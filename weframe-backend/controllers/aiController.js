const pool = require('../config/database');
const aiService = require('../services/aiService');
const fileStorageService = require('../services/fileStorageService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { v4: uuidv4 } = require('uuid');

// Helper function to get avatar URL from fileId
async function getAvatarUrlFromFileId(avatarFileId) {
  const avatarResult = await pool.query(
    'SELECT file_url FROM avatars WHERE id = $1 AND is_active = true',
    [avatarFileId]
  );
  if (avatarResult.rows.length > 0 && avatarResult.rows[0].file_url) {
    return avatarResult.rows[0].file_url;
  }
  throw new Error('Avatar file not found or URL is missing');
}

// 超分辨率处理
exports.applySuperResolution = async (req, res) => {
  try {
    const { avatarFileId, scaleFactor = 2, quality = 'high', userId } = req.body;

    if (!avatarFileId) {
      return res.status(400).json({
        success: false,
        message: '缺少头像文件ID'
      });
    }

    // 验证参数
    if (scaleFactor < 1 || scaleFactor > 8) {
      return res.status(400).json({
        success: false,
        message: '放大倍数必须在1-8之间'
      });
    }

    if (!['standard', 'high', 'ultra'].includes(quality)) {
      return res.status(400).json({
        success: false,
        message: '质量参数必须是 standard、high 或 ultra'
      });
    }

    // 1. 从avatars表获取头像信息
    const avatarQuery = 'SELECT * FROM avatars WHERE id = $1 AND is_active = true';
    const avatarResult = await pool.query(avatarQuery, [avatarFileId]);
    
    if (avatarResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的头像或头像已被删除'
      });
    }

    const avatarInfo = avatarResult.rows[0];
    const originalUrl = avatarInfo.file_url;

    if (!originalUrl) {
      return res.status(404).json({
        success: false,
        message: '头像文件URL不存在'
      });
    }

    console.log('🚀 开始超分辨处理:', {
      avatarFileId,
      scaleFactor,
      quality,
      originalUrl,
      userId: userId || 'anonymous'
    });

    // 2. 调用AI服务进行超分辨处理
    let processedUrl;
    try {
      processedUrl = await aiService.superResolution(originalUrl, scaleFactor, quality);
      console.log('✅ 超分辨处理完成:', processedUrl);
    } catch (error) {
      console.error('❌ AI超分辨处理失败:', error);
      
      // 根据错误类型返回不同的错误信息
      if (error.message.includes('下载图像失败')) {
        return res.status(502).json({
          success: false,
          message: '无法下载原始图像，请检查图像链接是否有效'
        });
      } else if (error.message.includes('API 错误')) {
        return res.status(502).json({
          success: false,
          message: 'AI服务暂时不可用，请稍后重试'
        });
      } else if (error.message.includes('timeout')) {
        return res.status(408).json({
          success: false,
          message: '处理超时，请稍后重试'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: '超分辨处理失败: ' + error.message
        });
      }
    }

    // 3. 保存AI生成记录到数据库
    let recordId = null;
    try {
      recordId = await aiService.saveAIGeneratedRecord(
        userId || null,
        'super_resolution',
        originalUrl,
        `超分辨率增强 - 放大倍数: ${scaleFactor}x, 质量: ${quality}`,
        processedUrl,
        'openai-edit',
        { scaleFactor, quality }
      );
      console.log('📝 记录已保存到数据库，ID:', recordId);
    } catch (dbError) {
      console.error('⚠️ 保存记录失败，但处理成功:', dbError.message);
      // 不影响主流程
    }

    // 4. 返回成功结果
    return res.json({
      success: true,
      message: '超分辨处理成功',
      data: {
        resultUrl: processedUrl,
        taskId: recordId,
        status: 'completed',
        scaleFactor: scaleFactor,
        quality: quality
      }
    });

  } catch (error) {
    console.error('❌ 超分辨处理失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message
    });
  }
};

// 风格迁移处理
exports.applyStyleTransfer = async (req, res) => {
  const { avatarFileId, styleId, customStylePrompt, userId } = req.body;

  if (!avatarFileId) {
    return errorResponse(res, '缺少 avatarFileId 参数', 400);
  }

  if (!styleId && !customStylePrompt) {
    return errorResponse(res, '缺少 styleId 或 customStylePrompt 参数', 400);
  }

  try {
    console.log(`控制器接收到风格迁移请求: avatarFileId=${avatarFileId}, styleId=${styleId}`);

    const imageUrl = await getAvatarUrlFromFileId(avatarFileId);
    
    // 获取风格提示词
    let stylePrompt;
    if (customStylePrompt) {
      stylePrompt = customStylePrompt;
    } else {
      stylePrompt = await aiService.getStylePrompt(styleId);
    }
    
    const resultUrl = await aiService.styleTransfer(imageUrl, stylePrompt);
    console.log(`AI服务返回风格迁移结果URL: ${resultUrl}`);

    // 保存记录到数据库
    const recordId = await aiService.saveAIGeneratedRecord(
      userId,
      'style-transfer',
      imageUrl,
      stylePrompt,
      resultUrl,
      'dall-e-2',
      { styleId, customStylePrompt }
    );

    return successResponse(res, { taskId: recordId, resultUrl }, '风格迁移处理成功');
  } catch (error) {
    console.error('❌ 风格迁移处理失败:', error.message);
    if (error.message.includes('Avatar file not found')) {
      return errorResponse(res, '头像文件未找到', 404);
    }
    return errorResponse(res, `风格迁移处理失败: ${error.message}`, 500);
  }
};

// 获取可用风格列表
exports.getStylesList = async (req, res) => {
  try {
    const styles = await aiService.getAvailableStyles();
    return successResponse(res, { styles }, '获取风格列表成功');
  } catch (error) {
    console.error('❌ 获取风格列表失败:', error.message);
    return errorResponse(res, `获取风格列表失败: ${error.message}`, 500);
  }
};

// 文本生成图像
exports.generateTextToImage = async (req, res) => {
  const { text, width = 1024, height = 1024, model = 'dall-e-3', quality = 'standard', userId } = req.body;

  if (!text) {
    return errorResponse(res, '缺少 text 参数', 400);
  }

  try {
    console.log(`控制器接收到文本生成图像请求: text=${text}, size=${width}x${height}, model=${model}`);

    const resultUrl = await aiService.textToImage(text, width, height, model, quality);
    console.log(`AI服务返回文本生成图像结果URL: ${resultUrl}`);

    // 保存记录到数据库
    let recordId = null;
    if (userId) {
      try {
        recordId = await aiService.saveAIGeneratedRecord(
          userId,
          'text-to-image',
          null,
          text,
          resultUrl,
          model,
          { width, height, quality }
        );
      } catch (dbError) {
        console.error('❌ 保存记录到数据库失败:', dbError.message);
        // 不影响主流程，继续返回结果
      }
    }

    return successResponse(res, { taskId: recordId, resultUrl }, '文本生成图像成功');
  } catch (error) {
    console.error('❌ 文本生成图像失败:', error.message);
    
    // 根据错误类型返回不同的状态码
    if (error.message.includes('Request timed out') || error.message.includes('timeout')) {
      return errorResponse(res, '请求超时，请稍后重试', 408);
    } else if (error.message.includes('Invalid size')) {
      return errorResponse(res, error.message, 400);
    } else if (error.message.includes('quota') || error.message.includes('billing')) {
      return errorResponse(res, 'API配额不足，请检查账户余额', 402);
    } else {
      return errorResponse(res, `文本生成图像失败: ${error.message}`, 500);
    }
  }
};

// 获取文本生成图像历史记录
exports.getTextToImageHistory = async (req, res) => {
  const { userId, page = 1, limit = 10 } = req.query;

  if (!userId) {
    return errorResponse(res, '缺少 userId 参数', 400);
  }

  try {
    const history = await aiService.getAIGeneratedHistory(userId, 'text-to-image', parseInt(page), parseInt(limit));
    return successResponse(res, history, '获取历史记录成功');
  } catch (error) {
    console.error('❌ 获取历史记录失败:', error.message);
    return errorResponse(res, `获取历史记录失败: ${error.message}`, 500);
  }
};

exports.applyBackgroundBlur = async (req, res) => {
  try {
    const { avatarFileId, blurLevel = 5, userId } = req.body;

    if (!avatarFileId) {
      return res.status(400).json({
        success: false,
        message: '缺少头像文件ID'
      });
    }

    // 验证 blurLevel 参数
    if (blurLevel < 1 || blurLevel > 10) {
      return res.status(400).json({
        success: false,
        message: '模糊级别必须在1-10之间'
      });
    }

    // 1. 从avatars表获取头像信息
    const avatarQuery = 'SELECT * FROM avatars WHERE id = $1 AND is_active = true';
    const avatarResult = await pool.query(avatarQuery, [avatarFileId]);
    
    if (avatarResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的头像或头像已被删除'
      });
    }

    const avatarInfo = avatarResult.rows[0];
    const originalUrl = avatarInfo.file_url;

    if (!originalUrl) {
      return res.status(404).json({
        success: false,
        message: '头像文件URL不存在'
      });
    }

    console.log('🚀 开始背景模糊处理:', {
      avatarFileId,
      blurLevel,
      originalUrl,
      userId: userId || 'anonymous'
    });

    // 2. 调用AI服务进行背景模糊处理
    let processedUrl;
    try {
      processedUrl = await aiService.backgroundBlur(originalUrl, blurLevel);
      console.log('✅ 背景模糊处理完成:', processedUrl);
    } catch (error) {
      console.error('❌ AI背景模糊处理失败:', error);
      
      // 根据错误类型返回不同的错误信息
      if (error.message.includes('下载图像失败')) {
        return res.status(502).json({
          success: false,
          message: '无法下载原始图像，请检查图像链接是否有效'
        });
      } else if (error.message.includes('API 错误')) {
        return res.status(502).json({
          success: false,
          message: 'AI服务暂时不可用，请稍后重试'
        });
      } else if (error.message.includes('timeout')) {
        return res.status(408).json({
          success: false,
          message: '处理超时，请稍后重试'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: '背景模糊处理失败: ' + error.message
        });
      }
    }

    // 3. 保存AI生成记录到数据库
    let recordId = null;
    try {
      recordId = await aiService.saveAIGeneratedRecord(
        userId || null,
        'background_blur',
        originalUrl,
        `背景模糊强度: ${blurLevel}`,
        processedUrl,
        'openai-edit',
        { blurLevel }
      );
      console.log('📝 记录已保存到数据库，ID:', recordId);
    } catch (dbError) {
      console.error('⚠️ 保存记录失败，但处理成功:', dbError.message);
      // 不影响主流程
    }

    // 4. 返回成功结果
    return res.json({
      success: true,
      message: '背景模糊处理成功',
      data: {
        resultUrl: processedUrl,
        taskId: recordId,
        status: 'completed',
        blurLevel: blurLevel
      }
    });

  } catch (error) {
    console.error('❌ 背景模糊处理失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message
    });
  }
};

// 背景替换处理
exports.applyBackgroundReplace = async (req, res) => {
  const { avatarFileId, backgroundDescription, userId } = req.body;

  if (!avatarFileId || !backgroundDescription) {
    return errorResponse(res, '缺少 avatarFileId 或 backgroundDescription 参数', 400);
  }

  try {
    console.log(`控制器接收到背景替换请求: avatarFileId=${avatarFileId}, backgroundDescription=${backgroundDescription}`);

    const imageUrl = await getAvatarUrlFromFileId(avatarFileId);
    const resultUrl = await aiService.backgroundReplace(imageUrl, backgroundDescription);
    console.log(`AI服务返回背景替换结果URL: ${resultUrl}`);

    // 保存记录到数据库
    const recordId = await aiService.saveAIGeneratedRecord(
      userId,
      'background-replace',
      imageUrl,
      `Replace background with ${backgroundDescription}`,
      resultUrl,
      'dall-e-2',
      { backgroundDescription }
    );

    return successResponse(res, { taskId: recordId, resultUrl }, '背景替换处理成功');
  } catch (error) {
    console.error('❌ 背景替换处理失败:', error.message);
    if (error.message.includes('Avatar file not found')) {
      return errorResponse(res, '头像文件未找到', 404);
    }
    return errorResponse(res, `背景替换处理失败: ${error.message}`, 500);
  }
};

// 获取所有AI处理历史记录
exports.getAIHistory = async (req, res) => {
  console.log('🔍 getAIHistory 被调用, req.query:', req.query);
  const { userId, taskType, page = 1, limit = 10 } = req.query;

  if (!userId) {
    console.log('❌ 缺少 userId 参数');
    return errorResponse(res, '缺少 userId 参数', 400);
  }

  try {
    console.log('📡 调用 aiService.getAIGeneratedHistory:', { userId, taskType, page: parseInt(page), limit: parseInt(limit) });
    const history = await aiService.getAIGeneratedHistory(userId, taskType, parseInt(page), parseInt(limit));
    console.log('✅ 获取历史记录成功, 记录数量:', history.records?.length || 0);
    return successResponse(res, history, '获取AI历史记录成功');
  } catch (error) {
    console.error('❌ 获取AI历史记录失败:', error.message);
    return errorResponse(res, `获取AI历史记录失败: ${error.message}`, 500);
  }
};

// 获取超分辨率历史记录
exports.getSuperResolutionHistory = async (req, res) => {
  console.log('🔍 getSuperResolutionHistory 被调用, req.query:', req.query);
  const { userId, page = 1, limit = 10 } = req.query;

  if (!userId) {
    console.log('❌ 缺少 userId 参数');
    return errorResponse(res, '缺少 userId 参数', 400);
  }

  try {
    console.log('📡 调用 aiService.getAIGeneratedHistory (super_resolution):', { userId, page: parseInt(page), limit: parseInt(limit) });
    const history = await aiService.getAIGeneratedHistory(userId, 'super_resolution', parseInt(page), parseInt(limit));
    console.log('✅ 获取超分辨率历史记录成功, 记录数量:', history.records?.length || 0);
    return successResponse(res, history, '获取超分辨率历史记录成功');
  } catch (error) {
    console.error('❌ 获取超分辨率历史记录失败:', error.message);
    return errorResponse(res, `获取超分辨率历史记录失败: ${error.message}`, 500);
  }
};

// 获取风格迁移历史记录
exports.getStyleTransferHistory = async (req, res) => {
  const { userId, page = 1, limit = 10 } = req.query;

  if (!userId) {
    return errorResponse(res, '缺少 userId 参数', 400);
  }

  try {
    const history = await aiService.getAIGeneratedHistory(userId, 'style-transfer', parseInt(page), parseInt(limit));
    return successResponse(res, history, '获取风格迁移历史记录成功');
  } catch (error) {
    console.error('❌ 获取风格迁移历史记录失败:', error.message);
    return errorResponse(res, `获取风格迁移历史记录失败: ${error.message}`, 500);
  }
};

// 获取背景模糊历史记录
exports.getBackgroundBlurHistory = async (req, res) => {
  const { userId, page = 1, limit = 10 } = req.query;

  if (!userId) {
    return errorResponse(res, '缺少 userId 参数', 400);
  }

  try {
    const history = await aiService.getAIGeneratedHistory(userId, 'background_blur', parseInt(page), parseInt(limit));
    return successResponse(res, history, '获取背景模糊历史记录成功');
  } catch (error) {
    console.error('❌ 获取背景模糊历史记录失败:', error.message);
    return errorResponse(res, `获取背景模糊历史记录失败: ${error.message}`, 500);
  }
};

// 获取背景替换历史记录
exports.getBackgroundReplaceHistory = async (req, res) => {
  const { userId, page = 1, limit = 10 } = req.query;

  if (!userId) {
    return errorResponse(res, '缺少 userId 参数', 400);
  }

  try {
    const history = await aiService.getAIGeneratedHistory(userId, 'background-replace', parseInt(page), parseInt(limit));
    return successResponse(res, history, '获取背景替换历史记录成功');
  } catch (error) {
    console.error('❌ 获取背景替换历史记录失败:', error.message);
    return errorResponse(res, `获取背景替换历史记录失败: ${error.message}`, 500);
  }
};

// 删除单个AI记录
exports.deleteAIRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { userId } = req.body;

    console.log('🗑️ 删除AI记录请求:', { recordId, userId });

    if (!recordId) {
      return res.status(400).json({
        success: false,
        message: '缺少记录ID参数'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID参数'
      });
    }

    // 调用服务层删除记录
    const result = await aiService.deleteAIGeneratedRecord(userId, recordId);

    return res.json({
      success: true,
      message: '记录删除成功',
      data: {
        deletedRecord: result.deletedRecord
      }
    });

  } catch (error) {
    console.error('❌ 删除AI记录失败:', error);
    
    if (error.message.includes('记录不存在或无权限删除')) {
      return res.status(404).json({
        success: false,
        message: '记录不存在或您没有权限删除该记录'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: '删除记录失败: ' + error.message
    });
  }
};

// 批量删除AI记录
exports.deleteMultipleAIRecords = async (req, res) => {
  try {
    const { recordIds, userId } = req.body;

    console.log('🗑️ 批量删除AI记录请求:', { recordIds, userId });

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少记录ID数组参数'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID参数'
      });
    }

    // 验证记录ID数量限制
    if (recordIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: '单次最多只能删除100条记录'
      });
    }

    // 调用服务层批量删除记录
    const result = await aiService.deleteMultipleAIRecords(userId, recordIds);

    return res.json({
      success: true,
      message: `成功删除 ${result.deletedCount} 条记录`,
      data: {
        deletedCount: result.deletedCount,
        deletedRecords: result.deletedRecords,
        fileDeleteResults: result.fileDeleteResults
      }
    });

  } catch (error) {
    console.error('❌ 批量删除AI记录失败:', error);
    
    if (error.message.includes('没有找到可删除的记录')) {
      return res.status(404).json({
        success: false,
        message: '没有找到可删除的记录'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: '批量删除记录失败: ' + error.message
    });
  }
};

// 删除所有AI记录
exports.deleteAllAIRecords = async (req, res) => {
  try {
    const { userId, taskType } = req.body;

    console.log('🗑️ 删除所有AI记录请求:', { userId, taskType });

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID参数'
      });
    }

    // 调用服务层删除所有记录
    const result = await aiService.deleteAllAIRecordsByUser(userId, taskType);

    if (result.deletedCount === 0) {
      return res.json({
        success: true,
        message: '没有找到需要删除的记录',
        data: {
          deletedCount: 0
        }
      });
    }

    return res.json({
      success: true,
      message: `成功删除 ${result.deletedCount} 条记录`,
      data: {
        deletedCount: result.deletedCount,
        taskType: taskType || 'all',
        fileDeleteResults: result.fileDeleteResults
      }
    });

  } catch (error) {
    console.error('❌ 删除所有AI记录失败:', error);
    
    return res.status(500).json({
      success: false,
      message: '删除所有记录失败: ' + error.message
    });
  }
};

// 添加水印
exports.addWatermark = async (req, res) => {
  try {
    const { avatarFileId, watermarkType, content, options } = req.body;
    const { position = 'bottom-right', opacity = 0.3, fontSize = 16, color = '#ffffff' } = options || {};
    const userId = req.body.userId;

    if (!avatarFileId) {
      return res.status(400).json({
        success: false,
        message: '缺少头像文件ID'
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '缺少水印内容'
      });
    }

    // 1. 从avatars表获取头像信息
    const avatarQuery = 'SELECT * FROM avatars WHERE id = $1 AND is_active = true';
    const avatarResult = await pool.query(avatarQuery, [avatarFileId]);
    
    if (avatarResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的头像或头像已被删除'
      });
    }

    const avatarInfo = avatarResult.rows[0];
    const originalUrl = avatarInfo.file_url;

    if (!originalUrl) {
      return res.status(404).json({
        success: false,
        message: '头像文件URL不存在'
      });
    }

    console.log('🚀 开始添加水印:', {
      avatarFileId,
      watermarkType,
      content,
      position,
      opacity,
      fontSize,
      color,
      userId: userId || 'anonymous'
    });

    // 2. 调用服务添加水印
    const watermarkOptions = {
      position,
      opacity,
      fontSize,
      color
    };

    let processedUrl = await aiService.addWatermark(originalUrl, content, watermarkType, watermarkOptions);
    console.log('✅ 水印添加完成:', processedUrl);

    // 3. 保存AI生成记录到数据库
    let recordId = null;
    try {
      recordId = await aiService.saveAIGeneratedRecord(
        userId || null,
        'watermark',
        originalUrl,
        `添加${watermarkType === 'invisible' ? '隐形' : ''}水印: "${content}"`,
        processedUrl,
        'watermark',
        { watermarkType, position, opacity, fontSize, color }
      );
      console.log('📝 记录已保存到数据库，ID:', recordId);
    } catch (dbError) {
      console.error('⚠️ 保存记录失败，但处理成功:', dbError.message);
      // 不影响主流程
    }

    // 4. 返回成功结果
    return res.json({
      success: true,
      message: '水印添加成功',
      data: {
        taskId: recordId,
        resultUrl: processedUrl,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('❌ 添加水印失败:', error);
    return res.status(500).json({
      success: false,
      message: '添加水印失败: ' + error.message
    });
  }
};

// 检测水印
exports.detectWatermark = async (req, res) => {
  try {
    const { imageFileId } = req.body;

    if (!imageFileId) {
      return res.status(400).json({
        success: false,
        message: '缺少图片文件ID'
      });
    }

    // 获取图片URL
    const imageQuery = 'SELECT file_url FROM avatars WHERE id = $1';
    const imageResult = await pool.query(imageQuery, [imageFileId]);
    
    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的图片'
      });
    }

    const imageUrl = imageResult.rows[0].file_url;

    // 调用服务检测水印
    const detectionResult = await aiService.detectWatermark(imageUrl);

    return res.json({
      success: true,
      message: detectionResult.hasWatermark ? '检测到水印' : '未检测到水印',
      data: detectionResult
    });

  } catch (error) {
    console.error('❌ 检测水印失败:', error);
    return res.status(500).json({
      success: false,
      message: '检测水印失败: ' + error.message
    });
  }
};