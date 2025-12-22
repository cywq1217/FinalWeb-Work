import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '@/store/playerStore';
import { PlaybackStatus, PlayMode } from '@/types';
import type { Song } from '@/types';

describe('playerStore', () => {
  const mockSong: Song = {
    id: '1',
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180,
    filePath: '/uploads/test.mp3',
    coverUrl: null,
    lyricsPath: null,
    genre: '流行',
    year: 2024,
    playCount: 0,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  beforeEach(() => {
    const store = usePlayerStore.getState();
    store.cleanup();
  });

  it('应该初始化为默认状态', () => {
    const state = usePlayerStore.getState();

    expect(state.currentSong).toBeNull();
    expect(state.playlist).toEqual([]);
    expect(state.currentIndex).toBe(-1);
    expect(state.status).toBe(PlaybackStatus.STOPPED);
    expect(state.playMode).toBe(PlayMode.SEQUENCE);
    expect(state.volume).toBe(0.7);
    expect(state.isMuted).toBe(false);
  });

  it('应该设置播放列表', () => {
    const songs = [mockSong];
    usePlayerStore.getState().setPlaylist(songs);

    const state = usePlayerStore.getState();
    expect(state.playlist).toEqual(songs);
    expect(state.currentIndex).toBe(0);
    expect(state.currentSong).toEqual(mockSong);
  });

  it('应该设置音量', () => {
    usePlayerStore.getState().setVolume(0.5);

    const state = usePlayerStore.getState();
    expect(state.volume).toBe(0.5);
  });

  it('应该切换静音', () => {
    const initialMuted = usePlayerStore.getState().isMuted;
    usePlayerStore.getState().toggleMute();

    const state = usePlayerStore.getState();
    expect(state.isMuted).toBe(!initialMuted);
  });

  it('应该设置播放模式', () => {
    usePlayerStore.getState().setPlayMode(PlayMode.SHUFFLE);

    const state = usePlayerStore.getState();
    expect(state.playMode).toBe(PlayMode.SHUFFLE);
  });

  it('应该更新当前时间', () => {
    usePlayerStore.getState().updateCurrentTime(30);

    const state = usePlayerStore.getState();
    expect(state.currentTime).toBe(30);
  });
});
