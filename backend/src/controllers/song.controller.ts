import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { parseFile } from 'music-metadata';
import path from 'path';

const prisma = new PrismaClient();

// 获取所有歌曲
export const getAllSongs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, genre, artist } = req.query;
    
    const where: any = {};
    if (genre) where.genre = genre;
    if (artist) where.artist = { contains: artist as string, mode: 'insensitive' };

    const songs = await prisma.song.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.song.count({ where });

    res.json({
      data: songs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('获取歌曲列表失败:', error);
    res.status(500).json({ error: '获取歌曲列表失败' });
  }
};

// 搜索歌曲
export const searchSongs = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: '请提供搜索关键词' });
    }

    const songs = await prisma.song.findMany({
      where: {
        OR: [
          { title: { contains: q as string, mode: 'insensitive' } },
          { artist: { contains: q as string, mode: 'insensitive' } },
          { album: { contains: q as string, mode: 'insensitive' } },
        ],
      },
      take: 50,
    });

    res.json({ data: songs });
  } catch (error) {
    console.error('搜索歌曲失败:', error);
    res.status(500).json({ error: '搜索歌曲失败' });
  }
};

// 获取单个歌曲
export const getSongById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const song = await prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      return res.status(404).json({ error: '歌曲不存在' });
    }

    res.json({ data: song });
  } catch (error) {
    console.error('获取歌曲失败:', error);
    res.status(500).json({ error: '获取歌曲失败' });
  }
};

// 上传歌曲
export const uploadSong = async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const { title, artist, album, genre, year } = req.body;

    if (!files.audio || !files.audio[0]) {
      return res.status(400).json({ error: '请上传音频文件' });
    }

    const audioFile = files.audio[0];
    const coverFile = files.cover ? files.cover[0] : null;
    const lyricsFile = files.lyrics ? files.lyrics[0] : null;

    // 解析音频元数据
    const metadata = await parseFile(audioFile.path);
    const duration = Math.floor(metadata.format.duration || 0);

    const song = await prisma.song.create({
      data: {
        title: title || metadata.common.title || '未知歌曲',
        artist: artist || metadata.common.artist || '未知艺术家',
        album: album || metadata.common.album || null,
        duration,
        filePath: `/uploads/${audioFile.filename}`,
        coverUrl: coverFile ? `/uploads/${coverFile.filename}` : null,
        lyricsPath: lyricsFile ? `/uploads/${lyricsFile.filename}` : null,
        genre: genre || metadata.common.genre?.[0] || null,
        year: year ? parseInt(year) : metadata.common.year || null,
      },
    });

    res.status(201).json({ data: song, message: '歌曲上传成功' });
  } catch (error) {
    console.error('上传歌曲失败:', error);
    res.status(500).json({ error: '上传歌曲失败' });
  }
};

// 更新歌曲信息
export const updateSong = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, artist, album, genre, year } = req.body;

    const song = await prisma.song.update({
      where: { id },
      data: {
        title,
        artist,
        album,
        genre,
        year: year ? parseInt(year) : null,
      },
    });

    res.json({ data: song, message: '歌曲信息更新成功' });
  } catch (error) {
    console.error('更新歌曲失败:', error);
    res.status(500).json({ error: '更新歌曲失败' });
  }
};

// 删除歌曲
export const deleteSong = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.song.delete({
      where: { id },
    });

    res.json({ message: '歌曲删除成功' });
  } catch (error) {
    console.error('删除歌曲失败:', error);
    res.status(500).json({ error: '删除歌曲失败' });
  }
};

// 增加播放次数
export const incrementPlayCount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const song = await prisma.song.update({
      where: { id },
      data: {
        playCount: { increment: 1 },
      },
    });

    res.json({ data: song });
  } catch (error) {
    console.error('更新播放次数失败:', error);
    res.status(500).json({ error: '更新播放次数失败' });
  }
};
