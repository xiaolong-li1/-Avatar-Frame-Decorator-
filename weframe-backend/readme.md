# Avatar Frame Decorator - 后端服务

一个功能丰富的头像框装饰器后端服务，支持头像框管理、AI图像生成、用户管理等功能。

## 🛠️ 环境要求

### 必需软件
- **Node.js** >= 16.0.0
- **PostgreSQL** >= 12.0
- **npm** 或 **yarn**

### 数据库安装

#### Windows 用户
1. 下载并安装 [PostgreSQL](https://www.postgresql.org/download/windows/)
2. 安装过程中设置超级用户密码（记住这个密码）
3. 确保 PostgreSQL 服务正在运行

#### macOS 用户
```bash
# 使用 Homebrew 安装
brew install postgresql
brew services start postgresql
```

#### Linux 用户 (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 📦 安装依赖

```bash
# 进入后端目录
cd weframe-backend

# 安装依赖包 注意权限给足
npm install
```

## ⚙️ 环境配置
1 **编辑 `.env` 文件**
```properties
# 数据库配置
DB_USER=postgres
DB_HOST=localhost
DB_NAME=weframe
DB_PASSWORD=你的PostgreSQL密码，或者不改就是1
DB_PORT=5432

# 服务器配置(key已经填好，勿动)
PORT=3000
JWT_SECRET=your-secret-key-here

# Cloudinary配置 (图片存储)(key已经填好，勿动)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI服务配置 (可选)(key已经填好，勿动)
DEEPAI_API_KEY=your-deepai-key
OPENAI_API_KEY=your-openai-key
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

## 🗄️ 数据库初始化

### 第一次设置

```bash
# 1. 测试数据库连接
npm run test-connection

# 2. 创建数据库（如果不存在）
npm run create-db

# 3. 初始化数据库结构和预设数据
npm run init-db

# 4. 验证数据库设置
npm run test-db
```


### 可选：头像框资源更新
如果你有自定义的头像框文件（01.png - 12.png）:

```bash
# 1. 上传并更新头像框URL
npm run update-frames
```

## 🚀 启动服务

### 开发模式
```bash
# 在 weframe-backend 目录下
npm run dev
```

### 生产模式
```bash
# 在 weframe-backend 目录下
npm start
# 或
node app.js
```

服务启动后访问：`http://localhost:3000`

## 📋 可用脚本

| 命令 | 描述 |
|------|------|
| `npm run test-connection` | 测试数据库连接 |
| `npm run create-db` | 创建数据库 |
| `npm run init-db` | 初始化数据库结构 |
| `npm run test-db` | 测试数据库完整性 |
| `npm run update-frames` | 更新预设头像框 |
| `npm run setup-full` | 一键完整设置 |
| `npm run dev` | 开发模式启动 |
| `npm start` | 生产模式启动 |

## 📁 项目结构

```
weframe-backend/
├── app.js                 # 主应用入口
├── config/                # 配置文件
│   ├── database.js        # 数据库配置
│   └── cloudinary.js      # 云存储配置
├── controllers/           # 控制器
├── middleware/           # 中间件
├── models/              # 数据模型
├── routes/              # 路由定义
├── services/            # 业务服务
├── scripts/             # 数据库脚本
├── assets/              # 静态资源
├── schema-fixed.sql     # 数据库结构
├── .env.example         # 环境变量模板
└── package.json         # 项目配置
```

## 🌐 API 端点

- **用户管理**: `/api/auth/*`
- **头像框**: `/api/frames/*`
- **头像上传**: `/api/avatars/*`
- **AI功能**: `/api/ai/*`
- **分享功能**: `/api/share/*`

## 🔄 更新数据库结构

如需重新初始化数据库：
```bash
# 警告：这会删除所有数据
npm run init-db
```

## 🚀 启动前端

后端服务启动成功后，可以启动前端应用：
```bash
# 在前端目录下
cd ../weframe-frontend
npm install
npm run dev
```

## 📞 技术支持

如遇问题，请检查：
1. PostgreSQL 服务是否正常运行
2. 环境变量配置是否正确
3. 网络连接是否正常
4. 端口是否被占用

---

**🎉 现在你可以开始使用 Avatar Frame Decorator 了！**