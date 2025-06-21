const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// 超分辨率接口
router.post('/super-resolution', aiController.applySuperResolution);

// 风格迁移接口
router.post('/style-transfer', aiController.applyStyleTransfer);

// 获取可用风格列表
router.get('/styles', aiController.getStylesList);

// 文本生成图像接口
router.post('/text-to-image', aiController.generateTextToImage);

// 背景模糊接口
router.post('/background-blur', aiController.applyBackgroundBlur);

// 背景替换接口
router.post('/background-replace', aiController.applyBackgroundReplace);

// 获取所有AI处理历史记录
router.get('/history', aiController.getAIHistory);

// 各类型的历史记录接口
router.get('/super-resolution/history', aiController.getSuperResolutionHistory);
router.get('/style-transfer/history', aiController.getStyleTransferHistory);
router.get('/background-blur/history', aiController.getBackgroundBlurHistory);
router.get('/background-replace/history', aiController.getBackgroundReplaceHistory);
router.get('/text-to-image/history', aiController.getTextToImageHistory);

// 删除记录接口
router.delete('/history/:recordId', aiController.deleteAIRecord);
router.delete('/history/batch', aiController.deleteMultipleAIRecords);
router.delete('/history/all', aiController.deleteAllAIRecords);

// 调试路由
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'AI路由正常工作',
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

