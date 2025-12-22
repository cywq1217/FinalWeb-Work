// LRC歌词解析器

export interface LyricLine {
  time: number; // 时间（秒）
  text: string; // 歌词文本
}

/**
 * 解析LRC格式歌词
 * @param lrcContent LRC文件内容
 * @returns 解析后的歌词数组
 */
export function parseLRC(lrcContent: string): LyricLine[] {
  const lines = lrcContent.split('\n');
  const lyrics: LyricLine[] = [];

  // 时间标签正则: [mm:ss.xx] 或 [mm:ss]
  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\]/g;

  lines.forEach((line) => {
    const matches = [...line.matchAll(timeRegex)];
    
    if (matches.length > 0) {
      // 提取歌词文本（去除所有时间标签）
      const text = line.replace(timeRegex, '').trim();
      
      // 一行可能有多个时间标签
      matches.forEach((match) => {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0;
        
        const time = minutes * 60 + seconds + milliseconds / 1000;
        
        lyrics.push({ time, text });
      });
    }
  });

  // 按时间排序
  return lyrics.sort((a, b) => a.time - b.time);
}

/**
 * 获取当前时间应该显示的歌词索引
 * @param lyrics 歌词数组
 * @param currentTime 当前播放时间（秒）
 * @returns 当前歌词索引
 */
export function getCurrentLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (lyrics.length === 0) return -1;

  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      return i;
    }
  }

  return -1;
}

/**
 * 生成示例LRC歌词（用于测试）
 */
export function generateSampleLRC(): string {
  return `[00:00.00]示例歌词
[00:05.00]这是第一句歌词
[00:10.00]这是第二句歌词
[00:15.00]这是第三句歌词
[00:20.00]欢迎使用在线音乐播放器
[00:25.00]支持LRC歌词同步显示
[00:30.00]可以上传自己的歌词文件`;
}
