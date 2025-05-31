const express = require('express');
const router = express.Router();
const frameController = require('../controllers/frameController');
const authMiddleware = require('../middlewares/authMiddleware');

// 获取预设头像框列表
router.get('/preset', frameController.getPresetFrames);

// 应用预设头像框
router.post('/apply', frameController.applyFrame);

module.exports = router;