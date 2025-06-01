const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');
const fileStorageService = require('./fileStorageService');
const os = require('os');
const fetch = require('node-fetch');
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
    
    // 构建 curl 命令（风格迁移/背景模糊/背景替换）
    const curlCommand = `curl -s "${API_BASE_URL}/images/edits" `
      + `-H "Authorization: Bearer ${API_KEY}" `
      + `-F "model=gpt-image-1" `
      + `-F "image=@${imagePath}" `
      + `-F "prompt=${stylePrompt.replace(/"/g, '\\"')}"`;
      
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

// 背景模糊（使用图像编辑）
const backgroundBlur = async (imageUrl, blurLevel = 5) => {
  try {
    console.log(`🚀 背景模糊: ImageURL=${imageUrl}, BlurLevel=${blurLevel}`);

    const blurPrompt = `Apply a ${blurLevel > 7 ? 'strong' : blurLevel > 4 ? 'medium' : 'subtle'} blur effect to the background while keeping the main subject in sharp focus`;

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
      + `-F "prompt=${blurPrompt.replace(/"/g, '\\"')}"`;
      
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
      console.log('✅ 背景模糊完成，临时URL:', resultUrl);
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
      `ai-generated/background-blur/${Date.now()}.png`, 
      'image/png'
    );

    console.log('✅ 背景模糊结果已保存:', permanentUrl);
    return permanentUrl;
  } catch (error) {
    console.error('❌ 背景模糊失败:', error.message);
    throw new Error(`背景模糊失败: ${error.message}`);
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

// 获取可用风格列表 - 保持不变，因为这是数据库操作
const getAvailableStyles = async () => {
  try {
    const result = await pool.query(
      'SELECT id, name, category, preview_url FROM ai_styles WHERE is_active = true ORDER BY category, name'
    );
    return result.rows;
  } catch (error) {
    console.error('❌ 获取风格列表失败:', error.message);
    throw new Error(`获取风格列表失败: ${error.message}`);
  }
};

// 根据风格ID获取提示词模板 - 保持不变，因为这是数据库操作
const getStylePrompt = async (styleId) => {
  try {
    const result = await pool.query(
      'SELECT prompt_template FROM ai_styles WHERE id = $1 AND is_active = true',
      [styleId]
    );
    if (result.rows.length === 0) {
      throw new Error(`Style ${styleId} not found`);
    }
    return result.rows[0].prompt_template;
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

// 辅助函数：下载图像（增加超时时间）
const downloadImage = async (url) => {
  // 创建超时控制器
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒下载超时
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      timeout: 60000
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    return await response.buffer();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

module.exports = {
  textToImage,
  styleTransfer,
  backgroundBlur,
  backgroundReplace,
  getAvailableStyles,
  getStylePrompt,
  saveAIGeneratedRecord,
  getAIGeneratedHistory
};
