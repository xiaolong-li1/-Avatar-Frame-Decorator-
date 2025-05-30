const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 头像框配置
const frames = [
  { id: 'spring-festival', name: '春节主题', color: 'red' },
  { id: 'valentine', name: '情人节', color: 'pink' },
  { id: 'christmas', name: '圣诞节', color: 'green' },
  { id: 'golden', name: '金色经典', color: 'gold' },
  { id: 'neon', name: '霓虹光效', color: 'purple' },
  { id: 'vintage', name: '复古胶片', color: 'brown' }
];

// 创建所有头像框
async function createAllFrames() {
  const framesDir = path.join(__dirname, '../../public/frames');

  // 确保目录存在
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  // 创建所有头像框
  for (const frame of frames) {
    await createFrame(framesDir, frame.id, frame.color);
  }

  console.log('所有头像框创建完成');
}

// 创建单个头像框
async function createFrame(dir, id, color) {
  const previewPath = path.join(dir, `${id}-preview.png`);
  const framePath = path.join(dir, `${id}-frame.png`);
  
  // 检查文件是否已存在
  if (fs.existsSync(previewPath) && fs.existsSync(framePath)) {
    console.log(`跳过已存在的头像框: ${id}`);
    return;
  }

  console.log(`创建头像框: ${id}`);

  // 创建预览图 SVG
  const previewSvg = Buffer.from(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="200" height="200" fill="none" stroke="${color}" stroke-width="10" rx="30" ry="30"/>
  </svg>`);

  // 创建头像框 SVG
  const frameSvg = Buffer.from(`<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="512" height="512" fill="none" stroke="${color}" stroke-width="20" rx="60" ry="60"/>
  </svg>`);

  // 将 SVG 转换为 PNG
  await sharp(previewSvg)
    .png()
    .toFile(previewPath);

  await sharp(frameSvg)
    .png()
    .toFile(framePath);

  console.log(`创建完成: ${id}`);
}

// 执行创建
createAllFrames().catch(err => {
  console.error('创建头像框失败:', err);
});

module.exports = { createAllFrames }; 