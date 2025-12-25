# 开发日志 - 第2阶段：核心功能开发

## 阶段概述
- **目标**: 实现数据库模型、后端API、前端基础组件
- **涉及文件**: prisma/schema.prisma, controllers/, routes/, components/

---

## 详细日志

### [对话] 数据库设计讨论
```
时间: 阶段初期
类型: 用户对话

用户: 请帮我设计数据库模型，需要支持歌曲、用户、播放列表等功能

AI响应: 好的，我来设计数据库模型。根据您的需求，我建议以下模型：
       1. User - 用户表（id, email, username, password）
       2. Song - 歌曲表（id, title, artist, album, duration, filePath等）
       3. Playlist - 播放列表（id, name, userId）
       4. 用户收藏关系表
       
       我现在创建Prisma schema文件...
```

### [代码] 数据库模型设计
```
时间: 讨论后
类型: 代码创建
文件: backend/prisma/schema.prisma

创建内容:

model User {
  id        String     @id @default(uuid())
  email     String     @unique
  username  String
  password  String
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  favorites Song[]     @relation("UserFavorites")
  playlists Playlist[]
}

model Song {
  id         String     @id @default(uuid())
  title      String
  artist     String
  album      String?
  genre      String?
  year       Int?
  duration   Float
  filePath   String
  coverPath  String?
  lyricsPath String?
  playCount  Int        @default(0)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  favoritedBy User[]    @relation("UserFavorites")
  playlists  Playlist[] @relation("PlaylistSongs")
}

model Playlist {
  id          String   @id @default(uuid())
  name        String
  description String?
  coverPath   String?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  songs       Song[]   @relation("PlaylistSongs")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### [代码] 数据库迁移
```
时间: 模型设计后
类型: 命令执行
文件: backend/prisma/migrations/

执行命令:
$ cd backend
$ npx prisma migrate dev --name init

输出:
✓ Generated Prisma Client
✓ Applied migration: 20241219_init

结果: 数据库表创建成功
```

### [对话] API接口规划
```
时间: 数据库完成后
类型: 用户对话

用户: 后端API需要哪些接口？请帮我实现

AI响应: 根据音乐播放器的需求，我建议实现以下API接口：
       
       歌曲模块：
       - GET /api/songs - 获取歌曲列表
       - POST /api/songs - 上传歌曲
       - GET /api/songs/:id - 获取单个歌曲详情
       - DELETE /api/songs/:id - 删除歌曲
       
       用户模块：
       - POST /api/users/register - 注册
       - POST /api/users/login - 登录
       
       我现在开始实现这些接口...

用户: 好的，请开始实现
```

### [代码] 歌曲控制器实现
```
时间: API规划后
类型: 代码创建
文件: backend/src/controllers/song.controller.ts

核心函数:

// 获取歌曲列表
export const getSongs = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, search } = req.query;
  
  const where = search ? {
    OR: [
      { title: { contains: search as string, mode: 'insensitive' } },
      { artist: { contains: search as string, mode: 'insensitive' } },
      { album: { contains: search as string, mode: 'insensitive' } },
    ],
  } : {};

  const songs = await prisma.song.findMany({
    where,
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: songs, total: await prisma.song.count({ where }) });
};

// 上传歌曲
export const uploadSong = async (req: Request, res: Response) => {
  const { title, artist, album, genre, year, duration } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const song = await prisma.song.create({
    data: {
      title,
      artist,
      album,
      genre,
      year: year ? parseInt(year) : null,
      duration: parseFloat(duration),
      filePath: `/uploads/audio/${files.audio[0].filename}`,
      coverPath: files.cover ? `/uploads/covers/${files.cover[0].filename}` : null,
      lyricsPath: files.lyrics ? `/uploads/lyrics/${files.lyrics[0].filename}` : null,
    },
  });

  res.status(201).json({ data: song });
};

// 增加播放次数
export const incrementPlayCount = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const song = await prisma.song.update({
    where: { id },
    data: { playCount: { increment: 1 } },
  });

  res.json({ data: song });
};
```

### [代码] 用户控制器实现
```
时间: 歌曲控制器后
类型: 代码创建
文件: backend/src/controllers/user.controller.ts

核心函数:

// 用户注册
export const register = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  // 检查邮箱是否已存在
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ error: '邮箱已被注册' });
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, username, password: hashedPassword },
  });

  // 生成 JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    data: { id: user.id, email: user.email, username: user.username },
    token,
  });
};

// 用户登录
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );

  res.json({
    data: { id: user.id, email: user.email, username: user.username },
    token,
  });
};
```

### [代码] 路由配置
```
时间: 控制器完成后
类型: 代码创建
文件: backend/src/routes/index.ts

内容:

import { Router } from 'express';
import songRoutes from './song.routes';
import userRoutes from './user.routes';
import playlistRoutes from './playlist.routes';

const router = Router();

router.use('/songs', songRoutes);
router.use('/users', userRoutes);
router.use('/playlists', playlistRoutes);

export default router;
```

### [代码] 文件上传中间件
```
时间: 路由配置后
类型: 代码创建
文件: backend/src/middlewares/upload.ts

内容:

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    if (file.fieldname === 'audio') folder += 'audio/';
    else if (file.fieldname === 'cover') folder += 'covers/';
    else if (file.fieldname === 'lyrics') folder += 'lyrics/';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      const allowed = ['.mp3', '.wav', '.flac', '.m4a'];
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, allowed.includes(ext));
    } else if (file.fieldname === 'cover') {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, allowed.includes(ext));
    } else if (file.fieldname === 'lyrics') {
      cb(null, path.extname(file.originalname).toLowerCase() === '.lrc');
    } else {
      cb(null, false);
    }
  },
});
```

### [代码] 后端入口文件
```
时间: 中间件完成后
类型: 代码创建
文件: backend/src/index.ts

内容:

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api', routes);

// 启动服务
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
```

---

## 阶段总结

### 完成项
- [x] 数据库模型设计 (User, Song, Playlist)
- [x] 数据库迁移
- [x] 歌曲管理API (CRUD + 搜索)
- [x] 用户认证API (注册/登录)
- [x] 文件上传中间件
- [x] JWT认证中间件
- [x] 路由配置

### API接口清单
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | /api/songs | 获取歌曲列表 |
| POST | /api/songs | 上传歌曲 |
| GET | /api/songs/:id | 获取单个歌曲 |
| DELETE | /api/songs/:id | 删除歌曲 |
| POST | /api/songs/:id/play | 增加播放次数 |
| POST | /api/users/register | 用户注册 |
| POST | /api/users/login | 用户登录 |
