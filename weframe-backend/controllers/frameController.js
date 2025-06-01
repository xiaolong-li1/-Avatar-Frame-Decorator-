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

// 获取用户自定义头像框
exports.getCustomFrames = async (req, res) => {
  try {
    // 从查询参数或请求体获取userId
    const userId = req.query.userId || req.body.userId || '1';
    console.log('获取头像框 - 使用userId:', userId);

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // 查询该用户的自定义头像框
    const framesResult = await pool.query(
      'SELECT * FROM frames WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM frames WHERE user_id = $1',
      [userId]
    );

    // 返回响应
    successResponse(res, {
      frames: framesResult.rows,
      total: parseInt(totalResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit),
    }, '获取自定义头像框成功');
  } catch (error) {
    console.error('获取自定义头像框失败:', error);
    errorResponse(res, 500, '获取自定义头像框失败', error.message);
  }
};

// 上传自定义头像框
exports.uploadCustomFrame = async (req, res) => {
  try {
    // 添加调试信息
    console.log('=================== 上传头像框 ===================');
    console.log('Headers:', req.headers);
    console.log('Request has file?', !!req.file);
    console.log('File details:', req.file);
    console.log('Request body:', req.body);
    console.log('==================================================');

    // 确保有文件上传
    if (!req.file) {
      return errorResponse(res, 400, '没有上传文件', '请选择一个文件进行上传');
    }

    // 直接从请求体获取userId
    const userId = req.body.userId;
    console.log('从请求体获取的userId:', userId);
    
    // 如果没有userId，使用默认ID
    const userIdToUse = userId || '1'; // 默认ID为1
    
    // 获取表单字段
    const { name = '自定义头像框', description = '' } = req.body;
    
    // 生成文件ID
    const frameId = uuidv4();
    
    // 处理上传的文件
    const buffer = req.file.buffer;
    const contentType = req.file.mimetype;
    
    // 保存原始图像
    const filePath = `frames/${frameId}`;
    const frameUrl = await fileStorageService.uploadFile(buffer, filePath, contentType);
    
    // 生成缩略图
    const thumbnailBuffer = await imageProcessingService.generateThumbnail(buffer);
    const thumbnailPath = `frames/thumbnails/${frameId}`;
    const thumbnailUrl = await fileStorageService.uploadFile(thumbnailBuffer, thumbnailPath, 'image/png');
    
    // 保存到数据库
    const result = await pool.query(
      `INSERT INTO frames (id, name, category, frame_url, thumbnail_url, is_preset, is_animated, user_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP) RETURNING *`,
      [frameId, name, 'custom', frameUrl, thumbnailUrl, false, false, userIdToUse]
    );

    successResponse(res, result.rows[0], '头像框上传成功');
  } catch (error) {
    console.error('上传自定义头像框失败:', error);
    errorResponse(res, 500, '上传自定义头像框失败', error.message);
  }
};

// 删除自定义头像框
exports.deleteCustomFrame = async (req, res) => {
  try {
    const { frameId } = req.params;
    // 从查询参数或请求体获取userId
    const userId = req.query.userId || req.body.userId || '1';
    console.log('删除头像框 - 使用userId:', userId, '框ID:', frameId);
    
    // 检查头像框是否存在且属于该用户
    const checkResult = await pool.query(
      'SELECT * FROM frames WHERE id = $1 AND user_id = $2',
      [frameId, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return errorResponse(res, 404, '头像框不存在或无权删除', '找不到该头像框或您无权删除');
    }
    
    // 删除头像框记录
    await pool.query(
      'DELETE FROM frames WHERE id = $1 AND user_id = $2',
      [frameId, userId]
    );
    
    successResponse(res, { id: frameId }, '头像框删除成功');
  } catch (error) {
    console.error('删除自定义头像框失败:', error);
    errorResponse(res, 500, '删除自定义头像框失败', error.message);
  }
};
