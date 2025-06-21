const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// 添加水印接口
router.post('/watermark', aiController.addWatermark);

// 检测水印接口
router.post('/detect', aiController.detectWatermark);

module.exports = router; 