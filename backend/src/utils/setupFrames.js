const fs = require('fs');
const path = require('path');
const config = require('../config/config');

/**
 * 初始化预设头像框
 * 这个函数会检查预设头像框文件是否存在，如果不存在，会创建一些示例头像框
 */
const setupPresetFrames = () => {
  const presetFramesDir = path.join(__dirname, '../../', config.upload.dir, 'frames', 'preset');
  const presetFrameThumbDir = path.join(presetFramesDir, 'thumb');
  
  // 确保目录存在
  if (!fs.existsSync(presetFramesDir)) {
    fs.mkdirSync(presetFramesDir, { recursive: true });
  }
  
  if (!fs.existsSync(presetFrameThumbDir)) {
    fs.mkdirSync(presetFrameThumbDir, { recursive: true });
  }
  
  // 检查是否已经有预设头像框
  const files = fs.readdirSync(presetFramesDir);
  if (files.length > 5) {
    console.log('预设头像框已存在，跳过初始化');
    return;
  }
  
  // 示例头像框
  // 在实际项目中，您应该准备真实的头像框图片
  // 这里我们仅创建简单的占位文件
  
  // 春节红包框
  createDummyFrame(presetFramesDir, 'frame_001', 'red');
  
  // 情人节爱心框
  createDummyFrame(presetFramesDir, 'frame_002', 'pink');
  
  // 商务简约框
  createDummyFrame(presetFramesDir, 'frame_003', 'blue');
  
  // 可爱猫咪框
  createDummyFrame(presetFramesDir, 'frame_004', 'orange');
  
  // 酷炫霓虹框
  createDummyFrame(presetFramesDir, 'frame_005', 'purple');
  
  console.log('预设头像框初始化完成');
};

/**
 * 创建示例头像框文件
 * @param {string} dir - 目录路径
 * @param {string} id - 框架ID
 * @param {string} color - 框架颜色
 */
const createDummyFrame = (dir, id, color) => {
  const framePath = path.join(dir, `${id}.png`);
  const thumbPath = path.join(dir, 'thumb', `${id}_thumb.png`);
  
  // 检查文件是否已存在
  if (fs.existsSync(framePath) && fs.existsSync(thumbPath)) {
    return;
  }
  
  // 创建简单的头像框 SVG 数据
  // 这里使用 Base64 编码的简单 SVG 图像作为示例
  // 在实际项目中，您应该使用真实的头像框图片
  
  // 创建透明度和颜色的框架 SVG
  const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="512" height="512" fill="none" stroke="${color}" stroke-width="20" rx="60" ry="60"/>
  </svg>`;
  
  const thumbSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="200" height="200" fill="none" stroke="${color}" stroke-width="10" rx="30" ry="30"/>
  </svg>`;
  
  // 将 SVG 写入文件
  fs.writeFileSync(framePath, svg);
  fs.writeFileSync(thumbPath, thumbSvg);
};

module.exports = setupPresetFrames; 