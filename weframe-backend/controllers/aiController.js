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

// 超分辨率处理（暂时不实现，返回提示信息）
exports.applySuperResolution = async (req, res) => {
  return errorResponse(res, '超分辨率功能暂未实现，请等待后续更新', 501);
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

// 背景模糊处理
exports.applyBackgroundBlur = async (req, res) => {
  const { avatarFileId, blurLevel = 5, userId } = req.body;

  if (!avatarFileId) {
    return errorResponse(res, '缺少 avatarFileId 参数', 400);
  }

  try {
    console.log(`控制器接收到背景模糊请求: avatarFileId=${avatarFileId}, blurLevel=${blurLevel}`);

    const imageUrl = await getAvatarUrlFromFileId(avatarFileId);
    const resultUrl = await aiService.backgroundBlur(imageUrl, blurLevel);
    console.log(`AI服务返回背景模糊结果URL: ${resultUrl}`);

    // 保存记录到数据库
    const recordId = await aiService.saveAIGeneratedRecord(
      userId,
      'background-blur',
      imageUrl,
      `Apply blur level ${blurLevel} to background`,
      resultUrl,
      'dall-e-2',
      { blurLevel }
    );

    return successResponse(res, { taskId: recordId, resultUrl }, '背景模糊处理成功');
  } catch (error) {
    console.error('❌ 背景模糊处理失败:', error.message);
    if (error.message.includes('Avatar file not found')) {
      return errorResponse(res, '头像文件未找到', 404);
    }
    return errorResponse(res, `背景模糊处理失败: ${error.message}`, 500);
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
  const { userId, taskType, page = 1, limit = 10 } = req.query;

  if (!userId) {
    return errorResponse(res, '缺少 userId 参数', 400);
  }

  try {
    const history = await aiService.getAIGeneratedHistory(userId, taskType, parseInt(page), parseInt(limit));
    return successResponse(res, history, '获取AI历史记录成功');
  } catch (error) {
    console.error('❌ 获取AI历史记录失败:', error.message);
    return errorResponse(res, `获取AI历史记录失败: ${error.message}`, 500);
  }
};