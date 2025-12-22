# 依赖安装指南

## 方法1：使用npm（默认）

```bash
npm install
```

## 方法2：使用淘宝镜像（推荐，速度更快）

### 临时使用
```bash
npm install --registry=https://registry.npmmirror.com
```

### 永久配置（推荐）
```bash
# 设置淘宝镜像
npm config set registry https://registry.npmmirror.com

# 验证配置
npm config get registry

# 安装依赖
npm install
```

### 恢复官方源
```bash
npm config set registry https://registry.npmjs.org
```

## 方法3：使用cnpm

```bash
# 安装cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com

# 使用cnpm安装
cnpm install
```

## 方法4：使用pnpm（更快）

```bash
# 安装pnpm
npm install -g pnpm

# 使用pnpm安装
pnpm install
```

## 如果安装卡住了

1. **Ctrl + C** 取消当前安装
2. 清理缓存：
   ```bash
   npm cache clean --force
   ```
3. 删除 `node_modules` 和 `package-lock.json`：
   ```bash
   rm -rf node_modules package-lock.json
   ```
4. 使用淘宝镜像重新安装：
   ```bash
   npm install --registry=https://registry.npmmirror.com
   ```

## 安装完成后验证

```bash
# 查看已安装的包
npm list --depth=0

# 测试TypeScript编译
npx tsc --version

# 测试Prisma
npx prisma --version
```
