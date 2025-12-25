# 在线音乐播放器 - Web技术及应用开发大作业

## 项目简介

一个功能完整的在线音乐播放器Web应用，采用前后端分离架构，支持本地音乐上传播放、网易云音乐搜索与导入、歌词同步显示、播放列表管理、用户认证等功能。项目使用现代化技术栈开发，具有精美的UI设计和流畅的用户体验。

## 技术栈

### 前端
| 技术 | 说明 |
|------|------|
| React 18 | 前端框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Tailwind CSS | 样式框架 |
| Zustand | 状态管理 |
| Howler.js | 音频播放引擎 |
| Axios | HTTP客户端 |
| Lucide React | 图标库 |

### 后端
| 技术 | 说明 |
|------|------|
| Node.js | 运行环境 |
| Express | Web框架 |
| TypeScript | 类型安全 |
| Prisma | ORM框架 |
| PostgreSQL | 数据库 |
| JWT | 用户认证 |
| Multer | 文件上传 |

## 已实现功能

### 音乐播放
- [x] 播放/暂停/上一曲/下一曲
- [x] 进度条拖拽控制
- [x] 音量调节和静音
- [x] 播放模式切换（顺序/循环/单曲/随机）
- [x] 实时播放进度显示

### 歌词显示
- [x] LRC格式歌词解析
- [x] 歌词同步滚动
- [x] 当前歌词高亮
- [x] 全屏歌词面板

### 用户系统
- [x] 用户注册/登录
- [x] JWT Token认证
- [x] 登录状态持久化
- [x] 歌曲收藏功能

### 音乐管理
- [x] 本地音乐上传（音频+封面+歌词）
- [x] 音乐库浏览
- [x] 搜索筛选功能
- [x] 播放列表管理
- [x] 播放历史记录

### 网易云音乐集成
- [x] 在线搜索歌曲
- [x] 播放网易云音乐
- [x] 导入歌曲到本地库
- [x] 自动获取歌词和封面

### UI/UX
- [x] 响应式设计
- [x] 专辑封面旋转动画
- [x] 毛玻璃背景效果
- [x] 平滑过渡动画
- [x] 键盘快捷键支持

## 项目结构

```
finallweb/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── components/          # React组件
│   │   │   ├── Auth/            # 认证组件
│   │   │   ├── Player/          # 播放器组件
│   │   │   ├── MusicList/       # 音乐列表
│   │   │   ├── Playlist/        # 播放列表
│   │   │   ├── Netease/         # 网易云搜索
│   │   │   ├── Upload/          # 上传组件
│   │   │   ├── Lyrics/          # 歌词组件
│   │   │   └── History/         # 播放历史
│   │   ├── store/               # Zustand状态管理
│   │   ├── services/            # API服务
│   │   ├── hooks/               # 自定义Hooks
│   │   ├── utils/               # 工具函数
│   │   └── types/               # TypeScript类型
│   └── package.json
│
├── backend/                     # 后端项目
│   ├── src/
│   │   ├── controllers/         # 控制器
│   │   │   ├── song.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── playlist.controller.ts
│   │   │   └── netease.controller.ts
│   │   ├── routes/              # 路由
│   │   ├── middlewares/         # 中间件
│   │   └── index.ts             # 入口文件
│   ├── prisma/
│   │   └── schema.prisma        # 数据库模型
│   └── package.json
│
├── docs/                        # 项目文档
│   ├── 需求规格说明书.md
│   ├── 系统架构设计.md
│   └── API接口文档.md
│
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 18
- PostgreSQL >= 14
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd finallweb
```

### 2. 安装依赖
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 配置环境变量

在 `backend` 目录创建 `.env` 文件：
```env
DATABASE_URL="postgresql://user:password@localhost:5432/music_player"
JWT_SECRET="your-secret-key"
PORT=3001
UPLOAD_PATH="./uploads"
CORS_ORIGIN="http://localhost:5173"
```

### 4. 初始化数据库
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 5. 运行项目
```bash
# 终端1：启动后端服务
cd backend
npm run dev
# 服务运行在 http://localhost:3001

# 终端2：启动前端服务
cd frontend
npm run dev
# 服务运行在 http://localhost:5173
```

### 6. 访问应用
在浏览器打开 http://localhost:5173

## API接口概览

| 模块 | 接口 | 说明 |
|------|------|------|
| 歌曲 | GET /api/songs | 获取歌曲列表 |
| 歌曲 | POST /api/songs | 上传歌曲 |
| 歌曲 | GET /api/songs/search | 搜索歌曲 |
| 用户 | POST /api/users/register | 用户注册 |
| 用户 | POST /api/users/login | 用户登录 |
| 用户 | GET /api/users/:id/favorites | 获取收藏 |
| 播放列表 | GET /api/playlists | 获取播放列表 |
| 播放列表 | POST /api/playlists | 创建播放列表 |
| 网易云 | GET /api/netease/search | 搜索网易云歌曲 |
| 网易云 | POST /api/netease/import | 导入歌曲 |

详细API文档请参阅 `docs/API接口文档.md`

## 项目文档

| 文档 | 说明 |
|------|------|
| [需求规格说明书](docs/需求规格说明书.md) | 项目需求分析与功能定义 |
| [系统架构设计](docs/系统架构设计.md) | 技术架构与设计方案 |
| [API接口文档](docs/API接口文档.md) | 后端API详细说明 |
| [开发过程说明](docs/开发过程说明.md) | AI辅助开发过程记录 |
| [功能完成清单](FEATURES_COMPLETED.md) | 已实现功能详细列表 |
| [测试文档](TESTING.md) | 测试用例与方法 |
| [部署指南](DEPLOYMENT.md) | 项目部署说明 |

## 开发完成情况

| 阶段 | 内容 | 状态 |
|------|------|------|
| 阶段一 | 项目初始化、数据库设计、基础API | 已完成 |
| 阶段二 | 播放器核心功能、用户系统、歌词显示 | 已完成 |
| 阶段三 | 网易云集成、播放列表、收藏功能 | 已完成 |
| 阶段四 | UI优化、动画效果、响应式适配 | 已完成 |

## 截图预览

### 主界面
- 音乐列表展示
- 底部播放控制条
- 搜索和筛选功能

### 播放器
- 专辑封面旋转动画
- 歌词同步滚动显示
- 播放进度和音量控制

### 网易云搜索
- 在线搜索歌曲
- 一键导入本地库
- 支持播放和收藏

## 许可证

MIT License
