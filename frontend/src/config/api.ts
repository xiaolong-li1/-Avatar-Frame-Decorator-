// API配置文件
export const API_CONFIG = {
  // 基础配置
  BASE_URL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8081/api/v1',
  TIMEOUT: 30000, // 30秒超时
  
  // 文件上传配置
  UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
    CHUNK_SIZE: 1024 * 1024, // 1MB分片上传
  }
}

// API端点定义
export const API_ENDPOINTS = {
  // 用户认证
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },

  // 文件上传
  UPLOAD: {
    AVATAR: '/upload/avatar',
    FRAME: '/upload/frame',
  },

  // 预设头像框
  FRAMES: {
    PRESET_LIST: '/frames/preset',
    APPLY: '/frames/apply',
    CUSTOM_UPLOAD: '/frames/custom/upload',
    CUSTOM_LIST: '/frames/custom/list',
    CUSTOM_DELETE: (frameId: string) => `/frames/custom/${frameId}`,
  },

  // AI处理功能
  AI: {
    SUPER_RESOLUTION: '/ai/super-resolution',
    STYLE_TRANSFER: '/ai/style-transfer',
    STYLES_LIST: '/ai/styles',
    TEXT_TO_IMAGE: '/ai/text-to-image',
    TEXT_TO_IMAGE_HISTORY: '/ai/text-to-image/history',
    BACKGROUND_BLUR: '/ai/background-blur',
    BACKGROUND_REPLACE: '/ai/background-replace',
    TASK_STATUS: (taskId: string) => `/ai/task/${taskId}/status`,
  },

  // 动态特效
  EFFECTS: {
    LIST: '/effects/list',
    APPLY: '/effects/apply',
  },

  // 版权保护
  COPYRIGHT: {
    WATERMARK: '/copyright/watermark',
    DETECT: '/copyright/detect',
  },

  // 保存与分享
  SAVE: {
    RESULT: '/save/result',
  },

  SHARE: {
    CREATE: '/share/create',
    GET: (shareId: string) => `/share/${shareId}`,
  },

  // 系统管理
  SYSTEM: {
    STATUS: '/system/status',
    USER_STATS: '/user/stats',
  }
}

// 响应数据类型定义
export interface ApiResponse<T = any> {
  success: boolean
  code: number
  message: string
  data: T
  timestamp: number
  error?: string
}

// 任务状态类型
export interface TaskStatus {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  resultUrl?: string
  error?: string
  estimatedTime?: number
}

// 文件上传响应类型
export interface UploadResponse {
  fileId: string
  originalUrl: string
  thumbnailUrl: string
  size: number
  width: number
  height: number
  format: string
}

// 头像框类型
export interface Frame {
  id: string
  name: string
  category: string
  thumbnailUrl: string
  frameUrl: string
  isAnimated: boolean
  tags: string[]
}

// 艺术风格类型
export interface ArtStyle {
  id: string
  name: string
  description: string
  previewUrl: string
  category: string
}

// 动态特效类型
export interface Effect {
  id: string
  name: string
  description: string
  previewUrl: string
  type: string
  duration: number
} 