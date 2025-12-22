import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume2, VolumeX, ChevronDown, ListMusic, X, Music } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { PlaybackStatus, PlayMode } from '@/types';
import { formatTime } from '@/utils/format';
import { parseLRC, getCurrentLyricIndex } from '@/utils/lyrics';
import AudioVisualizer from './AudioVisualizer';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FullScreenPlayer({ isOpen, onClose }: FullScreenPlayerProps) {
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [showQueue, setShowQueue] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const { currentSong, status, playMode, currentTime, isMuted, togglePlay, next, previous, seek, toggleMute, setPlayMode, playlist, playSong } = usePlayerStore();

  useEffect(() => {
    if (currentSong?.lyricsPath) {
      // 判断是否为 base64 编码的歌词（网易云歌曲）
      if (currentSong.lyricsPath.startsWith('data:')) {
        try {
          const base64Data = currentSong.lyricsPath.split(',')[1];
          const lrcText = decodeURIComponent(escape(atob(base64Data)));
          setLyrics(parseLRC(lrcText));
        } catch {
          setLyrics([]);
        }
      } else {
        // 本地歌词文件
        fetch('http://localhost:3001' + currentSong.lyricsPath)
          .then(res => res.arrayBuffer())
          .then(buffer => {
            const lrcText = new TextDecoder('utf-8').decode(buffer);
            setLyrics(parseLRC(lrcText));
          })
          .catch(() => setLyrics([]));
      }
    } else { setLyrics([]); }
  }, [currentSong?.lyricsPath]);

  useEffect(() => { if (lyrics.length > 0) setCurrentLyricIndex(getCurrentLyricIndex(lyrics, currentTime)); }, [currentTime, lyrics]);
  useEffect(() => { if (lyricsContainerRef.current && currentLyricIndex >= 0) { const el = lyricsContainerRef.current.querySelector('[data-index="' + currentLyricIndex + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, [currentLyricIndex]);

  // 计算当前歌词行的进度百分比（用于卡拉OK效果）
  const getLyricProgress = (index: number) => {
    if (index !== currentLyricIndex || index < 0) return 0;
    const startTime = lyrics[index].time;
    const endTime = lyrics[index + 1]?.time || (startTime + 5);
    const duration = endTime - startTime;
    const elapsed = currentTime - startTime;
    return Math.min(100, Math.max(0, (elapsed / duration) * 100));
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    if (e.code === 'Escape') { e.preventDefault(); onClose(); }
  }, [isOpen, togglePlay, onClose]);

  useEffect(() => { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [handleKeyDown]);

  const songDuration = currentSong?.duration || 0;
  const progress = songDuration > 0 ? (currentTime / songDuration) * 100 : 0;
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => { seek((parseFloat(e.target.value) / 100) * songDuration); };
  const cyclePlayMode = () => { const modes = [PlayMode.SEQUENCE, PlayMode.LOOP, PlayMode.SINGLE, PlayMode.SHUFFLE]; setPlayMode(modes[(modes.indexOf(playMode) + 1) % modes.length]); };
  const getPlayModeIcon = () => { if (playMode === PlayMode.SINGLE) return <Repeat1 className="w-5 h-5" />; if (playMode === PlayMode.SHUFFLE) return <Shuffle className="w-5 h-5" />; return <Repeat className="w-5 h-5" />; };

  if (!isOpen || !currentSong) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 animate-fade-in">
      <button onClick={onClose} className="absolute top-4 left-4 z-20 p-2 text-gray-500 hover:text-gray-700"><ChevronDown className="w-6 h-6" /></button>
      <button onClick={() => setShowQueue(!showQueue)} className="absolute top-4 right-4 z-20 p-2 text-gray-500 hover:text-gray-700"><ListMusic className="w-6 h-6" /></button>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 max-w-6xl w-full items-center">
            <div className="flex flex-col items-center gap-4 flex-shrink-0">
              <div className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-white rounded-3xl shadow-xl p-4 md:p-6 relative">
                <div className={'w-full h-full rounded-full bg-gray-900 shadow-lg relative ' + (status === PlaybackStatus.PLAYING ? 'animate-spin-slow' : '')}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700">
                      {currentSong.coverUrl ? <img src={currentSong.coverUrl.startsWith('http') ? currentSong.coverUrl : 'http://localhost:3001' + currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-orange-400 flex items-center justify-center text-white text-2xl font-bold">{currentSong.title[0]}</div>}
                    </div>
                  </div>
                </div>
              </div>
              {/* 音频频谱可视化 - 移动端隐藏 */}
              <div className="hidden md:block w-48 md:w-64 lg:w-80">
                <AudioVisualizer isPlaying={status === PlaybackStatus.PLAYING} />
              </div>
            </div>
            <div className="flex-1 flex flex-col h-[300px] md:h-[400px] lg:h-[500px] w-full lg:w-auto">
              <div className="text-center mb-2 md:mb-4"><h2 className="text-lg md:text-2xl font-bold text-gray-800">{currentSong.title}</h2><p className="text-sm md:text-base text-gray-500">{currentSong.artist}</p></div>
              <div ref={lyricsContainerRef} className="flex-1 overflow-y-auto">
                {lyrics.length > 0 ? (
                  <div className="py-40">
                    {lyrics.map((lyric, index) => {
                      const isCurrentLine = index === currentLyricIndex;
                      const progressPercent = getLyricProgress(index);
                      return (
                        <div 
                          key={index} 
                          data-index={index} 
                          onClick={() => seek(lyric.time)} 
                          className={`py-2 text-center cursor-pointer transition-all ${isCurrentLine ? 'text-xl font-semibold' : 'text-gray-400'}`}
                        >
                          {isCurrentLine ? (
                            <span className="relative inline-block">
                              <span className="text-gray-300">{lyric.text}</span>
                              <span 
                                className="absolute left-0 top-0 text-orange-500 overflow-hidden whitespace-nowrap"
                                style={{ width: `${progressPercent}%` }}
                              >
                                {lyric.text}
                              </span>
                            </span>
                          ) : lyric.text}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <div className="text-5xl mb-4">🎵</div>
                    <p>暂无歌词</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="max-w-3xl mx-auto bg-white/60 backdrop-blur rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-sm text-gray-600 w-12 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1 relative"><div className="h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-orange-400 rounded-full" style={{ width: progress + '%' }} /></div><input type="range" min="0" max="100" value={progress} onChange={handleProgressChange} className="absolute inset-0 w-full opacity-0 cursor-pointer" /></div>
              <span className="text-sm text-gray-600 w-12">{formatTime(songDuration)}</span>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={cyclePlayMode} className="text-gray-500 hover:text-orange-500">{getPlayModeIcon()}</button>
              <div className="flex items-center gap-6">
                <button onClick={previous} className="text-gray-600"><SkipBack className="w-7 h-7" /></button>
                <button onClick={togglePlay} className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-orange-400 shadow-lg">{status === PlaybackStatus.PLAYING ? <Pause className="w-7 h-7" fill="currentColor" /> : <Play className="w-7 h-7 ml-1" fill="currentColor" />}</button>
                <button onClick={next} className="text-gray-600"><SkipForward className="w-7 h-7" /></button>
              </div>
              <button onClick={toggleMute} className="text-gray-500">{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
            </div>
          </div>
        </div>
      </div>

      {/* 播放队列面板 */}
      <div className={`absolute top-0 right-0 h-full w-80 bg-white/95 backdrop-blur shadow-2xl transform transition-transform duration-300 z-30 ${showQueue ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <ListMusic className="w-5 h-5" />
              播放队列
            </h3>
            <button onClick={() => setShowQueue(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {playlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Music className="w-12 h-12 mb-2" />
                <p>播放队列为空</p>
              </div>
            ) : (
              <div className="py-2">
                {playlist.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => playSong(song)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      currentSong?.id === song.id ? 'bg-orange-50 border-l-4 border-orange-400' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-6 text-center text-sm text-gray-400">{index + 1}</span>
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0 overflow-hidden">
                      {song.coverUrl ? (
                        <img src={song.coverUrl.startsWith('http') ? song.coverUrl : 'http://localhost:3001' + song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs">
                          <Music className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${currentSong?.id === song.id ? 'text-orange-500' : 'text-gray-800'}`}>
                        {song.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                    </div>
                    {currentSong?.id === song.id && status === PlaybackStatus.PLAYING && (
                      <div className="flex gap-0.5">
                        <span className="w-1 h-4 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-4 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-4 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-500">
            共 {playlist.length} 首歌曲
          </div>
        </div>
      </div>
    </div>
  );
}

