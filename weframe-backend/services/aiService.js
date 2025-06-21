const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');
const fileStorageService = require('./fileStorageService');
const os = require('os');
const fetch = require('node-fetch');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// API 基础 URL 和 API Key
const API_BASE_URL = process.env.OPENAI_API_BASE_URL || 'https://api.chatanywhere.tech/v1';
const API_KEY = process.env.OPENAI_API_KEY;

// 文本生成图像
const textToImage = async (text, width = 1024, height = 1024, model = 'gpt-image-1', quality = 'standard') => {
  try {
    console.log(`🚀 curl 调用文本生成图像: Text=${text}, Size=${width}x${height}, Model=${model}`);

    const size = `${width}x${height}`;
    
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 尝试第 ${attempt} 次请求 API...`);
        
        // 构建 curl 命令
        const curlCommand = `curl -s "${API_BASE_URL}/images/generations" `
          + `-H "Content-Type: application/json" `
          + `-H "Authorization: Bearer ${API_KEY}" `
          + `-d "{\\"model\\":\\"${model}\\",\\"prompt\\":\\"${text.replace(/"/g, '\\"')}\\",\\"n\\":1,\\"size\\":\\"${size}\\",\\"quality\\":\\"${quality}\\"}"`;
        
        console.log(`执行命令: ${curlCommand.replace(API_KEY, 'API_KEY_HIDDEN')}`);
        
        // 执行 curl 命令
        const output = execSync(curlCommand).toString();
        console.log('API 响应:', output.substring(0, 200) + '...');
        
        // 解析 JSON 响应
        const response = JSON.parse(output);
        
        if (response.error) {
          throw new Error(`API 错误: ${response.error.message || JSON.stringify(response.error)}`);
        }
        
        if (!response.data || !response.data[0]) {
          throw new Error('API 返回数据格式不正确，缺少 data 数组');
        }
        
        let imageBuffer;
        
        // 检查返回格式
        if (response.data[0].url) {
          // URL 格式
          const imageUrl = response.data[0].url;
          console.log('✅ API返回URL格式，临时URL:', imageUrl);
          imageBuffer = await downloadImage(imageUrl);
        } else if (response.data[0].b64_json) {
          // Base64 格式
          console.log('✅ API返回Base64格式，转换中...');
          const base64Data = response.data[0].b64_json;
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          throw new Error('API 返回格式不正确，缺少 url 或 b64_json');
        }

        // 上传到永久存储
        const permanentUrl = await fileStorageService.uploadFile(
          imageBuffer, 
          `ai-generated/text-to-image/${Date.now()}.png`, 
          'image/png'
        );

        console.log('✅ 图像已保存到永久存储:', permanentUrl);
        return permanentUrl;
      } catch (error) {
        lastError = error;
        console.log(`❌ 第 ${attempt} 次尝试失败:`, error.message);
        
        if (attempt < 3) {
          const delay = attempt * 10000; // 减少等待时间，10秒、20秒
          console.log(`⏳ 等待 ${delay/1000} 秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  } catch (error) {
    console.error('❌ 文本生成图像失败:', error.message);
    throw new Error(`文本生成图像失败: ${error.message}`);
  }
};

// 风格迁移（使用图像编辑）
const styleTransfer = async (imageUrl, stylePrompt) => {
  try {
    console.log(`🚀 风格迁移: ImageURL=${imageUrl}, Style=${stylePrompt}`);

    // 创建临时目录
    const tempDir = path.join(os.tmpdir(), 'weframe-ai');
    await fs.mkdir(tempDir, { recursive: true });
    
    // 下载原始图像
    const imageBuffer = await downloadImage(imageUrl);
    const imagePath = path.join(tempDir, `original-${Date.now()}.png`);
    await fs.writeFile(imagePath, imageBuffer);
    
    // 构建 curl 命令 - 添加超时参数
    const curlCommand = `curl -s "${API_BASE_URL}/images/edits" `
      + `-H "Authorization: Bearer ${API_KEY}" `
      + `-F "image=@${imagePath}" `
      + `-F "prompt=${stylePrompt.replace(/"/g, '\\"')}" `
      + `-F "n=1" `
      + `-F "size=1024x1024" `
      + `--connect-timeout 30 `
      + `--max-time 180`;
      
    console.log(`执行命令: ${curlCommand.replace(API_KEY, 'API_KEY_HIDDEN')}`);
    
    // 执行 curl 命令
    const output = execSync(curlCommand, { 
      timeout: 180000,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10
    }).toString();
    
    console.log('API 响应:', output.substring(0, 200) + '...');
    
    // 解析 JSON 响应
    const response = JSON.parse(output);
    
    if (response.error) {
      throw new Error(`API 错误: ${response.error.message || JSON.stringify(response.error)}`);
    }

    let resultBuffer;
    
    // 检查返回格式
    if (response.data[0].url) {
      // URL 格式
      const resultUrl = response.data[0].url;
      console.log('✅ 风格迁移完成，临时URL:', resultUrl);
      resultBuffer = await downloadImage(resultUrl);
    } else if (response.data[0].b64_json) {
      // Base64 格式
      console.log('✅ API返回Base64格式，转换中...');
      const base64Data = response.data[0].b64_json;
      resultBuffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new Error('API 返回格式不正确，缺少 url 或 b64_json');
    }

    // 删除临时文件
    await fs.unlink(imagePath).catch(err => console.error('删除临时文件失败:', err));

    // 保存到永久存储
    const permanentUrl = await fileStorageService.uploadFile(
      resultBuffer, 
      `ai-generated/style-transfer/${Date.now()}.png`, 
      'image/png'
    );

    console.log('✅ 风格迁移结果已保存:', permanentUrl);
    return permanentUrl;
  } catch (error) {
    console.error('❌ 风格迁移失败:', error.message);
    throw new Error(`风格迁移失败: ${error.message}`);
  }
};

// 辅助函数：下载图像（增加重试机制和更好的错误处理）
const downloadImage = async (url) => {
  console.log(`📥 开始下载图像: ${url}`);
  
  let lastError;
  const maxRetries = 10;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📥 第 ${attempt}/${maxRetries} 次下载尝试...`);
      
      // 使用更完整的浏览器请求头
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'cross-site',
          'Connection': 'close' // 强制关闭连接，避免复用
        },
        // 移除 timeout 选项，只使用 signal
        signal: AbortSignal.timeout(60000), // 使用新的 timeout API
        // 添加其他选项
        redirect: 'follow',
        referrerPolicy: 'no-referrer-when-downgrade'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const buffer = await response.buffer();
      console.log(`✅ 图像下载成功，大小: ${buffer.length} bytes`);
      
      return buffer;
      
    } catch (error) {
      lastError = error;
      console.log(`❌ 第 ${attempt} 次下载失败:`, error.message);
      
      // 如果是连接重置错误，等待更长时间
      if (error.message.includes('ECONNRESET') || error.message.includes('network')) {
        const delay = attempt * 1500; // 15秒, 30秒, 45秒
        console.log(`⏳ 网络错误，等待 ${delay/1000} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (attempt < maxRetries) {
        const delay = attempt * 5000; // 其他错误等待较短时间
        console.log(`⏳ 等待 ${delay/1000} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`下载图像失败（已重试${maxRetries}次）: ${lastError.message}`);
};

// 背景模糊（使用图像编辑）- 修正错误
const backgroundBlur = async (imageUrl, blurLevel = 5) => {
  let tempFiles = []; // 跟踪所有临时文件
  
  try {
    console.log(`🚀 背景模糊: ImageURL=${imageUrl}, BlurLevel=${blurLevel}`);

    const blurPrompt = `Apply a ${blurLevel > 7 ? 'strong' : blurLevel > 4 ? 'medium' : 'subtle'} blur effect to the background while keeping the main subject in sharp focus`;

    // 创建临时目录
    const tempDir = path.join(os.tmpdir(), 'weframe-ai');
    await fs.mkdir(tempDir, { recursive: true });
    
    // 下载原始图像
    console.log('📥 正在下载原始图像...');
    const imageBuffer = await downloadImage(imageUrl);
    
    const imagePath = path.join(tempDir, `original-${Date.now()}.png`);
    tempFiles.push(imagePath);
    
    await fs.writeFile(imagePath, imageBuffer);
    console.log('💾 图像已保存到临时文件:', imagePath);
    
    // 构建 curl 命令 - 修正参数
    const curlCommand = `curl -s "${API_BASE_URL}/images/edits" `
      + `-H "Authorization: Bearer ${API_KEY}" `
      + `-F "image=@${imagePath}" `
      + `-F "prompt=${blurPrompt.replace(/"/g, '\\"')}" `
      + `-F "n=1" `
      + `-F "size=1024x1024" `
      + `--connect-timeout 30 `
      + `--max-time 180`;
      
    console.log(`🚀 执行 AI 处理命令: ${curlCommand.replace(API_KEY, 'API_KEY_HIDDEN')}`);
    
    // 执行 curl 命令
    const output = execSync(curlCommand, { 
      timeout: 180000, // 180秒超时
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    }).toString();
    
    console.log('📨 API 响应:', output.substring(0, 200) + '...');
    
    // 解析 JSON 响应
    let response;
    try {
      response = JSON.parse(output);
    } catch (parseError) {
      throw new Error(`API响应解析失败: ${parseError.message}\n原始响应: ${output.substring(0, 500)}`);
    }
    
    if (response.error) {
      throw new Error(`API 错误: ${response.error.message || JSON.stringify(response.error)}`);
    }

    if (!response.data || !response.data[0]) {
      throw new Error(`API 返回数据格式不正确: ${JSON.stringify(response)}`);
    }

    let resultBuffer;
    
    // 检查返回格式
    if (response.data[0].url) {
      // URL 格式
      const resultUrl = response.data[0].url;
      console.log('✅ 背景模糊完成，正在下载结果图像:', resultUrl);
      resultBuffer = await downloadImage(resultUrl);
    } else if (response.data[0].b64_json) {
      // Base64 格式
      console.log('✅ API返回Base64格式，正在转换...');
      const base64Data = response.data[0].b64_json;
      resultBuffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new Error('API 返回格式不正确，缺少 url 或 b64_json');
    }

    // 保存到永久存储
    console.log('💾 正在保存到永久存储...');
    const permanentUrl = await fileStorageService.uploadFile(
      resultBuffer, 
      `ai-generated/background-blur/${Date.now()}.png`, 
      'image/png'
    );

    console.log('✅ 背景模糊结果已保存:', permanentUrl);
    return permanentUrl;
    
  } catch (error) {
    console.error('❌ 背景模糊失败:', error.message);
    throw new Error(`背景模糊失败: ${error.message}`);
  } finally {
    // 清理所有临时文件
    for (const tempFile of tempFiles) {
      try {
        await fs.unlink(tempFile);
        console.log('🗑️ 已删除临时文件:', tempFile);
      } catch (cleanupError) {
        console.error('⚠️ 删除临时文件失败:', cleanupError.message);
      }
    }
  }
};

// 背景替换（使用图像编辑）
const backgroundReplace = async (imageUrl, backgroundDescription) => {
  try {
    console.log(`🚀 背景替换: ImageURL=${imageUrl}, Background=${backgroundDescription}`);

    const replacePrompt = `Replace the background with ${backgroundDescription} while keeping the main subject unchanged`;

    // 创建临时目录
    const tempDir = path.join(os.tmpdir(), 'weframe-ai');
    await fs.mkdir(tempDir, { recursive: true });
    
    // 下载原始图像
    const imageBuffer = await downloadImage(imageUrl);
    const imagePath = path.join(tempDir, `original-${Date.now()}.png`);
    await fs.writeFile(imagePath, imageBuffer);
    
    // 构建 curl 命令
    const curlCommand = `curl -s "${API_BASE_URL}/images/edits" `
      + `-H "Authorization: Bearer ${API_KEY}" `
      + `-F "model=gpt-image-1" `
      + `-F "image=@${imagePath}" `
      + `-F "prompt=${replacePrompt.replace(/"/g, '\\"')}"`;
      
    console.log(`执行命令: ${curlCommand.replace(API_KEY, 'API_KEY_HIDDEN')}`);
    
    // 执行 curl 命令
    const output = execSync(curlCommand).toString();
    console.log('API 响应:', output.substring(0, 200) + '...');
    
    // 解析 JSON 响应
    const response = JSON.parse(output);
    
    if (response.error) {
      throw new Error(`API 错误: ${response.error.message || JSON.stringify(response.error)}`);
    }

    let resultBuffer;
    
    // 检查返回格式
    if (response.data[0].url) {
      // URL 格式
      const resultUrl = response.data[0].url;
      console.log('✅ 背景替换完成，临时URL:', resultUrl);
      resultBuffer = await downloadImage(resultUrl);
    } else if (response.data[0].b64_json) {
      // Base64 格式
      console.log('✅ API返回Base64格式，转换中...');
      const base64Data = response.data[0].b64_json;
      resultBuffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new Error('API 返回格式不正确，缺少 url 或 b64_json');
    }

    // 删除临时文件
    await fs.unlink(imagePath).catch(err => console.error('删除临时文件失败:', err));

    // 保存到永久存储
    const permanentUrl = await fileStorageService.uploadFile(
      resultBuffer, 
      `ai-generated/background-replace/${Date.now()}.png`, 
      'image/png'
    );

    console.log('✅ 背景替换结果已保存:', permanentUrl);
    return permanentUrl;
  } catch (error) {
    console.error('❌ 背景替换失败:', error.message);
    throw new Error(`背景替换失败: ${error.message}`);
  }
};

// 超分辨率处理（使用图像编辑）
const superResolution = async (imageUrl, scaleFactor = 2, quality = 'high') => {
  let tempFiles = []; // 跟踪所有临时文件
  
  try {
    console.log(`🚀 超分辨处理: ImageURL=${imageUrl}, ScaleFactor=${scaleFactor}, Quality=${quality}`);

    // 根据质量和放大倍数构建提示词
    let enhancePrompt;
    if (quality === 'high' && scaleFactor >= 4) {
      enhancePrompt = 'Enhance this image to ultra-high resolution with crystal clear details, sharp edges, refined textures, and professional photo quality. Remove any blur or pixelation while preserving natural colors and lighting.';
    } else if (quality === 'high') {
      enhancePrompt = 'Enhance this image to high resolution with improved clarity, sharpened details, and enhanced textures while maintaining natural appearance.';
    } else if (scaleFactor >= 4) {
      enhancePrompt = 'Upscale this image to higher resolution with clearer details and improved sharpness.';
    } else {
      enhancePrompt = 'Improve image quality with enhanced clarity and detail enhancement.';
    }

    // 创建临时目录
    const tempDir = path.join(os.tmpdir(), 'weframe-ai');
    await fs.mkdir(tempDir, { recursive: true });
    
    // 下载原始图像
    console.log('📥 正在下载原始图像...');
    const imageBuffer = await downloadImage(imageUrl);
    
    const imagePath = path.join(tempDir, `original-${Date.now()}.png`);
    tempFiles.push(imagePath);
    
    await fs.writeFile(imagePath, imageBuffer);
    console.log('💾 图像已保存到临时文件:', imagePath);
    
    // 构建 curl 命令
    const curlCommand = `curl -s "${API_BASE_URL}/images/edits" `
      + `-H "Authorization: Bearer ${API_KEY}" `
      + `-F "image=@${imagePath}" `
      + `-F "prompt=${enhancePrompt.replace(/"/g, '\\"')}" `
      + `-F "n=1" `
      + `-F "size=1024x1024" `
      + `--connect-timeout 30 `
      + `--max-time 180`;
      
    console.log(`🚀 执行 AI 处理命令: ${curlCommand.replace(API_KEY, 'API_KEY_HIDDEN')}`);
    
    // 执行 curl 命令
    const output = execSync(curlCommand, { 
      timeout: 180000, // 120秒超时
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    }).toString();
    
    console.log('📨 API 响应:', output.substring(0, 200) + '...');
    
    // 解析 JSON 响应
    let response;
    try {
      response = JSON.parse(output);
    } catch (parseError) {
      throw new Error(`API响应解析失败: ${parseError.message}\n原始响应: ${output.substring(0, 500)}`);
    }
    
    if (response.error) {
      throw new Error(`API 错误: ${response.error.message || JSON.stringify(response.error)}`);
    }

    if (!response.data || !response.data[0]) {
      throw new Error(`API 返回数据格式不正确: ${JSON.stringify(response)}`);
    }

    let resultBuffer;
    
    // 检查返回格式
    if (response.data[0].url) {
      // URL 格式
      const resultUrl = response.data[0].url;
      console.log('✅ 超分辨处理完成，正在下载结果图像:', resultUrl);
      resultBuffer = await downloadImage(resultUrl);
    } else if (response.data[0].b64_json) {
      // Base64 格式
      console.log('✅ API返回Base64格式，正在转换...');
      const base64Data = response.data[0].b64_json;
      resultBuffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new Error('API 返回格式不正确，缺少 url 或 b64_json');
    }

    // 保存到永久存储
    console.log('💾 正在保存到永久存储...');
    const permanentUrl = await fileStorageService.uploadFile(
      resultBuffer, 
      `ai-generated/super-resolution/${Date.now()}.png`, 
      'image/png'
    );

    console.log('✅ 超分辨结果已保存:', permanentUrl);
    return permanentUrl;
    
  } catch (error) {
    console.error('❌ 超分辨处理失败:', error.message);
    throw new Error(`超分辨处理失败: ${error.message}`);
  } finally {
    // 清理所有临时文件
    for (const tempFile of tempFiles) {
      try {
        await fs.unlink(tempFile);
        console.log('🗑️ 已删除临时文件:', tempFile);
      } catch (cleanupError) {
        console.error('⚠️ 删除临时文件失败:', cleanupError.message);
      }
    }
  }
};

// 硬编码的风格模板
const STYLE_TEMPLATES = {
  'vangogh_starry': {
    id: 'vangogh_starry',
    name: '星空',
    artist: '梵高',
    description: '梵高经典作品《星空》风格',
    prompt: 'Transform this image into the style of Van Gogh\'s "Starry Night" with swirling brushstrokes, vibrant blues and yellows, and expressive post-impressionist technique'
  },
  'monet_water': {
    id: 'monet_water',
    name: '水莲',
    artist: '莫奈',
    description: '莫奈印象派水莲系列风格',
    prompt: 'Apply Monet\'s water lilies impressionist style with soft brushstrokes, pastel colors, and dreamy atmospheric effects'
  },
  'picasso_abstract': {
    id: 'picasso_abstract',
    name: '立体派',
    artist: '毕加索',
    description: '毕加索立体主义抽象风格',
    prompt: 'Transform into Picasso\'s cubist style with geometric shapes, fragmented forms, and abstract angular perspectives'
  },
  'chinese_ink': {
    id: 'chinese_ink',
    name: '水墨画',
    artist: '中式传统',
    description: '中国传统水墨画风格',
    prompt: 'Convert to traditional Chinese ink painting style with black ink washes, minimal colors, and flowing brushwork'
  },
  'oil_painting': {
    id: 'oil_painting',
    name: '古典油画',
    artist: '欧洲古典',
    description: '欧洲古典油画风格',
    prompt: 'Apply classical European oil painting style with rich colors, detailed brushwork, and Renaissance-inspired techniques'
  },
  'watercolor': {
    id: 'watercolor',
    name: '水彩画',
    artist: '现代水彩',
    description: '清新水彩画风格',
    prompt: 'Transform into watercolor painting style with soft translucent colors, flowing pigments, and paper texture effects'
  }
};

// 获取可用风格列表 - 改为返回硬编码数据
const getAvailableStyles = async () => {
  try {
    return Object.values(STYLE_TEMPLATES);
  } catch (error) {
    console.error('❌ 获取风格列表失败:', error.message);
    throw new Error(`获取风格列表失败: ${error.message}`);
  }
};

// 根据风格ID获取提示词模板 - 改为从硬编码数据获取
const getStylePrompt = async (styleId) => {
  try {
    const style = STYLE_TEMPLATES[styleId];
    if (!style) {
      throw new Error(`Style ${styleId} not found`);
    }
    return style.prompt;
  } catch (error) {
    console.error('❌ 获取风格提示词失败:', error.message);
    throw new Error(`获取风格提示词失败: ${error.message}`);
  }
};

// 保存AI生成记录到数据库 - 保持不变，因为这是数据库操作
const saveAIGeneratedRecord = async (userId, taskType, originalImageUrl, prompt, resultUrl, model, parameters) => {
  try {
    const result = await pool.query(
      `INSERT INTO ai_generated_images (user_id, task_type, original_image_url, prompt, result_url, openai_model, parameters)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [userId, taskType, originalImageUrl, prompt, resultUrl, model, JSON.stringify(parameters)]
    );
    return result.rows[0].id;
  } catch (error) {
    console.error('❌ 保存AI生成记录失败:', error.message);
    throw new Error(`保存AI生成记录失败: ${error.message}`);
  }
};

// 获取AI生成历史记录 - 保持不变，因为这是数据库操作
const getAIGeneratedHistory = async (userId, taskType = null, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    let query = `
      SELECT id, task_type, original_image_url, prompt, result_url, openai_model, parameters, created_at
      FROM ai_generated_images 
      WHERE user_id = $1
    `;
    const params = [userId];

    if (taskType) {
      query += ` AND task_type = $${params.length + 1}`;
      params.push(taskType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM ai_generated_images WHERE user_id = $1';
    const countParams = [userId];
    if (taskType) {
      countQuery += ' AND task_type = $2';
      countParams.push(taskType);
    }
    const countResult = await pool.query(countQuery, countParams);

    return {
      records: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    };
  } catch (error) {
    console.error('❌ 获取AI历史记录失败:', error.message);
    throw new Error(`获取AI历史记录失败: ${error.message}`);
  }
};

// 删除AI生成记录
const deleteAIGeneratedRecord = async (userId, recordId) => {
  try {
    console.log('🗑️ 删除AI记录:', { userId, recordId });
    
    // 首先查询记录，确保记录存在且属于该用户
    const checkQuery = `
      SELECT id, user_id, result_url, task_type 
      FROM ai_generated_images 
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [recordId, userId]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('记录不存在或无权限删除');
    }
    
    const record = checkResult.rows[0];
    console.log('📝 找到记录:', record);
    
    // 删除数据库记录
    const deleteQuery = `
      DELETE FROM ai_generated_images 
      WHERE id = $1 AND user_id = $2
    `;
    const deleteResult = await pool.query(deleteQuery, [recordId, userId]);
    
    if (deleteResult.rowCount === 0) {
      throw new Error('删除记录失败');
    }
    
    // 尝试删除关联的文件（可选，根据你的文件存储策略）
    try {
      if (record.result_url && fileStorageService.deleteFile) {
        await fileStorageService.deleteFile(record.result_url);
        console.log('🗑️ 已删除关联文件:', record.result_url);
      }
    } catch (fileError) {
      console.warn('⚠️ 删除关联文件失败，但记录已删除:', fileError.message);
      // 不抛出错误，因为数据库记录已经删除成功
    }
    
    console.log('✅ AI记录删除成功');
    return {
      success: true,
      deletedRecord: record
    };
    
  } catch (error) {
    console.error('❌ 删除AI记录失败:', error.message);
    throw new Error(`删除AI记录失败: ${error.message}`);
  }
};

// 批量删除AI生成记录
const deleteMultipleAIRecords = async (userId, recordIds) => {
  try {
    console.log('🗑️ 批量删除AI记录:', { userId, recordIds });
    
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      throw new Error('记录ID数组不能为空');
    }
    
    // 生成占位符
    const placeholders = recordIds.map((_, index) => `$${index + 2}`).join(',');
    
    // 首先查询要删除的记录
    const checkQuery = `
      SELECT id, user_id, result_url, task_type 
      FROM ai_generated_images 
      WHERE user_id = $1 AND id IN (${placeholders})
    `;
    const checkResult = await pool.query(checkQuery, [userId, ...recordIds]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('没有找到可删除的记录');
    }
    
    const recordsToDelete = checkResult.rows;
    console.log('📝 找到记录数量:', recordsToDelete.length);
    
    // 删除数据库记录
    const deleteQuery = `
      DELETE FROM ai_generated_images 
      WHERE user_id = $1 AND id IN (${placeholders})
    `;
    const deleteResult = await pool.query(deleteQuery, [userId, ...recordIds]);
    
    console.log('🗑️ 已删除记录数量:', deleteResult.rowCount);
    
    // 尝试删除关联的文件
    const fileDeleteResults = [];
    for (const record of recordsToDelete) {
      try {
        if (record.result_url && fileStorageService.deleteFile) {
          await fileStorageService.deleteFile(record.result_url);
          fileDeleteResults.push({ id: record.id, fileDeleted: true });
        } else {
          fileDeleteResults.push({ id: record.id, fileDeleted: false, reason: 'No file URL or delete function' });
        }
      } catch (fileError) {
        console.warn(`⚠️ 删除文件失败 (ID: ${record.id}):`, fileError.message);
        fileDeleteResults.push({ id: record.id, fileDeleted: false, reason: fileError.message });
      }
    }
    
    console.log('✅ 批量删除完成');
    return {
      success: true,
      deletedCount: deleteResult.rowCount,
      deletedRecords: recordsToDelete,
      fileDeleteResults: fileDeleteResults
    };
    
  } catch (error) {
    console.error('❌ 批量删除AI记录失败:', error.message);
    throw new Error(`批量删除AI记录失败: ${error.message}`);
  }
};

// 删除用户所有AI记录
const deleteAllAIRecordsByUser = async (userId, taskType = null) => {
  try {
    console.log('🗑️ 删除用户所有AI记录:', { userId, taskType });
    
    // 构建查询条件
    let checkQuery = `
      SELECT id, user_id, result_url, task_type 
      FROM ai_generated_images 
      WHERE user_id = $1
    `;
    let deleteQuery = `
      DELETE FROM ai_generated_images 
      WHERE user_id = $1
    `;
    
    const queryParams = [userId];
    
    if (taskType) {
      checkQuery += ` AND task_type = $2`;
      deleteQuery += ` AND task_type = $2`;
      queryParams.push(taskType);
    }
    
    // 首先查询要删除的记录
    const checkResult = await pool.query(checkQuery, queryParams);
    
    if (checkResult.rows.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        message: '没有找到需要删除的记录'
      };
    }
    
    const recordsToDelete = checkResult.rows;
    console.log('📝 找到记录数量:', recordsToDelete.length);
    
    // 删除数据库记录
    const deleteResult = await pool.query(deleteQuery, queryParams);
    
    console.log('🗑️ 已删除记录数量:', deleteResult.rowCount);
    
    // 尝试删除关联的文件
    const fileDeleteResults = [];
    for (const record of recordsToDelete) {
      try {
        if (record.result_url && fileStorageService.deleteFile) {
          await fileStorageService.deleteFile(record.result_url);
          fileDeleteResults.push({ id: record.id, fileDeleted: true });
        } else {
          fileDeleteResults.push({ id: record.id, fileDeleted: false, reason: 'No file URL or delete function' });
        }
      } catch (fileError) {
        console.warn(`⚠️ 删除文件失败 (ID: ${record.id}):`, fileError.message);
        fileDeleteResults.push({ id: record.id, fileDeleted: false, reason: fileError.message });
      }
    }
    
    console.log('✅ 删除所有记录完成');
    return {
      success: true,
      deletedCount: deleteResult.rowCount,
      deletedRecords: recordsToDelete,
      fileDeleteResults: fileDeleteResults
    };
    
  } catch (error) {
    console.error('❌ 删除所有AI记录失败:', error.message);
    throw new Error(`删除所有AI记录失败: ${error.message}`);
  }
};

// 添加水印
const addWatermark = async (imageUrl, content, watermarkType = 'text', options = {}) => {
  try {
    const {
      position = 'bottom-right',
      opacity = 0.8,
      fontSize = 16,
      color = '#ffffff'
    } = options;

    console.log(`🖌️ 开始添加水印: 图像=${imageUrl}, 内容=${content}, 类型=${watermarkType}`);
    console.log(`水印选项: 位置=${position}, 透明度=${opacity}, 字体大小=${fontSize}, 颜色=${color}`);

    // 1. 下载原始图像
    const imageBuffer = await downloadImage(imageUrl);
    if (!imageBuffer) {
      throw new Error('下载图像失败');
    }
    console.log(`✅ 图像下载成功，大小: ${imageBuffer.length} bytes`);

    // 2. 使用Sharp添加水印
    // 获取图像信息
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;
    console.log(`图像尺寸: ${width}x${height}`);

    // 创建SVG水印文字
    let svgText;
    
    if (position === 'tile') {
      // 平铺水印效果
      // 创建一个基本的SVG模板，包含水印文字
      let tileWidth = width / 3; // 平铺的宽度间隔
      let tileHeight = height / 3; // 平铺的高度间隔
      
      let svgContent = '';
      // 创建一个3x3的平铺网格
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const x = tileWidth * i + tileWidth / 2;
          const y = tileHeight * j + tileHeight / 2;
          svgContent += `<text x="${x}" y="${y}" 
                          font-family="Arial" 
                          font-size="${fontSize}" 
                          fill="${formatRGBA(color, opacity)}" 
                          text-anchor="middle" 
                          transform="rotate(-15, ${x}, ${y})">${content}</text>`;
        }
      }
      
      svgText = `<svg width="${width}" height="${height}">${svgContent}</svg>`;
      
    } else {
      // 单一水印位置计算
      let x, y, textAnchor, alignment;
      
      switch (position) {
        case 'top-left':
          x = 20;
          y = 20 + fontSize;
          textAnchor = 'start';
          alignment = 'start';
          break;
        case 'top-right':
          x = width - 20;
          y = 20 + fontSize;
          textAnchor = 'end';
          alignment = 'end';
          break;
        case 'bottom-left':
          x = 20;
          y = height - 20;
          textAnchor = 'start';
          alignment = 'start';
          break;
        case 'bottom-right':
          x = width - 20;
          y = height - 20;
          textAnchor = 'end';
          alignment = 'end';
          break;
        case 'center':
          x = width / 2;
          y = height / 2;
          textAnchor = 'middle';
          alignment = 'middle';
          break;
        default:
          // 默认右下角
          x = width - 20;
          y = height - 20;
          textAnchor = 'end';
          alignment = 'end';
      }
      
      svgText = `<svg width="${width}" height="${height}">
                <text x="${x}" y="${y}" 
                      font-family="Arial" 
                      font-size="${fontSize}" 
                      fill="${formatRGBA(color, opacity)}"
                      text-anchor="${textAnchor}">${content}</text>
                </svg>`;
    }
    
    // 将SVG转换为Buffer
    const svgBuffer = Buffer.from(svgText);
    console.log('✅ 已创建SVG水印');
    
    // 将水印叠加在原图上
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: svgBuffer,
          top: 0,
          left: 0,
        }
      ])
      .toFormat('png')
      .toBuffer();
    
    console.log(`✅ 已将水印添加到图片，处理后大小: ${watermarkedBuffer.length} bytes`);
    
    // 3. 生成文件名并保存
    const filename = path.basename(imageUrl);
    const uniqueFilename = `watermarked_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    console.log(`保存水印图像，文件名: ${uniqueFilename}`);
    
    // 使用uploadFile函数替代saveImage函数，因为问题出在这里
    const resultUrl = await fileStorageService.uploadFile(
      watermarkedBuffer,
      `watermarked/${uniqueFilename}`,
      'image/png'
    );
    
    console.log(`✅ 水印图像保存成功: ${resultUrl}`);
    return resultUrl;
  } catch (error) {
    console.error('添加水印失败:', error);
    throw new Error(`添加水印失败: ${error.message}`);
  }
};

// 将颜色转换为rgba格式，确保颜色足够深
function formatRGBA(color, opacity) {
  // 确保不透明度至少为0.7，使颜色更加明显
  const finalOpacity = Math.max(opacity, 0.7);
  
  // 如果传入的颜色是十六进制格式
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
  }
  
  // 如果传入的颜色已经是 rgb 或 rgba 格式
  if (color.startsWith('rgb')) {
    if (color.startsWith('rgba')) {
      // 替换原有的透明度值
      return color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/, `rgba($1, $2, $3, ${finalOpacity})`);
    } else {
      // 将 rgb 转换为 rgba
      return color.replace('rgb', 'rgba').replace(')', `, ${finalOpacity})`);
    }
  }
  
  // 默认返回带透明度的白色
  return `rgba(255, 255, 255, ${finalOpacity})`;
}

// 检测水印（简单实现，实际应该根据水印类型采用不同的检测方法）
const detectWatermark = async (imageUrl) => {
  try {
    // 在实际应用中，这里应该是一个复杂的水印检测算法
    // 当前简单实现，返回一个模拟结果
    return {
      hasWatermark: Math.random() > 0.5, // 随机返回是否有水印
      watermarkInfo: {
        content: "© WeFrame",
        confidence: 0.85 + Math.random() * 0.15, // 随机置信度
      }
    };
  } catch (error) {
    console.error('检测水印失败:', error);
    throw new Error(`检测水印失败: ${error.message}`);
  }
};

// 导出函数
module.exports = {
  textToImage,
  styleTransfer,
  getAvailableStyles,
  getStylePrompt,
  backgroundBlur,
  backgroundReplace,
  superResolution,
  saveAIGeneratedRecord,
  getAIGeneratedHistory,
  deleteAIGeneratedRecord,
  deleteMultipleAIRecords,
  deleteAllAIRecordsByUser,
  addWatermark,
  detectWatermark
};
