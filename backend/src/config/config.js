require('dotenv').config();

module.exports = {
  // 服务器配置
  port: process.env.PORT || 8081,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // 数据库配置
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/weframe'
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  
  // 文件存储配置
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  },
  
  // 跨域配置
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  
  // 文件URL前缀
  fileUrlPrefix: process.env.FILE_URL_PREFIX || 'http://localhost:8081'
}; 