import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 用户注册
export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: '请提供完整的注册信息' });
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
      },
    });

    // 生成JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      data: { user, token },
      message: '注册成功',
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败' });
  }
};

// 用户登录
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '请提供邮箱和密码' });
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
        },
        token,
      },
      message: '登录成功',
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
};

// 获取用户信息
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
};

// 获取用户收藏
export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const favorites = await prisma.favorite.findMany({
      where: { userId: id },
      include: {
        song: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: favorites });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ error: '获取收藏列表失败' });
  }
};

// 添加收藏
export const addFavorite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ error: '请提供歌曲ID' });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: id,
        songId,
      },
      include: {
        song: true,
      },
    });

    res.status(201).json({ data: favorite, message: '收藏成功' });
  } catch (error) {
    console.error('添加收藏失败:', error);
    res.status(500).json({ error: '添加收藏失败' });
  }
};

// 取消收藏
export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const { id, songId } = req.params;

    await prisma.favorite.deleteMany({
      where: {
        userId: id,
        songId,
      },
    });

    res.json({ message: '取消收藏成功' });
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({ error: '取消收藏失败' });
  }
};

// 获取用户统计数据
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取收藏数量
    const favoriteCount = await prisma.favorite.count({
      where: { userId: id },
    });

    // 获取歌单数量
    const playlistCount = await prisma.playlist.count({
      where: { userId: id },
    });

    // 获取用户收藏歌曲的总播放次数
    const favorites = await prisma.favorite.findMany({
      where: { userId: id },
      include: { song: true },
    });
    const totalPlayCount = favorites.reduce((sum, fav) => sum + (fav.song?.playCount || 0), 0);

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json({
      data: {
        user,
        stats: {
          favoriteCount,
          playlistCount,
          totalPlayCount,
        },
      },
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ error: '获取用户统计失败' });
  }
};

// 更新用户资料
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, avatar } = req.body;

    // 检查用户名是否已被占用
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id },
        },
      });
      if (existingUser) {
        return res.status(400).json({ error: '用户名已被占用' });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(username && { username }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json({ data: user, message: '资料更新成功' });
  } catch (error) {
    console.error('更新资料失败:', error);
    res.status(500).json({ error: '更新资料失败' });
  }
};

// 修改密码
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请提供旧密码和新密码' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度至少6位' });
    }

    // 获取用户当前密码
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: '旧密码错误' });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
};

// 获取最常播放的歌曲
export const getMostPlayed = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // 获取用户收藏中播放次数最多的歌曲
    const favorites = await prisma.favorite.findMany({
      where: { userId: id },
      include: { song: true },
      orderBy: { song: { playCount: 'desc' } },
      take: limit,
    });

    const songs = favorites.map(fav => fav.song);
    res.json({ data: songs });
  } catch (error) {
    console.error('获取最常播放失败:', error);
    res.status(500).json({ error: '获取最常播放失败' });
  }
};

// 获取用户的所有播放列表
export const getUserPlaylists = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const playlists = await prisma.playlist.findMany({
      where: { userId: id },
      include: {
        songs: {
          include: { song: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: playlists });
  } catch (error) {
    console.error('获取用户播放列表失败:', error);
    res.status(500).json({ error: '获取用户播放列表失败' });
  }
};

// 上传头像
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: '请选择头像文件' });
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 构建头像URL
    const avatarUrl = `/uploads/${req.file.filename}`;

    // 更新用户头像
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json({ data: updatedUser, message: '头像上传成功' });
  } catch (error) {
    console.error('上传头像失败:', error);
    res.status(500).json({ error: '上传头像失败' });
  }
};
