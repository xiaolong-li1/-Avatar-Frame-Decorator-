const express = require('express');
const router = express.Router();
const frameController = require('../controllers/frameController');
const upload = require('../middleware/uploadMiddleware'); // 引入上传中间件

// 获取预设头像框
router.get('/preset', frameController.getPresetFrames);

// 应用头像框
router.post('/apply', frameController.applyFrame);

// 自定义头像框相关
router.post('/custom/upload', upload.single('file'), frameController.uploadCustomFrame); // 添加 multer 中间件
router.get('/custom/list', frameController.getCustomFrames);

// 删除相关路由
router.delete('/custom/:frameId', frameController.deleteCustomFrame);
router.delete('/custom/batch', frameController.deleteMultipleCustomFrames); // 新增批量删除路由

module.exports = router;