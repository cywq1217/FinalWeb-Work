import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music, Heart, Trash2, ListPlus } from 'lucide-react';
import type { Song } from '@/types';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useFavoriteStore } from '@/store/favoriteStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { PlaybackStatus } from '@/types';
import { formatTime } from '@/utils/format';
import { songApi } from '@/services/api';

interface SongItemProps {
  song: Song;
  index: number;
  onDelete?: (songId: string) => void;
}

export default function SongItem({ song, index, onDelete }: SongItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { currentSong, status, playSong, togglePlay } = usePlayerStore();
  const { user } = useAuthStore();
  const { toggleFavorite, isFavorite } = useFavoriteStore();
  const { playlists, loadPlaylists, addSongToPlaylist } = usePlaylistStore();
  
  const isCurrentSong = currentSong?.id === song.id;
  const isPlaying = isCurrentSong && status === PlaybackStatus.PLAYING;
  const isFav = isFavorite(song.id);

  // 加载播放列表
  useEffect(() => {
    if (user && showPlaylistMenu && playlists.length === 0) {
      loadPlaylists(user.id);
    }
  }, [user, showPlaylistMenu, playlists.length, loadPlaylists]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPlaylistMenu(false);
      }
    };
    if (showPlaylistMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlaylistMenu]);

  const handleAddToPlaylist = async (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    await addSongToPlaylist(playlistId, song.id);
    setShowPlaylistMenu(false);
    alert('已添加到播放列表');
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确定要删除 "${song.title}" 吗？`)) return;
    
    setIsDeleting(true);
    try {
      await songApi.delete(song.id);
      onDelete?.(song.id);
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClick = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      await toggleFavorite(user.id, song);
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
        isCurrentSong
          ? 'bg-purple-50 border border-purple-200 shadow-md'
          : 'hover:bg-gray-100 hover:shadow-sm'
      }`}
    >
      {/* 序号/播放按钮 */}
      <div className="w-10 flex items-center justify-center">
        {isPlaying ? (
          <div className="text-purple-600">
            <Pause className="w-5 h-5" fill="currentColor" />
          </div>
        ) : (
          <>
            <span className="group-hover:hidden text-gray-500 text-sm">{index + 1}</span>
            <Play className="hidden group-hover:block text-purple-600 w-5 h-5" fill="currentColor" />
          </>
        )}
      </div>

      {/* 封面 */}
      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-md flex-shrink-0 overflow-hidden">
        {song.coverUrl ? (
          <img src={song.coverUrl.startsWith('http') ? song.coverUrl : `http://localhost:3001${song.coverUrl}`} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <Music className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* 歌曲信息 */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium truncate ${isCurrentSong ? 'text-purple-600' : 'text-gray-900'}`}>
          {song.title}
        </h3>
        <p className="text-sm text-gray-500 truncate">{song.artist}</p>
      </div>

      {/* 专辑 */}
      <div className="hidden md:block w-48 text-sm text-gray-500 truncate">
        {song.album || '未知专辑'}
      </div>

      {/* 时长 */}
      <div className="text-sm text-gray-500">
        {formatTime(song.duration)}
      </div>

      {/* 添加到播放列表 */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowPlaylistMenu(!showPlaylistMenu); }}
          className="text-gray-400 hover:text-purple-500 transition-all opacity-0 group-hover:opacity-100"
          title="添加到播放列表"
        >
          <ListPlus className="w-5 h-5" />
        </button>
        {showPlaylistMenu && (
          <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border z-50 min-w-[160px] py-2">
            <div className="px-3 py-1 text-xs text-gray-500 border-b mb-1">添加到播放列表</div>
            {!user ? (
              <div className="px-3 py-2 text-sm text-gray-400">请先登录</div>
            ) : playlists.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">暂无播放列表</div>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={(e) => handleAddToPlaylist(e, pl.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 hover:text-purple-600"
                >
                  {pl.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* 收藏按钮 */}
      <button
        onClick={handleFavoriteClick}
        className={`transition-all duration-300 ${
          isFav
            ? 'text-red-500 scale-110'
            : 'text-gray-400 hover:text-red-500 hover:scale-110'
        }`}
      >
        <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
      </button>

      {/* 删除按钮 */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={`transition-all duration-300 opacity-0 group-hover:opacity-100 ${
          isDeleting
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-400 hover:text-red-500 hover:scale-110'
        }`}
        title="删除歌曲"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
