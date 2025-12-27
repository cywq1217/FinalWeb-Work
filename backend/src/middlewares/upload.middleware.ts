import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// 文件过滤
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedAudioTypes = ['.mp3', '.wav', '.flac', '.m4a', '.ogg'];
  const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const allowedLyricsTypes = ['.lrc', '.txt'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'audio' && allowedAudioTypes.includes(ext)) {
    cb(null, true);
  } else if (file.fieldname === 'cover' && allowedImageTypes.includes(ext)) {
    cb(null, true);
  } else if (file.fieldname === 'avatar' && allowedImageTypes.includes(ext)) {
    cb(null, true);
  } else if (file.fieldname === 'lyrics' && allowedLyricsTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}`));
  }
};

// 导出multer实例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});
