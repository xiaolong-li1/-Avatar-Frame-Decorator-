const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');

// 配置 Multer 用于文件上传，限制文件大小为 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg、png、webp 格式'));
    }
  },
});

// 头像图片上传
router.post('/avatar', upload.single('file'), uploadController.uploadAvatar);

module.exports = router;