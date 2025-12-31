import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma, cleanDatabase, createTestUser, createTestSong, disconnectDatabase } from '../../utils/testHelper';

describe('Favorite Model', () => {
  let testUserId: string;
  let testSongId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    testUserId = user.id;
    const song = await createTestSong();
    testSongId = song.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await prisma.favorite.deleteMany();
  });

  it('应该添加歌曲到收藏', async () => {
    const favorite = await prisma.favorite.create({
      data: {
        userId: testUserId,
        songId: testSongId,
      },
    });

    expect(favorite).toBeDefined();
    expect(favorite.userId).toBe(testUserId);
    expect(favorite.songId).toBe(testSongId);
  });

  it('应该获取用户的收藏列表', async () => {
    await prisma.favorite.create({
      data: {
        userId: testUserId,
        songId: testSongId,
      },
    });

    const favorites = await prisma.favorite.findMany({
      where: { userId: testUserId },
      include: { song: true },
    });

    expect(favorites).toHaveLength(1);
    expect(favorites[0].song.title).toBe('Test Song');
  });

  it('应该取消收藏', async () => {
    const favorite = await prisma.favorite.create({
      data: {
        userId: testUserId,
        songId: testSongId,
      },
    });

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    const found = await prisma.favorite.findFirst({
      where: { userId: testUserId, songId: testSongId },
    });
    expect(found).toBeNull();
  });
});
