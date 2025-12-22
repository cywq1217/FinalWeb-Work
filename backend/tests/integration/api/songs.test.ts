import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import songRoutes from '../../../src/routes/song.routes';
import { cleanDatabase, createTestSong, disconnectDatabase } from '../../utils/testHelper';

const app = express();
app.use(express.json());
app.use('/api/songs', songRoutes);

describe('Songs API', () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/songs', () => {
    it('应该返回所有歌曲', async () => {
      await createTestSong();
      
      const response = await request(app)
        .get('/api/songs')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('应该支持分页', async () => {
      await createTestSong();
      
      const response = await request(app)
        .get('/api/songs?page=1&limit=10')
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/songs/search', () => {
    it('应该搜索歌曲', async () => {
      await createTestSong();
      
      const response = await request(app)
        .get('/api/songs/search?q=Test')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('应该返回空数组当没有匹配时', async () => {
      const response = await request(app)
        .get('/api/songs/search?q=NonExistent')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/songs/:id', () => {
    it('应该返回单个歌曲', async () => {
      const song = await createTestSong();
      
      const response = await request(app)
        .get(`/api/songs/${song.id}`)
        .expect(200);

      expect(response.body.data.id).toBe(song.id);
      expect(response.body.data.title).toBe('Test Song');
    });

    it('应该返回404当歌曲不存在', async () => {
      await request(app)
        .get('/api/songs/nonexistent-id')
        .expect(404);
    });
  });

  describe('POST /api/songs/:id/play', () => {
    it('应该增加播放次数', async () => {
      const song = await createTestSong();
      
      const response = await request(app)
        .post(`/api/songs/${song.id}/play`)
        .expect(200);

      expect(response.body.data.playCount).toBe(1);
    });
  });
});
