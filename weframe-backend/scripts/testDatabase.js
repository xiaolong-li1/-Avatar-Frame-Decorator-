const path = require('path');

// 确保先加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = require('../config/database');

async function testDatabase() {
  try {
    console.log('🧪 测试数据库连接和表结构 (weframe)...');
    
    // 测试连接
    const connectionTest = await pool.query('SELECT NOW(), current_database()');
    console.log('✅ 数据库连接正常:', {
      time: connectionTest.rows[0].now,
      database: connectionTest.rows[0].current_database
    });
    
    // 测试各个表
    const tables = ['users', 'avatars', 'frames', 'text_to_image_history', 'ai_generated_images', 'ai_styles', 'task_status', 'shares'];
    
    console.log('📊 表结构检查:');
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  ✅ 表 ${table}: ${result.rows[0].count} 条记录`);
      } catch (error) {
        console.error(`  ❌ 表 ${table} 测试失败:`, error.message);
      }
    }
    
    // 测试预设数据
    console.log('📦 预设数据检查:');
    try {
      const framesResult = await pool.query('SELECT COUNT(*) FROM frames WHERE is_preset = true');
      console.log(`  🖼️ 预设头像框数量: ${framesResult.rows[0].count}`);
      
      const stylesResult = await pool.query('SELECT COUNT(*) FROM ai_styles WHERE is_active = true');
      console.log(`  🎨 可用AI风格数量: ${stylesResult.rows[0].count}`);
      
      // 显示具体的预设头像框
      const frameDetails = await pool.query(`
        SELECT category, COUNT(*) as count 
        FROM frames 
        WHERE is_preset = true 
        GROUP BY category 
        ORDER BY category
      `);
      
      if (frameDetails.rows.length > 0) {
        console.log('  📂 头像框分类:');
        frameDetails.rows.forEach(row => {
          console.log(`    - ${row.category}: ${row.count} 个`);
        });
      }
      
      // 显示具体的预设头像框列表
      const frameList = await pool.query(`
        SELECT name, category, 
               CASE 
                 WHEN frame_url LIKE 'https://res.cloudinary.com%' THEN '✅ 真实URL'
                 ELSE '❌ 占位符URL'
               END as url_status
        FROM frames 
        WHERE is_preset = true 
        ORDER BY category, name
        LIMIT 10
      `);
      
      if (frameList.rows.length > 0) {
        console.log('  📋 预设头像框详情 (前10个):');
        frameList.rows.forEach(row => {
          console.log(`    ${row.url_status} ${row.category} - ${row.name}`);
        });
      }
      
    } catch (error) {
      console.error('  ❌ 预设数据检查失败:', error.message);
    }
    
    // 测试AI风格数据
    console.log('🎨 AI风格数据检查:');
    try {
      const styleCategories = await pool.query(`
        SELECT category, COUNT(*) as count 
        FROM ai_styles 
        WHERE is_active = true 
        GROUP BY category 
        ORDER BY category
      `);
      
      if (styleCategories.rows.length > 0) {
        console.log('  📂 AI风格分类:');
        styleCategories.rows.forEach(row => {
          console.log(`    - ${row.category}: ${row.count} 个`);
        });
      }
      
      const styleList = await pool.query(`
        SELECT name, category 
        FROM ai_styles 
        WHERE is_active = true 
        ORDER BY category, name 
        LIMIT 8
      `);
      
      if (styleList.rows.length > 0) {
        console.log('  🎨 AI风格列表 (前8个):');
        styleList.rows.forEach(row => {
          console.log(`    - ${row.category}: ${row.name}`);
        });
      }
      
    } catch (error) {
      console.error('  ❌ AI风格数据检查失败:', error.message);
    }
    
    // 测试用户表
    console.log('👤 用户数据检查:');
    try {
      const userResult = await pool.query('SELECT COUNT(*) FROM users');
      console.log(`  用户总数: ${userResult.rows[0].count}`);
      
      if (parseInt(userResult.rows[0].count) > 0) {
        const userDetails = await pool.query('SELECT username, created_at FROM users ORDER BY created_at DESC LIMIT 5');
        console.log('  最近用户:');
        userDetails.rows.forEach(user => {
          const date = new Date(user.created_at);
          console.log(`    - ${user.username} (${date.toLocaleDateString()})`);
        });
      }
    } catch (error) {
      console.error('  ❌ 用户数据检查失败:', error.message);
    }
    
    // 测试索引
    console.log('🔍 索引检查:');
    try {
      const indexResult = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname
      `);
      
      if (indexResult.rows.length > 0) {
        console.log(`  📊 自定义索引数量: ${indexResult.rows.length}`);
        const indexByTable = {};
        indexResult.rows.forEach(row => {
          if (!indexByTable[row.tablename]) {
            indexByTable[row.tablename] = [];
          }
          indexByTable[row.tablename].push(row.indexname);
        });
        
        Object.entries(indexByTable).forEach(([table, indexes]) => {
          console.log(`    ${table}: ${indexes.join(', ')}`);
        });
      } else {
        console.log('  ⚠️ 没有找到自定义索引');
      }
    } catch (error) {
      console.error('  ❌ 索引检查失败:', error.message);
    }
    
    // 数据库统计摘要
    console.log('📈 数据库统计摘要:');
    try {
      const stats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM frames) as total_frames,
          (SELECT COUNT(*) FROM frames WHERE is_preset = true) as preset_frames,
          (SELECT COUNT(*) FROM frames WHERE is_preset = false) as custom_frames,
          (SELECT COUNT(*) FROM ai_styles WHERE is_active = true) as active_styles,
          (SELECT COUNT(*) FROM avatars) as avatars,
          (SELECT COUNT(*) FROM text_to_image_history) as text_to_image_records,
          (SELECT COUNT(*) FROM ai_generated_images) as ai_image_records
      `);
      
      const s = stats.rows[0];
      console.log(`  👥 用户: ${s.users}`);
      console.log(`  🖼️ 头像框总数: ${s.total_frames} (预设: ${s.preset_frames}, 自定义: ${s.custom_frames})`);
      console.log(`  🎨 AI风格: ${s.active_styles}`);
      console.log(`  📸 头像: ${s.avatars}`);
      console.log(`  🤖 AI记录: 文本转图像 ${s.text_to_image_records}, 其他AI ${s.ai_image_records}`);
      
    } catch (error) {
      console.error('  ❌ 统计摘要获取失败:', error.message);
    }
    
    console.log('✅ 数据库 weframe 测试完成！');
    
    // 给出后续建议
    console.log('\n💡 后续步骤建议:');
    console.log('1. 如果预设头像框显示占位符URL，运行: npm run update-frames');
    console.log('2. 启动开发服务器: npm run dev');
    console.log('3. 访问前端应用进行测试');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
    console.error('详细错误信息:', error.stack);
    
    console.log('\n🔍 调试建议:');
    console.log('1. 检查数据库是否已正确初始化: npm run init-db');
    console.log('2. 检查数据库连接: npm run test-connection');
    console.log('3. 检查PostgreSQL服务状态');
    
    process.exit(1);
  } finally {
    // 确保连接关闭
    if (pool) {
      await pool.end();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testDatabase();
}

module.exports = { testDatabase };