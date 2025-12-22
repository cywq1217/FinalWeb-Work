import { describe, it, expect } from '@jest/globals';

// 格式化时间函数
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

describe('formatTime', () => {
  it('应该正确格式化0秒', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('应该正确格式化60秒', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('应该正确格式化125秒', () => {
    expect(formatTime(125)).toBe('02:05');
  });

  it('应该正确格式化3665秒', () => {
    expect(formatTime(3665)).toBe('61:05');
  });

  it('应该处理NaN', () => {
    expect(formatTime(NaN)).toBe('00:00');
  });

  it('应该处理小数', () => {
    expect(formatTime(65.7)).toBe('01:05');
  });
});
