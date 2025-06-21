const { Pool } = require('pg');
const path = require('path');

// 确保加载正确的 .env 文件
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 调试环境变量加载
console.log('🔧 环境变量检查:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置' : '未设置');
console.log('DB_PORT:', process.env.DB_PORT);

// 数据库配置 - 使用你的配置，添加默认值
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'weframe',
  password: String(process.env.DB_PASSWORD || '1'), // 确保密码是字符串
  port: parseInt(process.env.DB_PORT) || 5432,
  
  // 连接池配置
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
};

console.log('📊 PostgreSQL database config:', {
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  port: dbConfig.port,
  passwordSet: !!dbConfig.password
});

const pool = new Pool(dbConfig);

// 测试数据库连接
pool.on('connect', (client) => {
  console.log('✅ 数据库连接成功 - weframe');
});

pool.on('error', (err, client) => {
  console.error('❌ 数据库连接错误:', err);
  process.exit(-1);
});

// 导出连接池
module.exports = pool;