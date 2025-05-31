const axios = require('axios');
require('dotenv').config();

const DEEPAI_API_KEY = process.env.DEEPAI_API_KEY;

/**
 * @param {string} imageUrl - 原始图像 URL
 * @returns {string} 超分后图像的 URL
 */
const superResolution = async (imageUrl) => {
  try {
    const response = await axios.post(
      'https://api.deepai.org/api/torch-srgan',
      {
        image: imageUrl,
      },
      {
        headers: {
          'Api-Key': DEEPAI_API_KEY,
        },
      }
    );

    console.log('✅ 超分完成，图片地址:', response.data.output_url);
    return response.data.output_url;
  } catch (error) {
    console.error('❌ 超分失败:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = { superResolution };
