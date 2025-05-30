const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 将SVG文件转换为PNG
async function convertSvgToPng(svgPath, pngPath) {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer)
      .png()
      .toFile(pngPath);
    console.log(`已转换: ${svgPath} -> ${pngPath}`);
  } catch (error) {
    console.error(`转换失败 ${svgPath}:`, error);
  }
}

// 转换框架目录中的所有SVG文件
async function convertAllSvgInDir() {
  const framesDir = path.join(__dirname, '../../public/frames');
  const files = fs.readdirSync(framesDir);
  
  for (const file of files) {
    if (file.endsWith('.svg')) {
      const svgPath = path.join(framesDir, file);
      const pngPath = path.join(framesDir, file.replace('.svg', '.png'));
      await convertSvgToPng(svgPath, pngPath);
    }
  }
}

// 执行转换
convertAllSvgInDir().then(() => {
  console.log('所有SVG文件转换完成');
}).catch(err => {
  console.error('转换过程中出错:', err);
});

module.exports = { convertSvgToPng, convertAllSvgInDir }; 