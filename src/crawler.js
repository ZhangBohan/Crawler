const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATHS = {
  LINUX: '/usr/bin/chromium',
  MAC: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  WIN: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
};

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

async function crawlImages({ url, keyword, async = false, scroll = false }) {
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
    
    // 设置请求拦截
    await page.setRequestInterception(true);
    page.on('request', request => {
      const resourceType = request.resourceType();
      if (['document', 'script', 'xhr', 'fetch', 'image'].includes(resourceType)) {
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

    // 等待图片加载
    await page.waitForSelector('img', { timeout: 5000 }).catch(() => {
      console.log('No images found immediately, continuing...');
    });

    // 提取图片
    const images = await page.evaluate((keyword) => {
      const imgElements = document.getElementsByTagName('img');
      return Array.from(imgElements)
        .map(img => img.src)
        .filter(src => src && src.startsWith('http'))
        .filter(src => keyword ? src.includes(keyword) : true);
    }, keyword);

    if (!images || images.length === 0) {
      console.log('No images found matching criteria');
    }

    return images;
  } catch (error) {
    console.error('Crawling error in puppeteer:', error);
    throw new Error(`Failed to crawl images: ${error.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
  }
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

module.exports = { crawlImages }; 