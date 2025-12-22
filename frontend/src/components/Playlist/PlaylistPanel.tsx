import { useState, useEffect } from 'react';
import { Plus, X, Music, Trash2, Edit2, Check, ListMusic } from 'lucide-react';
import { usePlaylistStore } from '@/store/playlistStore';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import type { Playlist } from '@/types';

interface PlaylistPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlaylistPanel({ isOpen, onClose }: PlaylistPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { user } = useAuthStore();
  const { playlists, currentPlaylist, isLoading, loadPlaylists, createPlaylist, updatePlaylist, deletePlaylist, setCurrentPlaylist } = usePlaylistStore();
  const { setPlaylist: setPlayerPlaylist, playSong } = usePlayerStore();

  useEffect(() => {
    if (user && isOpen) {
      loadPlaylists(user.id);
    }
  }, [user, isOpen, loadPlaylists]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !user) return;
    const playlist = await createPlaylist({
      name: newPlaylistName.trim(),
      description: newPlaylistDesc.trim() || undefined,
      userId: user.id,
    });
    if (playlist) {
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setShowCreateForm(false);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (confirm('确定要删除这个播放列表吗？')) {
      await deletePlaylist(id);
    }
  };

  const handleStartEdit = (playlist: Playlist) => {
    setEditingId(playlist.id);
    setEditName(playlist.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (editName.trim()) {
      await updatePlaylist(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.songs.length > 0) {
      const songs = playlist.songs.map(ps => ps.song);
      setPlayerPlaylist(songs);
      playSong(songs[0]);
      setCurrentPlaylist(playlist);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <ListMusic className="w-6 h-6" />
            <h2 className="text-xl font-bold">我的播放列表</h2>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          {!user ? (
            <div className="text-center py-12 text-gray-500">
              <p>请先登录以管理播放列表</p>
            </div>
          ) : (
            <>
              {/* 创建新播放列表 */}
              {showCreateForm ? (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="text"
                    placeholder="播放列表名称"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="描述（可选）"
                    value={newPlaylistDesc}
                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreatePlaylist}
                      disabled={!newPlaylistName.trim()}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                    >
                      创建
                    </button>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  创建新播放列表
                </button>
              )}

              {/* 播放列表 */}
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : playlists.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ListMusic className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>还没有播放列表</p>
                  <p className="text-sm mt-1">点击上方按钮创建一个吧</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        currentPlaylist?.id === playlist.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handlePlayPlaylist(playlist)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white">
                            <Music className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            {editingId === playlist.id ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="font-medium px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(playlist.id)}
                              />
                            ) : (
                              <h3 className="font-medium text-gray-800">{playlist.name}</h3>
                            )}
                            <p className="text-sm text-gray-500">{playlist.songs?.length || 0} 首歌曲</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {editingId === playlist.id ? (
                            <button
                              onClick={() => handleSaveEdit(playlist.id)}
                              className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(playlist)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePlaylist(playlist.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      {playlist.description && (
                        <p className="mt-2 text-sm text-gray-500 ml-15">{playlist.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
