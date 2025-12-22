import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取所有播放列表
export const getAllPlaylists = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    const where = userId ? { userId: userId as string } : {};

    const playlists = await prisma.playlist.findMany({
      where,
      include: {
        songs: {
          include: {
            song: true,
          },
          orderBy: { position: 'asc' },
        },
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: playlists });
  } catch (error) {
    console.error('获取播放列表失败:', error);
    res.status(500).json({ error: '获取播放列表失败' });
  }
};

// 获取单个播放列表
export const getPlaylistById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        songs: {
          include: {
            song: true,
          },
          orderBy: { position: 'asc' },
        },
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    if (!playlist) {
      return res.status(404).json({ error: '播放列表不存在' });
    }

    res.json({ data: playlist });
  } catch (error) {
    console.error('获取播放列表失败:', error);
    res.status(500).json({ error: '获取播放列表失败' });
  }
};

// 创建播放列表
export const createPlaylist = async (req: Request, res: Response) => {
  try {
    const { name, description, userId, coverUrl } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: '请提供播放列表名称和用户ID' });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description,
        userId,
        coverUrl,
      },
    });

    res.status(201).json({ data: playlist, message: '播放列表创建成功' });
  } catch (error) {
    console.error('创建播放列表失败:', error);
    res.status(500).json({ error: '创建播放列表失败' });
  }
};

// 更新播放列表
export const updatePlaylist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, coverUrl } = req.body;

    const playlist = await prisma.playlist.update({
      where: { id },
      data: {
        name,
        description,
        coverUrl,
      },
    });

    res.json({ data: playlist, message: '播放列表更新成功' });
  } catch (error) {
    console.error('更新播放列表失败:', error);
    res.status(500).json({ error: '更新播放列表失败' });
  }
};

// 删除播放列表
export const deletePlaylist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.playlist.delete({
      where: { id },
    });

    res.json({ message: '播放列表删除成功' });
  } catch (error) {
    console.error('删除播放列表失败:', error);
    res.status(500).json({ error: '删除播放列表失败' });
  }
};

// 添加歌曲到播放列表
export const addSongToPlaylist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ error: '请提供歌曲ID' });
    }

    // 获取当前播放列表中的最大位置
    const maxPosition = await prisma.playlistSong.findFirst({
      where: { playlistId: id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = maxPosition ? maxPosition.position + 1 : 0;

    const playlistSong = await prisma.playlistSong.create({
      data: {
        playlistId: id,
        songId,
        position,
      },
      include: {
        song: true,
      },
    });

    res.status(201).json({ data: playlistSong, message: '歌曲添加成功' });
  } catch (error) {
    console.error('添加歌曲失败:', error);
    res.status(500).json({ error: '添加歌曲失败' });
  }
};

// 从播放列表移除歌曲
export const removeSongFromPlaylist = async (req: Request, res: Response) => {
  try {
    const { id, songId } = req.params;

    await prisma.playlistSong.deleteMany({
      where: {
        playlistId: id,
        songId,
      },
    });

    res.json({ message: '歌曲移除成功' });
  } catch (error) {
    console.error('移除歌曲失败:', error);
    res.status(500).json({ error: '移除歌曲失败' });
  }
};
