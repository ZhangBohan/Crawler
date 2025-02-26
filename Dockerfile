FROM node:18-slim

# 安装 Chromium 依赖
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 设置 Chrome 路径
ENV CHROME_PATH=/usr/bin/chromium

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 设置环境变量
ENV PORT=3000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "src/server.js"] 