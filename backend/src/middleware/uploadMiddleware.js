const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const { errorResponse } = require('../utils/responseUtil');

// 创建临时上传目录
const tempDir = path.join(__dirname, '../../', config.upload.dir, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 定义存储策略
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型，请上传jpg、png或webp格式的图片'), false);
  }
};

// 创建上传实例
const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize, // 10MB
    files: 1 // 最多上传1个文件
  },
  fileFilter
});

// 处理上传错误
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json(errorResponse(
        '文件过大，最大允许10MB', 
        413, 
        err.message
      ));
    }
    return res.status(400).json(errorResponse('文件上传出错', 400, err.message));
  } else if (err) {
    return res.status(400).json(errorResponse(err.message, 400));
  }
  next();
};

module.exports = {
  uploadAvatar: [upload.single('file'), handleUploadError],
  uploadFrame: [upload.single('file'), handleUploadError]
}; 