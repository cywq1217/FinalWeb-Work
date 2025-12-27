import { useState, useEffect } from 'react';
import { X, User, Heart, ListMusic, Play, Settings, Lock, LogOut, Music, Calendar, Mail, Camera, Upload } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import { userApi } from '@/services/api';
import type { Song, Playlist } from '@/types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserStats {
  favoriteCount: number;
  playlistCount: number;
  totalPlayCount: number;
}

type TabType = 'overview' | 'favorites' | 'playlists' | 'most-played' | 'settings';

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, logout, updateUser } = useAuthStore();
  const { playSong, setPlaylist } = usePlayerStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mostPlayed, setMostPlayed] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 设置相关状态
  const [newUsername, setNewUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // 加载用户统计数据
  useEffect(() => {
    if (isOpen && user) {
      loadUserStats();
      setNewUsername(user.username);
    }
  }, [isOpen, user]);

  // 切换标签时加载对应数据
  useEffect(() => {
    if (!isOpen || !user) return;
    
    switch (activeTab) {
      case 'favorites':
        loadFavorites();
        break;
      case 'playlists':
        loadPlaylists();
        break;
      case 'most-played':
        loadMostPlayed();
        break;
    }
  }, [activeTab, isOpen, user]);

  const loadUserStats = async () => {
    if (!user) return;
    try {
      const response = await userApi.getStats(user.id);
      setStats(response.data.stats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await userApi.getFavorites(user.id);
      const songs = response.data.map((fav: any) => fav.song);
      setFavorites(songs);
    } catch (error) {
      console.error('加载收藏失败:', error);
    }
    setLoading(false);
  };

  const loadPlaylists = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await userApi.getPlaylists(user.id);
      setPlaylists(response.data);
    } catch (error) {
      console.error('加载播放列表失败:', error);
    }
    setLoading(false);
  };

  const loadMostPlayed = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await userApi.getMostPlayed(user.id, 10);
      setMostPlayed(response.data);
    } catch (error) {
      console.error('加载最常播放失败:', error);
    }
    setLoading(false);
  };

  const handlePlaySong = (song: Song) => {
    playSong(song);
  };

  const handlePlayAll = (songs: Song[]) => {
    if (songs.length > 0) {
      setPlaylist(songs, 0);
    }
  };

  const handleUpdateUsername = async () => {
    if (!user || !newUsername.trim()) return;
    setSettingsError('');
    setSettingsMessage('');
    
    try {
      const response = await userApi.updateProfile(user.id, { username: newUsername.trim() });
      updateUser(response.data);
      setSettingsMessage('用户名修改成功');
    } catch (error: any) {
      setSettingsError(error.response?.data?.error || '修改失败');
    }
  };

  const handleChangePassword = async () => {
    setSettingsError('');
    setSettingsMessage('');
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      setSettingsError('请填写所有密码字段');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setSettingsError('两次输入的新密码不一致');
      return;
    }
    
    if (newPassword.length < 6) {
      setSettingsError('新密码长度至少6位');
      return;
    }
    
    if (!user) return;
    
    try {
      await userApi.changePassword(user.id, { oldPassword, newPassword });
      setSettingsMessage('密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setSettingsError(error.response?.data?.error || '修改失败');
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setSettingsError('请上传 JPG、PNG、WebP 或 GIF 格式的图片');
      return;
    }

    // 检查文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      setSettingsError('图片大小不能超过 5MB');
      return;
    }

    setUploadingAvatar(true);
    setSettingsError('');
    setSettingsMessage('');

    try {
      const response = await userApi.uploadAvatar(user.id, file);
      updateUser(response.data);
      setSettingsMessage('头像上传成功');
      loadUserStats(); // 刷新统计数据
    } catch (error: any) {
      setSettingsError(error.response?.data?.error || '上传失败');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isOpen || !user) return null;

  const tabs = [
    { id: 'overview' as TabType, label: '概览', icon: User },
    { id: 'favorites' as TabType, label: '我的收藏', icon: Heart },
    { id: 'playlists' as TabType, label: '我的歌单', icon: ListMusic },
    { id: 'most-played' as TabType, label: '最常播放', icon: Play },
    { id: 'settings' as TabType, label: '设置', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold overflow-hidden">
                {user.avatar ? (
                  <img src={`http://localhost:3001${user.avatar}`} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-white/80 flex items-center gap-1">
                  <Mail size={14} />
                  {user.email}
                </p>
                <p className="text-white/60 text-sm flex items-center gap-1 mt-1">
                  <Calendar size={14} />
                  注册于 {formatDate(user.createdAt || new Date().toISOString())}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* 统计数据 */}
          {stats && (
            <div className="flex gap-8 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.favoriteCount}</div>
                <div className="text-white/70 text-sm">收藏歌曲</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.playlistCount}</div>
                <div className="text-white/70 text-sm">创建歌单</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.totalPlayCount}</div>
                <div className="text-white/70 text-sm">累计播放</div>
              </div>
            </div>
          )}
        </div>

        {/* 标签导航 */}
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* 概览 */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl">
                  <Heart className="text-pink-500 mb-2" size={24} />
                  <div className="text-2xl font-bold text-pink-600">{stats?.favoriteCount || 0}</div>
                  <div className="text-gray-600 text-sm">收藏歌曲</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                  <ListMusic className="text-purple-500 mb-2" size={24} />
                  <div className="text-2xl font-bold text-purple-600">{stats?.playlistCount || 0}</div>
                  <div className="text-gray-600 text-sm">创建歌单</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                  <Play className="text-blue-500 mb-2" size={24} />
                  <div className="text-2xl font-bold text-blue-600">{stats?.totalPlayCount || 0}</div>
                  <div className="text-gray-600 text-sm">累计播放</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-700 mb-3">账户信息</h3>
                <div className="space-y-2 text-gray-600">
                  <p><span className="text-gray-400">用户名：</span>{user.username}</p>
                  <p><span className="text-gray-400">邮箱：</span>{user.email}</p>
                  <p><span className="text-gray-400">注册时间：</span>{formatDate(user.createdAt || new Date().toISOString())}</p>
                </div>
              </div>
            </div>
          )}

          {/* 我的收藏 */}
          {activeTab === 'favorites' && (
            <div>
              {favorites.length > 0 && (
                <button
                  onClick={() => handlePlayAll(favorites)}
                  className="mb-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                >
                  <Play size={18} />
                  播放全部
                </button>
              )}
              {loading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无收藏歌曲</div>
              ) : (
                <div className="space-y-2">
                  {favorites.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => handlePlaySong(song)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                        {song.coverUrl ? (
                          <img src={song.coverUrl.startsWith('http') ? song.coverUrl : `http://localhost:3001${song.coverUrl}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{song.title}</div>
                        <div className="text-sm text-gray-500 truncate">{song.artist}</div>
                      </div>
                      <div className="text-sm text-gray-400">{song.playCount || 0} 次播放</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 我的歌单 */}
          {activeTab === 'playlists' && (
            <div>
              {loading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : playlists.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无创建的歌单</div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                          <ListMusic size={24} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{playlist.name}</div>
                          <div className="text-sm text-gray-500">{playlist.songs?.length || 0} 首歌曲</div>
                          {playlist.description && (
                            <div className="text-xs text-gray-400 truncate mt-1">{playlist.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 最常播放 */}
          {activeTab === 'most-played' && (
            <div>
              {mostPlayed.length > 0 && (
                <button
                  onClick={() => handlePlayAll(mostPlayed)}
                  className="mb-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                >
                  <Play size={18} />
                  播放全部
                </button>
              )}
              {loading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : mostPlayed.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无播放记录</div>
              ) : (
                <div className="space-y-2">
                  {mostPlayed.map((song, index) => (
                    <div
                      key={song.id}
                      onClick={() => handlePlaySong(song)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                        {song.coverUrl ? (
                          <img src={song.coverUrl.startsWith('http') ? song.coverUrl : `http://localhost:3001${song.coverUrl}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{song.title}</div>
                        <div className="text-sm text-gray-500 truncate">{song.artist}</div>
                      </div>
                      <div className="text-sm text-gray-400">{song.playCount || 0} 次播放</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 设置 */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* 消息提示 */}
              {settingsMessage && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg">{settingsMessage}</div>
              )}
              {settingsError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">{settingsError}</div>
              )}
              
              {/* 修改头像 */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Camera size={18} />
                  修改头像
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-purple-200">
                    {user.avatar ? (
                      <img 
                        src={`http://localhost:3001${user.avatar}`} 
                        alt="头像" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User size={32} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Upload size={18} />
                        {uploadingAvatar ? '上传中...' : '选择图片'}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">支持 JPG、PNG、WebP、GIF 格式，最大 5MB</p>
                  </div>
                </div>
              </div>

              {/* 修改用户名 */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User size={18} />
                  修改用户名
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="输入新用户名"
                  />
                  <button
                    onClick={handleUpdateUsername}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>

              {/* 修改密码 */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Lock size={18} />
                  修改密码
                </h3>
                <div className="space-y-3">
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="当前密码"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="新密码（至少6位）"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="确认新密码"
                  />
                  <button
                    onClick={handleChangePassword}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    修改密码
                  </button>
                </div>
              </div>

              {/* 退出登录 */}
              <div className="bg-red-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <LogOut size={18} />
                  退出登录
                </h3>
                <p className="text-gray-500 text-sm mb-3">退出当前账户，下次使用需要重新登录</p>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
