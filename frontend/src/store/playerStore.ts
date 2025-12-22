import { create } from 'zustand';
import { Howl } from 'howler';
import type { Song } from '@/types';
import { PlaybackStatus, PlayMode } from '@/types';
import { songApi } from '@/services/api';

// 播放记忆数据
interface PlaybackMemory {
  songId: string | null;
  currentTime: number;
  volume: number;
  playMode: PlayMode;
}

interface PlayerState {
  // 当前播放的歌曲
  currentSong: Song | null;
  // 播放列表
  playlist: Song[];
  // 当前播放索引
  currentIndex: number;
  // 播放状态
  status: PlaybackStatus;
  // 播放模式
  playMode: PlayMode;
  // 音量 (0-1)
  volume: number;
  // 当前播放进度 (秒)
  currentTime: number;
  // 是否静音
  isMuted: boolean;
  // Howler实例
  howl: Howl | null;
  // 进度更新定时器ID
  progressInterval: number | null;

  // Actions
  setPlaylist: (songs: Song[], startIndex?: number) => void;
  playSong: (song: Song) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlayMode: (mode: PlayMode) => void;
  updateCurrentTime: (time: number) => void;
  cleanup: () => void;
  // 播放记忆
  savePlaybackMemory: () => void;
  restorePlaybackMemory: (songs: Song[]) => void;
  // 播放历史
  playHistory: Song[];
  addToHistory: (song: Song) => void;
  clearHistory: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  playlist: [],
  currentIndex: -1,
  status: PlaybackStatus.STOPPED,
  playMode: PlayMode.SEQUENCE,
  volume: 0.7,
  currentTime: 0,
  isMuted: false,
  howl: null,
  progressInterval: null,

  // 设置播放列表
  setPlaylist: (songs, startIndex = 0) => {
    const { howl } = get();
    if (howl) {
      howl.unload();
    }

    set({
      playlist: songs,
      currentIndex: startIndex,
      currentSong: songs[startIndex] || null,
    });

    if (songs[startIndex]) {
      get().playSong(songs[startIndex]);
    }
  },

  // 播放指定歌曲
  playSong: (song) => {
    const { howl, volume, isMuted } = get();

    // 清理旧的Howl实例
    if (howl) {
      howl.unload();
    }

    set({ status: PlaybackStatus.LOADING, currentSong: song });

    // 创建新的Howl实例 - 判断是否为外部链接
    const audioUrl = song.filePath.startsWith('http') 
      ? song.filePath 
      : `http://localhost:3001${song.filePath}`;
    
    const newHowl = new Howl({
      src: [audioUrl],
      html5: true,
      volume: isMuted ? 0 : volume,
      onload: () => {
        set({ status: PlaybackStatus.PAUSED });
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
      onloaderror: (_id: number, error: unknown) => {
        console.error('加载错误:', error);
        set({ status: PlaybackStatus.STOPPED });
      },
      onplayerror: (_id: number, error: unknown) => {
        console.error('播放错误:', error);
        set({ status: PlaybackStatus.STOPPED });
      },
    });

    set({ howl: newHowl });
    newHowl.play();

    // 清除旧的进度更新定时器
    const { progressInterval: oldInterval } = get();
    if (oldInterval) {
      clearInterval(oldInterval);
    }

    // 使用 setInterval 稳定更新播放进度
    const interval = window.setInterval(() => {
      const { howl, status } = get();
      if (howl && status === PlaybackStatus.PLAYING) {
        const seek = howl.seek();
        if (typeof seek === 'number') {
          set({ currentTime: seek });
        }
      }
    }, 100); // 每100ms更新一次

    set({ progressInterval: interval });
  },

  // 播放
  play: () => {
    const { howl, currentSong, playlist, currentIndex } = get();
    
    if (!currentSong && playlist.length > 0) {
      get().playSong(playlist[currentIndex >= 0 ? currentIndex : 0]);
    } else if (howl) {
      howl.play();
    }
  },

  // 暂停
  pause: () => {
    const { howl } = get();
    if (howl) {
      howl.pause();
    }
  },

  // 切换播放/暂停
  togglePlay: () => {
    const { status } = get();
    if (status === PlaybackStatus.PLAYING) {
      get().pause();
    } else {
      get().play();
    }
  },

  // 下一曲
  next: () => {
    const { playlist, currentIndex, playMode } = get();
    if (playlist.length === 0) return;

    let nextIndex = currentIndex;

    switch (playMode) {
      case PlayMode.SEQUENCE:
        nextIndex = currentIndex + 1;
        if (nextIndex >= playlist.length) {
          nextIndex = 0;
        }
        break;
      case PlayMode.LOOP:
        nextIndex = (currentIndex + 1) % playlist.length;
        break;
      case PlayMode.SINGLE:
        // 单曲循环，索引不变
        break;
      case PlayMode.SHUFFLE:
        nextIndex = Math.floor(Math.random() * playlist.length);
        break;
    }

    set({ currentIndex: nextIndex });
    get().playSong(playlist[nextIndex]);
  },

  // 上一曲
  previous: () => {
    const { playlist, currentIndex, playMode } = get();
    if (playlist.length === 0) return;

    let prevIndex = currentIndex;

    switch (playMode) {
      case PlayMode.SEQUENCE:
      case PlayMode.LOOP:
        prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
          prevIndex = playlist.length - 1;
        }
        break;
      case PlayMode.SINGLE:
        // 单曲循环，索引不变
        break;
      case PlayMode.SHUFFLE:
        prevIndex = Math.floor(Math.random() * playlist.length);
        break;
    }

    set({ currentIndex: prevIndex });
    get().playSong(playlist[prevIndex]);
  },

  // 跳转到指定时间
  seek: (time) => {
    const { howl } = get();
    if (howl) {
      howl.seek(time);
      set({ currentTime: time });
    }
  },

  // 设置音量
  setVolume: (volume) => {
    const { howl, isMuted } = get();
    set({ volume });
    if (howl && !isMuted) {
      howl.volume(volume);
    }
  },

  // 切换静音
  toggleMute: () => {
    const { howl, isMuted, volume } = get();
    const newMuted = !isMuted;
    set({ isMuted: newMuted });
    if (howl) {
      howl.volume(newMuted ? 0 : volume);
    }
  },

  // 设置播放模式
  setPlayMode: (mode) => {
    set({ playMode: mode });
  },

  // 更新当前播放时间
  updateCurrentTime: (time) => {
    set({ currentTime: time });
  },

  // 清理资源
  cleanup: () => {
    const { howl, progressInterval } = get();
    // 保存播放记忆
    get().savePlaybackMemory();
    if (howl) {
      howl.unload();
    }
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    set({
      howl: null,
      progressInterval: null,
      status: PlaybackStatus.STOPPED,
      currentTime: 0,
    });
  },

  // 播放历史
  playHistory: JSON.parse(localStorage.getItem('playHistory') || '[]') as Song[],

  // 添加到播放历史
  addToHistory: (song: Song) => {
    const { playHistory } = get();
    // 移除重复项，最多保留 50 条
    const newHistory = [song, ...playHistory.filter(s => s.id !== song.id)].slice(0, 50);
    set({ playHistory: newHistory });
    localStorage.setItem('playHistory', JSON.stringify(newHistory));
  },

  // 清空播放历史
  clearHistory: () => {
    set({ playHistory: [] });
    localStorage.removeItem('playHistory');
  },

  // 保存播放记忆
  savePlaybackMemory: () => {
    const { currentSong, currentTime, volume, playMode } = get();
    const memory: PlaybackMemory = {
      songId: currentSong?.id || null,
      currentTime,
      volume,
      playMode,
    };
    localStorage.setItem('playbackMemory', JSON.stringify(memory));
  },

  // 恢复播放记忆
  restorePlaybackMemory: (songs: Song[]) => {
    // 始终设置播放列表
    set({ playlist: songs });

    const saved = localStorage.getItem('playbackMemory');
    if (!saved) return;

    try {
      const memory: PlaybackMemory = JSON.parse(saved);
      // 恢复音量和播放模式
      set({ volume: memory.volume, playMode: memory.playMode });

      // 查找之前播放的歌曲
      if (memory.songId) {
        const song = songs.find(s => s.id === memory.songId);
        if (song) {
          const index = songs.indexOf(song);
          set({ 
            currentSong: song,
            currentIndex: index,
            currentTime: memory.currentTime
          });
        }
      }
    } catch (e) {
      console.error('恢复播放记忆失败:', e);
    }
  },
}));
