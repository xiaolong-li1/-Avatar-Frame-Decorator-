const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Pool } = require('pg');

async function testConnection() {
  console.log('🔧 测试数据库连接...');
  
  // 显示配置信息
  console.log('📊 连接配置:');
  console.log('  用户:', process.env.DB_USER);
  console.log('  主机:', process.env.DB_HOST);
  console.log('  数据库:', process.env.DB_NAME);
  console.log('  端口:', process.env.DB_PORT);
  console.log('  密码:', process.env.DB_PASSWORD ? '已设置' : '未设置');
  
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD),
    port: parseInt(process.env.DB_PORT),
  });
  
  try {
    // 测试连接
    const client = await pool.connect();
    console.log('✅ 数据库连接成功！');
    
    // 执行测试查询
    const result = await client.query('SELECT NOW() as current_time, current_database() as db_name, version() as version');
    console.log('📊 数据库信息:');
    console.log('  当前时间:', result.rows[0].current_time);
    console.log('  数据库名:', result.rows[0].db_name);
    console.log('  版本:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // 检查现有表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 现有表:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('📋 数据库为空，没有找到表');
    }
    
    client.release();
    console.log('✅ 连接测试完成！');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 建议:');
      console.log('  1. 检查PostgreSQL服务是否运行');
      console.log('  2. 检查端口5432是否正确');
    } else if (error.code === '28P01') {
      console.log('💡 建议:');
      console.log('  1. 检查用户名和密码是否正确');
      console.log('  2. 检查用户是否有访问权限');
    } else if (error.code === '3D000') {
      console.log('💡 建议:');
      console.log('  1. 数据库不存在，需要先创建');
      console.log('  2. 运行: createdb -U postgres weframe');
    }
  } finally {
    await pool.end();
  }
}

testConnection();