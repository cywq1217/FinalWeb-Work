// 歌曲类型
export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  filePath: string;
  coverUrl?: string;
  lyricsPath?: string;
  genre?: string;
  year?: number;
  playCount?: number;
  createdAt?: string;
  updatedAt?: string;
  source?: 'local' | 'netease'; // 歌曲来源
  neteaseId?: number; // 网易云歌曲ID
}

// 播放列表类型
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  userId: string;
  songs: PlaylistSong[];
  createdAt: string;
  updatedAt: string;
}

// 播放列表-歌曲关联
export interface PlaylistSong {
  id: string;
  playlistId: string;
  songId: string;
  position: number;
  song: Song;
  addedAt: string;
}

// 用户类型
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: string;
}

// API响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 播放器状态
export enum PlaybackStatus {
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  LOADING = 'loading',
}

// 播放模式
export enum PlayMode {
  SEQUENCE = 'sequence',    // 顺序播放
  LOOP = 'loop',            // 列表循环
  SINGLE = 'single',        // 单曲循环
  SHUFFLE = 'shuffle',      // 随机播放
}
