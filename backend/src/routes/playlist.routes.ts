import { Router } from 'express';
import * as playlistController from '../controllers/playlist.controller';

const router = Router();

// 获取所有播放列表
router.get('/', playlistController.getAllPlaylists);

// 获取单个播放列表
router.get('/:id', playlistController.getPlaylistById);

// 创建播放列表
router.post('/', playlistController.createPlaylist);

// 更新播放列表
router.put('/:id', playlistController.updatePlaylist);

// 删除播放列表
router.delete('/:id', playlistController.deletePlaylist);

// 添加歌曲到播放列表
router.post('/:id/songs', playlistController.addSongToPlaylist);

// 从播放列表移除歌曲
router.delete('/:id/songs/:songId', playlistController.removeSongFromPlaylist);

export default router;
