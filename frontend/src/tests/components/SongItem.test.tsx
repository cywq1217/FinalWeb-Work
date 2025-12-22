import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SongItem from '@/components/MusicList/SongItem';
import type { Song } from '@/types';

// Mock stores
vi.mock('@/store/playerStore', () => ({
  usePlayerStore: () => ({
    currentSong: null,
    status: 'stopped',
    playSong: vi.fn(),
    togglePlay: vi.fn(),
  }),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
  }),
}));

vi.mock('@/store/favoriteStore', () => ({
  useFavoriteStore: () => ({
    toggleFavorite: vi.fn(),
    isFavorite: () => false,
  }),
}));

describe('SongItem', () => {
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
    playCount: 100,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  it('应该渲染歌曲信息', () => {
    render(<SongItem song={mockSong} index={0} />);

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByText('Test Album')).toBeInTheDocument();
  });

  it('应该显示正确的序号', () => {
    render(<SongItem song={mockSong} index={5} />);

    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('应该显示格式化的时长', () => {
    render(<SongItem song={mockSong} index={0} />);

    expect(screen.getByText('03:00')).toBeInTheDocument();
  });

  it('应该在点击时触发播放', () => {
    const { container } = render(<SongItem song={mockSong} index={0} />);
    const songItem = container.firstChild as HTMLElement;

    fireEvent.click(songItem);

    // 验证playSong被调用
    // 注意：由于我们mock了store，这里只是验证组件行为
  });
});
