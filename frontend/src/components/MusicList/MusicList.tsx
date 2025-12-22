import { useEffect, useState, useCallback } from 'react';
import { Music2, Search, Upload as UploadIcon, User, LogOut, ListMusic, X, Clock, Filter, Cloud } from 'lucide-react';
import type { Song } from '@/types';
import { songApi } from '@/services/api';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useFavoriteStore } from '@/store/favoriteStore';
import SongItem from './SongItem';
import UploadModal from '../Upload/UploadModal';
import AuthModal from '../Auth/AuthModal';
import PlaylistPanel from '../Playlist/PlaylistPanel';
import HistoryPanel from '../History/HistoryPanel';
import NeteaseSearch from '../Netease/NeteaseSearch';
import { SongListSkeleton } from '../Loading/SongSkeleton';

export default function MusicList() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
const [showNetease, setShowNetease] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [filterGenre, setFilterGenre] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  
  const { setPlaylist, restorePlaybackMemory } = usePlayerStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { loadFavorites } = useFavoriteStore();

  useEffect(() => {
    loadSongs();
  }, []);

  useEffect(() => {
    if (user) {
      loadFavorites(user.id);
    }
  }, [user, loadFavorites]);

  const loadSongs = async () => {
    try {
      setLoading(true);
      const response = await songApi.getAll({ limit: 100 });
      setSongs(response.data);
      setAllSongs(response.data);
      
      // 提取所有流派
      const allGenres = [...new Set(response.data.map(s => s.genre).filter(Boolean))] as string[];
      setGenres(allGenres);
      
      // 恢复播放记忆或设置播放列表
      if (response.data.length > 0) {
        restorePlaybackMemory(response.data);
      }
    } catch (error) {
      console.error('加载歌曲失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 实时搜索（防抖）
  const debouncedSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSongs(filterGenre ? allSongs.filter(s => s.genre === filterGenre) : allSongs);
      return;
    }
    const q = query.toLowerCase();
    const filtered = allSongs.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.artist.toLowerCase().includes(q) ||
      s.album?.toLowerCase().includes(q)
    );
    setSongs(filterGenre ? filtered.filter(s => s.genre === filterGenre) : filtered);
  }, [allSongs, filterGenre]);

  // 搜索输入变化时触发实时搜索
  useEffect(() => {
    const timer = setTimeout(() => debouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  // 流派筛选变化时
  useEffect(() => {
    if (filterGenre) {
      setSongs(allSongs.filter(s => s.genre === filterGenre));
    } else {
      setSongs(allSongs);
    }
  }, [filterGenre, allSongs]);

  // 保存搜索历史
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadSongs();
      return;
    }

    try {
      setLoading(true);
      const response = await songApi.search(searchQuery);
      setSongs(response.data);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSong = (songId: string) => {
    setSongs(songs.filter(s => s.id !== songId));
    setPlaylist(songs.filter(s => s.id !== songId));
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 bg-white/90 backdrop-blur-sm rounded-2xl my-4 shadow-lg">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <SongListSkeleton count={8} />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-6 bg-white/90 backdrop-blur-sm rounded-2xl my-4 shadow-lg">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center animate-pulse-slow">
                <Music2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">音乐库</h1>
                <p className="text-sm text-gray-500">{songs.length} 首歌曲</p>
              </div>
            </div>

            {/* 用户操作按钮 */}
            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
              <button
                onClick={() => setShowNetease(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 border border-red-400 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Cloud className="w-5 h-5" />
                <span className="hidden sm:inline">网易云</span>
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Clock className="w-5 h-5" />
                <span className="hidden sm:inline">播放历史</span>
              </button>
              <button
                onClick={() => setShowPlaylist(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <ListMusic className="w-5 h-5" />
                <span className="hidden sm:inline">播放列表</span>
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                <UploadIcon className="w-5 h-5" />
                <span className="hidden sm:inline">上传音乐</span>
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="退出登录"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <User className="w-5 h-5" />
                  登录/注册
                </button>
              )}
            </div>
          </div>

        {/* 搜索框和筛选 */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索歌曲、艺术家或专辑..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              onKeyPress={(e) => { if (e.key === 'Enter') { saveSearchHistory(searchQuery); handleSearch(); } }}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
            {/* 搜索历史下拉 */}
            {showSearchDropdown && searchHistory.length > 0 && !searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />搜索历史</span>
                  <button onClick={clearSearchHistory} className="text-xs text-gray-400 hover:text-red-500">清空</button>
                </div>
                {searchHistory.map((h, i) => (
                  <button key={i} onClick={() => { setSearchQuery(h); setShowSearchDropdown(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 hover:text-purple-600">
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 流派筛选 */}
          {genres.length > 0 && (
            <div className="relative">
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white cursor-pointer"
              >
                <option value="">全部流派</option>
                {genres.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* 歌曲列表 */}
      {songs.length === 0 ? (
        <div className="text-center py-12">
          <Music2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无歌曲</p>
          <p className="text-sm text-gray-400 mt-2">请先上传一些音乐文件</p>
        </div>
      ) : (
        <div className="space-y-1">
          {songs.map((song, index) => (
            <div key={song.id} className="animate-slide-up" style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}>
              <SongItem song={song} index={index} onDelete={handleDeleteSong} />
            </div>
          ))}
        </div>
      )}
      </div>

      {/* 模态框 */}
      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => {
          loadSongs();
          alert('上传成功！');
        }}
      />
      
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
      />

      <PlaylistPanel
        isOpen={showPlaylist}
        onClose={() => setShowPlaylist(false)}
      />

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <NeteaseSearch
        isOpen={showNetease}
        onClose={() => setShowNetease(false)}
      />
    </>
  );
}
