# 后端服务配置说明

## 环境变量配置

请在 `backend` 目录下创建 `.env` 文件（已在 .gitignore 中忽略，不会提交到Git）

### 远程PostgreSQL数据库配置示例

```env
# 数据库配置 - 连接到队友的PostgreSQL数据库
DATABASE_URL="postgresql://用户名:密码@队友IP地址:5432/music_player"

# 示例（请替换为实际值）：
# DATABASE_URL="postgresql://postgres:123456@192.168.1.100:5432/music_player"

# JWT密钥（团队统一使用相同的密钥）
JWT_SECRET="your-super-secret-jwt-key-change-this"

# 服务器端口
PORT=3000

# 文件上传路径
UPLOAD_PATH="./uploads"

# 允许的跨域来源
CORS_ORIGIN="http://localhost:5173"
```

## 数据库连接格式说明

```
DATABASE_URL="postgresql://用户名:密码@主机地址:端口/数据库名"
```

**参数说明：**
- `用户名`: PostgreSQL用户名（默认通常是 `postgres`）
- `密码`: 数据库密码
- `主机地址`: 队友电脑的IP地址（例如：`192.168.1.100`）
- `端口`: PostgreSQL端口（默认 `5432`）
- `数据库名`: 数据库名称（建议使用 `music_player`）

## 队友需要做的配置

### 1. 创建数据库
```sql
CREATE DATABASE music_player;
```

### 2. 配置PostgreSQL允许远程连接

#### 修改 `postgresql.conf`
找到并修改：
```conf
listen_addresses = '*'  # 允许所有IP连接
```

#### 修改 `pg_hba.conf`
添加以下行（允许局域网访问）：
```conf
# IPv4 局域网连接
host    all             all             192.168.0.0/16          md5
host    all             all             10.0.0.0/8              md5
```

### 3. 重启PostgreSQL服务
```bash
# Windows
net stop postgresql-x64-14
net start postgresql-x64-14

# Linux/Mac
sudo systemctl restart postgresql
```

### 4. 防火墙配置
确保防火墙允许 5432 端口：
```bash
# Windows防火墙
# 控制面板 -> Windows Defender 防火墙 -> 高级设置 -> 入站规则 -> 新建规则
# 端口：5432，协议：TCP

# Linux
sudo ufw allow 5432/tcp
```

### 5. 获取队友电脑IP地址
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
# 或
ip addr show
```

## 安装依赖

```bash
npm install
```

## 初始化数据库

```bash
# 生成Prisma客户端
npx prisma generate

# 创建数据库表（首次运行或模型变更时）
npx prisma migrate dev --name init

# 查看数据库（可选）
npx prisma studio
```

## 启动开发服务器

```bash
npm run dev
```

## 注意事项

1. **安全性**：生产环境不要使用 `listen_addresses = '*'`，应指定具体IP
2. **网络**：确保两台电脑在同一局域网内
3. **密码**：使用强密码，不要使用默认密码
4. **Git**：`.env` 文件已被忽略，不会提交到仓库
5. **团队协作**：团队成员的 `.env` 文件中 `DATABASE_URL` 应该相同
