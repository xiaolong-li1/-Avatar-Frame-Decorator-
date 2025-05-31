import { message } from 'antd'
import { API_CONFIG, API_ENDPOINTS, ApiResponse, UploadResponse, TaskStatus, Frame, ArtStyle, Effect } from '../config/api'
// 基于 Fetch 的封装类
class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // 核心请求方法：会读取 response.json() 并抛出带后端 error 字段的错误
private async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${this.baseURL}${endpoint}`;

  // 默认 headers
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 如果有 token，就附加在 headers 中
  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    // 使用 AbortController 实现超时功能
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 先尝试将 response 解析为 JSON（可能在 error 情况时也有 JSON body）
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // 如果无法解析 JSON，则 data 保持 null
    }

    if (!response.ok) {
      // 如果后端返回了 { error: 'xxx' } 或 {message: 'xxx'}，优先使用它们
      const serverMsg = data?.error || data?.message;
      console.log("🚩 进入 if (!response.ok)，后端返回的 data:", data);
      console.log("🚩 serverMsg:", serverMsg);
      throw new Error(serverMsg || `HTTP error! status: ${response.status}`);
    }

    // 如果是 204 No Content，可以直接返回空 object
    if (response.status === 204) {
      return {} as ApiResponse<T>;
    }

    // 返回解析后的 JSON
    return data as ApiResponse<T>;
  } catch (err: any) {
    // 对于网络超时、解析错误等也一并捕获
    console.error("❌ API请求失败，捕获到 err:", err);
    throw err;
  }
}

  // GET 请求
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST 请求
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT 请求
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE 请求
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // 文件上传（保持原有逻辑）
  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseURL}${endpoint}`;
    console.log('Uploading file to:', url);
    console.log('Headers:', headers);
    console.log('Additional Data:', additionalData);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed! status: ${response.status}, details: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  }
}


// 创建API服务实例
const apiService = new ApiService()

// 具体的API调用方法
export const api = {
    // 用户注册
  register: (username: string, password: string) => {
    const url = API_ENDPOINTS.AUTH.REGISTER;
    const body = { username, password };
    message.info(`POST ${url} \nRequest Body: ${JSON.stringify(body)}`);
    return apiService.post<{ token: string; user: { id: string; username: string } }>(url, body);
  },

  login: (username: string, password: string) => {
    const url = API_ENDPOINTS.AUTH.LOGIN;
    const body = { username, password };
    message.info(`POST ${url} \nRequest Body: ${JSON.stringify(body)}`);
    return apiService.post<{ token: string; user: { id: string; username: string } }>(url, body);
  },

  // 文件上传
  uploadAvatar: (file: File) => {
    console.log('Uploading avatar:', file.name); // 打印上传的文件名
    return apiService.uploadFile(API_ENDPOINTS.UPLOAD.AVATAR, file, { type: 'avatar' });
  },

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
    const url = `${API_ENDPOINTS.FRAMES.PRESET_LIST}?${params.toString()}`;
    message.info(`请求 URL: ${url}`);
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

  // AI处理功能 - 头像超分
  superResolution: (avatarFileId: string, scaleFactor: number, quality: string) =>
    apiService.post<{ resultUrl: string }>(
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

  createShare: (resultFileId: string, shareType = 'wechat', options: Record<string, any> = {}) => {
    console.log(`resultFileId: ${resultFileId}, shareType: ${shareType}, options: ${JSON.stringify(options)}`);
    return apiService.post<{ shareId: string; shareUrl: string; qrCodeUrl: string; expiresAt: string }>(
      API_ENDPOINTS.SHARE.CREATE,
      { resultFileId, shareType, options }
    );
  },

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