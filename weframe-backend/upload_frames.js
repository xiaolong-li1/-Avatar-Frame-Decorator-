require('dotenv').config(); // 加载环境变量
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const fileStorageService  = require('./services/fileStorageService'); // 改成你本地的实际路径

// PostgreSQL 数据库配置
const pool = require('./config/database'); // 改成你本地的实际路径

const categories = ['节日', '经典', '时尚', '复古'];
const imageFiles = ['01.png', '02.png', '03.png', '04.png']; // 放在 assets 文件夹里

const uploadAndInsert = async (localFilePath, name, category) => {
  const buffer = fs.readFileSync(localFilePath);
  const contentType = mime.lookup(localFilePath) || 'image/png';
  const id = uuidv4();
  const fileName = `frames/${id}`;

  const cloudinaryUrl = await fileStorageService.uploadFile(buffer, fileName, contentType);

  await pool.query(`
    INSERT INTO frames (id, name, category, thumbnail_url, frame_url, is_preset, is_animated, tags)
    VALUES ($1, $2, $3, $4, $5, true, false, $6)
  `, [id, name, category, cloudinaryUrl, cloudinaryUrl, [`预设`, category]]);

  console.log(`✅ 上传并插入成功: ${name}`);
};

(async () => {
  try {
    // 清空旧数据
    await pool.query(`DELETE FROM frames WHERE category = ANY($1)`, [categories]);
    console.log(`🗑 已清空 ${categories.join(', ')} 分类的旧数据`);

    for (let i = 0; i < categories.length; i++) {
      const fileName = imageFiles[i];
      const category = categories[i];
      const localPath = path.join(__dirname, 'assets', fileName);
      await uploadAndInsert(localPath, `${category}头像框`, category);
    }
  } catch (err) {
    console.error('❌ 出错了:', err);
  } finally {
    await pool.end();
  }
})();
