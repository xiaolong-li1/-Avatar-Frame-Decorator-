const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const { successResponse, errorResponse } = require('../utils/responseUtil');

/**
 * 预设头像框数据
 * 在实际项目中，这些数据应该存储在数据库中
 */
const presetFrames = [
  {
    id: 'frame_001',
    name: '春节红包框',
    category: 'festival',
    thumbnailUrl: `${config.fileUrlPrefix}/${config.upload.dir}/frames/preset/frame_001_thumb.png`,
    frameUrl: `${config.fileUrlPrefix}/${config.upload.dir}/frames/preset/frame_001.png`,
    isAnimated: false,
    tags: ['春节', '红色', '传统']
  },
  {
    id: 'frame_002',
    name: '情人节爱心框',
    category: 'festival',
    thumbnailUrl: `${config.fileUrlPrefix}/${config.upload.dir}/frames/preset/frame_002_thumb.png`,
    frameUrl: `${config.fileUrlPrefix}/${config.upload.dir}/frames/preset/frame_002.png`,
    isAnimated: false,
    tags: ['情人节', '爱心', '浪漫']
  },
  {
    id: 'frame_003',
    name: '商务简约框',
    category: 'business',
    thumbnailUrl: `${config.fileUrlPrefix}/${config.upload.dir}/frames/preset/frame_003_thumb.png`,
    frameUrl: `${config.fileUrlPrefix}/${config.upload.dir}/frames/preset/frame_003.png`,
    isAnimated: false,
    tags: ['商务', '简约', '专业']
  },
  {
    id: 'frame_004',
    name: '可爱猫咪框',
    category: 'cute',
    thumbnailUrl: `${config.fileUrlPrefix}/${config.upload.dir}/frames/preset/frame_004_thumb.png`,
    frameUrl: `${config.fileUrlPrefix}/${config.upload.dir}/frames/preset/frame_004.png`,
    isAnimated: false,
    tags: ['可爱', '动物', '猫咪']
  },
  {
    id: 'frame_005',
    name: '酷炫霓虹框',
    category: 'cool',
    thumbnailUrl: `${config.fileUrlPrefix}/${config.upload.dir}/frames/preset/frame_005_thumb.png`,
    frameUrl: `${config.fileUrlPrefix}/${config.upload.dir}/frames/preset/frame_005.png`,
    isAnimated: false,
    tags: ['霓虹', '酷炫', '时尚']
  }
];

/**
 * 自定义头像框存储
 * 在实际项目中，这些数据应该存储在数据库中
 */
let customFrames = [];

/**
 * 获取预设头像框列表
 */
const getPresetFrames = async (req, res) => {
  try {
    const { category = 'all', page = 1, limit = 20 } = req.query;
    
    // 根据分类筛选
    const filteredFrames = category === 'all'
      ? presetFrames
      : presetFrames.filter(frame => frame.category === category);
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedFrames = filteredFrames.slice(startIndex, endIndex);
    
    return res.json(successResponse({
      frames: paginatedFrames,
      total: filteredFrames.length,
      page: parseInt(page),
      limit: parseInt(limit)
    }, '获取成功'));
  } catch (error) {
    console.error('获取预设头像框失败:', error);
    return res.status(500).json(errorResponse('获取预设头像框失败', 500, error.message));
  }
};

/**
 * 应用头像框（预设或自定义）
 */
const applyFrame = async (req, res) => {
  try {
    const { avatarFileId, frameId, options = {} } = req.body;
    
    if (!avatarFileId || !frameId) {
      return res.status(400).json(errorResponse('参数不完整', 400));
    }
    
    // 查找头像框
    let frameInfo;
    if (frameId.startsWith('frame_')) {
      // 预设头像框
      frameInfo = presetFrames.find(frame => frame.id === frameId);
    } else if (frameId.startsWith('custom_frame_')) {
      // 自定义头像框
      frameInfo = customFrames.find(frame => frame.id === frameId);
    }
    
    if (!frameInfo) {
      return res.status(404).json(errorResponse('头像框不存在', 404));
    }
    
    // 查找头像文件
    const avatarDir = path.join(__dirname, '../../', config.upload.dir, 'original');
    const resultsDir = path.join(__dirname, '../../', config.upload.dir, 'results');
    
    // 查找头像文件（实际场景中应从数据库获取）
    const avatarFiles = await fs.readdir(avatarDir);
    const avatarFile = avatarFiles.find(file => file.startsWith(avatarFileId));
    
    if (!avatarFile) {
      return res.status(404).json(errorResponse('头像文件不存在', 404));
    }
    
    // 获取框架图片URL路径
    const frameUrl = frameInfo.frameUrl;
    const frameFilePath = frameUrl.replace(`${config.fileUrlPrefix}/`, '');
    const frameAbsolutePath = path.join(__dirname, '../../', frameFilePath);
    
    // 头像文件路径
    const avatarFilePath = path.join(avatarDir, avatarFile);
    
    // 结果文件名
    const resultId = `result_${Date.now()}_${uuidv4().substring(0, 8)}`;
    const resultFilename = `${resultId}.png`;
    const resultPath = path.join(resultsDir, resultFilename);
    
    // 读取头像和框架图片
    const avatarBuffer = await fs.readFile(avatarFilePath);
    const frameBuffer = await fs.readFile(frameAbsolutePath);
    
    // 获取头像尺寸
    const avatarMetadata = await sharp(avatarBuffer).metadata();
    
    // 调整框架图片大小以匹配头像
    const resizedFrameBuffer = await sharp(frameBuffer)
      .resize(avatarMetadata.width, avatarMetadata.height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();
    
    // 设置透明度
    const opacity = options.opacity || 1.0;
    
    // 合成图片 - 先调整头像为正方形
    await sharp(avatarBuffer)
      .resize(Math.max(avatarMetadata.width, avatarMetadata.height), Math.max(avatarMetadata.width, avatarMetadata.height), {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .composite([
        {
          input: resizedFrameBuffer,
          blend: 'over',
          // 如果需要，可以调整透明度
          ...(opacity !== 1.0 && { 
            // 由于sharp不直接支持透明度，所以这里需要其他方法处理
            // 例如使用blend模式或者其他图像处理方法
          })
        }
      ])
      .png()
      .toFile(resultPath);
    
    // 生成结果URL
    const resultUrl = `${config.fileUrlPrefix}/${config.upload.dir}/results/${resultFilename}`;
    
    return res.json(successResponse({
      taskId: resultId,
      resultUrl,
      status: 'completed'
    }, '头像框应用成功'));
  } catch (error) {
    console.error('应用头像框失败:', error);
    return res.status(500).json(errorResponse('应用头像框失败', 500, error.message));
  }
};

/**
 * 获取用户自定义头像框列表
 */
const getCustomFrames = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedFrames = customFrames.slice(startIndex, endIndex);
    
    return res.json(successResponse({
      frames: paginatedFrames,
      total: customFrames.length,
      page: parseInt(page),
      limit: parseInt(limit)
    }, '获取成功'));
  } catch (error) {
    console.error('获取自定义头像框失败:', error);
    return res.status(500).json(errorResponse('获取自定义头像框失败', 500, error.message));
  }
};

/**
 * 删除自定义头像框
 */
const deleteCustomFrame = async (req, res) => {
  try {
    const { frameId } = req.params;
    
    if (!frameId || !frameId.startsWith('custom_frame_')) {
      return res.status(400).json(errorResponse('无效的头像框ID', 400));
    }
    
    // 查找头像框
    const frameIndex = customFrames.findIndex(frame => frame.id === frameId);
    
    if (frameIndex === -1) {
      return res.status(404).json(errorResponse('头像框不存在', 404));
    }
    
    // 获取头像框信息
    const frameInfo = customFrames[frameIndex];
    
    // 删除文件
    const frameUrl = frameInfo.frameUrl;
    const thumbnailUrl = frameInfo.thumbnailUrl;
    
    const frameFilePath = frameUrl.replace(`${config.fileUrlPrefix}/`, '');
    const thumbnailFilePath = thumbnailUrl.replace(`${config.fileUrlPrefix}/`, '');
    
    const frameAbsolutePath = path.join(__dirname, '../../', frameFilePath);
    const thumbnailAbsolutePath = path.join(__dirname, '../../', thumbnailFilePath);
    
    // 尝试删除文件（如果存在）
    try {
      await fs.access(frameAbsolutePath);
      await fs.unlink(frameAbsolutePath);
    } catch (error) {
      // 文件不存在，忽略错误
      console.warn(`文件不存在: ${frameAbsolutePath}`);
    }
    
    try {
      await fs.access(thumbnailAbsolutePath);
      await fs.unlink(thumbnailAbsolutePath);
    } catch (error) {
      // 文件不存在，忽略错误
      console.warn(`文件不存在: ${thumbnailAbsolutePath}`);
    }
    
    // 从数组中删除
    customFrames.splice(frameIndex, 1);
    
    return res.json(successResponse({}, '删除成功'));
  } catch (error) {
    console.error('删除自定义头像框失败:', error);
    return res.status(500).json(errorResponse('删除自定义头像框失败', 500, error.message));
  }
};

/**
 * 添加自定义头像框
 * 由uploadController中的uploadCustomFrame函数调用
 */
const addCustomFrame = (frameData) => {
  // 添加创建时间
  const frame = {
    ...frameData,
    isAnimated: false,
    tags: [],
    createdAt: new Date().toISOString()
  };
  
  customFrames.push(frame);
  return frame;
};

module.exports = {
  getPresetFrames,
  applyFrame,
  getCustomFrames,
  deleteCustomFrame,
  addCustomFrame
}; 