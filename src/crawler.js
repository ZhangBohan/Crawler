const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATHS = {
  LINUX: '/usr/bin/chromium',
  MAC: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  WIN: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
};

// 在文件顶部添加默认 UA 配置
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

function getChromePath() {
  switch (process.platform) {
    case 'linux':
      return CHROME_PATHS.LINUX;
    case 'darwin':
      return CHROME_PATHS.MAC;
    case 'win32':
      return CHROME_PATHS.WIN;
    default:
      throw new Error('Unsupported platform');
  }
}

// 定义支持的资源类型
const RESOURCE_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  TEXT: 'text'
};

/**
 * 通用爬取函数
 */
async function crawlResources({ 
  url, 
  resourceType, 
  keyword, 
  async = false, 
  scroll = false,
  userAgent = DEFAULT_USER_AGENT  // 添加 userAgent 参数
}) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: getChromePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--window-size=1920,1080'
      ],
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    
    // 使用传入的 userAgent 参数
    await page.setUserAgent(userAgent);
    
    // 设置请求拦截
    await page.setRequestInterception(true);
    page.on('request', request => {
      const reqResourceType = request.resourceType();
      // 根据资源类型调整允许的请求类型
      const allowedTypes = ['document', 'script', 'xhr', 'fetch'];
      
      // 根据要爬取的资源类型添加对应的请求类型
      if (resourceType === RESOURCE_TYPES.IMAGE) allowedTypes.push('image');
      if (resourceType === RESOURCE_TYPES.VIDEO) allowedTypes.push('media');
      if (resourceType === RESOURCE_TYPES.AUDIO) allowedTypes.push('media');
      
      if (allowedTypes.includes(reqResourceType)) {
        request.continue();
      } else {
        request.abort();
      }
    });

    // 设置页面错误处理
    page.on('error', err => {
      console.error('Page error:', err);
    });

    page.on('pageerror', err => {
      console.error('Page error:', err);
    });

    // 设置超时和视窗
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);
    await page.setViewport({ width: 1920, height: 1080 });

    // 导航到页面
    const response = await page.goto(url, {
      waitUntil: async ? 'networkidle0' : 'domcontentloaded',
      timeout: 30000
    });

    if (!response.ok()) {
      throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
    }

    if (scroll) {
      await autoScroll(page);
    }

    console.log('page', page);

    // 根据资源类型选择不同的爬取策略
    let resources = [];
    switch (resourceType) {
      case RESOURCE_TYPES.IMAGE:
        resources = await extractImages(page, keyword);
        break;
      case RESOURCE_TYPES.VIDEO:
        resources = await extractVideos(page, keyword);
        break;
      case RESOURCE_TYPES.AUDIO:
        resources = await extractAudios(page, keyword);
        break;
      case RESOURCE_TYPES.TEXT:
        resources = await extractTexts(page, keyword);
        break;
      default:
        throw new Error(`不支持的资源类型: ${resourceType}`);
    }

    if (!resources || resources.length === 0) {
      console.log(`未找到匹配条件的${resourceType}资源`);
    }

    return resources;
  } catch (error) {
    console.error('爬取过程中出错:', error);
    throw new Error(`爬取失败: ${error.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error('关闭浏览器时出错:', error);
      }
    }
  }
}

// 提取图片资源
async function extractImages(page, keyword) {
  // 等待图片加载
  await page.waitForSelector('img', { timeout: 5000 }).catch(() => {
    console.log('没有立即找到图片，继续执行...');
  });

  return page.evaluate((keyword) => {
    const imgElements = document.getElementsByTagName('img');
    return Array.from(imgElements)
      .map(img => img.src)
      .filter(src => src && src.startsWith('http'))
      .filter(src => keyword ? src.toLowerCase().includes(keyword.toLowerCase()) : true);
  }, keyword);
}

// 提取视频资源
async function extractVideos(page, keyword) {
  await page.waitForSelector('video, source[type*="video"], iframe[src*="youtube"], iframe[src*="vimeo"]', { timeout: 5000 }).catch(() => {
    console.log('没有立即找到视频，继续执行...');
  });

  return page.evaluate((keyword) => {
    // 直接视频标签
    const videoElements = Array.from(document.getElementsByTagName('video'))
      .map(video => video.src)
      .filter(src => src && src.startsWith('http'));
    
    // 视频源标签
    const sourceElements = Array.from(document.querySelectorAll('source[type*="video"]'))
      .map(source => source.src)
      .filter(src => src && src.startsWith('http'));
    
    // iframe嵌入视频
    const iframeElements = Array.from(document.querySelectorAll('iframe'))
      .map(iframe => iframe.src)
      .filter(src => src && src.startsWith('http') && 
        (src.includes('youtube') || src.includes('vimeo') || src.includes('video')));
    
    // 合并所有视频源
    const allVideos = [...videoElements, ...sourceElements, ...iframeElements];
    
    // 根据关键词过滤
    return allVideos.filter(src => keyword ? src.toLowerCase().includes(keyword.toLowerCase()) : true);
  }, keyword);
}

// 提取音频资源
async function extractAudios(page, keyword) {
  await page.waitForSelector('audio, source[type*="audio"]', { timeout: 5000 }).catch(() => {
    console.log('没有立即找到音频，继续执行...');
  });

  return page.evaluate((keyword) => {
    // 直接音频标签
    const audioElements = Array.from(document.getElementsByTagName('audio'))
      .map(audio => audio.src)
      .filter(src => src && src.startsWith('http'));
    
    // 音频源标签
    const sourceElements = Array.from(document.querySelectorAll('source[type*="audio"]'))
      .map(source => source.src)
      .filter(src => src && src.startsWith('http'));
    
    // 合并所有音频源
    const allAudios = [...audioElements, ...sourceElements];
    
    // 根据关键词过滤
    return allAudios.filter(src => keyword ? src.toLowerCase().includes(keyword.toLowerCase()) : true);
  }, keyword);
}

// 提取文本内容
async function extractTexts(page, keyword) {
  return page.evaluate((keyword) => {
    // 提取页面中的主要文本内容
    const textElements = [
      ...Array.from(document.querySelectorAll('p')),
      ...Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')),
      ...Array.from(document.querySelectorAll('article')),
      ...Array.from(document.querySelectorAll('section')),
      ...Array.from(document.querySelectorAll('div.content, div.article, div.text'))
    ];
    
    // 提取文本并过滤空内容
    const texts = textElements
      .map(el => ({
        text: el.textContent.trim(),
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        class: el.className || ''
      }))
      .filter(item => item.text.length > 0);
    
    // 根据关键词过滤
    return keyword 
      ? texts.filter(item => item.text.toLowerCase().includes(keyword.toLowerCase()))
      : texts;
  }, keyword);
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const maxScrolls = 100; // 添加最大滚动次数限制
      let scrollCount = 0;
      
      const timer = setInterval(() => {
        const scrollHeight = document.documentElement.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrollCount++;

        if (totalHeight >= scrollHeight || scrollCount >= maxScrolls) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// 为了兼容性保留原来的函数
async function crawlImages(options) {
  return crawlResources({ ...options, resourceType: RESOURCE_TYPES.IMAGE });
}

module.exports = { 
  crawlImages,
  crawlResources,
  RESOURCE_TYPES
}; 