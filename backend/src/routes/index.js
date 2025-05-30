const express = require('express');
const router = express.Router();

// 导入子路由
const uploadRoutes = require('./uploadRoutes');
const framesRoutes = require('./framesRoutes');

// 使用子路由
router.use(uploadRoutes);
router.use(framesRoutes);

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API服务正常运行',
    timestamp: Date.now()
  });
});

module.exports = router; 