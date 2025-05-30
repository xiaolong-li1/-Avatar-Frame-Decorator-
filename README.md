# WeFrame - 微信头像智能处理系统

一个基于React + TypeScript + Ant Design开发的微信头像智能处理系统，提供多种AI图像处理功能，让您的社交形象更加个性化和专业。

## 🌟 核心功能

根据用户故事优先级排序：

### 高优先级功能 (Priority 5)
1. **预设头像框** - 丰富的节日主题和动态效果头像框
2. **自定义头像框上传** - 支持用户上传自定义设计图案作为头像框
3. **头像超分处理** - AI智能提升头像清晰度和分辨率
4. **艺术风格迁移** - 将头像转换为梵高、莫奈等经典艺术风格
5. **文生图头像生成** - 通过文字描述自动生成个性化头像

### 中高优先级功能 (Priority 4)
6. **动态特效头像** - 为头像添加粒子飘落、光影变化等动态特效

### 中等优先级功能 (Priority 3)
7. **头像版权保护** - 添加隐形水印或版权信息防止盗用

### 低优先级功能 (Priority 2)
8. **头像保存与分享** - 将处理后的头像保存至本地或分享到微信
9. **人像背景虚化** - 智能识别人像并进行背景虚化或替换

## 🚀 技术栈

- **前端**:
  - React 18 + TypeScript
  - Vite
  - Ant Design 5.x
  - React Router DOM 6.x
  - Fabric.js
  - Framer Motion
  - CSS-in-JS + CSS Modules
  - Axios
  - FileSaver.js + html2canvas

- **后端**:
  - Node.js + Express
  - MongoDB
  - Redis
  - Multer
  - Sharp
  - Bull

## 📦 安装与运行

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB (可选)
- Redis (可选)

### 快速启动（前后端）
```bash
# 在项目根目录下运行
start-all.bat
```

### 前端开发
```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
前端应用将在 `http://localhost:3000` 启动

### 后端开发
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
后端API将在 `http://localhost:8081` 启动

### 构建前端生产版本
```bash
cd frontend
npm run build
```

### 预览生产版本
```bash
npm run preview
```

### 代码检查
```bash
npm run lint
```

### 类型检查
```bash
npm run type-check
```

## 🎨 功能详细说明

### 1. 预设头像框
- 提供多种节日主题头像框（春节、圣诞节、情人节等）
- 支持动态效果预览
- 一键应用到头像

### 2. 自定义头像框上传
- 支持PNG/JPG/WebP格式
- 自动透明度处理
- 边框调整工具
- 实时预览效果

### 3. 头像超分处理
- AI智能算法提升图像清晰度
- 支持2x、4x超分辨率
- 前后对比预览
- 批量处理功能

### 4. 艺术风格迁移
- 多种经典艺术风格（梵高、莫奈、毕加索等）
- 强度调节控制
- 高质量风格转换
- 实时预览

### 5. 文生图头像生成
- 支持中文描述输入
- AI智能理解和生成
- 多样化风格选择
- 批量生成选项

### 6. 动态特效头像
- 粒子飘落、闪烁星光、光晕效果等多种特效
- 可调节速度、密度、颜色等参数
- 支持GIF和MP4格式输出
- 自动循环播放设置

### 7. 头像版权保护
- 隐形水印技术
- 可见版权标签
- 版权验证工具
- 创作者认证

### 8. 头像保存与分享
- 多格式导出（PNG/JPEG/GIF/MP4）
- 一键分享到微信
- 云端同步保存
- 批量导出功能

### 9. 人像背景虚化
- AI智能人像识别
- 自然虚化效果
- 背景替换功能
- 边缘优化工具

## 🎯 用户体验特色

### 现代化设计
- 采用Glassmorphism（玻璃态）设计风格
- 渐变背景和毛玻璃效果
- 响应式布局，适配移动端
- 流畅的动画过渡

### 智能交互
- 拖拽上传文件
- 实时预览效果
- 进度指示器
- 错误处理和用户反馈

### 性能优化
- 组件懒加载
- 图像压缩处理
- 缓存策略
- Bundle分割优化

## 📂 项目结构

```
/
├── frontend/               # 前端代码
│   ├── public/             # 静态资源
│   ├── src/                # 源代码
│   │   ├── components/     # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── utils/          # 工具函数
│   │   ├── config/         # 配置文件
│   │   ├── services/       # API服务
│   │   ├── App.tsx         # 主应用组件
│   │   └── main.tsx        # 应用入口
│   ├── package.json        # 前端依赖
│   └── vite.config.ts      # Vite配置
│
├── backend/                # 后端代码
│   ├── public/             # 静态资源和上传文件
│   ├── src/                # 源代码
│   ├── uploads/            # 用户上传文件
│   └── package.json        # 后端依赖
│
├── start-all.bat           # 前后端一键启动脚本
├── README.md               # 项目说明
└── 后端API接口文档.md       # API文档
```

## 🔧 开发指南

### 前端开发
1. 在 `frontend/src/pages/` 目录下创建新的页面组件
2. 在 `frontend/src/App.tsx` 中添加路由配置
3. 更新侧边栏菜单项

### 后端开发
1. 在 `backend/src/routes/` 目录下添加新的路由
2. 在 `backend/src/controllers/` 目录下实现对应的控制器
3. 更新API文档

### API集成
1. 在 `frontend/src/config/api.ts` 中添加新的API端点
2. 在 `frontend/src/services/` 目录下实现相应的API调用服务
3. 在组件中使用这些服务

## 🌐 浏览器支持

- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## 📄 许可证

MIT License

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📞 联系方式

- 项目作者：WeFrame Team
- 邮箱：contact@weframe.com
- 项目地址：https://github.com/weframe/weframe-frontend

---

**WeFrame** - 让您的微信头像更加精彩！ ✨ 