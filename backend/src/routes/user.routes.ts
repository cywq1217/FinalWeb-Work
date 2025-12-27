import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// 用户注册
router.post('/register', userController.register);

// 用户登录
router.post('/login', userController.login);

// 获取用户信息
router.get('/:id', userController.getUserById);

// 获取用户统计数据
router.get('/:id/stats', userController.getUserStats);

// 更新用户资料
router.put('/:id/profile', userController.updateProfile);

// 修改密码
router.put('/:id/password', userController.changePassword);

// 获取最常播放的歌曲
router.get('/:id/most-played', userController.getMostPlayed);

// 获取用户的所有播放列表
router.get('/:id/playlists', userController.getUserPlaylists);

// 获取用户收藏
router.get('/:id/favorites', userController.getUserFavorites);

// 添加收藏
router.post('/:id/favorites', userController.addFavorite);

// 取消收藏
router.delete('/:id/favorites/:songId', userController.removeFavorite);

// 上传头像
router.post('/:id/avatar', upload.single('avatar'), userController.uploadAvatar);

export default router;
