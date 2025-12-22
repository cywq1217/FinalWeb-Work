# 在线音乐播放器 - 系统架构设计文档

## 1. 系统架构概述

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                            客户端层                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    React SPA 应用                            │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │Components│ │  Hooks  │ │  Store  │ │Services │           │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP/REST API
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            服务器层                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Express.js 服务器                         │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │ Routes  │ │Controllers│ │Middleware│ │ Prisma  │           │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Prisma ORM
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            数据层                                    │
│  ┌───────────────────┐  ┌───────────────────────────────────────┐  │
│  │    SQLite 数据库   │  │           文件存储系统                 │  │
│  │  • Users          │  │  • /uploads/audio/  音频文件           │  │
│  │  • Songs          │  │  • /uploads/covers/ 封面图片           │  │
│  │  • Playlists      │  │  • /uploads/lyrics/ 歌词文件           │  │
│  │  • Favorites      │  │                                       │  │
│  └───────────────────┘  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 技术选型

| 层级 | 技术栈 | 版本 | 说明 |
|------|--------|------|------|
| **前端框架** | React | 18.2.0 | 组件化 UI 框架 |
| **类型系统** | TypeScript | 5.2.2 | 静态类型检查 |
| **CSS 框架** | Tailwind CSS | 3.3.6 | 原子化 CSS |
| **状态管理** | Zustand | 4.5.7 | 轻量级状态管理 |
| **HTTP 客户端** | Axios | 1.6.2 | API 请求 |
| **音频引擎** | Howler.js | 2.2.4 | 音频播放控制 |
| **构建工具** | Vite | 5.0.8 | 快速构建 |
| **后端框架** | Express | 4.18.2 | Node.js Web 框架 |
| **ORM** | Prisma | 5.7.0 | 数据库操作 |
| **数据库** | SQLite | - | 轻量级关系数据库 |
| **认证** | JWT | 9.0.2 | Token 认证 |

---

## 2. 前端架构设计

### 2.1 目录结构

```
frontend/src/
├── components/          # UI 组件
│   ├── Auth/           # 认证相关组件
│   ├── ErrorBoundary/  # 错误边界
│   ├── Help/           # 帮助组件
│   ├── History/        # 播放历史
│   ├── Loading/        # 加载状态
│   ├── Lyrics/         # 歌词组件
│   ├── MusicList/      # 歌曲列表
│   ├── Player/         # 播放器组件
│   ├── Playlist/       # 播放列表
│   └── Upload/         # 上传组件
├── hooks/              # 自定义 Hooks
│   └── useKeyboardShortcuts.ts
├── services/           # API 服务
│   └── api.ts
├── store/              # 状态管理
│   ├── playerStore.ts  # 播放器状态
│   ├── authStore.ts    # 认证状态
│   ├── playlistStore.ts # 播放列表状态
│   └── favoriteStore.ts # 收藏状态
├── types/              # TypeScript 类型
│   └── index.ts
├── utils/              # 工具函数
│   ├── format.ts       # 格式化工具
│   └── lyrics.ts       # 歌词解析
├── App.tsx             # 根组件
├── main.tsx            # 入口文件
└── index.css           # 全局样式
```

### 2.2 组件架构图

```
                         App
                          │
          ┌───────────────┼───────────────┐
          │               │               │
      MusicList     PlayerControls   KeyboardShortcuts
          │               │
    ┌─────┴─────┐   ┌─────┴─────┐
    │           │   │           │
 SongItem  SearchBar FullScreenPlayer
    │               │
    │         ┌─────┴─────┐
    │         │           │
    │    AudioVisualizer  LyricsDisplay
    │
┌───┴───┬───────┬────────┬────────┐
│       │       │        │        │
Upload Auth  Playlist History  ErrorBoundary
Modal  Modal  Panel    Panel
```

### 2.3 状态管理架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Zustand Stores                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  playerStore    │  │   authStore     │                  │
│  ├─────────────────┤  ├─────────────────┤                  │
│  │ • currentSong   │  │ • user          │                  │
│  │ • playlist      │  │ • token         │                  │
│  │ • status        │  │ • isAuthenticated│                 │
│  │ • playMode      │  │ • login()       │                  │
│  │ • volume        │  │ • logout()      │                  │
│  │ • currentTime   │  │ • register()    │                  │
│  │ • playHistory   │  └─────────────────┘                  │
│  │ • playSong()    │                                       │
│  │ • next()        │  ┌─────────────────┐                  │
│  │ • previous()    │  │ favoriteStore   │                  │
│  └─────────────────┘  ├─────────────────┤                  │
│                       │ • favorites     │                  │
│  ┌─────────────────┐  │ • toggleFavorite│                  │
│  │ playlistStore   │  │ • isFavorite()  │                  │
│  ├─────────────────┤  └─────────────────┘                  │
│  │ • playlists     │                                       │
│  │ • createPlaylist│                                       │
│  │ • addSong()     │                                       │
│  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 数据流图

```
┌──────────┐     Action     ┌──────────┐     Update    ┌──────────┐
│          │ ─────────────► │          │ ────────────► │          │
│   View   │                │  Store   │               │   View   │
│(Component)│ ◄───────────── │ (Zustand)│ ◄──────────── │(Component)│
│          │   Subscribe    │          │    State     │          │
└──────────┘                └──────────┘               └──────────┘
                                  │
                                  │ API Call
                                  ▼
                           ┌──────────┐
                           │  Server  │
                           │  (API)   │
                           └──────────┘
```

---

## 3. 后端架构设计

### 3.1 目录结构

```
backend/src/
├── controllers/         # 控制器层
│   ├── song.controller.ts
│   ├── user.controller.ts
│   └── playlist.controller.ts
├── routes/              # 路由层
│   ├── song.routes.ts
│   ├── user.routes.ts
│   └── playlist.routes.ts
├── middlewares/         # 中间件
│   └── upload.middleware.ts
├── prisma/              # 数据库配置
│   └── schema.prisma
└── index.ts             # 服务器入口
```

### 3.2 请求处理流程

```
HTTP Request
     │
     ▼
┌─────────────┐
│   Express   │
│   Router    │
└─────────────┘
     │
     ▼
┌─────────────┐
│ Middleware  │  ◄── CORS, JSON Parser, Auth, Upload
└─────────────┘
     │
     ▼
┌─────────────┐
│ Controller  │  ◄── 业务逻辑处理
└─────────────┘
     │
     ▼
┌─────────────┐
│   Prisma    │  ◄── 数据库操作
│    ORM      │
└─────────────┘
     │
     ▼
┌─────────────┐
│   SQLite    │
│  Database   │
└─────────────┘
     │
     ▼
HTTP Response
```

### 3.3 数据库模型 (Prisma Schema)

```prisma
model User {
  id        String     @id @default(uuid())
  email     String     @unique
  username  String
  password  String
  createdAt DateTime   @default(now())
  favorites Favorite[]
  playlists Playlist[]
}

model Song {
  id         String     @id @default(uuid())
  title      String
  artist     String
  album      String?
  duration   Float
  filePath   String
  coverUrl   String?
  lyricsPath String?
  genre      String?
  playCount  Int        @default(0)
  createdAt  DateTime   @default(now())
  favorites  Favorite[]
  playlists  PlaylistSong[]
}

model Playlist {
  id          String         @id @default(uuid())
  name        String
  description String?
  coverUrl    String?
  userId      String
  user        User           @relation(fields: [userId], references: [id])
  songs       PlaylistSong[]
  createdAt   DateTime       @default(now())
}

model PlaylistSong {
  id         String   @id @default(uuid())
  playlistId String
  songId     String
  playlist   Playlist @relation(fields: [playlistId], references: [id])
  song       Song     @relation(fields: [songId], references: [id])
  addedAt    DateTime @default(now())
}

model Favorite {
  id        String   @id @default(uuid())
  userId    String
  songId    String
  user      User     @relation(fields: [userId], references: [id])
  song      Song     @relation(fields: [songId], references: [id])
  createdAt DateTime @default(now())
}
```

---

## 4. 前后端交互

### 4.1 API 通信方式

- **协议**: HTTP/HTTPS
- **数据格式**: JSON
- **认证方式**: JWT Bearer Token
- **跨域处理**: CORS 中间件

### 4.2 请求/响应格式

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**成功响应**:
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

### 4.3 认证流程

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │                    │ Database │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │  POST /api/users/login        │                               │
     │  {email, password}            │                               │
     │ ─────────────────────────────►│                               │
     │                               │  查询用户                      │
     │                               │ ─────────────────────────────►│
     │                               │                               │
     │                               │  返回用户数据                   │
     │                               │ ◄─────────────────────────────│
     │                               │                               │
     │                               │  验证密码 + 生成 JWT           │
     │                               │                               │
     │  {user, token}                │                               │
     │ ◄─────────────────────────────│                               │
     │                               │                               │
     │  存储 Token 到 localStorage    │                               │
     │                               │                               │
     │  后续请求携带 Token            │                               │
     │  Authorization: Bearer xxx    │                               │
     │ ─────────────────────────────►│                               │
     │                               │                               │
```

---

## 5. 部署架构

### 5.1 开发环境

```
┌─────────────────────────────────────────────────────────────┐
│                      开发机器                                │
│  ┌─────────────────┐        ┌─────────────────┐            │
│  │  Vite Dev Server│        │  Express Server │            │
│  │  localhost:5173 │ ◄────► │  localhost:3001 │            │
│  └─────────────────┘        └─────────────────┘            │
│                                     │                       │
│                                     ▼                       │
│                             ┌─────────────────┐            │
│                             │  SQLite File    │            │
│                             │  dev.db         │            │
│                             └─────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 生产环境 (建议)

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx                                │
│                   (反向代理 + 静态文件)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│   静态文件服务       │         │   API 服务          │
│   /dist/*           │         │   /api/*           │
│   (React Build)     │         │   (Express)        │
└─────────────────────┘         └─────────────────────┘
                                          │
                                          ▼
                                ┌─────────────────────┐
                                │      Database       │
                                │   (SQLite/MySQL)    │
                                └─────────────────────┘
```

---

## 6. 安全设计

### 6.1 安全措施

| 安全项 | 实现方式 |
|--------|----------|
| 密码加密 | bcrypt 哈希加盐 |
| 身份认证 | JWT Token |
| 跨域保护 | CORS 白名单 |
| 输入验证 | 服务端参数校验 |
| SQL 注入 | Prisma ORM 参数化查询 |

### 6.2 JWT Token 结构

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "uuid",
    "email": "user@example.com",
    "iat": 1703001600,
    "exp": 1703088000
  },
  "signature": "..."
}
```

---

## 7. 版本历史

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| 1.0 | 2024-12-19 | 初始版本 |

