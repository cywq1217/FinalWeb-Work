import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function cleanDatabase() {
  await prisma.favorite.deleteMany();
  await prisma.playlistSong.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.song.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser() {
  return await prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'testuser',
      password: '$2b$10$YourHashedPasswordHere',
    },
  });
}

export async function createTestSong() {
  return await prisma.song.create({
    data: {
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      duration: 180,
      filePath: '/uploads/test.mp3',
      genre: '流行',
      year: 2024,
    },
  });
}

export async function createTestPlaylist(userId: string) {
  return await prisma.playlist.create({
    data: {
      name: 'Test Playlist',
      description: 'Test Description',
      userId,
    },
  });
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
