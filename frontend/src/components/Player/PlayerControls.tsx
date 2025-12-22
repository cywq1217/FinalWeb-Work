import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Repeat1, Shuffle, Maximize2 } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { PlaybackStatus, PlayMode } from '@/types';
import { formatTime } from '@/utils/format';
import FullScreenPlayer from './FullScreenPlayer';

export default function PlayerControls() {
  const [showLyrics, setShowLyrics] = useState(false);
  
  const {
    currentSong,
    status,
    playMode,
    volume,
    currentTime,
    isMuted,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    setPlayMode,
  } = usePlayerStore();

  if (!currentSong) return null;

  const duration = currentSong.duration;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const cyclePlayMode = () => {
    const modes = [PlayMode.SEQUENCE, PlayMode.LOOP, PlayMode.SINGLE, PlayMode.SHUFFLE];
    const currentIndex = modes.indexOf(playMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setPlayMode(nextMode);
  };

  const getPlayModeIcon = () => {
    switch (playMode) {
      case PlayMode.SINGLE:
        return <Repeat1 className="w-5 h-5" />;
      case PlayMode.SHUFFLE:
        return <Shuffle className="w-5 h-5" />;
      default:
        return <Repeat className="w-5 h-5" />;
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg backdrop-blur-lg bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 py-3">
        {/* 进度条 */}
        <div className="mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* 歌曲信息 */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex-shrink-0 overflow-hidden ${
              status === PlaybackStatus.PLAYING ? 'animate-spin-slow' : ''
            }`}>
              {currentSong.coverUrl ? (
                <img src={currentSong.coverUrl.startsWith('http') ? currentSong.coverUrl : `http://localhost:3001${currentSong.coverUrl}`} alt={currentSong.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                  {currentSong.title[0]}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{currentSong.title}</h3>
              <p className="text-sm text-gray-500 truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* 播放控制 */}
          <div className="flex items-center gap-4 mx-8">
            <button
              onClick={cyclePlayMode}
              className="text-gray-600 hover:text-purple-600 transition-colors"
              title={`播放模式: ${playMode}`}
            >
              {getPlayModeIcon()}
            </button>

            <button
              onClick={previous}
              className="text-gray-700 hover:text-purple-600 transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            <button
              onClick={togglePlay}
              className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:shadow-lg transition-shadow"
              disabled={status === PlaybackStatus.LOADING}
            >
              {status === PlaybackStatus.PLAYING ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6 ml-1" fill="currentColor" />
              )}
            </button>

            <button
              onClick={next}
              className="text-gray-700 hover:text-purple-600 transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* 音量控制和歌词按钮 */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <button
              onClick={() => setShowLyrics(true)}
              className="text-gray-600 hover:text-purple-600 transition-colors"
              title="全屏播放"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            
            <button
              onClick={toggleMute}
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
            />
          </div>
        </div>
        </div>
      </div>
      
      {/* 全屏播放器 */}
      <FullScreenPlayer isOpen={showLyrics} onClose={() => setShowLyrics(false)} />
    </>
  );
}
