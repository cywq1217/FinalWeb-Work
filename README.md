# 在线音乐播放器 - Web技术及应用开发大作业

## 项目简介

一个功能完整的在线音乐播放器，支持音乐播放控制、播放列表管理、歌词同步显示、音乐库管理和搜索筛选等功能。

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **音频处理**: Howler.js
- **状态管理**: Zustand
- **路由**: React Router
- **HTTP客户端**: Axios
- **动画**: Framer Motion

### 后端
- **运行环境**: Node.js
- **框架**: Express + TypeScript
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: JWT
- **文件上传**: Multer

## 功能特性

### 核心功能
- ✅ 音乐播放控制（播放/暂停/上一曲/下一曲）
- ✅ 进度条拖拽和音量控制
- ✅ 播放列表管理
- ✅ 音乐库浏览
- ✅ 搜索和筛选功能
- ✅ 响应式设计（支持移动端）

### 前端亮点
- 🎨 精美的播放器UI设计
- 🎵 歌词滚动同步显示
- 🌀 专辑封面旋转动画
- 🎭 背景模糊效果
- 📊 音频可视化（频谱动画）
- 🌓 深色/浅色主题切换

### 后端特性
- 🔐 用户认证系统
- 📁 文件上传和管理
- 🔍 高效搜索API
- 💾 数据库优化
- 🚀 RESTful API设计

## 项目结构

```
music-player/
├── frontend/              # 前端项目
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── store/         # 状态管理
│   │   ├── services/      # API服务
│   │   ├── utils/         # 工具函数
│   │   └── types/         # TypeScript类型定义
│   └── package.json
│
├── backend/               # 后端项目
│   ├── src/
│   │   ├── routes/        # 路由
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑
│   │   ├── models/        # 数据模型
│   │   ├── middlewares/   # 中间件
│   │   └── utils/         # 工具函数
│   └── package.json
│
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 18
- PostgreSQL >= 14
- npm 或 yarn

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 配置环境变量

在 `backend` 目录创建 `.env` 文件：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/music_player"
JWT_SECRET="your-secret-key"
PORT=3000
```

### 运行项目

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端开发服务器
cd frontend
npm run dev
```

## 开发计划

### 阶段一：核心功能（当前）
- [x] 项目初始化
- [ ] 后端API开发
- [ ] 前端基础组件
- [ ] 播放器核心功能
- [ ] 数据库设计

### 阶段二：功能完善
- [ ] 用户系统
- [ ] 歌词功能
- [ ] 搜索优化
- [ ] UI美化

### 阶段三：优化提升
- [ ] 性能优化
- [ ] 缓存策略
- [ ] 音频可视化
- [ ] 推荐系统

## 团队成员

- 成员1：负责前端开发
- 成员2：负责后端开发

## 许可证

MIT License
