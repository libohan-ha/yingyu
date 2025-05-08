# 阿里云部署指南

本文档提供将英语单词学习应用部署到阿里云服务器的详细步骤。

## 前置条件

- 已有一台阿里云ECS服务器（Linux系统，推荐使用Ubuntu或CentOS）
- 已获取服务器的SSH访问权限
- 已在服务器上安装Docker（可选，用于容器化部署）

## 基础环境配置

### 1. 安装Node.js环境

```bash
# 安装nvm (Node版本管理器)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc

# 安装Node.js 16.x版本
nvm install 16
nvm use 16

# 验证安装
node -v
npm -v
```

### 2. 安装MongoDB（如果使用数据库功能）

```bash
# 导入公钥
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# 创建MongoDB源列表文件
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# 更新包管理器
sudo apt-get update

# 安装MongoDB
sudo apt-get install -y mongodb-org

# 启动MongoDB服务
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. 安装Nginx（用于反向代理和静态文件服务）

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 部署后端

### 1. 克隆代码库

```bash
mkdir -p /var/www/yingyu
cd /var/www/yingyu
git clone https://github.com/libohan-ha/yingyu.git .
```

### 2. 设置后端环境

```bash
cd /var/www/yingyu/backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件，设置MongoDB连接和其他必要配置
nano .env
```

### 3. 启动后端服务

#### 方法1：直接使用Node.js启动

```bash
# 安装PM2进程管理器
npm install -g pm2

# 启动应用
cd /var/www/yingyu/backend
pm2 start src/server.js --name "yingyu-backend"

# 设置开机自启
pm2 startup
pm2 save
```

#### 方法2：使用Docker容器部署（可选）

创建后端Dockerfile在项目根目录：

```
# 在后端目录创建Dockerfile
cd /var/www/yingyu/backend
cat > Dockerfile << 'EOL'
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
EOL

# 构建镜像
docker build -t yingyu-backend .

# 运行容器
docker run -d -p 3000:3000 --name yingyu-backend --restart always yingyu-backend
```

## 部署前端

### 1. 构建前端应用

```bash
cd /var/www/yingyu/frontend

# 安装依赖
npm install

# 构建静态文件
npm run build
```

### 2. 配置Nginx

```bash
# 创建Nginx配置文件
sudo nano /etc/nginx/sites-available/yingyu

# 添加以下内容
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名或服务器IP

    # 前端静态文件
    location / {
        root /var/www/yingyu/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 启用网站配置
sudo ln -s /etc/nginx/sites-available/yingyu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 设置HTTPS（可选但推荐）

使用Let's Encrypt免费SSL证书：

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取并设置证书
sudo certbot --nginx -d your-domain.com

# 自动续期证书
sudo systemctl status certbot.timer
```

## 维护说明

### 更新应用

```bash
cd /var/www/yingyu
git pull

# 更新后端
cd backend
npm install
pm2 restart yingyu-backend

# 更新前端
cd ../frontend
npm install
npm run build
```

### 查看日志

```bash
# 后端日志
pm2 logs yingyu-backend

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 备份数据库

```bash
# 创建备份
mongodump --out=/var/backups/mongodb/$(date +"%Y-%m-%d")

# 自动备份（添加到crontab）
echo "0 2 * * * mongodump --out=/var/backups/mongodb/\$(date +\"%Y-%m-%d\")" | crontab -
```

## 常见问题解决

1. **端口问题**：确保3000端口（后端）和80/443端口（前端）在防火墙中已开放
2. **权限问题**：确保应用目录有正确的读写权限
3. **数据库连接问题**：检查MongoDB服务是否正常运行，连接字符串是否正确
4. **静态文件路径问题**：确保Nginx配置中的路径与实际前端构建输出目录一致 