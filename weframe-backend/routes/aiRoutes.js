const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
// const authMiddleware = require('../middlewares/authMiddleware');

// 超分辨率接口
router.post('/super-resolution', aiController.applySuperResolution);

// 风格迁移接口
router.post('/style-transfer', aiController.applyStyleTransfer);

// 获取可用风格列表
router.get('/styles', aiController.getStylesList);

// 文本生成图像接口
router.post('/text-to-image', aiController.generateTextToImage);

// 文本生成图像历史记录
router.get('/text-to-image/history', aiController.getTextToImageHistory);

// 背景模糊接口
router.post('/background-blur', aiController.applyBackgroundBlur);

// 背景替换接口
router.post('/background-replace', aiController.applyBackgroundReplace);

// 获取所有AI处理历史记录
router.get('/history', aiController.getAIHistory);

module.exports = router;
