# Web Image Crawler Service

一个基于Node.js的网页图片爬虫服务，支持SPA页面和滚动加载，提供HTTP API接口。

## 功能特点

- 支持爬取任意网页的图片
- 支持SPA页面的异步加载
- 支持页面滚动加载
- 支持关键词过滤
- Docker容器化部署
- 完整的错误处理
- 单元测试覆盖

## 技术栈

- Node.js
- Express
- Puppeteer
- Docker
- Jest (测试框架)

## 安装

### 本地开发环境

确保你的系统已安装：
- Node.js (v14+)
- Google Chrome 或 Chromium 浏览器

### Docker环境

镜像地址：registry.cn-beijing.aliyuncs.com/mathmind/web-image-crawler

```bash
# 构建Docker镜像
npm run build

# 运行Docker容器
npm run docker:run
```

## API使用说明

### 爬取图片接口

**请求**:
- 方法: `POST`
- 路径: `/crawl`
- Content-Type: `application/json`

**请求体参数**:
```json
{
  "url": "https://www.example.com",  // 必填，要爬取的网页URL
  "keyword": "example",              // 可选，图片URL关键词过滤
  "async": true,                     // 可选，是否等待异步加载（默认false）
  "scroll": true                     // 可选，是否需要滚动页面（默认false）
}
```

**响应示例**:
```json
{
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

**错误响应**:
```json
{
  "error": "错误信息",
  "details": "详细错误信息（仅在开发环境）"
}
```

**状态码**:
- 200: 成功
- 400: 请求参数错误（如URL缺失或格式错误）
- 404: 未找到图片
- 500: 服务器错误（如页面加载失败）

## 使用示例

```bash
# 爬取IT之家的图片
curl -X POST http://localhost:3000/crawl \
-H "Content-Type: application/json" \
-d '{
  "url": "https://www.ithome.com/0/833/171.htm",
  "keyword": "newsuploadfiles/2025",
  "async": true,
  "scroll": true
}'

# 爬取知到智能的图片
curl -X POST http://localhost:3000/crawl \
-H "Content-Type: application/json" \
-d '{
  "url": "https://www.zhidx.com/p/465832.html",
  "async": false,
  "scroll": false
}'
```

## 本地开发

```bash
# 启动开发服务器
npm start

# 运行测试
npm test
```

## Docker部署

1. 构建镜像：
```bash
docker build -t web-image-crawler .
```

2. 运行容器：
```bash
docker run -p 3000:3000 web-image-crawler
```

## 配置说明

环境变量：
- `PORT`: 服务端口号（默认3000）
- `NODE_ENV`: 运行环境（development/production）
- `CHROME_PATH`: Chrome/Chromium可执行文件路径
- `PUPPETEER_EXECUTABLE_PATH`: Docker环境中的Chromium路径

## 测试

项目包含完整的单元测试：

```bash
# 运行所有测试
npm test
```

测试用例包括：
- 基本图片爬取功能
- SPA页面处理
- 错误处理
- 参数验证

## 注意事项

1. 确保目标网站允许爬虫访问
2. 某些网站可能有反爬虫机制，需要适当调整请求间隔
3. Docker环境需要至少2GB内存
4. 建议在使用前检查目标网站的robots.txt
5. 图片URL可能会因CDN或防盗链策略而失效

## 常见问题

1. Chrome启动失败
   - 检查Chrome/Chromium是否正确安装
   - 确认可执行文件路径是否正确
   - Docker环境中确保有足够的内存

2. 页面加载超时
   - 检查网络连接
   - 调整超时设置（默认30秒）
   - 考虑目标网站的响应时间

3. 无法获取图片
   - 确认页面是否需要异步加载（设置async=true）
   - 检查是否需要滚动加载（设置scroll=true）
   - 验证图片选择器是否正确

## License

MIT

## 贡献指南

欢迎提交Issue和Pull Request。

1. Fork项目
2. 创建特性分支
3. 提交改动
4. 推送到分支
5. 创建Pull Request
