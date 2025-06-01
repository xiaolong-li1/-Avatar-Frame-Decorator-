const express = require('express');
const router = express.Router();
const frameController = require('../controllers/frameController');
const multer = require('multer');

// 配置 multer 存储
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// 预设头像框路由
router.get('/preset', frameController.getPresetFrames);
router.post('/apply', frameController.applyFrame);

// 自定义头像框路由 - 确保这里有 multer
router.get('/custom/list', frameController.getCustomFrames);
router.post('/custom/upload', 
  upload.single('file'),  // 这行必须存在
  frameController.uploadCustomFrame
);
router.delete('/custom/:frameId', frameController.deleteCustomFrame);

module.exports = router;