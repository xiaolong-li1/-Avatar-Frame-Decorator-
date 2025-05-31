const { v4: uuidv4 } = require('uuid');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const pool = require('../config/database');
const imageProcessingService = require('../services/imageProcessingService');
const fileStorageService = require('../services/fileStorageService');
const sharp = require('sharp');

exports.getPresetFrames = async (req, res) => {
  try {
    const { category = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM frames WHERE is_preset = true';
    const params = [];

    // 按分类过滤
    if (category !== 'all') {
      query += ' AND category = $1';
      params.push(category);
    }
    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    // 查询数据库
    const framesResult = await pool.query(query, params);
    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM frames WHERE is_preset = true' + (category !== 'all' ? ' AND category = $1' : ''),
      category !== 'all' ? [category] : []
    );

    // 返回响应
    successResponse(res, {
      frames: framesResult.rows.map(frame => ({
        id: frame.id,
        name: frame.name,
        category: frame.category,
        thumbnailUrl: frame.thumbnail_url,
        frameUrl: frame.frame_url,
        isAnimated: frame.is_animated,
        tags: frame.tags || [],
      })),
      total: parseInt(totalResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit),
    }, '获取预设头像框成功');
  } catch (error) {
    console.error('获取预设头像框失败:', error);
    errorResponse(res, 500, '获取预设头像框失败', error.message);
  }
};
exports.applyFrame = async (req, res) => {
  try {
    const { avatarFileId, frameId, options } = req.body;

    // 验证输入
    if (!avatarFileId || !frameId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
        error: 'avatarFileId and frameId are required'
      });
    }

    // 从数据库获取头像文件路径
    const avatarResult = await pool.query(
      'SELECT file_url FROM avatars WHERE id = $1 AND is_active = true',
      [avatarFileId]
    );
    if (!avatarResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: '头像文件不存在',
        error: 'Avatar file not found'
      });
    }
    const avatarFileUrl = avatarResult.rows[0].file_url;
    if (!avatarFileUrl) {
      return res.status(400).json({
        success: false,
        message: '头像文件路径为空',
        error: 'Avatar file URL is empty'
      });
    }

    // 从数据库获取头像框信息
    const frameResult = await pool.query(
      'SELECT frame_url FROM frames WHERE id = $1',
      [frameId]
    );
    if (!frameResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: '头像框不存在',
        error: 'Frame not found'
      });
    }
    const frameUrl = frameResult.rows[0].frame_url;
    if (!frameUrl) {
      return res.status(400).json({
        success: false,
        message: '头像框路径为空',
        error: 'Frame URL is empty'
      });
    }

    console.log('开始下载头像文件:', avatarFileUrl);
    // 从 Cloudinary 获取文件
    const avatarFile = await fileStorageService.getFile(avatarFileUrl);
    console.log('头像文件下载成功, 大小:', avatarFile.length);
    
    console.log('开始下载头像框文件:', frameUrl);
    const frameFile = await fileStorageService.getFile(frameUrl);
    console.log('头像框文件下载成功, 大小:', frameFile.length);

    // 验证下载的文件是否为有效图像
    try {
      // 检查头像文件
      const avatarInfo = await sharp(avatarFile).metadata();
      console.log('头像文件格式:', avatarInfo.format, '尺寸:', avatarInfo.width, 'x', avatarInfo.height);
      
      // 检查头像框文件
      const frameInfo = await sharp(frameFile).metadata();
      console.log('头像框文件格式:', frameInfo.format, '尺寸:', frameInfo.width, 'x', frameInfo.height);
    } catch (imageError) {
      console.error('图像验证失败:', imageError);
      return res.status(400).json({
        success: false,
        message: '下载的文件不是有效图像格式',
        error: imageError.message
      });
    }

    // 应用头像框
    console.log('开始应用头像框...');
    const resultBuffer = await imageProcessingService.applyFrame(avatarFile, frameFile, options);
    console.log('头像框应用成功, 结果大小:', resultBuffer.length);

    // 上传结果到 Cloudinary
    const taskId = uuidv4();
    const resultPath = `results/${taskId}.png`;  // 改用 PNG 格式保存透明背景
    const resultUrl = await fileStorageService.uploadFile(resultBuffer, resultPath, 'image/png');

    // 返回响应
    res.status(200).json({
      success: true,
      data: { taskId, resultUrl, status: 'completed' },
      message: '头像框应用成功'
    });
  } catch (error) {
    console.error('应用头像框失败:', error);
    res.status(500).json({
      success: false,
      message: '应用头像框失败',
      error: error.message
    });
  }
};