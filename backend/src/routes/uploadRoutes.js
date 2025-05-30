const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const uploadMiddleware = require('../middleware/uploadMiddleware');

/**
 * 头像上传
 * POST /upload/avatar
 */
router.post('/upload/avatar', uploadMiddleware.uploadAvatar, uploadController.uploadAvatar);

/**
 * 自定义头像框上传
 * POST /frames/custom/upload
 */
router.post('/frames/custom/upload', uploadMiddleware.uploadFrame, uploadController.uploadCustomFrame);

module.exports = router; 