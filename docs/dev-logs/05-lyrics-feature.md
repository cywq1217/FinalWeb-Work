# 开发日志 - 第5阶段：歌词功能

## 阶段概述
- **目标**: 实现LRC歌词解析和同步滚动显示
- **涉及文件**: utils/lyrics.ts, components/Lyrics/

---

## 详细日志

### [对话] 歌词功能需求
```
时间: 阶段初期
类型: 用户对话

用户: 我想添加歌词显示功能，能够同步滚动显示当前播放的歌词

AI响应: 好的，我来实现歌词功能。需要以下步骤：
       1. 创建LRC歌词解析器，解析时间标签
       2. 创建歌词面板组件
       3. 根据播放进度高亮当前歌词
       4. 实现自动滚动效果
       
       我先创建歌词解析工具函数...

用户: 歌词需要支持上传LRC文件

AI响应: 明白，我会在上传组件中添加歌词文件上传功能，
       支持.lrc格式文件，上传后保存路径到数据库。
```

### [代码] LRC歌词解析器
```
时间: 需求确认后
类型: 代码创建
文件: frontend/src/utils/lyrics.ts

核心实现:

export interface LyricLine {
  time: number;    // 时间（秒）
  text: string;    // 歌词文本
}

/**
 * 解析LRC格式歌词
 * LRC格式示例: [00:12.34]歌词内容
 */
export function parseLRC(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const lyrics: LyricLine[] = [];

  // 匹配时间标签: [mm:ss.xx] 或 [mm:ss]
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    if (matches.length === 0) continue;

    // 提取歌词文本（去除所有时间标签）
    const text = line.replace(timeRegex, '').trim();
    if (!text) continue;

    // 一行可能有多个时间标签（合唱等情况）
    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = match[3] 
        ? parseInt(match[3].padEnd(3, '0'), 10) 
        : 0;

      const time = minutes * 60 + seconds + milliseconds / 1000;
      lyrics.push({ time, text });
    }
  }

  // 按时间排序
  return lyrics.sort((a, b) => a.time - b.time);
}

/**
 * 获取当前歌词索引
 */
export function getCurrentLyricIndex(
  lyrics: LyricLine[], 
  currentTime: number
): number {
  if (lyrics.length === 0) return -1;

  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      return i;
    }
  }

  return -1;
}
```

### [代码] 歌词面板组件
```
时间: 解析器完成后
类型: 代码创建
文件: frontend/src/components/Lyrics/LyricsPanel.tsx

组件实现:

interface LyricsPanelProps {
  lyrics: LyricLine[];
  currentTime: number;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({ 
  lyrics, 
  currentTime 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndex = getCurrentLyricIndex(lyrics, currentTime);

  // 自动滚动到当前歌词
  useEffect(() => {
    if (currentIndex >= 0 && containerRef.current) {
      const currentElement = containerRef.current.children[currentIndex];
      if (currentElement) {
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentIndex]);

  if (lyrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        暂无歌词
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto px-4 py-8 space-y-4"
    >
      {lyrics.map((lyric, index) => (
        <div
          key={index}
          className={`text-center transition-all duration-300 ${
            index === currentIndex
              ? 'text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent'
              : index < currentIndex
              ? 'text-gray-400 text-lg'
              : 'text-gray-600 text-lg'
          }`}
        >
          {lyric.text}
        </div>
      ))}
    </div>
  );
};
```

### [代码] 全屏播放器集成歌词
```
时间: 歌词面板后
类型: 代码修改
文件: frontend/src/components/Player/FullScreenPlayer.tsx

新增代码:

const [lyrics, setLyrics] = useState<LyricLine[]>([]);

useEffect(() => {
  const fetchLyrics = async () => {
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
        try {
          const response = await fetch(
            'http://localhost:3001' + currentSong.lyricsPath
          );
          const buffer = await response.arrayBuffer();
          const lrcText = new TextDecoder('utf-8').decode(buffer);
          setLyrics(parseLRC(lrcText));
        } catch {
          setLyrics([]);
        }
      }
    } else {
      setLyrics([]);
    }
  };
  
  fetchLyrics();
}, [currentSong?.lyricsPath]);

// 在渲染中添加歌词面板
<LyricsPanel lyrics={lyrics} currentTime={currentTime} />
```

### [代码] 上传组件支持歌词
```
时间: 全屏播放器后
类型: 代码修改
文件: frontend/src/components/Upload/UploadModal.tsx

新增代码:

const [lyricsFile, setLyricsFile] = useState<File | null>(null);

// 文件选择处理
const handleLyricsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file && file.name.endsWith('.lrc')) {
    setLyricsFile(file);
  } else {
    alert('请选择.lrc格式的歌词文件');
  }
};

// 表单提交时包含歌词文件
const formData = new FormData();
formData.append('audio', audioFile);
if (coverFile) formData.append('cover', coverFile);
if (lyricsFile) formData.append('lyrics', lyricsFile);  // 新增

// UI新增歌词上传按钮
<div className="border-2 border-dashed rounded-lg p-4">
  <input
    type="file"
    accept=".lrc"
    onChange={handleLyricsChange}
  />
  <p className="text-sm text-gray-500">
    支持LRC格式歌词文件
  </p>
</div>
```

### [调试] 歌词滚动不流畅
```
时间: 功能完成后
类型: 问题调试

问题: 歌词切换时滚动动画不流畅

原因分析:
- scrollIntoView的smooth动画与CSS transition冲突
- 频繁触发滚动导致性能问题

解决方案:
1. 使用debounce限制滚动频率
2. 优化CSS transition时间

修改代码:
// 添加防抖
const debouncedScroll = useMemo(
  () => debounce((index: number) => {
    if (containerRef.current?.children[index]) {
      containerRef.current.children[index].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, 100),
  []
);

useEffect(() => {
  if (currentIndex >= 0) {
    debouncedScroll(currentIndex);
  }
}, [currentIndex, debouncedScroll]);

结果: 歌词滚动流畅
```

### [调试] 歌词编码问题
```
时间: 调试后
类型: 问题调试

问题: 部分中文歌词显示乱码

原因分析:
- LRC文件可能使用GBK/GB2312编码
- TextDecoder默认使用UTF-8

解决方案:
- 尝试UTF-8解码，失败则尝试GBK
- 使用 text-encoding 库支持多编码

修改代码:
const decodeText = (buffer: ArrayBuffer): string => {
  try {
    return new TextDecoder('utf-8').decode(buffer);
  } catch {
    // 尝试GBK编码
    return new TextDecoder('gbk').decode(buffer);
  }
};

结果: 中文歌词正常显示
```

---

## 阶段总结

### 完成项
- [x] LRC歌词解析器
- [x] 歌词时间标签解析
- [x] 歌词面板组件
- [x] 当前歌词高亮
- [x] 自动滚动到当前歌词
- [x] 歌词上传功能
- [x] 编码兼容处理

### 技术要点
| 功能 | 实现方式 |
|------|----------|
| 时间解析 | 正则表达式 /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/ |
| 歌词高亮 | 渐变色文字 bg-gradient-to-r + bg-clip-text |
| 自动滚动 | scrollIntoView + smooth behavior |
| 编码处理 | TextDecoder UTF-8/GBK |
