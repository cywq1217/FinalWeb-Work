import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma, cleanDatabase, createTestUser, createTestPlaylist, disconnectDatabase } from '../../utils/testHelper';

describe('Playlist Model', () => {
  let testUserId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    testUserId = user.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await prisma.playlist.deleteMany();
  });

  it('应该创建播放列表', async () => {
    const playlist = await createTestPlaylist(testUserId);
    
    expect(playlist).toBeDefined();
    expect(playlist.name).toBe('Test Playlist');
    expect(playlist.userId).toBe(testUserId);
  });

  it('应该获取用户的所有播放列表', async () => {
    await createTestPlaylist(testUserId);
    await prisma.playlist.create({
      data: {
        name: 'Playlist 2',
        userId: testUserId,
      },
    });

    const playlists = await prisma.playlist.findMany({
      where: { userId: testUserId },
    });
    expect(playlists).toHaveLength(2);
  });

  it('应该通过ID查找播放列表', async () => {
    const playlist = await createTestPlaylist(testUserId);
    const found = await prisma.playlist.findUnique({
      where: { id: playlist.id },
    });

    expect(found).toBeDefined();
    expect(found?.name).toBe('Test Playlist');
  });

  it('应该更新播放列表信息', async () => {
    const playlist = await createTestPlaylist(testUserId);
    const updated = await prisma.playlist.update({
      where: { id: playlist.id },
      data: { name: 'Updated Playlist', description: '新描述' },
    });

    expect(updated.name).toBe('Updated Playlist');
    expect(updated.description).toBe('新描述');
  });

  it('应该删除播放列表', async () => {
    const playlist = await createTestPlaylist(testUserId);
    await prisma.playlist.delete({
      where: { id: playlist.id },
    });

    const found = await prisma.playlist.findUnique({
      where: { id: playlist.id },
    });
    expect(found).toBeNull();
  });
});
