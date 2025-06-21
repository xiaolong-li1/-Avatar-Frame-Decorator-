const path = require('path');

// 确保先加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const fs = require('fs');
const mime = require('mime-types');
const pool = require('../config/database');
const fileStorageService = require('../services/fileStorageService');

// 扩展到12个文件，对应12个预设头像框
const frameFiles = [
  { file: '01.png', name: '节日头像框', category: '节日' },
  { file: '09.png', name: '经典头像框', category: '经典' },
  { file: '03.png', name: '时尚头像框', category: '时尚' },
  { file: '04.png', name: '复古头像框', category: '复古' },
  { file: '05.png', name: '圆形经典', category: '经典' },
  { file: '06.png', name: '方形简约', category: '经典' },
  { file: '07.png', name: '春节特别版', category: '节日' },
  { file: '08.png', name: '圣诞特别版', category: '节日' },
  { file: '02.png', name: '霓虹时尚', category: '时尚' },
  { file: '10.png', name: '几何时尚', category: '时尚' },
  { file: '11.png', name: '70年代复古', category: '复古' },
  { file: '12.png', name: '胶片复古', category: '复古' }
];

async function updatePresetFrameUrls() {
  try {
    console.log('🚀 开始更新数据库 weframe 中预设头像框的真实URL...');
    console.log('📋 按照定义顺序更新12个头像框');
    
    // 检查环境变量
    console.log('🔧 环境变量检查:');
    console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || '未设置');
    console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '已设置' : '未设置');
    console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '已设置' : '未设置');
    
    // 验证Cloudinary配置
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary配置不完整！');
      console.log('请确保在.env文件中设置了以下变量:');
      console.log('- CLOUDINARY_CLOUD_NAME');
      console.log('- CLOUDINARY_API_KEY');
      console.log('- CLOUDINARY_API_SECRET');
      return;
    }
    
    console.log('✅ Cloudinary配置检查通过');
    
    // 检查assets目录
    const assetsDir = path.join(__dirname, '../assets');
    if (!fs.existsSync(assetsDir)) {
      console.error('❌ assets目录不存在:', assetsDir);
      console.log('请创建assets目录并放入头像框文件');
      return;
    }
    
    console.log('📁 assets目录:', assetsDir);
    
    // 显示计划的更新对应关系
    console.log('\n📋 计划更新对应关系:');
    frameFiles.forEach((frameData, index) => {
      console.log(`   ${index + 1}. ${frameData.file} → ${frameData.category} - ${frameData.name}`);
    });
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < frameFiles.length; i++) {
      const frameData = frameFiles[i];
      const localPath = path.join(assetsDir, frameData.file);
      
      console.log(`\n📤 [${i + 1}/${frameFiles.length}] 处理: ${frameData.file} → ${frameData.category} - ${frameData.name}`);
      
      if (!fs.existsSync(localPath)) {
        console.warn(`   ⚠️ 文件不存在，跳过: ${frameData.file}`);
        console.warn(`   完整路径: ${localPath}`);
        skipCount++;
        continue;
      }
      
      const fileSize = (fs.statSync(localPath).size / 1024).toFixed(2);
      console.log(`   📄 文件大小: ${fileSize} KB`);
      
      try {
        // 读取文件
        const buffer = fs.readFileSync(localPath);
        const contentType = mime.lookup(localPath) || 'image/png';
        const fileName = `frames/preset/${frameData.file}`;
        
        // 上传到Cloudinary
        console.log(`   ☁️ 上传到Cloudinary...`);
        const cloudinaryUrl = await fileStorageService.uploadFile(buffer, fileName, contentType);
        console.log(`   ✅ 上传成功: ${cloudinaryUrl.substring(0, 60)}...`);
        
        // 更新数据库中对应的记录
        const updateResult = await pool.query(`
          UPDATE frames 
          SET frame_url = $1, thumbnail_url = $1, updated_at = CURRENT_TIMESTAMP
          WHERE name = $2 AND category = $3 AND is_preset = true
        `, [cloudinaryUrl, frameData.name, frameData.category]);
        
        if (updateResult.rowCount > 0) {
          console.log(`   🔄 数据库更新成功: ${frameData.name} (${frameData.category})`);
          successCount++;
        } else {
          console.warn(`   ⚠️ 未找到对应的数据库记录: ${frameData.name} (${frameData.category})`);
          
          // 尝试查找类似的记录
          const similarResult = await pool.query(`
            SELECT name, category 
            FROM frames 
            WHERE is_preset = true 
            AND (name ILIKE $1 OR category = $2)
            ORDER BY name
          `, [`%${frameData.name.substring(0, 2)}%`, frameData.category]);
          
          if (similarResult.rows.length > 0) {
            console.log(`   💡 找到类似的记录:`);
            similarResult.rows.forEach(row => {
              console.log(`      - ${row.category}: ${row.name}`);
            });
          }
          errorCount++;
        }
        
      } catch (uploadError) {
        console.error(`   ❌ 处理文件 ${frameData.file} 失败:`, uploadError.message);
        errorCount++;
      }
    }
    
    console.log('\n✅ 预设头像框URL更新流程完成！');
    console.log(`📊 处理结果: 成功 ${successCount} 个，跳过 ${skipCount} 个，失败 ${errorCount} 个`);
    
    // 显示更新结果
    const result = await pool.query(`
      SELECT name, category, 
             CASE 
               WHEN frame_url LIKE 'https://res.cloudinary.com%' THEN '✅ 已更新'
               ELSE '❌ 未更新'
             END as status,
             frame_url,
             updated_at
      FROM frames 
      WHERE is_preset = true 
      ORDER BY 
        CASE category
          WHEN '节日' THEN 1
          WHEN '经典' THEN 2
          WHEN '时尚' THEN 3
          WHEN '复古' THEN 4
          ELSE 5
        END,
        name
    `);
    
    console.log('\n📋 预设头像框最终状态:');
    result.rows.forEach((row, index) => {
      const updateTime = new Date(row.updated_at).toLocaleString();
      console.log(`  ${index + 1}. ${row.status} ${row.category} - ${row.name}`);
      console.log(`     更新时间: ${updateTime}`);
      if (row.frame_url.length > 80) {
        console.log(`     URL: ${row.frame_url.substring(0, 80)}...`);
      } else {
        console.log(`     URL: ${row.frame_url}`);
      }
      console.log('');
    });
    
    // 统计信息
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN frame_url LIKE 'https://res.cloudinary.com%' THEN 1 END) as updated,
        COUNT(CASE WHEN updated_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_updates
      FROM frames 
      WHERE is_preset = true
    `);
    
    const s = stats.rows[0];
    console.log('📊 更新统计:');
    console.log(`   总计: ${s.total} 个预设头像框`);
    console.log(`   已更新: ${s.updated} 个 (${((s.updated / s.total) * 100).toFixed(1)}%)`);
    console.log(`   本次更新: ${s.recent_updates} 个`);
    
    // 按分类统计
    const categoryStats = await pool.query(`
      SELECT 
        category,
        COUNT(*) as total,
        COUNT(CASE WHEN frame_url LIKE 'https://res.cloudinary.com%' THEN 1 END) as updated
      FROM frames 
      WHERE is_preset = true 
      GROUP BY category 
      ORDER BY 
        CASE category
          WHEN '节日' THEN 1
          WHEN '经典' THEN 2
          WHEN '时尚' THEN 3
          WHEN '复古' THEN 4
          ELSE 5
        END
    `);
    
    console.log('\n📂 分类统计:');
    categoryStats.rows.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.updated}/${cat.total} 已更新`);
    });
    
    // 如果有未匹配的记录，显示数据库中所有预设头像框
    if (errorCount > 0) {
      console.log('\n🔍 数据库中所有预设头像框 (用于调试):');
      const allFrames = await pool.query(`
        SELECT name, category 
        FROM frames 
        WHERE is_preset = true 
        ORDER BY category, name
      `);
      
      allFrames.rows.forEach((frame, index) => {
        console.log(`   ${index + 1}. ${frame.category} - ${frame.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 更新预设头像框URL失败:', error);
    console.error('详细错误:', error.stack);
  } finally {
    await pool.end();
    console.log('🔐 数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updatePresetFrameUrls();
}

module.exports = { updatePresetFrameUrls };