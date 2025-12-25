# 开发日志 - 第3阶段：播放器功能

## 阶段概述
- **目标**: 实现音乐播放器核心功能
- **涉及文件**: store/playerStore.ts, components/Player/

---

## 详细日志

### [对话] 播放器需求确认
```
时间: 阶段初期
类型: 用户对话

用户: 请帮我实现播放器的核心功能，包括播放、暂停、上一曲、下一曲

AI响应: 好的，我来实现播放器核心功能。我会使用Howler.js作为音频引擎，
       创建以下组件：
       1. PlayerControls - 播放控制条
       2. ProgressBar - 进度条（支持拖拽）
       3. VolumeControl - 音量控制
       
       同时创建playerStore来管理播放状态...

用户: 播放模式也需要支持，比如单曲循环、随机播放

AI响应: 明白，我会在playerStore中添加playMode状态，支持：
       - sequential: 顺序播放
       - loop: 列表循环  
       - single: 单曲循环
       - shuffle: 随机播放
```

### [代码] 播放器状态管理
```
时间: 需求确认后
类型: 代码创建
文件: frontend/src/store/playerStore.ts

核心状态定义:

interface PlayerState {
  // 播放状态
  currentSong: Song | null;
  playlist: Song[];
  status: PlaybackStatus;
  
  // 播放控制
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;
  
  // Howl实例
  howl: Howl | null;
  
  // 操作方法
  playSong: (song: Song) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlayMode: (mode: PlayMode) => void;
}

export enum PlaybackStatus {
  STOPPED = 'stopped',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
}

export enum PlayMode {
  SEQUENTIAL = 'sequential',
  LOOP = 'loop',
  SINGLE = 'single',
  SHUFFLE = 'shuffle',
}
```

### [代码] playSong 函数实现
```
时间: 状态定义后
类型: 代码创建
文件: frontend/src/store/playerStore.ts

实现代码:

playSong: (song) => {
  const { howl, volume, isMuted } = get();

  // 清理旧的Howl实例
  if (howl) {
    howl.unload();
  }

  set({ status: PlaybackStatus.LOADING, currentSong: song });

  // 判断是本地文件还是外部URL
  const src = song.filePath.startsWith('http') 
    ? song.filePath 
    : `http://localhost:3001${song.filePath}`;

  // 创建新的Howl实例
  const newHowl = new Howl({
    src: [src],
    html5: true,
    volume: isMuted ? 0 : volume,
    onload: () => {
      set({ status: PlaybackStatus.PAUSED, duration: newHowl.duration() });
    },
    onplay: () => {
      set({ status: PlaybackStatus.PLAYING });
      // 增加播放次数
      songApi.incrementPlayCount(song.id).catch(console.error);
      // 添加到播放历史
      get().addToHistory(song);
    },
    onpause: () => {
      set({ status: PlaybackStatus.PAUSED });
    },
    onend: () => {
      get().next();
    },
    onloaderror: (id, error) => {
      console.error('加载错误:', error);
      set({ status: PlaybackStatus.STOPPED });
    },
  });

  set({ howl: newHowl });
  newHowl.play();

  // 启动进度更新定时器
  const interval = setInterval(() => {
    if (newHowl.playing()) {
      set({ currentTime: newHowl.seek() as number });
    }
  }, 100);

  set({ progressInterval: interval });
},
```

### [代码] 下一曲逻辑实现
```
时间: playSong后
类型: 代码创建
文件: frontend/src/store/playerStore.ts

实现代码:

next: () => {
  const { playlist, currentSong, playMode } = get();
  if (playlist.length === 0) return;

  let nextIndex: number;
  const currentIndex = playlist.findIndex(s => s.id === currentSong?.id);

  switch (playMode) {
    case PlayMode.SHUFFLE:
      // 随机播放
      nextIndex = Math.floor(Math.random() * playlist.length);
      break;
    case PlayMode.SINGLE:
      // 单曲循环
      nextIndex = currentIndex;
      break;
    case PlayMode.LOOP:
      // 列表循环
      nextIndex = (currentIndex + 1) % playlist.length;
      break;
    default:
      // 顺序播放
      nextIndex = currentIndex + 1;
      if (nextIndex >= playlist.length) {
        set({ status: PlaybackStatus.STOPPED });
        return;
      }
  }

  get().playSong(playlist[nextIndex]);
},
```

### [代码] 播放控制组件
```
时间: Store完成后
类型: 代码创建
文件: frontend/src/components/Player/PlayerControls.tsx

组件结构:

export const PlayerControls: React.FC = () => {
  const {
    currentSong,
    status,
    currentTime,
    duration,
    volume,
    isMuted,
    playMode,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    setPlayMode,
  } = usePlayerStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg 
                    border-t border-gray-200 px-4 py-3">
      <div className="max-w-screen-xl mx-auto flex items-center gap-4">
        {/* 歌曲信息 */}
        <div className="flex items-center gap-3 w-64">
          <img 
            src={currentSong?.coverPath || '/default-cover.png'} 
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="truncate">
            <div className="font-medium truncate">{currentSong?.title}</div>
            <div className="text-sm text-gray-500 truncate">{currentSong?.artist}</div>
          </div>
        </div>

        {/* 播放控制 */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button onClick={() => setPlayMode(getNextPlayMode(playMode))}>
              <PlayModeIcon mode={playMode} />
            </button>
            <button onClick={previous}><SkipBack /></button>
            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-black">
              {status === PlaybackStatus.PLAYING ? <Pause /> : <Play />}
            </button>
            <button onClick={next}><SkipForward /></button>
          </div>
          
          {/* 进度条 */}
          <ProgressBar 
            currentTime={currentTime} 
            duration={duration} 
            onSeek={seek} 
          />
        </div>

        {/* 音量控制 */}
        <VolumeControl 
          volume={volume} 
          isMuted={isMuted}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
        />
      </div>
    </div>
  );
};
```

### [代码] 进度条组件
```
时间: 控制组件后
类型: 代码创建
文件: frontend/src/components/Player/ProgressBar.tsx

实现代码:

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 
    ? ((isDragging ? dragTime : currentTime) / duration) * 100 
    : 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateDragTime(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateDragTime(e);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      onSeek(dragTime);
      setIsDragging(false);
    }
  };

  const updateDragTime = (e: MouseEvent | React.MouseEvent) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setDragTime(percent * duration);
  };

  return (
    <div className="w-full flex items-center gap-2">
      <span className="text-xs text-gray-500 w-10">
        {formatTime(isDragging ? dragTime : currentTime)}
      </span>
      <div
        ref={progressRef}
        className="flex-1 h-1 bg-gray-200 rounded-full cursor-pointer"
        onMouseDown={handleMouseDown}
      >
        <div
          className="h-full bg-black rounded-full relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 
                          w-3 h-3 bg-black rounded-full" />
        </div>
      </div>
      <span className="text-xs text-gray-500 w-10 text-right">
        {formatTime(duration)}
      </span>
    </div>
  );
};
```

### [代码] 音量控制组件
```
时间: 进度条后
类型: 代码创建
文件: frontend/src/components/Player/VolumeControl.tsx

实现代码:

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}) => {
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX />;
    if (volume < 0.5) return <Volume1 />;
    return <Volume2 />;
  };

  return (
    <div className="flex items-center gap-2 w-32">
      <button onClick={onToggleMute} className="text-gray-600 hover:text-black">
        {getVolumeIcon()}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={isMuted ? 0 : volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
      />
    </div>
  );
};
```

### [调试] 进度条拖拽问题
```
时间: 组件完成后
类型: 问题调试

问题: 拖拽进度条时，进度会跳回原位置

原因分析:
- 拖拽过程中，currentTime持续更新，覆盖了dragTime的显示

解决方案:
- 添加isDragging状态
- 拖拽时显示dragTime，松开后才调用onSeek

修改代码:
const progress = duration > 0 
  ? ((isDragging ? dragTime : currentTime) / duration) * 100 
  : 0;

结果: 拖拽功能正常工作
```

---

## 阶段总结

### 完成项
- [x] 播放器状态管理 (playerStore)
- [x] 播放/暂停功能
- [x] 上一曲/下一曲
- [x] 进度条（支持拖拽）
- [x] 音量控制
- [x] 静音切换
- [x] 播放模式（顺序/循环/单曲/随机）
- [x] 播放历史记录

### 组件清单
| 组件 | 功能 |
|------|------|
| PlayerControls | 播放控制条主组件 |
| ProgressBar | 可拖拽进度条 |
| VolumeControl | 音量控制 |
| PlayModeIcon | 播放模式图标 |
