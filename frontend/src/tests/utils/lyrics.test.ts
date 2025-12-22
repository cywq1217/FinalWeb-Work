import { describe, it, expect } from 'vitest';
import { parseLRC, getCurrentLyricIndex } from '@/utils/lyrics';

describe('parseLRC', () => {
  it('应该解析标准LRC格式', () => {
    const lrc = `[00:00.00]第一句
[00:05.00]第二句
[00:10.00]第三句`;

    const result = parseLRC(lrc);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ time: 0, text: '第一句' });
    expect(result[1]).toEqual({ time: 5, text: '第二句' });
    expect(result[2]).toEqual({ time: 10, text: '第三句' });
  });

  it('应该处理毫秒', () => {
    const lrc = '[00:05.50]测试';
    const result = parseLRC(lrc);

    expect(result[0].time).toBe(5.5);
  });

  it('应该处理多个时间标签', () => {
    const lrc = '[00:05.00][00:10.00]重复歌词';
    const result = parseLRC(lrc);

    expect(result).toHaveLength(2);
    expect(result[0].time).toBe(5);
    expect(result[1].time).toBe(10);
    expect(result[0].text).toBe('重复歌词');
    expect(result[1].text).toBe('重复歌词');
  });

  it('应该按时间排序', () => {
    const lrc = `[00:10.00]第二句
[00:00.00]第一句
[00:05.00]第一点五句`;

    const result = parseLRC(lrc);

    expect(result[0].time).toBe(0);
    expect(result[1].time).toBe(5);
    expect(result[2].time).toBe(10);
  });

  it('应该忽略无效行', () => {
    const lrc = `[00:00.00]有效行
这是无效行
[00:05.00]另一个有效行`;

    const result = parseLRC(lrc);

    expect(result).toHaveLength(2);
  });
});

describe('getCurrentLyricIndex', () => {
  const lyrics = [
    { time: 0, text: '第一句' },
    { time: 5, text: '第二句' },
    { time: 10, text: '第三句' },
  ];

  it('应该返回正确的索引', () => {
    expect(getCurrentLyricIndex(lyrics, 0)).toBe(0);
    expect(getCurrentLyricIndex(lyrics, 3)).toBe(0);
    expect(getCurrentLyricIndex(lyrics, 5)).toBe(1);
    expect(getCurrentLyricIndex(lyrics, 7)).toBe(1);
    expect(getCurrentLyricIndex(lyrics, 10)).toBe(2);
    expect(getCurrentLyricIndex(lyrics, 15)).toBe(2);
  });

  it('应该处理空数组', () => {
    expect(getCurrentLyricIndex([], 5)).toBe(-1);
  });

  it('应该处理时间早于第一句歌词', () => {
    const lyrics = [{ time: 5, text: '第一句' }];
    expect(getCurrentLyricIndex(lyrics, 3)).toBe(-1);
  });
});
