import { message } from 'antd'
import { API_CONFIG, API_ENDPOINTS, ApiResponse, UploadResponse, TaskStatus, Frame, ArtStyle, Effect } from '../config/api'

// 创建基础的fetch封装
class ApiService {
  private baseURL: string
  private timeout: number

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
  }

  // 基础请求方法
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    // 设置默认headers
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 获取token (如果有登录功能)
    const token = localStorage.getItem('token')
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API请求失败:', error)
      throw error
    }
  }

  // GET请求
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  // POST请求
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT请求
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE请求
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // 文件上传
  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData()
    formData.append('file', file)
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('文件上传失败:', error)
      throw error
    }
  }
}

// 创建API服务实例
const apiService = new ApiService()

// 具体的API调用方法
export const api = {
  // 文件上传
  uploadAvatar: (file: File) => 
    apiService.uploadFile(API_ENDPOINTS.UPLOAD.AVATAR, file, { type: 'avatar' }),

  uploadFrame: (file: File, name: string, description?: string) => 
    apiService.uploadFile(API_ENDPOINTS.FRAMES.CUSTOM_UPLOAD, file, { 
      name, 
      description: description || '' 
    }),

  // 预设头像框
  getPresetFrames: (category?: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(category && category !== 'all' && { category })
    })
    return apiService.get<{ frames: Frame[], total: number, page: number, limit: number }>(
      `${API_ENDPOINTS.FRAMES.PRESET_LIST}?${params}`
    )
  },

  applyFrame: (avatarFileId: string, frameId: string, options = {}) => 
    apiService.post<{ taskId: string, resultUrl?: string, status: string }>(
      API_ENDPOINTS.FRAMES.APPLY, 
      { avatarFileId, frameId, options }
    ),

  // 自定义头像框
  getCustomFrames: (page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    return apiService.get<{ frames: Frame[], total: number, page: number, limit: number }>(
      `${API_ENDPOINTS.FRAMES.CUSTOM_LIST}?${params}`
    )
  },

  deleteCustomFrame: (frameId: string) => 
    apiService.delete(API_ENDPOINTS.FRAMES.CUSTOM_DELETE(frameId)),

  // AI处理功能
  superResolution: (avatarFileId: string, scaleFactor: number, quality: string) => 
    apiService.post<{ taskId: string, status: string, estimatedTime: number }>(
      API_ENDPOINTS.AI.SUPER_RESOLUTION,
      { avatarFileId, scaleFactor, quality }
    ),

  getArtStyles: () => 
    apiService.get<{ styles: ArtStyle[] }>(API_ENDPOINTS.AI.STYLES_LIST),

  styleTransfer: (avatarFileId: string, styleId: string, intensity = 0.8) => 
    apiService.post<{ taskId: string, status: string, estimatedTime: number }>(
      API_ENDPOINTS.AI.STYLE_TRANSFER,
      { avatarFileId, styleId, intensity }
    ),

  textToImage: (prompt: string, style = 'cartoon', size = '512x512', options = {}) => 
    apiService.post<{ taskId: string, status: string, estimatedTime: number }>(
      API_ENDPOINTS.AI.TEXT_TO_IMAGE,
      { prompt, style, size, options }
    ),

  getTextToImageHistory: (page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    return apiService.get<{ images: any[], total: number, page: number, limit: number }>(
      `${API_ENDPOINTS.AI.TEXT_TO_IMAGE_HISTORY}?${params}`
    )
  },

  backgroundBlur: (avatarFileId: string, blurIntensity = 0.8, options = {}) => 
    apiService.post<{ taskId: string, status: string, estimatedTime: number }>(
      API_ENDPOINTS.AI.BACKGROUND_BLUR,
      { avatarFileId, blurIntensity, options }
    ),

  backgroundReplace: (avatarFileId: string, backgroundType: string, backgroundValue: string) => 
    apiService.post<{ taskId: string, status: string, estimatedTime: number }>(
      API_ENDPOINTS.AI.BACKGROUND_REPLACE,
      { avatarFileId, backgroundType, backgroundValue }
    ),

  // 动态特效
  getEffects: () => 
    apiService.get<{ effects: Effect[] }>(API_ENDPOINTS.EFFECTS.LIST),

  applyEffect: (avatarFileId: string, effectId: string, options = {}) => 
    apiService.post<{ taskId: string, status: string, estimatedTime: number }>(
      API_ENDPOINTS.EFFECTS.APPLY,
      { avatarFileId, effectId, options }
    ),

  // 版权保护
  addWatermark: (avatarFileId: string, watermarkType: string, content: string, options = {}) => 
    apiService.post<{ taskId: string, resultUrl: string, status: string }>(
      API_ENDPOINTS.COPYRIGHT.WATERMARK,
      { avatarFileId, watermarkType, content, options }
    ),

  detectWatermark: (imageFileId: string) => 
    apiService.post<{ hasWatermark: boolean, watermarkInfo?: any }>(
      API_ENDPOINTS.COPYRIGHT.DETECT,
      { imageFileId }
    ),

  // 任务状态查询
  getTaskStatus: (taskId: string) => 
    apiService.get<TaskStatus>(API_ENDPOINTS.AI.TASK_STATUS(taskId)),

  // 保存与分享
  saveResult: (taskId: string, format = 'jpg', quality = 90, size = 'original') => 
    apiService.post<{ downloadUrl: string, expiresAt: string, fileSize: number }>(
      API_ENDPOINTS.SAVE.RESULT,
      { taskId, format, quality, size }
    ),

  createShare: (resultFileId: string, shareType = 'wechat', options = {}) => 
    apiService.post<{ shareId: string, shareUrl: string, qrCodeUrl: string, expiresAt: string }>(
      API_ENDPOINTS.SHARE.CREATE,
      { resultFileId, shareType, options }
    ),

  // 系统状态
  getSystemStatus: () => 
    apiService.get<{ aiServiceStatus: string, storageStatus: string, queueLength: number, averageProcessTime: number }>(
      API_ENDPOINTS.SYSTEM.STATUS
    ),

  getUserStats: () => 
    apiService.get<{ totalProcessed: number, todayProcessed: number, remainingQuota: number, favoriteEffects: string[] }>(
      API_ENDPOINTS.SYSTEM.USER_STATS
    ),
}

// 轮询任务状态的工具函数
export const pollTaskStatus = async (taskId: string, onProgress?: (status: TaskStatus) => void): Promise<TaskStatus> => {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await api.getTaskStatus(taskId)
        if (response.success) {
          const status = response.data
          
          if (onProgress) {
            onProgress(status)
          }

          if (status.status === 'completed') {
            resolve(status)
          } else if (status.status === 'failed') {
            reject(new Error(status.error || '处理失败'))
          } else {
            // 继续轮询
            setTimeout(poll, 2000) // 每2秒查询一次
          }
        } else {
          reject(new Error(response.message))
        }
      } catch (error) {
        reject(error)
      }
    }

    poll()
  })
}

// 错误处理工具函数
export const handleApiError = (error: any) => {
  if (error.response?.data?.message) {
    message.error(error.response.data.message)
  } else if (error.message) {
    message.error(error.message)
  } else {
    message.error('网络请求失败，请稍后重试')
  }
}

export default api 