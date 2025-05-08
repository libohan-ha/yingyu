# AI 英语单词学习后端 API

这是基于 Node.js + Express 开发的英语单词学习应用后端部分，提供处理单词、生成文章、保存学习记录等功能。

## 功能特性

- 集成 DeepSeek API 处理用户输入的单词列表
- 生成包含目标单词的英语文章及中文翻译
- 提供单词高亮位置信息和释义
- 历史学习记录存储与检索
- 单词复习数据生成

## 项目结构

```
backend/
├── src/
│   ├── config/             # 配置文件
│   ├── controllers/        # 请求处理逻辑
│   ├── models/             # 数据模型定义
│   ├── routes/             # 路由定义
│   ├── services/           # 业务逻辑服务
│   ├── utils/              # 工具函数
│   └── server.js           # 服务器入口文件
├── .env.example            # 环境变量示例
├── package.json            # 依赖配置
└── README.md               # 说明文档
```

## API 端点

- `POST /api/process` - 处理单词列表并生成学习内容
- `GET /api/history` - 获取所有历史学习记录
- `GET /api/history/:sessionId` - 获取特定学习会话的详细数据
- `GET /api/review/:sessionId` - 获取用于复习的单词和例句数据

## 安装与运行

确保已安装 Node.js (建议 v14+)：

1. 安装依赖：

```bash
cd backend
npm install
```

2. 设置环境变量：

```bash
cp .env.example .env
# 编辑 .env 文件设置 MongoDB 连接
```

3. 启动开发服务器：

```bash
npm run dev
```

4. 生产环境启动：

```bash
npm start
```

## MongoDB 配置 (可选)

本应用可以连接 MongoDB 数据库以持久化存储学习记录。如不配置数据库，应用仍可正常工作，但历史记录功能将不可用。

## 注意事项

- 前端需提供用户的 DeepSeek API Key
- API Key 仅用于当前请求，不会在服务器端存储
- 建议前端实现对输入单词的预处理（去重、去空格等）
