import { X, Clock, Trash2, Play, Music } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { formatTime } from '@/utils/format';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const { playHistory, clearHistory, playSong, currentSong } = usePlayerStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-scale-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">播放历史</h2>
            <span className="text-sm text-gray-500">({playHistory.length}首)</span>
          </div>
          <div className="flex items-center gap-2">
            {playHistory.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('确定要清空播放历史吗？')) {
                    clearHistory();
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="清空历史"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 历史列表 */}
        <div className="flex-1 overflow-y-auto p-2">
          {playHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Clock className="w-12 h-12 mb-2 opacity-50" />
              <p>暂无播放历史</p>
            </div>
          ) : (
            <div className="space-y-1">
              {playHistory.map((song, index) => {
                const isCurrentSong = currentSong?.id === song.id;
                return (
                  <div
                    key={`${song.id}-${index}`}
                    onClick={() => playSong(song)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-100 ${
                      isCurrentSong ? 'bg-purple-50 border border-purple-200' : ''
                    }`}
                  >
                    {/* 封面 */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0">
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl.startsWith('http') ? song.coverUrl : `http://localhost:3001${song.coverUrl}`}
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
                      <h3 className={`font-medium truncate ${isCurrentSong ? 'text-purple-600' : 'text-gray-900'}`}>
                        {song.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                    </div>

                    {/* 时长 */}
                    <div className="text-sm text-gray-400">
                      {formatTime(song.duration)}
                    </div>

                    {/* 播放按钮 */}
                    <button
                      className="p-2 text-gray-400 hover:text-purple-600 transition-colors opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSong(song);
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
      </div>
    </div>
  );
}
