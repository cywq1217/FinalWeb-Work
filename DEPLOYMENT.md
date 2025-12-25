# 音乐播放器项目部署指南

## 项目架构

| 组件 | 技术栈 | 端口 |
|------|--------|------|
| 前端 | React + Vite + TypeScript | 5173 (开发) / 80 (生产) |
| 后端 | Node.js + Express + Prisma | 3001 |
| 数据库 | PostgreSQL | 5432 |

---

## 方案一：服务器部署（推荐）

### 前置要求

- 一台 Linux 服务器（Ubuntu 20.04+ 推荐）
- Node.js 18+
- PostgreSQL 14+
- Nginx（可选，用于反向代理）
- PM2（进程管理）

---

### 步骤 1：准备服务器环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2（进程管理器）
sudo npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx

# 安装 PostgreSQL（如果使用本地数据库）
sudo apt install -y postgresql postgresql-contrib
```

---

### 步骤 2：配置数据库

```bash
# 登录 PostgreSQL
sudo -u postgres psql

# 创建数据库和用户
CREATE USER music_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE music_player OWNER music_user;
GRANT ALL PRIVILEGES ON DATABASE music_player TO music_user;
\q
```

---

### 步骤 3：上传项目代码

```bash
# 方法1：使用 Git
git clone <your-repo-url> /var/www/music-player
cd /var/www/music-player

# 方法2：使用 SCP 上传
scp -r ./finallweb user@your-server:/var/www/music-player
```

---

### 步骤 4：配置后端

```bash
cd /var/www/music-player/backend

# 安装依赖
npm install

# 创建生产环境配置
cat > .env << 'EOF'
# 数据库配置
DATABASE_URL="postgresql://music_user:your_secure_password@localhost:5432/music_player?schema=public"

# JWT密钥（请更换为随机字符串）
JWT_SECRET="your-super-secret-jwt-key-change-this"

# 服务器端口
PORT=3001

# 文件上传路径
UPLOAD_PATH="./uploads"

# 允许的跨域来源（改为你的域名）
CORS_ORIGIN="https://your-domain.com"
EOF

# 创建上传目录
mkdir -p uploads

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# 构建项目
npm run build
```

---

### 步骤 5：配置前端

```bash
cd /var/www/music-player/frontend

# 安装依赖
npm install

# 创建生产环境配置
cat > .env.production << 'EOF'
VITE_API_BASE_URL=https://your-domain.com/api
EOF

# 构建项目
npm run build
```

---

### 步骤 6：使用 PM2 启动后端

```bash
cd /var/www/music-player/backend

# 创建 PM2 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'music-player-api',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

# 启动服务
pm2 start ecosystem.config.js

# 设置开机自启
pm2 save
pm2 startup
```

---

### 步骤 7：配置 Nginx 反向代理

```bash
# 创建 Nginx 配置
sudo cat > /etc/nginx/sites-available/music-player << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /var/www/music-player/frontend/dist;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件访问
    location /uploads {
        proxy_pass http://127.0.0.1:3001/uploads;
    }

    # 文件上传大小限制
    client_max_body_size 50M;
}
EOF

# 启用配置
sudo ln -s /etc/nginx/sites-available/music-player /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

### 步骤 8：配置 HTTPS（可选但推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

---

## 方案二：Docker 部署

### 创建 Dockerfile（后端）

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### 创建 Dockerfile（前端）

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: music_user
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: music_player
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://music_user:your_secure_password@postgres:5432/music_player?schema=public
      JWT_SECRET: your-super-secret-jwt-key
      PORT: 3001
      CORS_ORIGIN: http://localhost
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Docker 部署命令

```bash
# 构建并启动
docker-compose up -d --build

# 运行数据库迁移
docker-compose exec backend npx prisma migrate deploy

# 查看日志
docker-compose logs -f
```

---

## 方案三：云平台部署

### Vercel（前端）+ Railway（后端）

#### 前端部署到 Vercel

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 导入 GitHub 仓库
4. 设置：
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 添加环境变量：
   - `VITE_API_BASE_URL`: 你的后端 API 地址

#### 后端部署到 Railway

1. 访问 [railway.app](https://railway.app)
2. 创建新项目，添加 PostgreSQL 服务
3. 添加后端服务，连接 GitHub
4. 设置：
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
5. 添加环境变量

---

## 部署后检查清单

- [ ] 数据库连接正常
- [ ] 后端 API 可访问 (`/api/health`)
- [ ] 前端页面加载正常
- [ ] 用户注册/登录功能正常
- [ ] 音乐上传功能正常
- [ ] 网易云搜索功能正常
- [ ] HTTPS 证书有效（生产环境）

---

## 常见问题

### 1. 数据库连接失败
```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 检查连接
psql -h localhost -U music_user -d music_player
```

### 2. 后端启动失败
```bash
# 查看 PM2 日志
pm2 logs music-player-api

# 检查端口占用
netstat -tlnp | grep 3001
```

### 3. 前端 API 请求失败
- 检查 `VITE_API_BASE_URL` 配置
- 检查 Nginx 代理配置
- 检查 CORS 配置

### 4. 文件上传失败
```bash
# 检查目录权限
sudo chown -R www-data:www-data /var/www/music-player/backend/uploads
sudo chmod -R 755 /var/www/music-player/backend/uploads
```

---

## 维护命令

```bash
# 重启后端
pm2 restart music-player-api

# 查看日志
pm2 logs music-player-api --lines 100

# 更新代码后重新部署
cd /var/www/music-player
git pull
cd backend && npm install && npm run build && pm2 restart music-player-api
cd ../frontend && npm install && npm run build
```
