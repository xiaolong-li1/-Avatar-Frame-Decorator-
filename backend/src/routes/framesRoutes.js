const express = require('express');
const router = express.Router();
const framesController = require('../controllers/framesController');

/**
 * 获取预设头像框列表
 * GET /frames/preset?category={category}&page={page}&limit={limit}
 */
router.get('/frames/preset', framesController.getPresetFrames);

/**
 * 应用头像框
 * POST /frames/apply
 */
router.post('/frames/apply', framesController.applyFrame);

/**
 * 获取用户自定义头像框列表
 * GET /frames/custom/list?page={page}&limit={limit}
 */
router.get('/frames/custom/list', framesController.getCustomFrames);

/**
 * 删除自定义头像框
 * DELETE /frames/custom/{frameId}
 */
router.delete('/frames/custom/:frameId', framesController.deleteCustomFrame);

module.exports = router; 