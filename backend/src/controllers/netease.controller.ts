import { Request, Response } from 'express';

// 网易云音乐官方 API
const NETEASE_API_BASE = 'https://music.163.com/api';

// 类型定义
interface NeteaseResponse {
  code: number;
  result?: {
    songs?: any[];
    songCount?: number;
  };
  songs?: any[];
  data?: any[];
  lrc?: { lyric?: string };
  tlyric?: { lyric?: string };
  playlist?: {
    tracks?: any[];
  };
  playlists?: any[];
}

// 搜索歌曲
export const searchSongs = async (req: Request, res: Response) => {
  try {
    const { keywords, limit = 30, offset = 0 } = req.query;
    
    if (!keywords) {
      return res.status(400).json({ error: '请输入搜索关键词' });
    }

    const response = await fetch(
      `${NETEASE_API_BASE}/search/get?s=${encodeURIComponent(keywords as string)}&type=1&limit=${limit}&offset=${offset}`
    );
    
    const data = await response.json() as NeteaseResponse;
    
    if (data.code === 200 && data.result?.songs) {
      const songs = data.result.songs.map((song: any) => {
        // 使用歌手头像作为封面（搜索结果中没有专辑封面）
        const coverUrl = song.artists?.[0]?.img1v1Url || null;
        
        return {
          id: `netease_${song.id}`,
          neteaseId: song.id,
          title: song.name,
          artist: song.artists?.map((a: any) => a.name).join(', ') || '未知歌手',
          album: song.album?.name || '未知专辑',
          albumId: song.album?.id,
          duration: (song.duration || 0) / 1000,
          coverUrl: coverUrl,
          source: 'netease'
        };
      });
      
      res.json({
        data: songs,
        total: data.result.songCount || songs.length
      });
    } else {
      res.json({ data: [], total: 0 });
    }
  } catch (error) {
    console.error('网易云搜索失败:', error);
    res.status(500).json({ error: '搜索失败，请稍后重试' });
  }
};

// 获取歌曲详情
export const getSongDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const response = await fetch(`${NETEASE_API_BASE}/song/detail?ids=[${id}]`);
    const data = await response.json() as any;
    
    if (data.code === 200 && data.songs?.[0]) {
      const song = data.songs[0];
      res.json({
        data: {
          id: `netease_${song.id}`,
          neteaseId: song.id,
          title: song.name,
          artist: song.artists?.map((a: any) => a.name).join(', ') || '未知歌手',
          album: song.album?.name || '未知专辑',
          duration: (song.duration || 0) / 1000,
          coverUrl: song.album?.picUrl || song.album?.blurPicUrl || null,
          source: 'netease'
        }
      });
    } else {
      res.status(404).json({ error: '歌曲不存在' });
    }
  } catch (error) {
    console.error('获取歌曲详情失败:', error);
    res.status(500).json({ error: '获取详情失败' });
  }
};

// 获取歌曲播放地址
export const getSongUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 尝试获取真实的播放地址
    const response = await fetch(`https://music.163.com/api/song/enhance/player/url?ids=[${id}]&br=320000`);
    const data = await response.json() as any;
    
    if (data.code === 200 && data.data?.[0]?.url) {
      res.json({
        data: {
          url: data.data[0].url,
          type: 'mp3'
        }
      });
    } else {
      // 备用：使用外链格式
      res.json({
        data: {
          url: `https://music.163.com/song/media/outer/url?id=${id}.mp3`,
          type: 'mp3'
        }
      });
    }
  } catch (error) {
    console.error('获取播放地址失败:', error);
    res.status(500).json({ error: '获取播放地址失败' });
  }
};

// 获取歌词
export const getLyric = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const response = await fetch(`${NETEASE_API_BASE}/song/lyric?id=${id}&lv=1&kv=1&tv=-1`);
    const data = await response.json() as NeteaseResponse;
    
    if (data.code === 200) {
      res.json({
        data: {
          lrc: data.lrc?.lyric || '',
          tlyric: data.tlyric?.lyric || '' // 翻译歌词
        }
      });
    } else {
      res.json({ data: { lrc: '', tlyric: '' } });
    }
  } catch (error) {
    console.error('获取歌词失败:', error);
    res.status(500).json({ error: '获取歌词失败' });
  }
};

// 获取热门歌曲榜单
export const getTopSongs = async (req: Request, res: Response) => {
  try {
    // 获取热歌榜 (id: 3778678)
    const response = await fetch(`${NETEASE_API_BASE}/playlist/detail?id=3778678`);
    const data = await response.json() as NeteaseResponse;
    
    if (data.code === 200 && data.playlist?.tracks) {
      const songs = data.playlist.tracks.slice(0, 50).map((song: any) => ({
        id: `netease_${song.id}`,
        neteaseId: song.id,
        title: song.name,
        artist: song.ar?.map((a: any) => a.name).join(', ') || '未知歌手',
        album: song.al?.name || '未知专辑',
        duration: (song.dt || 0) / 1000,
        coverUrl: song.al?.picUrl || null,
        source: 'netease'
      }));
      
      res.json({ data: songs });
    } else {
      res.json({ data: [] });
    }
  } catch (error) {
    console.error('获取热门歌曲失败:', error);
    res.status(500).json({ error: '获取热门歌曲失败' });
  }
};

// 获取推荐歌单
export const getRecommendPlaylists = async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NETEASE_API_BASE}/top/playlist?limit=10`);
    const data = await response.json() as NeteaseResponse;
    
    if (data.code === 200 && data.playlists) {
      const playlists = data.playlists.map((pl: any) => ({
        id: pl.id,
        name: pl.name,
        coverUrl: pl.coverImgUrl,
        playCount: pl.playCount,
        trackCount: pl.trackCount
      }));
      
      res.json({ data: playlists });
    } else {
      res.json({ data: [] });
    }
  } catch (error) {
    console.error('获取推荐歌单失败:', error);
    res.status(500).json({ error: '获取推荐歌单失败' });
  }
};
