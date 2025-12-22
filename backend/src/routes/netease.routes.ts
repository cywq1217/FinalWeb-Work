import { Router } from 'express';
import * as neteaseController from '../controllers/netease.controller';

const router = Router();

// 搜索歌曲
router.get('/search', neteaseController.searchSongs);

// 获取热门歌曲
router.get('/top', neteaseController.getTopSongs);

// 获取推荐歌单
router.get('/playlists', neteaseController.getRecommendPlaylists);

// 获取歌曲详情
router.get('/song/:id', neteaseController.getSongDetail);

// 获取歌曲播放地址
router.get('/song/:id/url', neteaseController.getSongUrl);

// 获取歌词
router.get('/song/:id/lyric', neteaseController.getLyric);

export default router;
