const cloudinary = require('../config/cloudinary');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

exports.uploadFile = async (buffer, path, contentType) => {
  return new Promise((resolve, reject) => {
    // 去掉 path 中的扩展名
    const cleanPath = path.replace(/\.\w+$/, '');
    console.log('Uploading to Cloudinary with public_id:', cleanPath);

    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: cleanPath,
        resource_type: 'image',
        format: contentType.split('/')[1], // 仍使用 format 控制扩展名
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload failed:', error);
          reject(new Error(`Cloudinary upload failed: ${error.message || JSON.stringify(error)}`));
        } else {
          console.log(`✅ Image uploaded to Cloudinary: ${result.secure_url}`);
          resolve(result.secure_url);
        }
      }
    );
    stream.end(buffer);
  });
};
exports.getFile = async (url) => {
  try {
    if (!url) {
      throw new Error('File URL is empty');
    }
    console.log('Fetching file from Cloudinary:', url);

    // 提取 public_id（仅用于日志）
    const publicIdMatch = url.match(/\/upload\/v\d+\/(.+?)(?:\.(\w+))?$/i);
    if (!publicIdMatch) {
      throw new Error('Invalid Cloudinary URL format');
    }
    const publicId = publicIdMatch[1];
    console.log('Extracted public_id:', publicId);

    // 添加重试逻辑
    let retries = 5;
    let buffer;
    
    while (retries > 0) {
      try {
        // 设置更长的超时时间
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
        
        const response = await fetch(url, {
          signal: controller.signal,
          timeout: 30000 // 这个属性在某些fetch实现中可能不支持
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        buffer = await response.buffer();
        console.log('File fetched successfully, buffer length:', buffer.length);
        return buffer;
      } catch (fetchError) {
        retries--;
        if (retries === 0) throw fetchError;
        console.log(`Fetch attempt failed, retrying... (${retries} attempts left)`);
        // 指数退避策略 - 等待时间应随重试次数增加而增加
        await new Promise(r => setTimeout(r, Math.pow(2, 5-retries) * 1000)); // 1秒, 2秒, 4秒, 8秒, 16秒
      }
    }
  } catch (error) {
    console.error('Cloudinary fetch failed:', error);
    throw new Error(`Cloudinary fetch failed: ${error.message || JSON.stringify(error)}`);
  }
};