import { create } from 'zustand';
import type { Playlist } from '@/types';
import { playlistApi } from '@/services/api';

interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadPlaylists: (userId: string) => Promise<void>;
  createPlaylist: (data: { name: string; description?: string; userId: string }) => Promise<Playlist | null>;
  updatePlaylist: (id: string, data: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  playlists: [],
  currentPlaylist: null,
  isLoading: false,
  error: null,

  loadPlaylists: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await playlistApi.getAll(userId);
      set({ playlists: response.data, isLoading: false });
    } catch (error) {
      set({ error: '加载播放列表失败', isLoading: false });
    }
  },

  createPlaylist: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await playlistApi.create(data);
      const newPlaylist = response.data;
      set((state) => ({
        playlists: [newPlaylist, ...state.playlists],
        isLoading: false,
      }));
      return newPlaylist;
    } catch (error) {
      set({ error: '创建播放列表失败', isLoading: false });
      return null;
    }
  },

  updatePlaylist: async (id, data) => {
    try {
      const response = await playlistApi.update(id, data);
      set((state) => ({
        playlists: state.playlists.map((p) => (p.id === id ? response.data : p)),
        currentPlaylist: state.currentPlaylist?.id === id ? response.data : state.currentPlaylist,
      }));
    } catch (error) {
      set({ error: '更新播放列表失败' });
    }
  },

  deletePlaylist: async (id) => {
    try {
      await playlistApi.delete(id);
      set((state) => ({
        playlists: state.playlists.filter((p) => p.id !== id),
        currentPlaylist: state.currentPlaylist?.id === id ? null : state.currentPlaylist,
      }));
    } catch (error) {
      set({ error: '删除播放列表失败' });
    }
  },

  addSongToPlaylist: async (playlistId, songId) => {
    try {
      await playlistApi.addSong(playlistId, songId);
      // 重新加载播放列表以获取更新后的歌曲列表
      const response = await playlistApi.getById(playlistId);
      set((state) => ({
        playlists: state.playlists.map((p) => (p.id === playlistId ? response.data : p)),
        currentPlaylist: state.currentPlaylist?.id === playlistId ? response.data : state.currentPlaylist,
      }));
    } catch (error) {
      set({ error: '添加歌曲失败' });
    }
  },

  removeSongFromPlaylist: async (playlistId, songId) => {
    try {
      await playlistApi.removeSong(playlistId, songId);
      set((state) => ({
        playlists: state.playlists.map((p) => {
          if (p.id === playlistId) {
            return { ...p, songs: p.songs.filter((s) => s.songId !== songId) };
          }
          return p;
        }),
        currentPlaylist: state.currentPlaylist?.id === playlistId
          ? { ...state.currentPlaylist, songs: state.currentPlaylist.songs.filter((s) => s.songId !== songId) }
          : state.currentPlaylist,
      }));
    } catch (error) {
      set({ error: '移除歌曲失败' });
    }
  },

  setCurrentPlaylist: (playlist) => {
    set({ currentPlaylist: playlist });
  },
}));
