const { v4: uuidv4 } = require('uuid');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const fileStorageService = require('../services/fileStorageService');
const imageProcessingService = require('../services/imageProcessingService');
const pool = require('../config/database'); // 假设您有一个数据库连接池配置

exports.uploadAvatar = async (req, res) => {
  try {
    const { type, userId } = req.body; // 新增 userId 从请求体获取
    const file = req.file;

    // 验证上传类型
    if (!['avatar', 'frame'].includes(type)) {
      return errorResponse(res, 400, '无效的上传类型', 'Type must be "avatar" or "frame"');
    }

    // 验证文件存在
    if (!file) {
      return errorResponse(res, 400, '未上传文件', 'No file uploaded');
    }

    // 验证 userId（如果提供）
    if (userId) {
      const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (!userResult.rows.length) {
        return errorResponse(res, 404, '用户不存在', 'User not found');
      }
    }

    // 上传文件到 AWS S3
    const fileId = uuidv4();
    const filePath = `${type}s/${fileId}-${file.originalname}`;
    const originalUrl = await fileStorageService.uploadFile(file.buffer, filePath, file.mimetype);

    // 生成缩略图
    const thumbnailBuffer = await imageProcessingService.generateThumbnail(file.buffer);
    const thumbnailPath = `${type}s/thumb/${fileId}-${file.originalname}`;
    const thumbnailUrl = await fileStorageService.uploadFile(thumbnailBuffer, thumbnailPath, file.mimetype);

    // 获取图像尺寸
    const { width, height } = await imageProcessingService.getImageDimensions(file.buffer);

    // 根据类型更新数据库
    if (type === 'avatar') {
      // 插入到 avatars 表
      await pool.query(
        'INSERT INTO avatars (id, file_url, user_id, created_at, is_active) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, TRUE)',
        [fileId, originalUrl, userId || null]
      );
    } else if (type === 'frame') {
      // 插入到 frames 表
      await pool.query(
        'INSERT INTO frames (id, frame_url, thumbnail_url, user_id, is_preset, is_animated, created_at) VALUES ($1, $2, $3, $4, FALSE, FALSE, CURRENT_TIMESTAMP)',
        [fileId, originalUrl, thumbnailUrl, userId || null]
      );
    }

    // 返回响应
    successResponse(res, {
      fileId,
      originalUrl,
      thumbnailUrl,
      size: file.size,
      width,
      height,
      format: file.mimetype.split('/')[1],
    }, '文件上传成功');
  } catch (error) {
    console.error('上传失败:', error);
    errorResponse(res, 500, '文件上传失败', error.message);
  }
};