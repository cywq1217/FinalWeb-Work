# 开发日志 09 - 项目部署

## 概述

本阶段完成了项目的生产环境部署，采用 Vercel + Render + Railway 的云端部署方案。

---

## 开发时间线

### 2024-12-27

#### 部署方案选型

**时间**: 22:55

**类型**: 方案讨论

**内容**:
- 分析项目部署需求（React 前端 + Express 后端 + PostgreSQL 数据库）
- 对比四种部署方案：
  1. Vercel + Railway（推荐）
  2. Netlify + Render
  3. 云服务器部署
  4. Docker 容器化部署
- 最终选择：Vercel（前端）+ Render（后端）+ Railway（数据库）

**决策理由**:
- Vercel：专为前端优化，全球 CDN，与 GitHub 深度集成
- Render：支持 Node.js，免费套餐可用
- Railway：托管 PostgreSQL，便捷管理

---

#### 后端部署到 Render

**时间**: 23:30

**类型**: 部署配置

**内容**:
1. 创建 `backend/railway.json` 配置文件
2. 创建 `backend/Procfile` 启动配置
3. 在 Render 创建 Web Service
4. 配置环境变量：
   - `DATABASE_URL`: 引用 Railway PostgreSQL
   - `JWT_SECRET`: JWT 签名密钥
   - `PORT`: 3001
   - `CORS_ORIGIN`: *

**相关文件**:
- `backend/railway.json`
- `backend/Procfile`

**结果**: ✅ 部署成功，服务域名：`https://music-player-backend-luzn.onrender.com`

---

#### 数据库部署到 Railway

**时间**: 23:15

**类型**: 数据库配置

**内容**:
1. 在 Railway 创建 PostgreSQL 实例
2. 获取 DATABASE_URL 连接字符串
3. 配置内网连接地址供后端使用

**结果**: ✅ 数据库创建成功

---

### 2024-12-28

#### 前端构建错误修复

**时间**: 00:15

**类型**: Bug 修复

**内容**:
Vercel 构建失败，错误信息：
```
src/store/playlistStore.ts(2,25): error TS6196: 'Song' is declared but never used.
src/store/playlistStore.ts(21,61): error TS6133: 'get' is declared but its value is never read.
src/tests/components/SongItem.test.tsx: 多个类型错误
```

**修复方案**:
1. 移除 `playlistStore.ts` 中未使用的 `Song` 导入
2. 移除未使用的 `get` 参数
3. 在 `tsconfig.json` 中排除测试文件

**相关文件**:
- `frontend/src/store/playlistStore.ts`
- `frontend/tsconfig.json`

**结果**: ✅ 构建错误修复

---

#### 前端部署到 Vercel

**时间**: 00:30

**类型**: 部署配置

**内容**:
1. 创建 `frontend/vercel.json` 配置文件
2. 在 Vercel 导入 GitHub 仓库
3. 配置项目：
   - Root Directory: `frontend`
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 配置环境变量：
   - `VITE_API_BASE_URL`: 后端服务地址

**相关文件**:
- `frontend/vercel.json`

**结果**: ✅ 部署成功

---

## 部署配置文件

### backend/railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && npm run build"
  },
  "deploy": {
    "startCommand": "npx prisma db push && npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### frontend/vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 环境变量配置

### 后端环境变量 (Render)

| 变量名 | 说明 |
|--------|------|
| DATABASE_URL | PostgreSQL 连接字符串 |
| JWT_SECRET | JWT 签名密钥 |
| PORT | 服务端口 (3001) |
| CORS_ORIGIN | 允许的跨域来源 |
| UPLOAD_PATH | 文件上传路径 |

### 前端环境变量 (Vercel)

| 变量名 | 说明 |
|--------|------|
| VITE_API_BASE_URL | 后端 API 地址 |

---

## 部署架构

```
用户浏览器
    │
    │ HTTPS
    ▼
┌─────────────┐
│   Vercel    │  前端静态资源托管
│  (CDN)      │
└─────────────┘
    │
    │ REST API
    ▼
┌─────────────┐
│   Render    │  后端 API 服务
│  (Node.js)  │
└─────────────┘
    │
    │ Prisma ORM
    ▼
┌─────────────┐
│  Railway    │  PostgreSQL 数据库
│ (PostgreSQL)│
└─────────────┘
```

---

## 部署地址

| 服务 | 平台 | 域名 |
|------|------|------|
| 前端 | Vercel | https://[project].vercel.app |
| 后端 | Render | https://music-player-backend-luzn.onrender.com |
| 数据库 | Railway | 内部连接 |

---

## 注意事项

1. **Render 免费套餐限制**: 15 分钟无访问后休眠，首次访问需 30 秒唤醒
2. **环境变量安全**: 敏感信息通过平台环境变量配置，不在代码中硬编码
3. **CORS 配置**: 生产环境应将 CORS_ORIGIN 设置为实际前端域名
4. **数据库迁移**: 使用 `prisma db push` 同步数据库结构

---

## 总结

- ✅ 完成前后端分离的云端部署
- ✅ 实现 GitHub 推送自动部署
- ✅ 配置 HTTPS 全链路加密
- ✅ 解决构建错误问题
