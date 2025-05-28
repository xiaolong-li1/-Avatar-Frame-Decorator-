# WeFrame 后端API接口文档

## 项目概述

WeFrame是一个微信头像智能处理系统，提供多种AI图像处理功能。本文档详细描述了前端与后端交互所需的所有API接口。

## 技术栈建议

- **后端框架**: Node.js (Express/Koa) 或 Python (FastAPI/Django) 或 Java (Spring Boot)
- **数据库**: MongoDB/PostgreSQL + Redis (缓存)
- **文件存储**: 阿里云OSS/腾讯云COS/AWS S3
- **AI服务**: 百度AI/腾讯云AI/阿里云AI 或自建模型服务
- **图像处理**: OpenCV/PIL/ImageMagick

## 基础配置

### 请求基础格式
```
Base URL: https://api.weframe.com/v1
Content-Type: application/json
Authorization: Bearer <token> (需要登录的接口)
```

### 响应基础格式
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": 1678886400
}
```

### 错误响应格式
```json
{
  "success": false,
  "code": 400,
  "message": "错误描述",
  "error": "详细错误信息",
  "timestamp": 1678886400
}
```

---

## 1. 用户认证模块

### 1.1 用户注册/登录 (可选)
```http
POST /auth/login
```

**请求体:**
```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user123",
      "phone": "13800138000",
      "nickname": "用户昵称"
    }
  }
}
```

---

## 2. 文件上传模块

### 2.1 头像图片上传
```http
POST /upload/avatar
Content-Type: multipart/form-data
```

**请求参数:**
- `file`: 图片文件 (支持jpg,png,webp，最大10MB)
- `type`: 上传类型 ("avatar" | "frame")

**响应:**
```json
{
  "success": true,
  "data": {
    "fileId": "img_123456789",
    "originalUrl": "https://oss.example.com/original/123456789.jpg",
    "thumbnailUrl": "https://oss.example.com/thumb/123456789.jpg",
    "size": 1048576,
    "width": 1024,
    "height": 1024,
    "format": "jpg"
  }
}
```

---

## 3. 预设头像框模块

### 3.1 获取预设头像框列表
```http
GET /frames/preset?category={category}&page={page}&limit={limit}
```

**查询参数:**
- `category`: 分类 ("festival" | "business" | "cute" | "cool" | "all")
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认20)

**响应:**
```json
{
  "success": true,
  "data": {
    "frames": [
      {
        "id": "frame_001",
        "name": "春节红包框",
        "category": "festival",
        "thumbnailUrl": "https://oss.example.com/frames/thumb/001.png",
        "frameUrl": "https://oss.example.com/frames/001.png",
        "isAnimated": false,
        "tags": ["春节", "红色", "传统"]
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### 3.2 应用预设头像框
```http
POST /frames/apply
```

**请求体:**
```json
{
  "avatarFileId": "img_123456789",
  "frameId": "frame_001",
  "options": {
    "opacity": 0.8,
    "blendMode": "normal"
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_987654321",
    "resultUrl": "https://oss.example.com/result/987654321.jpg",
    "status": "completed"
  }
}
```

---

## 4. 自定义头像框模块

### 4.1 上传自定义头像框
```http
POST /frames/custom/upload
Content-Type: multipart/form-data
```

**请求参数:**
- `file`: 头像框文件 (PNG格式，支持透明度)
- `name`: 头像框名称
- `description`: 描述 (可选)

**响应:**
```json
{
  "success": true,
  "data": {
    "frameId": "custom_frame_123",
    "name": "我的头像框",
    "frameUrl": "https://oss.example.com/custom-frames/123.png",
    "thumbnailUrl": "https://oss.example.com/custom-frames/thumb/123.png"
  }
}
```

### 4.2 获取用户自定义头像框列表
```http
GET /frames/custom/list?page={page}&limit={limit}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "frames": [
      {
        "id": "custom_frame_123",
        "name": "我的头像框",
        "frameUrl": "https://oss.example.com/custom-frames/123.png",
        "thumbnailUrl": "https://oss.example.com/custom-frames/thumb/123.png",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

### 4.3 删除自定义头像框
```http
DELETE /frames/custom/{frameId}
```

**响应:**
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

## 5. 头像超分处理模块

### 5.1 头像超分处理
```http
POST /ai/super-resolution
```

**请求体:**
```json
{
  "avatarFileId": "img_123456789",
  "scaleFactor": 4,
  "quality": "high"
}
```

**参数说明:**
- `scaleFactor`: 放大倍数 (2, 4, 6, 8)
- `quality`: 处理质量 ("normal" | "high" | "ultra")

**响应:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_super_001",
    "status": "processing",
    "estimatedTime": 30
  }
}
```

### 5.2 查询处理进度
```http
GET /ai/task/{taskId}/status
```

**响应:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_super_001",
    "status": "completed",
    "progress": 100,
    "resultUrl": "https://oss.example.com/result/super_001.jpg",
    "originalSize": [512, 512],
    "resultSize": [2048, 2048]
  }
}
```

---

## 6. 艺术风格迁移模块

### 6.1 获取可用艺术风格
```http
GET /ai/styles
```

**响应:**
```json
{
  "success": true,
  "data": {
    "styles": [
      {
        "id": "vangogh",
        "name": "梵高风格",
        "description": "后印象派代表，色彩浓烈",
        "previewUrl": "https://oss.example.com/styles/vangogh.jpg",
        "category": "classic"
      },
      {
        "id": "monet",
        "name": "莫奈风格", 
        "description": "印象派大师，光影变化",
        "previewUrl": "https://oss.example.com/styles/monet.jpg",
        "category": "classic"
      }
    ]
  }
}
```

### 6.2 应用艺术风格迁移
```http
POST /ai/style-transfer
```

**请求体:**
```json
{
  "avatarFileId": "img_123456789",
  "styleId": "vangogh",
  "intensity": 0.8
}
```

**参数说明:**
- `intensity`: 风格强度 (0.1-1.0)

**响应:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_style_001",
    "status": "processing",
    "estimatedTime": 45
  }
}
```

---

## 7. 文生图头像生成模块

### 7.1 文生图头像生成
```http
POST /ai/text-to-image
```

**请求体:**
```json
{
  "prompt": "一只可爱的橘猫在星空下睡觉",
  "style": "cartoon",
  "size": "512x512",
  "options": {
    "seed": 12345,
    "steps": 20,
    "guidance": 7.5
  }
}
```

**参数说明:**
- `style`: 生成风格 ("cartoon" | "realistic" | "anime" | "oil-painting")
- `size`: 图片尺寸 ("512x512" | "768x768" | "1024x1024")

**响应:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_t2i_001",
    "status": "processing",
    "estimatedTime": 60
  }
}
```

### 7.2 获取生成历史
```http
GET /ai/text-to-image/history?page={page}&limit={limit}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "t2i_001",
        "prompt": "一只可爱的橘猫在星空下睡觉",
        "imageUrl": "https://oss.example.com/t2i/001.jpg",
        "style": "cartoon",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

---

## 8. 动态特效头像模块

### 8.1 获取可用动态特效
```http
GET /effects/list
```

**响应:**
```json
{
  "success": true,
  "data": {
    "effects": [
      {
        "id": "particles",
        "name": "粒子飘落",
        "description": "唯美粒子飘落效果",
        "previewUrl": "https://oss.example.com/effects/particles.gif",
        "type": "particle",
        "duration": 3
      },
      {
        "id": "glow",
        "name": "光环效果",
        "description": "柔和光环围绕",
        "previewUrl": "https://oss.example.com/effects/glow.gif", 
        "type": "glow",
        "duration": 2
      }
    ]
  }
}
```

### 8.2 应用动态特效
```http
POST /effects/apply
```

**请求体:**
```json
{
  "avatarFileId": "img_123456789",
  "effectId": "particles",
  "options": {
    "intensity": 0.7,
    "speed": 1.0,
    "color": "#ffffff",
    "duration": 3,
    "format": "gif"
  }
}
```

**参数说明:**
- `format`: 输出格式 ("gif" | "mp4")
- `duration`: 动画时长 (秒)

**响应:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_effect_001",
    "status": "processing",
    "estimatedTime": 120
  }
}
```

---

## 9. 人像背景虚化模块

### 9.1 人像背景虚化
```http
POST /ai/background-blur
```

**请求体:**
```json
{
  "avatarFileId": "img_123456789",
  "blurIntensity": 0.8,
  "options": {
    "edgeSmooth": true,
    "preserveHair": true
  }
}
```

**参数说明:**
- `blurIntensity`: 虚化强度 (0.1-1.0)
- `edgeSmooth`: 边缘平滑处理
- `preserveHair`: 毛发细节保持

**响应:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_blur_001",
    "status": "processing",
    "estimatedTime": 20
  }
}
```

### 9.2 背景替换
```http
POST /ai/background-replace
```

**请求体:**
```json
{
  "avatarFileId": "img_123456789",
  "backgroundType": "color",
  "backgroundValue": "#ff6b6b"
}
```

**参数说明:**
- `backgroundType`: 背景类型 ("color" | "gradient" | "image")
- `backgroundValue`: 背景值 (颜色代码/渐变配置/图片ID)

---

## 10. 头像版权保护模块

### 10.1 添加水印
```http
POST /copyright/watermark
```

**请求体:**
```json
{
  "avatarFileId": "img_123456789",
  "watermarkType": "text",
  "content": "© WeFrame 2024",
  "options": {
    "position": "bottom-right",
    "opacity": 0.3,
    "fontSize": 12,
    "color": "#ffffff",
    "invisible": false
  }
}
```

**参数说明:**
- `watermarkType`: 水印类型 ("text" | "image" | "invisible")
- `position`: 位置 ("top-left" | "top-right" | "bottom-left" | "bottom-right" | "center")
- `invisible`: 是否为隐形水印

**响应:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_watermark_001",
    "resultUrl": "https://oss.example.com/watermark/001.jpg",
    "status": "completed"
  }
}
```

### 10.2 水印检测
```http
POST /copyright/detect
```

**请求体:**
```json
{
  "imageFileId": "img_987654321"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "hasWatermark": true,
    "watermarkInfo": {
      "content": "© WeFrame 2024",
      "confidence": 0.95,
      "originalAuthor": "user123"
    }
  }
}
```

---

## 11. 头像保存与分享模块

### 11.1 保存处理结果
```http
POST /save/result
```

**请求体:**
```json
{
  "taskId": "task_123456",
  "format": "jpg",
  "quality": 90,
  "size": "original"
}
```

**参数说明:**
- `format`: 保存格式 ("jpg" | "png" | "webp")
- `quality`: 图片质量 (1-100)
- `size`: 尺寸 ("original" | "large" | "medium" | "small")

**响应:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://oss.example.com/download/123456.jpg",
    "expiresAt": "2024-01-02T00:00:00Z",
    "fileSize": 1048576
  }
}
```

### 11.2 生成分享链接
```http
POST /share/create
```

**请求体:**
```json
{
  "resultFileId": "result_123456",
  "shareType": "wechat",
  "options": {
    "enableDownload": true,
    "expiresIn": 86400
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "shareId": "share_789012",
    "shareUrl": "https://weframe.com/share/789012",
    "qrCodeUrl": "https://oss.example.com/qr/789012.png",
    "expiresAt": "2024-01-02T00:00:00Z"
  }
}
```

---

## 12. 系统管理接口

### 12.1 获取系统状态
```http
GET /system/status
```

**响应:**
```json
{
  "success": true,
  "data": {
    "aiServiceStatus": "online",
    "storageStatus": "online", 
    "queueLength": 5,
    "averageProcessTime": 30
  }
}
```

### 12.2 获取用户使用统计
```http
GET /user/stats
```

**响应:**
```json
{
  "success": true,
  "data": {
    "totalProcessed": 100,
    "todayProcessed": 5,
    "remainingQuota": 95,
    "favoriteEffects": ["particles", "glow"]
  }
}
```

---

## 错误代码说明

| 错误代码 | 说明 |
|---------|------|
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 413 | 文件过大 |
| 415 | 不支持的文件格式 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 503 | AI服务不可用 |

---

## 技术实现建议

### 1. 文件存储
- 使用对象存储服务 (OSS/COS/S3)
- 实现图片CDN加速
- 设置文件过期策略
- 支持多格式、多尺寸

### 2. AI服务集成
- 对接百度/腾讯/阿里云AI API
- 实现任务队列 (Redis/RabbitMQ)
- 支持异步处理和进度查询
- 设置超时和重试机制

### 3. 性能优化
- 实现接口缓存 (Redis)
- 数据库查询优化
- 图片处理并发控制
- 实现熔断和限流

### 4. 安全考虑
- 文件类型和大小验证
- 图片内容安全检测
- 用户上传频率限制
- 敏感内容过滤

### 5. 监控日志
- 接口调用日志
- 错误监控报警
- 性能指标统计
- 用户行为分析

---

## 开发优先级建议

1. **阶段一**: 基础接口 (文件上传、预设头像框)
2. **阶段二**: AI功能接口 (超分、风格迁移)  
3. **阶段三**: 高级功能 (动态特效、版权保护)
4. **阶段四**: 优化完善 (性能优化、监控统计)

请根据实际技术栈和业务需求，调整具体的实现方案。如有疑问，请及时沟通讨论。 