# AI 英语单词学习前端

这是基于 Vue3 + Vite 开发的英语单词学习应用前端部分，提供用户输入单词、查看生成的文章与中文翻译、复习单词等功能。

## 功能特性

- 输入 DeepSeek API Key 和单词列表
- 展示单词中文释义列表
- 展示基于单词生成的英文文章和中文翻译
- 支持文章中单词高亮，点击显示中文释义
- 单词复习功能，帮助记忆单词
- 历史学习记录功能

## 项目结构

```
frontend/
├── public/               # 静态资源目录
├── src/
│   ├── assets/           # 图片等资源文件
│   ├── components/       # 公共组件
│   ├── router/           # 路由配置
│   ├── store/            # 状态管理
│   ├── styles/           # 全局样式
│   ├── views/            # 页面组件
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── index.html            # HTML 模板
├── package.json          # 依赖配置
└── vite.config.js        # Vite 配置
```

## 安装与运行

确保已安装 Node.js (建议 v14+)：

1. 安装依赖：

```bash
cd frontend
npm install
```

2. 本地开发：

```bash
npm run dev
```

3. 构建生产版本：

```bash
npm run build
```

## 注意事项

- 本前端需要配合后端 API 一起使用
- 默认后端 API 地址为 `http://localhost:3000`
- 您需要准备一个有效的 DeepSeek API Key
