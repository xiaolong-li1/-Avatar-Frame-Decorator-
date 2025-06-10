const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Pool } = require('pg');

async function createDatabase() {
  console.log('🏗️ 创建数据库 weframe...');
  
  // 连接到默认的postgres数据库来创建新数据库
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres', // 连接到默认数据库
    password: String(process.env.DB_PASSWORD),
    port: parseInt(process.env.DB_PORT),
  });
  
  try {
    // 检查数据库是否已存在
    const checkResult = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`✅ 数据库 ${process.env.DB_NAME} 已存在`);
    } else {
      // 创建数据库
      await pool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`✅ 数据库 ${process.env.DB_NAME} 创建成功！`);
    }
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`✅ 数据库 ${process.env.DB_NAME} 已存在`);
    } else {
      console.error('❌ 创建数据库失败:', error.message);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createDatabase();
}

module.exports = { createDatabase };