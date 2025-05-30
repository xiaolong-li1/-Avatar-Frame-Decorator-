const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const { successResponse, errorResponse } = require('../utils/responseUtil');
const framesController = require('./framesController');

/**
 * 头像上传处理
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('请选择文件上传', 400));
    }

    const { file } = req;
    const fileId = `img_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    // 生成文件路径
    const originalDir = path.join(__dirname, '../../', config.upload.dir, 'original');
    const thumbDir = path.join(__dirname, '../../', config.upload.dir, 'thumb');
    
    const fileExt = path.extname(file.originalname);
    const originalFilename = `${fileId}${fileExt}`;
    const thumbFilename = `${fileId}.jpg`;
    
    const originalPath = path.join(originalDir, originalFilename);
    const thumbnailPath = path.join(thumbDir, thumbFilename);
    
    // 处理原图
    const imageBuffer = await fs.readFile(file.path);
    const metadata = await sharp(imageBuffer).metadata();
    
    // 保存原图
    await sharp(imageBuffer)
      .toFile(originalPath);
    
    // 生成缩略图
    await sharp(imageBuffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    // 清理临时文件
    await fs.unlink(file.path);
    
    // 生成URL
    const originalUrl = `${config.fileUrlPrefix}/${config.upload.dir}/original/${originalFilename}`;
    const thumbnailUrl = `${config.fileUrlPrefix}/${config.upload.dir}/thumb/${thumbFilename}`;
    
    // 返回响应
    return res.json(successResponse({
      fileId,
      originalUrl,
      thumbnailUrl,
      size: file.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    }, '上传成功'));
    
  } catch (error) {
    console.error('文件上传失败:', error);
    return res.status(500).json(errorResponse('文件上传失败', 500, error.message));
  }
};

/**
 * 自定义头像框上传处理
 */
const uploadCustomFrame = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('请选择文件上传', 400));
    }

    // 获取请求参数
    const { name, description = '' } = req.body;
    
    if (!name) {
      return res.status(400).json(errorResponse('请提供头像框名称', 400));
    }

    const { file } = req;
    const frameId = `custom_frame_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    // 生成文件路径
    const frameDir = path.join(__dirname, '../../', config.upload.dir, 'frames', 'custom');
    const thumbDir = path.join(__dirname, '../../', config.upload.dir, 'frames', 'custom', 'thumb');
    
    // 确保目录存在
    if (!fs.existsSync(thumbDir)) {
      await fs.mkdir(thumbDir, { recursive: true });
    }
    
    const fileExt = '.png'; // 统一转换为PNG格式以支持透明度
    const frameFilename = `${frameId}${fileExt}`;
    const thumbFilename = `${frameId}_thumb${fileExt}`;
    
    const framePath = path.join(frameDir, frameFilename);
    const thumbnailPath = path.join(thumbDir, thumbFilename);
    
    // 处理图片
    const imageBuffer = await fs.readFile(file.path);
    
    // 保存原图 (转换为PNG确保支持透明)
    await sharp(imageBuffer)
      .png()
      .toFile(framePath);
    
    // 生成缩略图
    await sharp(imageBuffer)
      .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(thumbnailPath);
    
    // 清理临时文件
    await fs.unlink(file.path);
    
    // 生成URL
    const frameUrl = `${config.fileUrlPrefix}/${config.upload.dir}/frames/custom/${frameFilename}`;
    const thumbnailUrl = `${config.fileUrlPrefix}/${config.upload.dir}/frames/custom/thumb/${thumbFilename}`;
    
    // 创建头像框对象
    const frameData = {
      id: frameId,
      name,
      description,
      frameUrl,
      thumbnailUrl
    };
    
    // 添加到自定义头像框集合中
    framesController.addCustomFrame(frameData);
    
    // 返回响应
    return res.json(successResponse(frameData, '头像框上传成功'));
    
  } catch (error) {
    console.error('头像框上传失败:', error);
    return res.status(500).json(errorResponse('头像框上传失败', 500, error.message));
  }
};

module.exports = {
  uploadAvatar,
  uploadCustomFrame
}; 