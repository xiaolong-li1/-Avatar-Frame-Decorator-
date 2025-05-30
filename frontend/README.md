# WeFrame Frontend

微信头像智能处理系统的前端应用，基于React + TypeScript + Ant Design开发。

## 功能特点

- 预设头像框应用
- 自定义头像框上传
- 头像超分处理
- 艺术风格迁移
- 文生图头像生成
- 动态特效头像
- 头像版权保护
- 头像保存与分享
- 人像背景虚化

## 技术栈

- React 18 + TypeScript
- Vite
- Ant Design 5.x
- React Router DOM 6.x
- Fabric.js
- Framer Motion
- CSS-in-JS + CSS Modules
- Axios
- FileSaver.js + html2canvas

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
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

## 项目结构

```
src/
├── components/          # 可复用组件
│   └── AvatarUpload.tsx # 头像上传组件
├── pages/              # 页面组件
│   ├── Home.tsx        # 首页
│   ├── PresetFrames.tsx     # 预设头像框
│   ├── CustomFrames.tsx     # 自定义头像框
│   └── ...
├── utils/              # 工具函数
├── config/             # 配置文件
├── services/           # API服务
├── App.tsx             # 主应用组件
└── main.tsx            # 应用入口
```

## 与后端集成

前端应用通过API与后端进行通信，API配置位于 `src/config/api.ts` 文件中。默认情况下，前端会连接到 `http://localhost:8081/api/v1` 作为后端API的基础URL。

如果需要修改API地址，可以设置环境变量 `VITE_API_BASE_URL`。

## 静态资源

静态资源（如预设头像框图片）默认从后端服务获取，配置位于 `src/config/staticAssets.ts` 文件中。默认静态资源URL为 `http://localhost:8081`。

如果需要修改静态资源地址，可以设置环境变量 `VITE_STATIC_URL`。 