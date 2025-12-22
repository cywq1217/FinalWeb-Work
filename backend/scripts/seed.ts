import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始添加测试数据...\n');

  // 清空现有数据
  await prisma.favorite.deleteMany();
  await prisma.playlistSong.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.song.deleteMany();
  await prisma.user.deleteMany();

  // 创建测试用户
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'testuser',
      password: '$2b$10$YourHashedPasswordHere', // 实际使用时应该是加密后的密码
    },
  });
  console.log('✅ 创建测试用户:', user.username);

  // 创建测试歌曲
  const songs = await Promise.all([
    prisma.song.create({
      data: {
        title: '示例歌曲 1',
        artist: '示例艺术家',
        album: '示例专辑',
        duration: 180, // 3分钟
        filePath: '/uploads/sample1.mp3',
        genre: '流行',
        year: 2024,
      },
    }),
    prisma.song.create({
      data: {
        title: '示例歌曲 2',
        artist: '示例艺术家',
        album: '示例专辑',
        duration: 240, // 4分钟
        filePath: '/uploads/sample2.mp3',
        genre: '摇滚',
        year: 2024,
      },
    }),
    prisma.song.create({
      data: {
        title: '示例歌曲 3',
        artist: '另一位艺术家',
        album: '另一张专辑',
        duration: 200, // 3分20秒
        filePath: '/uploads/sample3.mp3',
        genre: '电子',
        year: 2023,
      },
    }),
  ]);
  console.log(`✅ 创建 ${songs.length} 首测试歌曲`);

  // 创建测试播放列表
  const playlist = await prisma.playlist.create({
    data: {
      name: '我的最爱',
      description: '收藏的歌曲',
      userId: user.id,
    },
  });
  console.log('✅ 创建测试播放列表:', playlist.name);

  // 添加歌曲到播放列表
  await Promise.all(
    songs.map((song, index) =>
      prisma.playlistSong.create({
        data: {
          playlistId: playlist.id,
          songId: song.id,
          position: index,
        },
      })
    )
  );
  console.log('✅ 添加歌曲到播放列表');

  console.log('\n🎉 测试数据添加完成！');
  console.log('\n📊 数据统计:');
  console.log(`   用户: ${await prisma.user.count()}`);
  console.log(`   歌曲: ${await prisma.song.count()}`);
  console.log(`   播放列表: ${await prisma.playlist.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
