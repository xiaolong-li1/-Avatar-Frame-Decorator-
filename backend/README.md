# WeFrame微信头像智能处理系统 - 后端

这是WeFrame微信头像智能处理系统的后端服务，提供头像处理、头像框应用等功能的API。

## 功能特点

- 头像上传与管理
- 预设头像框应用
- 自定义头像框上传与管理
- 图像合成与处理

## 技术栈

- Node.js + Express
- sharp (图像处理)
- multer (文件上传)

## 项目结构

```
backend/
├── src/
│   ├── controllers/      # 控制器
│   ├── services/         # 业务逻辑
│   ├── models/           # 数据模型
│   ├── middleware/       # 中间件
│   ├── utils/            # 工具函数
│   ├── config/           # 配置文件
│   ├── routes/           # 路由定义
│   └── index.js          # 入口文件
├── uploads/              # 上传文件目录
├── package.json          # 项目依赖
└── README.md             # 项目说明
```

## 安装与运行

### 前提条件

- Node.js 14.0 或以上
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动服务

#### 开发模式

```bash
npm run dev
```

或直接双击 `start.bat` 脚本启动。

#### 生产模式

```bash
npm start
```

服务默认运行在 http://localhost:8080

## API 接口

### 预设头像框相关接口

- `GET /api/v1/frames/preset` - 获取预设头像框列表
- `POST /api/v1/frames/apply` - 应用头像框到头像

### 自定义头像框相关接口

- `POST /api/v1/frames/custom/upload` - 上传自定义头像框
- `GET /api/v1/frames/custom/list` - 获取用户自定义头像框列表
- `DELETE /api/v1/frames/custom/:frameId` - 删除自定义头像框

### 头像上传相关接口

- `POST /api/v1/upload/avatar` - 上传头像图片

## 配置说明

默认配置位于 `src/config/config.js`，可通过环境变量进行覆盖。

## 许可协议

[MIT](LICENSE) 