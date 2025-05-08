# AI 英语单词学习应用

基于 Vue 3 + Node.js + 通义千问 API 构建的英语单词学习应用，通过 AI 生成包含目标单词的文章和释义，创造沉浸式学习体验。

![版本](https://img.shields.io/badge/版本-1.0.0-blue)
![协议](https://img.shields.io/badge/协议-MIT-green)

## 📝 功能概述

- **单词学习**：输入想学习的英语单词列表
- **AI生成**：使用 通义千问 AI 生成包含这些单词的英文文章并翻译
- **互动阅读**：文章中的目标单词高亮显示，点击可查看中文释义
- **复习系统**：依次复习学习过的单词，标记记忆状态
- **历史记录**：保存历史学习会话，随时查看复习

## 🚀 快速开始

### 前提条件

- Node.js v14+ 和 npm v6+
- MongoDB (可选，用于持久化存储)
- 通义千问 API Key ([获取方式](#获取-通义千问-api-key))

### 安装与运行

1. **克隆项目**

```bash
git clone <repository-url>
cd 英语2
```

2. **安装前端依赖**

```bash
cd frontend
npm install
```

3. **安装后端依赖**

```bash
cd ../backend
npm install
```

4. **配置环境变量**

复制 `.env.example` 文件为 `.env` 并根据需要修改配置：

```bash
cp .env.example .env
```

5. **启动后端服务**

```bash
npm run dev
```

6. **启动前端服务**

```bash
cd ../frontend
npm run dev
```

7. **访问应用**

打开浏览器访问 http://localhost:5173

## 💡 使用指南

### 1. 上传图片或输入单词

首次使用时，您可以：
- 上传包含英文文章的图片，系统会识别文章内容和您标记的单词
- 直接输入要学习的单词列表（每行一个或用逗号分隔）

示例单词输入：
```
accommodate
versatile
persistence
innovation
integrity
```

### 2. 生成学习材料

点击"生成学习材料"按钮后，系统将：
- 翻译您输入的单词
- 生成包含这些单词的英文文章
- 提供文章的中文翻译

### 3. 阅读与学习

在文章页面中：
- 目标单词会以高亮显示
- 点击高亮单词查看中文释义
- 阅读中文翻译加深理解

### 4. 复习单词

复习页面会逐个展示您学习的单词，您可以：
- 标记是否记得该单词
- 查看含有该单词的例句
- 追踪复习进度

### 5. 查看历史记录

历史记录页面列出您之前的学习会话，可以随时回顾之前学习的内容。

## 🔑 获取 通义千问 API Key

1. 访问 [通义千问 API 平台](https://platform.tongyici.com/api_keys)
2. 注册/登录您的账户
3. 导航至 API Keys 页面
4. 创建新的 API Key
5. 复制并安全保存您的 Key

**注意**：该应用不会永久存储您的 API Key，仅在当前会话中使用。

## 🛠️ 项目架构

### 前端 (Vue 3 + Vite)
- Vue Router 处理页面路由
- Pinia 管理应用状态
- Axios 处理 API 请求
- 组件化结构设计

### 后端 (Node.js + Express)
- RESTful API 设计
- 通义千问 API 集成
- MongoDB 数据持久化
- 安全中间件配置

## 🗂️ 目录结构

```
项目根目录/
├── frontend/                  # 前端 Vue 应用
│   ├── src/
│   │   ├── assets/           # 静态资源
│   │   ├── components/       # 可复用组件
│   │   ├── router/           # 路由配置
│   │   ├── store/            # Pinia 状态管理
│   │   ├── styles/           # 全局样式
│   │   ├── views/            # 页面组件
│   │   ├── App.vue           # 根组件
│   │   └── main.js           # 入口文件
│   ├── package.json
│   └── vite.config.js
├── backend/                   # 后端 Node.js 应用
│   ├── src/
│   │   ├── controllers/      # 请求处理逻辑
│   │   ├── models/           # 数据模型
│   │   ├── routes/           # 路由定义
│   │   ├── services/         # 业务逻辑
│   │   └── server.js         # 服务器入口
│   ├── .env                  # 环境配置
│   └── package.json
├── README.md                  # 项目说明文档
├── PROJECT_STATUS.md          # 项目进度追踪
└── 1.md                       # 项目需求与技术文档
```

## 📋 项目状态

查看 [PROJECT_STATUS.md](./PROJECT_STATUS.md) 了解当前项目进度、已知问题和未来计划。

## 🧑‍💻 部署指南

### 开发环境

已在「快速开始」部分说明，使用 Vite 开发服务器和 Nodemon。

### 生产环境部署

#### 前端部署

1. 构建生产版本：

```bash
cd frontend
npm run build
```

2. 将 `dist` 目录部署到静态托管服务（如 Netlify、Vercel 或 Nginx）

#### 后端部署

1. 安装 PM2 或使用 Docker：

```bash
# 使用 PM2
npm install -g pm2
cd backend
pm2 start src/server.js --name "english-learning-backend"

# 或使用 Docker (需要创建 Dockerfile)
docker build -t english-learning-backend .
docker run -d -p 3000:3000 english-learning-backend
```

2. 配置生产环境变量：
   - 设置 `NODE_ENV=production`
   - 配置 MongoDB 连接字符串 
   - 设置适当的安全配置

3. 配置反向代理（如使用 Nginx）以启用 HTTPS

## 📄 许可

本项目采用 MIT 许可证 - 详见 LICENSE 文件

## 🙏 致谢

- [通义千问](https://tongyici.com/) - 提供强大的 AI 语言模型
- [Vue.js](https://vuejs.org/) - 前端框架
- [Express](https://expressjs.com/) - 后端框架
- [MongoDB](https://www.mongodb.com/) - 数据库解决方案
