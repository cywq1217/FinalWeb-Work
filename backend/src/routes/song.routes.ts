import { Router } from 'express';
import * as songController from '../controllers/song.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// 获取所有歌曲
router.get('/', songController.getAllSongs);

// 搜索歌曲
router.get('/search', songController.searchSongs);

// 获取单个歌曲
router.get('/:id', songController.getSongById);

// 上传歌曲
router.post('/', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
  { name: 'lyrics', maxCount: 1 }
]), songController.uploadSong);

// 更新歌曲信息
router.put('/:id', songController.updateSong);

// 删除歌曲
router.delete('/:id', songController.deleteSong);

// 增加播放次数
router.post('/:id/play', songController.incrementPlayCount);

export default router;
