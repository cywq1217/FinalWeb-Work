import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma, cleanDatabase, createTestSong, disconnectDatabase } from '../../utils/testHelper';

describe('Song Model', () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await prisma.song.deleteMany();
  });

  it('应该创建一首歌曲', async () => {
    const song = await createTestSong();
    
    expect(song).toBeDefined();
    expect(song.title).toBe('Test Song');
    expect(song.artist).toBe('Test Artist');
    expect(song.duration).toBe(180);
  });

  it('应该获取所有歌曲', async () => {
    await createTestSong();
    await prisma.song.create({
      data: {
        title: 'Song 2',
        artist: 'Artist 2',
        duration: 200,
        filePath: '/uploads/test2.mp3',
      },
    });

    const songs = await prisma.song.findMany();
    expect(songs).toHaveLength(2);
  });

  it('应该通过ID查找歌曲', async () => {
    const createdSong = await createTestSong();
    const foundSong = await prisma.song.findUnique({
      where: { id: createdSong.id },
    });

    expect(foundSong).toBeDefined();
    expect(foundSong?.title).toBe('Test Song');
  });

  it('应该更新歌曲信息', async () => {
    const song = await createTestSong();
    const updatedSong = await prisma.song.update({
      where: { id: song.id },
      data: { title: 'Updated Song' },
    });

    expect(updatedSong.title).toBe('Updated Song');
  });

  it('应该删除歌曲', async () => {
    const song = await createTestSong();
    await prisma.song.delete({
      where: { id: song.id },
    });

    const foundSong = await prisma.song.findUnique({
      where: { id: song.id },
    });

    expect(foundSong).toBeNull();
  });

  it('应该增加播放次数', async () => {
    const song = await createTestSong();
    const updatedSong = await prisma.song.update({
      where: { id: song.id },
      data: { playCount: { increment: 1 } },
    });

    expect(updatedSong.playCount).toBe(1);
  });
});
