const sharp = require('sharp');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// 混合模式映射
const blendModeMap = {
  normal: 'over', // 映射 "normal" 到 "over"
  clear: 'clear',
  source: 'source',
  over: 'over',
  in: 'in',
  out: 'out',
  atop: 'atop',
  dest: 'dest',
  'dest-over': 'dest-over',
  'dest-in': 'dest-in',
  'dest-out': 'dest-out',
  'dest-atop': 'dest-atop',
  xor: 'xor',
  add: 'add',
  saturate: 'saturate',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  darken: 'darken',
  lighten: 'lighten',
  'color-dodge': 'color-dodge',
  'color-burn': 'color-burn',
  'hard-light': 'hard-light',
  'soft-light': 'soft-light',
  difference: 'difference',
  exclusion: 'exclusion'
};

// 保留原图尺寸，只转换格式以保存
exports.generateThumbnail = async (buffer) => {
  return await sharp(buffer)
    .toFormat('png')
    .toBuffer();
};

// 获取图像尺寸
exports.getImageDimensions = async (buffer) => {
  const metadata = await sharp(buffer).metadata();
  return { width: metadata.width, height: metadata.height };
};

// 合成图像，并裁剪为圆形
exports.applyFrame = async (avatarBuffer, frameBuffer, options = {}) => {
  try {
    const { opacity = 0.8 } = options;
    
    // 创建临时文件
    const tempDir = os.tmpdir();
    const avatarPath = path.join(tempDir, `avatar_${Date.now()}.png`);
    const framePath = path.join(tempDir, `frame_${Date.now()}.png`);
    const outputPath = path.join(tempDir, `result_${Date.now()}.png`);
    
    // 写入临时文件
    await fs.writeFile(avatarPath, avatarBuffer);
    await fs.writeFile(framePath, frameBuffer);
    
    // 调用Python脚本
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        path.join(__dirname, '../scripts/process_image.py'),
        avatarPath,
        framePath,
        outputPath,
        opacity.toString()
      ]);
      
      let outputData = '';
      let errorData = '';
      
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
        console.log(`Python输出: ${data}`);
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        console.error(`Python错误: ${data}`);
      });
      
      pythonProcess.on('close', async (code) => {
        try {
          // 清理临时文件
          await Promise.all([
            fs.unlink(avatarPath).catch(() => {}),
            fs.unlink(framePath).catch(() => {})
          ]);
          
          if (code !== 0) {
            console.error(`Python进程退出，代码: ${code}`);
            reject(new Error(`Python处理失败: ${errorData}`));
            return;
          }
          
          // 读取结果
          const resultBuffer = await fs.readFile(outputPath);
          // 删除输出文件
          await fs.unlink(outputPath).catch(() => {});
          
          resolve(resultBuffer);
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('图像处理失败:', error);
    throw error;
  }
};