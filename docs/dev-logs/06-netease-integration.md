# 开发日志 - 第6阶段：网易云音乐集成

## 阶段概述
- **目标**: 实现网易云音乐搜索、播放、导入功能
- **涉及文件**: controllers/netease.controller.ts, components/Netease/

---

## 详细日志

### [对话] 测试歌曲播放
```
时间: 阶段初期
类型: 用户对话

用户: 请你推荐我几首可以搜索并播放出来的免费歌曲

AI响应: 我来帮您测试网易云音乐搜索功能。建议搜索以下免费歌曲：
       1. "晴天" - 周杰伦（经典老歌）
       2. "平凡之路" - 朴树
       3. "夜空中最亮的星" - 逃跑计划
       这些歌曲大多数可以免费播放...
```

### [对话] 播放问题反馈
```
时间: 测试后
类型: 用户对话

用户: 现在大部分歌曲可以播放出来了，但歌词不是所有播放出来的歌曲
     都能显示出来，以及封面一直没有显示出来

AI响应: 我来检查问题。发现两个问题：
       1. 封面URL获取逻辑有误，需要修改获取路径
       2. 歌词需要特殊处理，网易云返回的是原始LRC文本
       
       我现在修复这些问题...
```

### [代码] 网易云API控制器
```
时间: 问题分析后
类型: 代码创建/修改
文件: backend/src/controllers/netease.controller.ts

搜索接口实现:

const NETEASE_API_BASE = 'https://music.163.com/api';

export const searchSongs = async (req: Request, res: Response) => {
  try {
    const { keywords, limit = 30, offset = 0 } = req.query;

    const response = await fetch(
      `${NETEASE_API_BASE}/search/get?s=${encodeURIComponent(keywords as string)}&type=1&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://music.163.com',
        },
      }
    );

    const data = await response.json();

    if (data.code === 200 && data.result?.songs) {
      const songs = data.result.songs.map((song: any) => ({
        id: `netease_${song.id}`,
        neteaseId: song.id,
        title: song.name,
        artist: song.artists?.map((a: any) => a.name).join(', ') || '未知歌手',
        album: song.album?.name || '未知专辑',
        duration: (song.duration || 0) / 1000,
        coverUrl: null,  // 需要单独获取
        source: 'netease',
      }));

      res.json({ data: songs, total: data.result.songCount });
    } else {
      res.json({ data: [], total: 0 });
    }
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({ error: '搜索失败' });
  }
};
```

### [调试] 封面图片获取
```
时间: 搜索功能后
类型: 问题调试

问题: 搜索结果中封面图片URL为空

原因分析:
- 搜索API返回的数据中没有封面图片
- 需要调用歌曲详情接口获取封面

解决方案:
创建getSongDetail接口获取完整信息

修改代码:
export const getSongDetail = async (req: Request, res: Response) => {
  const { id } = req.params;

  const response = await fetch(
    `${NETEASE_API_BASE}/song/detail?ids=[${id}]`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );

  const data = await response.json();

  if (data.code === 200 && data.songs?.[0]) {
    const song = data.songs[0];
    res.json({
      data: {
        id: song.id,
        title: song.name,
        artist: song.ar?.map((a: any) => a.name).join(', '),
        album: song.al?.name,
        coverUrl: song.al?.picUrl,  // 从专辑信息获取封面
        duration: song.dt / 1000,
      },
    });
  }
};

结果: 封面图片正常显示
```

### [调试] 播放地址获取
```
时间: 封面修复后
类型: 问题调试

问题: 部分歌曲获取不到播放地址

原因分析:
- VIP歌曲需要付费
- 部分歌曲有版权限制

解决方案:
使用备用播放地址格式

修改代码:
export const getSongUrl = async (req: Request, res: Response) => {
  const { id } = req.params;

  // 尝试官方API
  const response = await fetch(`${NETEASE_API_BASE}/song/url?id=${id}`);
  const data = await response.json();

  if (data.code === 200 && data.data?.[0]?.url) {
    res.json({ data: { url: data.data[0].url } });
  } else {
    // 使用备用地址
    const fallbackUrl = `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
    res.json({ data: { url: fallbackUrl } });
  }
};

结果: 大部分免费歌曲可以播放
```

### [对话] 导入功能需求
```
时间: 播放修复后
类型: 用户对话

用户: 那么可以不可以加一个将外部网易云音乐能够选择导入我们该网站
     的音乐库，从而实现能够添加到播放列表

AI响应: 当然可以！我来实现导入功能：
       1. 后端添加 POST /api/netease/import 接口
       2. 前端在搜索结果添加"导入"按钮
       3. 导入时保存歌曲信息到本地数据库
       4. 导入后的歌曲可以添加到播放列表
       
       我现在开始实现...
```

### [代码] 导入API实现
```
时间: 需求确认后
类型: 代码创建
文件: backend/src/controllers/netease.controller.ts

新增函数:

export const importSong = async (req: Request, res: Response) => {
  try {
    const { neteaseId, title, artist, album, duration, coverUrl } = req.body;

    // 检查是否已导入
    const existing = await prisma.song.findFirst({
      where: { 
        filePath: { contains: `id=${neteaseId}` }
      },
    });

    if (existing) {
      return res.json({ message: '歌曲已存在', data: existing });
    }

    // 创建歌曲记录
    const song = await prisma.song.create({
      data: {
        title,
        artist,
        album,
        duration,
        genre: '网易云音乐',
        filePath: `https://music.163.com/song/media/outer/url?id=${neteaseId}.mp3`,
        coverPath: coverUrl,
      },
    });

    res.status(201).json({ message: '导入成功', data: song });
  } catch (error) {
    console.error('导入失败:', error);
    res.status(500).json({ error: '导入失败' });
  }
};
```

### [代码] 前端导入按钮
```
时间: 后端完成后
类型: 代码修改
文件: frontend/src/components/Netease/NeteaseSearch.tsx

新增代码:

const handleImport = async (song: Song, e: React.MouseEvent) => {
  e.stopPropagation();
  try {
    const neteaseId = song.neteaseId || parseInt(song.id.replace('netease_', ''));
    
    // 获取详细信息（包括封面）
    const detailResponse = await neteaseApi.getSongDetail(neteaseId.toString())
      .catch(() => ({ data: null }));

    const response = await neteaseApi.importSong({
      neteaseId,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      coverUrl: detailResponse.data?.coverUrl || song.coverUrl,
    });

    if (response.message === '歌曲已存在') {
      alert('该歌曲已导入过');
    } else {
      alert('导入成功！歌曲已添加到音乐库');
    }
  } catch (err) {
    console.error('导入失败:', err);
    alert('导入失败，请稍后重试');
  }
};

// UI添加导入按钮
<button
  className="p-2 text-gray-400 hover:text-green-500"
  onClick={(e) => handleImport(song, e)}
  title="导入到音乐库"
>
  <Download className="w-5 h-5" />
</button>
```

### [对话] 导入歌曲歌词问题
```
时间: 导入功能后
类型: 用户对话

用户: 现在可以成功导入，但歌词显示还是有问题

AI响应: 我检查了代码，发现导入的歌曲播放时无法获取歌词。
       问题是导入时没有保存neteaseId，导致无法动态获取歌词。
       
       解决方案：在FullScreenPlayer中检测网易云歌曲，
       动态调用API获取歌词...
```

### [调试] 导入歌曲歌词显示
```
时间: 问题反馈后
类型: 问题调试

问题: 导入的网易云歌曲不显示歌词

原因分析:
1. 导入时没有保存歌词
2. 前端无法识别需要动态获取歌词

解决方案:
在FullScreenPlayer中添加逻辑，检测到网易云歌曲时动态获取歌词

修改代码:
// frontend/src/components/Player/FullScreenPlayer.tsx

useEffect(() => {
  const fetchLyrics = async () => {
    if (currentSong?.lyricsPath) {
      // 处理已有歌词...
    } else if (
      currentSong?.filePath?.includes('music.163.com') || 
      currentSong?.genre === '网易云音乐'
    ) {
      // 导入的网易云歌曲，动态获取歌词
      try {
        const idMatch = currentSong.filePath.match(/id=(\d+)/);
        if (idMatch) {
          const neteaseId = idMatch[1];
          const response = await neteaseApi.getLyric(neteaseId);
          if (response.data?.lrc) {
            setLyrics(parseLRC(response.data.lrc));
          }
        }
      } catch {
        setLyrics([]);
      }
    }
  };
  fetchLyrics();
}, [currentSong?.lyricsPath, currentSong?.filePath, currentSong?.genre]);

结果: 导入的歌曲可以正常显示歌词
```

---

## 阶段总结

### 完成项
- [x] 网易云音乐搜索API
- [x] 歌曲详情获取（封面）
- [x] 播放地址获取（含备用地址）
- [x] 歌词获取API
- [x] 导入歌曲到本地库
- [x] 导入歌曲歌词动态获取
- [x] 前端搜索界面
- [x] 播放和导入按钮

### API接口清单
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | /api/netease/search | 搜索歌曲 |
| GET | /api/netease/song/:id | 获取歌曲详情 |
| GET | /api/netease/song/:id/url | 获取播放地址 |
| GET | /api/netease/song/:id/lyric | 获取歌词 |
| POST | /api/netease/import | 导入歌曲 |

### 问题解决记录
| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 封面不显示 | 搜索API无封面 | 调用详情接口获取 |
| 部分歌曲无法播放 | VIP限制 | 使用备用播放地址 |
| 导入歌曲无歌词 | 未保存歌词 | 动态获取歌词 |
