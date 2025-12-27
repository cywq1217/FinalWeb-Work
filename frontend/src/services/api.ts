import axios from 'axios';
import type { Song, Playlist, User, ApiResponse, PaginatedResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 歌曲相关API
export const songApi = {
  // 获取所有歌曲
  getAll: (params?: { page?: number; limit?: number; genre?: string; artist?: string }) =>
    api.get<any, PaginatedResponse<Song>>('/songs', { params }),

  // 搜索歌曲
  search: (query: string) =>
    api.get<any, ApiResponse<Song[]>>('/songs/search', { params: { q: query } }),

  // 获取单个歌曲
  getById: (id: string) =>
    api.get<any, ApiResponse<Song>>(`/songs/${id}`),

  // 上传歌曲
  upload: (formData: FormData) =>
    api.post<any, ApiResponse<Song>>('/songs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // 更新歌曲信息
  update: (id: string, data: Partial<Song>) =>
    api.put<any, ApiResponse<Song>>(`/songs/${id}`, data),

  // 删除歌曲
  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/songs/${id}`),

  // 增加播放次数
  incrementPlayCount: (id: string) =>
    api.post<any, ApiResponse<Song>>(`/songs/${id}/play`),

  // 导入网易云歌曲
  importFromNetease: (data: { neteaseId: string; title: string; artist: string; album?: string; duration?: number; coverUrl?: string }) =>
    api.post<any, ApiResponse<Song>>('/songs/import', data),
};

// 播放列表相关API
export const playlistApi = {
  // 获取所有播放列表
  getAll: (userId?: string) =>
    api.get<any, ApiResponse<Playlist[]>>('/playlists', { params: { userId } }),

  // 获取单个播放列表
  getById: (id: string) =>
    api.get<any, ApiResponse<Playlist>>(`/playlists/${id}`),

  // 创建播放列表
  create: (data: { name: string; description?: string; userId: string; coverUrl?: string }) =>
    api.post<any, ApiResponse<Playlist>>('/playlists', data),

  // 更新播放列表
  update: (id: string, data: Partial<Playlist>) =>
    api.put<any, ApiResponse<Playlist>>(`/playlists/${id}`, data),

  // 删除播放列表
  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/playlists/${id}`),

  // 添加歌曲到播放列表
  addSong: (playlistId: string, songId: string) =>
    api.post<any, ApiResponse<any>>(`/playlists/${playlistId}/songs`, { songId }),

  // 从播放列表移除歌曲
  removeSong: (playlistId: string, songId: string) =>
    api.delete<any, ApiResponse<void>>(`/playlists/${playlistId}/songs/${songId}`),
};

// 网易云音乐相关API
export const neteaseApi = {
  // 搜索歌曲
  search: (keywords: string, limit = 30, offset = 0) =>
    api.get<any, { data: Song[]; total: number }>('/netease/search', { params: { keywords, limit, offset } }),

  // 获取热门歌曲
  getTopSongs: () =>
    api.get<any, ApiResponse<Song[]>>('/netease/top'),

  // 获取推荐歌单
  getPlaylists: () =>
    api.get<any, ApiResponse<any[]>>('/netease/playlists'),

  // 获取歌曲详情
  getSongDetail: (id: string) =>
    api.get<any, ApiResponse<Song>>(`/netease/song/${id}`),

  // 获取播放地址
  getSongUrl: (id: string) =>
    api.get<any, ApiResponse<{ url: string; type: string }>>(`/netease/song/${id}/url`),

  // 获取歌词
  getLyric: (id: string) =>
    api.get<any, ApiResponse<{ lrc: string; tlyric: string }>>(`/netease/song/${id}/lyric`),
};

// 用户相关API
export const userApi = {
  // 注册
  register: (data: { email: string; username: string; password: string }) =>
    api.post<any, ApiResponse<{ user: User; token: string }>>('/users/register', data),

  // 登录
  login: (data: { email: string; password: string }) =>
    api.post<any, ApiResponse<{ user: User; token: string }>>('/users/login', data),

  // 获取用户信息
  getById: (id: string) =>
    api.get<any, ApiResponse<User>>(`/users/${id}`),

  // 获取用户统计数据
  getStats: (userId: string) =>
    api.get<any, ApiResponse<{ user: User; stats: { favoriteCount: number; playlistCount: number; totalPlayCount: number } }>>(`/users/${userId}/stats`),

  // 更新用户资料
  updateProfile: (userId: string, data: { username?: string; avatar?: string }) =>
    api.put<any, ApiResponse<User>>(`/users/${userId}/profile`, data),

  // 修改密码
  changePassword: (userId: string, data: { oldPassword: string; newPassword: string }) =>
    api.put<any, ApiResponse<void>>(`/users/${userId}/password`, data),

  // 获取最常播放的歌曲
  getMostPlayed: (userId: string, limit = 10) =>
    api.get<any, ApiResponse<Song[]>>(`/users/${userId}/most-played`, { params: { limit } }),

  // 获取用户的所有播放列表
  getPlaylists: (userId: string) =>
    api.get<any, ApiResponse<Playlist[]>>(`/users/${userId}/playlists`),

  // 获取用户收藏
  getFavorites: (userId: string) =>
    api.get<any, ApiResponse<any[]>>(`/users/${userId}/favorites`),

  // 添加收藏
  addFavorite: (userId: string, songId: string) =>
    api.post<any, ApiResponse<any>>(`/users/${userId}/favorites`, { songId }),

  // 取消收藏
  removeFavorite: (userId: string, songId: string) =>
    api.delete<any, ApiResponse<void>>(`/users/${userId}/favorites/${songId}`),

  // 上传头像
  uploadAvatar: (userId: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<any, ApiResponse<User>>(`/users/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
