import { useState, useEffect, useRef } from 'react';
import { FileText, X } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { parseLRC, getCurrentLyricIndex, type LyricLine } from '@/utils/lyrics';

interface LyricsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LyricsPanel({ isOpen, onClose }: LyricsPanelProps) {
  const { currentSong, currentTime } = usePlayerStore();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // 加载歌词
  useEffect(() => {
    if (currentSong?.lyricsPath) {
      fetch(`http://localhost:3001${currentSong.lyricsPath}`)
        .then((res) => res.text())
        .then((lrcContent) => {
          const parsedLyrics = parseLRC(lrcContent);
          setLyrics(parsedLyrics);
        })
        .catch((error) => {
          console.error('加载歌词失败:', error);
          setLyrics([]);
        });
    } else {
      setLyrics([]);
    }
  }, [currentSong]);

  // 更新当前歌词索引
  useEffect(() => {
    const index = getCurrentLyricIndex(lyrics, currentTime);
    setCurrentIndex(index);
  }, [lyrics, currentTime]);

  // 自动滚动到当前歌词
  useEffect(() => {
    if (lyricsContainerRef.current && currentIndex >= 0) {
      const currentElement = lyricsContainerRef.current.children[currentIndex] as HTMLElement;
      if (currentElement) {
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <FileText className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">{currentSong?.title || '暂无歌曲'}</h2>
              <p className="text-sm opacity-90">{currentSong?.artist || ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 歌词内容 */}
        <div
          ref={lyricsContainerRef}
          className="overflow-y-auto p-8 space-y-4"
          style={{ maxHeight: 'calc(80vh - 80px)' }}
        >
          {lyrics.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无歌词</p>
              <p className="text-sm text-gray-400 mt-2">上传音乐时可以添加LRC歌词文件</p>
            </div>
          ) : (
            lyrics.map((line, index) => (
              <div
                key={index}
                className={`text-center transition-all duration-300 ${
                  index === currentIndex
                    ? 'text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 scale-110'
                    : index < currentIndex
                    ? 'text-gray-400 text-lg'
                    : 'text-gray-600 text-lg'
                }`}
              >
                {line.text || '♪'}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
