const cloudinary = require('../config/cloudinary');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

exports.uploadFile = async (buffer, path, contentType) => {
  return new Promise((resolve, reject) => {
    // 去掉 path 中的扩展名
    const cleanPath = path.replace(/\.\w+$/, '');
    console.log('Uploading to Cloudinary with public_id:', cleanPath);

    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: cleanPath,
        resource_type: 'image',
        format: contentType.split('/')[1], // 仍使用 format 控制扩展名
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload failed:', error);
          reject(new Error(`Cloudinary upload failed: ${error.message || JSON.stringify(error)}`));
        } else {
          console.log(`✅ Image uploaded to Cloudinary: ${result.secure_url}`);
          resolve(result.secure_url);
        }
      }
    );
    stream.end(buffer);
  });
};

exports.getFile = async (url) => {
  try {
    if (!url) {
      throw new Error('File URL is empty');
    }
    console.log('Fetching file from Cloudinary:', url);

    // 提取 public_id（仅用于日志）
    const publicIdMatch = url.match(/\/upload\/v\d+\/(.+?)(?:\.(\w+))?$/i);
    if (!publicIdMatch) {
      throw new Error('Invalid Cloudinary URL format');
    }
    const publicId = publicIdMatch[1];
    console.log('Extracted public_id:', publicId);

    // 添加重试逻辑
    let retries = 5;
    let buffer;
    
    while (retries > 0) {
      try {
        // 设置更长的超时时间
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
        
        const response = await fetch(url, {
          signal: controller.signal,
          timeout: 30000 // 这个属性在某些fetch实现中可能不支持
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        buffer = await response.buffer();
        console.log('File fetched successfully, buffer length:', buffer.length);
        return buffer;
      } catch (fetchError) {
        retries--;
        if (retries === 0) throw fetchError;
        console.log(`Fetch attempt failed, retrying... (${retries} attempts left)`);
        // 指数退避策略 - 等待时间应随重试次数增加而增加
        await new Promise(r => setTimeout(r, Math.pow(2, 5-retries) * 1000)); // 1秒, 2秒, 4秒, 8秒, 16秒
      }
    }
  } catch (error) {
    console.error('Cloudinary fetch failed:', error);
    throw new Error(`Cloudinary fetch failed: ${error.message || JSON.stringify(error)}`);
  }
};

// 删除单个文件
exports.deleteFile = async (url) => {
  try {
    if (!url) {
      throw new Error('File URL is empty');
    }
    
    console.log('🗑️ Deleting file from Cloudinary:', url);

    // 从URL中提取public_id
    const publicIdMatch = url.match(/\/upload\/v\d+\/(.+?)(?:\.(\w+))?$/i);
    if (!publicIdMatch) {
      throw new Error('Invalid Cloudinary URL format - cannot extract public_id');
    }
    
    const publicId = publicIdMatch[1];
    console.log('Extracted public_id for deletion:', publicId);

    // 使用Cloudinary API删除文件
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true // 清除CDN缓存
      }, (error, result) => {
        if (error) {
          console.error('Cloudinary delete failed:', error);
          reject(new Error(`Cloudinary delete failed: ${error.message || JSON.stringify(error)}`));
        } else {
          resolve(result);
        }
      });
    });

    console.log('Cloudinary delete result:', result);

    // 检查删除结果
    if (result.result === 'ok') {
      console.log(`✅ File deleted successfully from Cloudinary: ${publicId}`);
      return {
        success: true,
        publicId: publicId,
        result: result.result
      };
    } else if (result.result === 'not found') {
      console.warn(`⚠️ File not found in Cloudinary: ${publicId}`);
      return {
        success: true,
        publicId: publicId,
        result: result.result,
        message: 'File was already deleted or does not exist'
      };
    } else {
      throw new Error(`Unexpected delete result: ${result.result}`);
    }

  } catch (error) {
    console.error('❌ Delete file failed:', error);
    throw new Error(`Delete file failed: ${error.message}`);
  }
};

// 批量删除文件
exports.deleteMultipleFiles = async (urls) => {
  try {
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error('URLs array is empty or invalid');
    }

    console.log(`🗑️ Batch deleting ${urls.length} files from Cloudinary`);

    const deleteResults = [];
    const errors = [];

    // 并发删除文件，但限制并发数量以避免API限制
    const batchSize = 10; // 每批处理10个文件
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(async (url, index) => {
        try {
          const result = await exports.deleteFile(url);
          return {
            url: url,
            success: true,
            result: result
          };
        } catch (error) {
          console.error(`Failed to delete file ${url}:`, error.message);
          return {
            url: url,
            success: false,
            error: error.message
          };
        }
      });

      // 等待当前批次完成
      const batchResults = await Promise.all(batchPromises);
      
      // 分类结果
      batchResults.forEach(result => {
        if (result.success) {
          deleteResults.push(result);
        } else {
          errors.push(result);
        }
      });

      // 如果不是最后一批，稍微等待一下以避免API限制
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 等待500ms
      }
    }

    console.log(`✅ Batch delete completed: ${deleteResults.length} successful, ${errors.length} failed`);

    return {
      success: true,
      totalRequested: urls.length,
      successCount: deleteResults.length,
      errorCount: errors.length,
      successResults: deleteResults,
      errors: errors
    };

  } catch (error) {
    console.error('❌ Batch delete failed:', error);
    throw new Error(`Batch delete failed: ${error.message}`);
  }
};

// 根据public_id删除文件（如果你有public_id而不是完整URL）
exports.deleteFileByPublicId = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId) {
      throw new Error('Public ID is empty');
    }

    console.log(`🗑️ Deleting file by public_id: ${publicId}`);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true
      }, (error, result) => {
        if (error) {
          console.error('Cloudinary delete failed:', error);
          reject(new Error(`Cloudinary delete failed: ${error.message || JSON.stringify(error)}`));
        } else {
          resolve(result);
        }
      });
    });

    console.log('Cloudinary delete result:', result);

    if (result.result === 'ok') {
      console.log(`✅ File deleted successfully: ${publicId}`);
      return {
        success: true,
        publicId: publicId,
        result: result.result
      };
    } else if (result.result === 'not found') {
      console.warn(`⚠️ File not found: ${publicId}`);
      return {
        success: true,
        publicId: publicId,
        result: result.result,
        message: 'File was already deleted or does not exist'
      };
    } else {
      throw new Error(`Unexpected delete result: ${result.result}`);
    }

  } catch (error) {
    console.error('❌ Delete file by public_id failed:', error);
    throw new Error(`Delete file by public_id failed: ${error.message}`);
  }
};

// 清理过期文件（按标签或前缀）
exports.cleanupFiles = async (options = {}) => {
  try {
    const {
      prefix = '',
      tag = '',
      olderThan = null, // Date对象，删除此日期之前的文件
      maxResults = 500
    } = options;

    console.log('🧹 Starting file cleanup with options:', options);

    // 构建搜索表达式
    let expression = 'resource_type:image';
    
    if (prefix) {
      expression += ` AND public_id:${prefix}*`;
    }
    
    if (tag) {
      expression += ` AND tags:${tag}`;
    }
    
    if (olderThan) {
      const timestamp = Math.floor(olderThan.getTime() / 1000);
      expression += ` AND uploaded_at<${timestamp}`;
    }

    console.log('Search expression:', expression);

    // 搜索要删除的文件
    const searchResult = await new Promise((resolve, reject) => {
      cloudinary.search
        .expression(expression)
        .max_results(maxResults)
        .execute((error, result) => {
          if (error) {
            reject(new Error(`Search failed: ${error.message}`));
          } else {
            resolve(result);
          }
        });
    });

    if (!searchResult.resources || searchResult.resources.length === 0) {
      console.log('No files found matching cleanup criteria');
      return {
        success: true,
        deletedCount: 0,
        message: 'No files found matching criteria'
      };
    }

    console.log(`Found ${searchResult.resources.length} files to cleanup`);

    // 批量删除找到的文件
    const publicIds = searchResult.resources.map(resource => resource.public_id);
    
    const deleteResult = await new Promise((resolve, reject) => {
      cloudinary.api.delete_resources(publicIds, {
        resource_type: 'image',
        invalidate: true
      }, (error, result) => {
        if (error) {
          reject(new Error(`Batch delete failed: ${error.message}`));
        } else {
          resolve(result);
        }
      });
    });

    const deletedCount = Object.keys(deleteResult.deleted || {}).length;
    const partialCount = Object.keys(deleteResult.partial || {}).length;
    
    console.log(`✅ Cleanup completed: ${deletedCount} deleted, ${partialCount} partial`);

    return {
      success: true,
      deletedCount: deletedCount,
      partialCount: partialCount,
      deleteResult: deleteResult
    };

  } catch (error) {
    console.error('❌ File cleanup failed:', error);
    throw new Error(`File cleanup failed: ${error.message}`);
  }
};