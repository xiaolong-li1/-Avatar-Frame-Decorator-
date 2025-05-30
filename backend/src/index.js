const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const config = require('./config/config');
const setupPresetFrames = require('./utils/setupFrames');
const { createPresetCircularFrames } = require('./utils/createCircularFrames');

// 创建Express应用
const app = express();

// 创建上传目录
const uploadDirs = [
  path.join(__dirname, '..', config.upload.dir),
  path.join(__dirname, '..', config.upload.dir, 'original'),
  path.join(__dirname, '..', config.upload.dir, 'thumb'),
  path.join(__dirname, '..', config.upload.dir, 'frames'),
  path.join(__dirname, '..', config.upload.dir, 'frames', 'preset'),
  path.join(__dirname, '..', config.upload.dir, 'frames', 'custom'),
  path.join(__dirname, '..', config.upload.dir, 'results')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 初始化预设头像框
// setupPresetFrames(); // 注释掉旧的方形头像框生成

// 生成圆形头像框
const publicDir = path.join(__dirname, '..', 'public');
createPresetCircularFrames(publicDir).catch(err => {
  console.error('生成圆形头像框失败:', err);
});

// 中间件配置
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// 静态文件服务
app.use('/' + config.upload.dir, express.static(path.join(__dirname, '..', config.upload.dir)));
// 添加公共静态文件服务，用于前端需要的预设图片
app.use('/', express.static(path.join(__dirname, '..', 'public')));

// 添加根路径处理程序
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WeFrame微信头像智能处理系统 API服务',
    version: '1.0.0',
    apiDocs: '/api/v1/health',
    timestamp: Date.now()
  });
});

// 路由配置
app.use('/api/v1', require('./routes'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('错误:', err.stack);
  res.status(500).json({
    success: false,
    code: 500,
    message: '服务器内部错误',
    error: config.nodeEnv === 'development' ? err.message : undefined,
    timestamp: Date.now()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 404,
    message: `找不到路径: ${req.originalUrl}`,
    timestamp: Date.now()
  });
});

// 启动服务器
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`服务器已启动: http://localhost:${PORT}`);
  console.log(`环境: ${config.nodeEnv}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
}); 