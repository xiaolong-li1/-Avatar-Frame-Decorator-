const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const fileStorageService = require('../services/fileStorageService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const imageProcessingService = require('../services/imageProcessingService');
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

// 上传自定义头像框 - 修复版本
exports.uploadCustomFrame = async (req, res) => {
  try {
    // 添加调试信息
    console.log('=================== 上传头像框 ===================');
    console.log('Headers:', req.headers);
    console.log('Request has file?', !!req.file);
    console.log('File details:', req.file);
    console.log('Request body:', req.body);
    console.log('Multer error?', req.multerError);
    console.log('==================================================');

    // 确保有文件上传
    if (!req.file) {
      console.error('❌ 没有接收到文件，可能原因:');
      console.error('1. multer中间件未正确配置');
      console.error('2. 前端发送的字段名不是 "file"');
      console.error('3. 文件大小超过限制');
      console.error('4. 文件类型不被接受');
      
      return errorResponse(res, '没有上传文件', 400, '请选择一个文件进行上传');
    }

    // 验证文件
    if (!req.file.buffer || req.file.buffer.length === 0) {
      return errorResponse(res, '上传的文件为空', 400);
    }

    // 从Authorization header获取用户ID (如果使用JWT)
    let userId = req.body.userId;
    
    // 如果没有userId，尝试从JWT token获取
    if (!userId && req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.id;
        console.log('从JWT获取的userId:', userId);
      } catch (jwtError) {
        console.warn('JWT解析失败:', jwtError.message);
      }
    }
    
    // 如果仍然没有userId，使用默认值
    if (!userId) {
      userId = '1'; // 默认用户ID
      console.warn('使用默认userId:', userId);
    }
    
    // 获取表单字段
    const { name = req.file.originalname.split('.')[0], description = '' } = req.body;
    
    console.log('处理上传参数:', { userId, name, description, fileSize: req.file.size });
    
    // 生成文件ID
    const frameId = uuidv4();
    
    // 处理上传的文件
    const buffer = req.file.buffer;
    const contentType = req.file.mimetype;
    
    // 验证图片格式
    try {
      const metadata = await sharp(buffer).metadata();
      console.log('图片信息:', {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels
      });
    } catch (imageError) {
      console.error('图片格式验证失败:', imageError);
      return errorResponse(res, '不是有效的图片文件', 400);
    }
    
    console.log('开始上传文件到云存储...');
    
    // 保存原始图像
    const filePath = `frames/${frameId}`;
    const frameUrl = await fileStorageService.uploadFile(buffer, filePath, contentType);
    console.log('原始文件上传成功:', frameUrl);
    
    // 生成缩略图
    console.log('开始生成缩略图...');
    const thumbnailBuffer = await imageProcessingService.generateThumbnail(buffer);
    const thumbnailPath = `frames/thumbnails/${frameId}`;
    const thumbnailUrl = await fileStorageService.uploadFile(thumbnailBuffer, thumbnailPath, 'image/png');
    console.log('缩略图上传成功:', thumbnailUrl);
    
    // 保存到数据库
    console.log('保存到数据库...');
    const result = await pool.query(
      `INSERT INTO frames (id, name, category, frame_url, thumbnail_url, is_preset, is_animated, user_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP) RETURNING *`,
      [frameId, name, 'custom', frameUrl, thumbnailUrl, false, false, userId]
    );

    console.log('✅ 头像框上传完成');
    successResponse(res, result.rows[0], '头像框上传成功');
  } catch (error) {
    console.error('❌ 上传自定义头像框失败:', error);
    errorResponse(res, '上传自定义头像框失败', 500, error.message);
  }
};

// 删除自定义头像框 - 修复表名
exports.deleteCustomFrame = async (req, res) => {
  try {
    const { frameId } = req.params;
    const userId = req.body.userId || req.query.userId;

    console.log('🗑️ 删除自定义头像框请求:', { frameId, userId });

    if (!frameId) {
      return errorResponse(res, '缺少头像框ID参数', 400);
    }

    if (!userId) {
      return errorResponse(res, '缺少用户ID参数', 400);
    }

    // 首先查询头像框信息，确保存在且属于该用户 - 使用正确的表名 frames
    const checkQuery = `
      SELECT id, name, frame_url, thumbnail_url, user_id, created_at 
      FROM frames 
      WHERE id = $1 AND user_id = $2 AND is_preset = false
    `;
    const checkResult = await pool.query(checkQuery, [frameId, userId]);

    if (checkResult.rows.length === 0) {
      return errorResponse(res, '头像框不存在或您没有权限删除', 404);
    }

    const frameToDelete = checkResult.rows[0];
    console.log('📝 找到要删除的头像框:', frameToDelete);

    // 删除数据库记录 - 使用正确的表名 frames
    const deleteQuery = `
      DELETE FROM frames 
      WHERE id = $1 AND user_id = $2 AND is_preset = false
    `;
    const deleteResult = await pool.query(deleteQuery, [frameId, userId]);

    if (deleteResult.rowCount === 0) {
      return errorResponse(res, '删除头像框失败', 500);
    }

    // 尝试删除关联的文件
    const fileDeleteResults = [];
    
    // 删除主文件
    if (frameToDelete.frame_url) {
      try {
        const deleteMainResult = await fileStorageService.deleteFile(frameToDelete.frame_url);
        fileDeleteResults.push({
          file: 'frame_url',
          url: frameToDelete.frame_url,
          deleted: deleteMainResult.success,
          result: deleteMainResult
        });
        console.log('🗑️ 主文件删除结果:', deleteMainResult);
      } catch (fileError) {
        console.warn('⚠️ 删除主文件失败:', fileError.message);
        fileDeleteResults.push({
          file: 'frame_url',
          url: frameToDelete.frame_url,
          deleted: false,
          error: fileError.message
        });
      }
    }

    // 删除缩略图
    if (frameToDelete.thumbnail_url && frameToDelete.thumbnail_url !== frameToDelete.frame_url) {
      try {
        const deleteThumbnailResult = await fileStorageService.deleteFile(frameToDelete.thumbnail_url);
        fileDeleteResults.push({
          file: 'thumbnail_url',
          url: frameToDelete.thumbnail_url,
          deleted: deleteThumbnailResult.success,
          result: deleteThumbnailResult
        });
        console.log('🗑️ 缩略图删除结果:', deleteThumbnailResult);
      } catch (fileError) {
        console.warn('⚠️ 删除缩略图失败:', fileError.message);
        fileDeleteResults.push({
          file: 'thumbnail_url',
          url: frameToDelete.thumbnail_url,
          deleted: false,
          error: fileError.message
        });
      }
    }

    console.log('✅ 自定义头像框删除成功');

    return successResponse(res, {
      deletedFrame: frameToDelete,
      fileDeleteResults: fileDeleteResults
    }, '头像框删除成功');

  } catch (error) {
    console.error('❌ 删除自定义头像框失败:', error);
    return errorResponse(res, `删除头像框失败: ${error.message}`, 500);
  }
};

// 批量删除自定义头像框 - 修复表名
exports.deleteMultipleCustomFrames = async (req, res) => {
  try {
    const { frameIds, userId } = req.body;

    console.log('🗑️ 批量删除自定义头像框请求:', { frameIds, userId });

    if (!frameIds || !Array.isArray(frameIds) || frameIds.length === 0) {
      return errorResponse(res, '缺少头像框ID数组参数', 400);
    }

    if (!userId) {
      return errorResponse(res, '缺少用户ID参数', 400);
    }

    if (frameIds.length > 50) {
      return errorResponse(res, '单次最多只能删除50个头像框', 400);
    }

    // 生成占位符
    const placeholders = frameIds.map((_, index) => `$${index + 2}`).join(',');

    // 查询要删除的头像框 - 使用正确的表名 frames，并确保只删除自定义头像框
    const checkQuery = `
      SELECT id, name, frame_url, thumbnail_url, user_id, created_at 
      FROM frames 
      WHERE user_id = $1 AND id IN (${placeholders}) AND is_preset = false
    `;
    const checkResult = await pool.query(checkQuery, [userId, ...frameIds]);

    if (checkResult.rows.length === 0) {
      return errorResponse(res, '没有找到可删除的头像框', 404);
    }

    const framesToDelete = checkResult.rows;
    console.log('📝 找到要删除的头像框数量:', framesToDelete.length);

    // 删除数据库记录 - 使用正确的表名 frames
    const deleteQuery = `
      DELETE FROM frames 
      WHERE user_id = $1 AND id IN (${placeholders}) AND is_preset = false
    `;
    const deleteResult = await pool.query(deleteQuery, [userId, ...frameIds]);

    console.log('🗑️ 数据库删除结果:', deleteResult.rowCount);

    // 删除关联的文件
    const fileDeleteResults = [];
    
    for (const frame of framesToDelete) {
      // 删除主文件
      if (frame.frame_url) {
        try {
          const deleteMainResult = await fileStorageService.deleteFile(frame.frame_url);
          fileDeleteResults.push({
            frameId: frame.id,
            file: 'frame_url',
            url: frame.frame_url,
            deleted: deleteMainResult.success
          });
        } catch (fileError) {
          console.warn(`⚠️ 删除主文件失败 (${frame.id}):`, fileError.message);
          fileDeleteResults.push({
            frameId: frame.id,
            file: 'frame_url',
            url: frame.frame_url,
            deleted: false,
            error: fileError.message
          });
        }
      }

      // 删除缩略图
      if (frame.thumbnail_url && frame.thumbnail_url !== frame.frame_url) {
        try {
          const deleteThumbnailResult = await fileStorageService.deleteFile(frame.thumbnail_url);
          fileDeleteResults.push({
            frameId: frame.id,
            file: 'thumbnail_url',
            url: frame.thumbnail_url,
            deleted: deleteThumbnailResult.success
          });
        } catch (fileError) {
          console.warn(`⚠️ 删除缩略图失败 (${frame.id}):`, fileError.message);
          fileDeleteResults.push({
            frameId: frame.id,
            file: 'thumbnail_url',
            url: frame.thumbnail_url,
            deleted: false,
            error: fileError.message
          });
        }
      }
    }

    console.log('✅ 批量删除完成');

    return successResponse(res, {
      deletedCount: deleteResult.rowCount,
      deletedFrames: framesToDelete,
      fileDeleteResults: fileDeleteResults
    }, `成功删除 ${deleteResult.rowCount} 个头像框`);

  } catch (error) {
    console.error('❌ 批量删除自定义头像框失败:', error);
    return errorResponse(res, `批量删除头像框失败: ${error.message}`, 500);
  }
};
