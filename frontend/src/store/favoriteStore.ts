import { create } from 'zustand';
import type { Song } from '@/types';
import { userApi } from '@/services/api';

interface FavoriteState {
  favorites: Set<string>;
  loading: boolean;
  
  loadFavorites: (userId: string) => Promise<void>;
  toggleFavorite: (userId: string, song: Song) => Promise<void>;
  isFavorite: (songId: string) => boolean;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: new Set(),
  loading: false,

  loadFavorites: async (userId: string) => {
    set({ loading: true });
    try {
      const response = await userApi.getFavorites(userId);
      const favoriteIds = new Set(response.data.map((fav: any) => fav.songId));
      set({ favorites: favoriteIds });
    } catch (error) {
      console.error('加载收藏失败:', error);
    } finally {
      set({ loading: false });
    }
  },

  toggleFavorite: async (userId: string, song: Song) => {
    const { favorites } = get();
    const isFav = favorites.has(song.id);

    try {
      if (isFav) {
        await userApi.removeFavorite(userId, song.id);
        const newFavorites = new Set(favorites);
        newFavorites.delete(song.id);
        set({ favorites: newFavorites });
      } else {
        await userApi.addFavorite(userId, song.id);
        const newFavorites = new Set(favorites);
        newFavorites.add(song.id);
        set({ favorites: newFavorites });
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      throw error;
    }
  },

  isFavorite: (songId: string) => {
    return get().favorites.has(songId);
  },
}));
