require('dotenv').config(); // 加载环境变量
const express = require('express');
const cors = require('cors');
const app = express();

// 配置 CORS，允许跨域请求
app.use(cors());

// 解析 JSON 请求体
app.use(express.json());

// 挂载路由模块
const uploadRoutes = require('./routes/uploadRoutes');
const frameRoutes = require('./routes/frameRoutes');
const authRoutes = require('./routes/authRoutes'); // ✅ 新增：引入认证路由
const shareRoutes = require('./routes/share'); // ✅ 新增：分享路由
app.use('/share', shareRoutes); // ✅ 新增：分享路由
app.use('/upload', uploadRoutes);   // 文件上传路由
app.use('/frames', frameRoutes);    // 头像框路由
app.use('/auth', authRoutes);   // ✅ 新增：认证接口路由

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
