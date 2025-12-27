import { useState } from 'react';
import { Search, Cloud, Play, Loader, Music, X, Download, Check } from 'lucide-react';
import { neteaseApi, songApi } from '@/services/api';
import { usePlayerStore } from '@/store/playerStore';
import type { Song } from '@/types';

interface NeteaseSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NeteaseSearch({ isOpen, onClose }: NeteaseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const { playSong, currentSong } = usePlayerStore();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await neteaseApi.search(searchQuery);
      setSongs(response.data || []);
      if (response.data?.length === 0) {
        setError('没有找到相关歌曲');
      }
    } catch (err) {
      console.error('搜索失败:', err);
      setError('搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (song: Song) => {
    try {
      const neteaseId = song.neteaseId || song.id.replace('netease_', '');
      
      // 并行获取播放地址、歌词和歌曲详情（封面）
      const [urlResponse, lyricResponse, detailResponse] = await Promise.all([
        neteaseApi.getSongUrl(neteaseId.toString()),
        neteaseApi.getLyric(neteaseId.toString()).catch(() => ({ data: { lrc: '' } })),
        neteaseApi.getSongDetail(neteaseId.toString()).catch(() => ({ data: null }))
      ]);
      
      if (urlResponse.data?.url) {
        // 创建可播放的歌曲对象，包含歌词和封面
        const playableSong: Song = {
          ...song,
          filePath: urlResponse.data.url,
          coverUrl: detailResponse.data?.coverUrl || song.coverUrl,
          lyricsPath: lyricResponse.data?.lrc ? `data:text/plain;base64,${btoa(unescape(encodeURIComponent(lyricResponse.data.lrc)))}` : undefined,
          source: 'netease'
        };
        playSong(playableSong);
        onClose();
      } else {
        alert('该歌曲暂时无法播放，可能受版权限制');
      }
    } catch (err) {
      console.error('获取播放地址失败:', err);
      alert('获取播放地址失败');
    }
  };

  const handleImport = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    const neteaseId = String(song.neteaseId || song.id.replace('netease_', ''));
    
    if (importedIds.has(neteaseId)) return;
    
    setImportingId(neteaseId);
    try {
      // 获取歌曲详情以获取封面
      const detailResponse = await neteaseApi.getSongDetail(neteaseId.toString()).catch(() => ({ data: null }));
      
      await songApi.importFromNetease({
        neteaseId: neteaseId.toString(),
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        coverUrl: detailResponse.data?.coverUrl || song.coverUrl,
      });
      
      setImportedIds(prev => new Set(prev).add(String(neteaseId)));
      alert('歌曲导入成功！');
    } catch (err: any) {
      if (err.response?.data?.error === '该歌曲已导入') {
        setImportedIds(prev => new Set(prev).add(String(neteaseId)));
        alert('该歌曲已导入过');
      } else {
        console.error('导入失败:', err);
        alert('导入失败，请稍后重试');
      }
    } finally {
      setImportingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-scale-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl">
          <div className="flex items-center gap-2 text-white">
            <Cloud className="w-6 h-6" />
            <h2 className="text-lg font-semibold">网易云音乐</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索歌曲、歌手..."
              className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : '搜索'}
            </button>
          </div>
        </div>

        {/* 搜索结果 */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="text-center text-gray-500 py-8">
              <p>{error}</p>
            </div>
          )}

          {!error && songs.length === 0 && !loading && (
            <div className="text-center text-gray-400 py-12">
              <Cloud className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>搜索网易云音乐曲库</p>
              <p className="text-sm mt-2">输入歌曲名或歌手名开始搜索</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          )}

          {songs.length > 0 && (
            <div className="space-y-2">
              {songs.map((song, index) => {
                const isCurrentSong = currentSong?.id === song.id;
                return (
                  <div
                    key={song.id}
                    onClick={() => handlePlay(song)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-gray-100 ${
                      isCurrentSong ? 'bg-red-50 border border-red-200' : ''
                    }`}
                  >
                    {/* 序号 */}
                    <span className="w-8 text-center text-gray-400 text-sm">
                      {index + 1}
                    </span>

                    {/* 封面 */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-red-400 to-pink-400 flex-shrink-0">
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <Music className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* 歌曲信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${isCurrentSong ? 'text-red-600' : 'text-gray-900'}`}>
                        {song.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                    </div>

                    {/* 专辑 */}
                    <div className="hidden md:block w-32 text-sm text-gray-400 truncate">
                      {song.album || '-'}
                    </div>

                    {/* 导入按钮 */}
                    {(() => {
                      const songNeteaseId = String(song.neteaseId || song.id.replace('netease_', ''));
                      const isImported = importedIds.has(songNeteaseId);
                      const isImporting = importingId === songNeteaseId;
                      return (
                        <button
                          className={`p-2 transition-colors ${
                            isImported ? 'text-green-500' : 'text-gray-400 hover:text-blue-500'
                          }`}
                          onClick={(e) => handleImport(song, e)}
                          disabled={isImporting}
                          title={isImported ? '已导入' : '导入到音乐库'}
                        >
                          {isImporting ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : isImported ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Download className="w-5 h-5" />
                          )}
                        </button>
                      );
                    })()}

                    {/* 播放按钮 */}
                    <button
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(song);
                      }}
                    >
                      <Play className="w-5 h-5" fill="currentColor" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-3 border-t bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400 text-center">
            音乐来源于网易云音乐，部分歌曲可能受版权限制无法播放
          </p>
        </div>
      </div>
    </div>
  );
}
