import { Router } from 'express';
import * as userController from '../controllers/user.controller';

const router = Router();

// 用户注册
router.post('/register', userController.register);

// 用户登录
router.post('/login', userController.login);

// 获取用户信息
router.get('/:id', userController.getUserById);

// 获取用户收藏
router.get('/:id/favorites', userController.getUserFavorites);

// 添加收藏
router.post('/:id/favorites', userController.addFavorite);

// 取消收藏
router.delete('/:id/favorites/:songId', userController.removeFavorite);

export default router;
