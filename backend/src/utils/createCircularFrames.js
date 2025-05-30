const fs = require('fs');
const path = require('path');

/**
 * 创建圆形预设头像框
 * @param {string} publicDir - 公共目录路径
 * @returns {Promise<void>}
 */
const createPresetCircularFrames = async (publicDir) => {
  // 确保frames目录存在
  const framesDir = path.join(publicDir, 'frames');
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }
  
  // 预设头像框配置
  const frames = [
    { id: 'spring-festival-frame', color: '#FF4D4F', name: '春节' },
    { id: 'valentine-frame', color: '#FF85C0', name: '情人节' },
    { id: 'christmas-frame', color: '#52C41A', name: '圣诞节' },
    { id: 'golden-frame', color: '#FAAD14', name: '金色' },
    { id: 'neon-frame', color: '#722ED1', name: '霓虹' },
    { id: 'vintage-frame', color: '#13C2C2', name: '复古' }
  ];
  
  // 为每个预设头像框创建圆形SVG
  for (const frame of frames) {
    await createCircularFrame(framesDir, frame);
  }
  
  console.log('圆形预设头像框创建完成');
};

/**
 * 创建单个圆形头像框
 * @param {string} dir - 目录路径
 * @param {Object} frame - 头像框配置
 * @returns {Promise<void>}
 */
const createCircularFrame = async (dir, frame) => {
  const framePath = path.join(dir, `${frame.id}.png`);
  const previewPath = path.join(dir, `${frame.id.replace('-frame', '-preview')}.png`);
  
  // 检查文件是否已存在，如果存在则跳过
  if (fs.existsSync(framePath) && fs.existsSync(previewPath)) {
    console.log(`头像框 ${frame.id} 已存在，跳过创建`);
    return;
  }
  
  // 创建圆形头像框SVG
  const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="246" fill="none" stroke="${frame.color}" stroke-width="20"/>
  </svg>`;
  
  // 创建预览图SVG
  const previewSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="none" stroke="${frame.color}" stroke-width="10"/>
  </svg>`;
  
  // 将SVG写入文件
  fs.writeFileSync(framePath, svg);
  fs.writeFileSync(previewPath, previewSvg);
  
  console.log(`创建头像框: ${frame.id}`);
};

module.exports = {
  createPresetCircularFrames
}; 