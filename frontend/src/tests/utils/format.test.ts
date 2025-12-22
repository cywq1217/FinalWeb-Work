import { describe, it, expect } from 'vitest';
import { formatTime, formatFileSize, formatPlayCount } from '@/utils/format';

describe('formatTime', () => {
  it('应该正确格式化时间', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(30)).toBe('00:30');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(125)).toBe('02:05');
    expect(formatTime(3665)).toBe('61:05');
  });

  it('应该处理无效输入', () => {
    expect(formatTime(NaN)).toBe('00:00');
    expect(formatTime(null as any)).toBe('00:00');
    expect(formatTime(undefined as any)).toBe('00:00');
  });

  it('应该处理小数', () => {
    expect(formatTime(65.7)).toBe('01:05');
    expect(formatTime(125.9)).toBe('02:05');
  });
});

describe('formatFileSize', () => {
  it('应该正确格式化文件大小', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(500)).toBe('500.00 B');
    expect(formatFileSize(1024)).toBe('1.00 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
  });

  it('应该保留两位小数', () => {
    expect(formatFileSize(1536)).toBe('1.50 KB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.50 MB');
  });
});

describe('formatPlayCount', () => {
  it('应该正确格式化播放次数', () => {
    expect(formatPlayCount(0)).toBe('0');
    expect(formatPlayCount(999)).toBe('999');
    expect(formatPlayCount(1000)).toBe('1.0K');
    expect(formatPlayCount(1500)).toBe('1.5K');
    expect(formatPlayCount(10000)).toBe('1.0万');
    expect(formatPlayCount(15000)).toBe('1.5万');
    expect(formatPlayCount(100000000)).toBe('1.0亿');
  });
});
