const path = require('path');
const fs = require('fs');

// 确保先加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = require('../config/database');

async function initDatabase() {
  try {
    console.log('🚀 开始初始化数据库 weframe...');
    
    // 检查 .env 文件是否存在
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
      console.error('❌ .env 文件不存在:', envPath);
      console.log('请确保 .env 文件存在并包含数据库配置信息');
      process.exit(1);
    }
    
    // 读取SQL文件
    const schemaPath = path.join(__dirname, '../schema-fixed.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ schema-fixed.sql 文件不存在:', schemaPath);
      console.log('请确保 schema-fixed.sql 文件存在');
      process.exit(1);
    }
    
    console.log('📄 读取SQL文件:', schemaPath);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // 测试数据库连接
    console.log('🔗 测试数据库连接...');
    const testResult = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log('✅ 连接成功:', {
      time: testResult.rows[0].current_time,
      database: testResult.rows[0].db_name
    });
    
    // 执行SQL
    console.log('📊 执行数据库初始化脚本...');
    await pool.query(schemaSql);
    
    console.log('✅ 数据库 weframe 初始化完成！');
    console.log('📋 创建的表:');
    console.log('  - users (用户表)');
    console.log('  - avatars (头像表)');
    console.log('  - frames (头像框表)');
    console.log('  - text_to_image_history (文本转图像历史)');
    console.log('  - ai_generated_images (AI生成图像记录)');
    console.log('  - ai_styles (AI风格库)');
    console.log('  - task_status (任务状态表)');
    console.log('  - shares (分享记录表)');
    
    // 验证表创建
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 数据库 weframe 中的表:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // 显示预设数据统计
    try {
      const frameCount = await pool.query('SELECT COUNT(*) FROM frames WHERE is_preset = true');
      const styleCount = await pool.query('SELECT COUNT(*) FROM ai_styles WHERE is_active = true');
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      
      console.log('📈 预设数据统计:');
      console.log(`  🖼️ 预设头像框: ${frameCount.rows[0].count} 个`);
      console.log(`  🎨 AI风格: ${styleCount.rows[0].count} 个`);
      console.log(`  👤 测试用户: ${userCount.rows[0].count} 个`);
    } catch (statsError) {
      console.warn('⚠️ 统计信息获取失败:', statsError.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库 weframe 初始化失败:', error);
    console.error('详细错误信息:', error.stack);
    
    // 提供一些调试建议
    console.log('\n🔍 调试建议:');
    console.log('1. 检查PostgreSQL服务是否运行');
    console.log('2. 检查数据库连接信息是否正确');
    console.log('3. 检查用户权限是否足够');
    console.log('4. 尝试手动连接数据库: psql -h localhost -U postgres -d weframe');
    
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };