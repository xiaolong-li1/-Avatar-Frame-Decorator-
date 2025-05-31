const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const DEEPAI_API_KEY = process.env.DEEPAI_API_KEY;

// 假设这个函数可以从文件ID获取URL（你需自己实现）
async function getAvatarUrlFromFileId(fileId) {
  // TODO: 这里写你自己逻辑，比如从数据库或对象存储获取URL
  // 示例：
  return `https://your-object-storage.com/avatars/${fileId}.png`;
}

// 调用DeepAI超分接口
async function superResolution(imageUrl) {
  const response = await axios.post(
    'https://api.deepai.org/api/torch-srgan',
    { image: imageUrl },
    { headers: { 'Api-Key': DEEPAI_API_KEY } }
  );
  return response.data.output_url;
}

// 超分接口路由
router.post('/', async (req, res) => {
  const { avatarFileId, scaleFactor, quality } = req.body;

  if (!avatarFileId) {
    return res.status(400).json({ error: 'avatarFileId 是必填参数' });
  }

  try {
    // 1. 获取图片URL
    const imageUrl = await getAvatarUrlFromFileId(avatarFileId);

    // 2. 调用超分辨服务（目前scaleFactor, quality未用）
    const resultUrl = await superResolution(imageUrl);

    // 3. 返回结果
    res.json({
      status: 'completed',
      resultUrl,
    });
  } catch (error) {
    console.error('超分错误:', error.message);
    res.status(500).json({ error: '超分服务失败' });
  }
});

module.exports = router;
