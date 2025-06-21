import { message } from 'antd'
import { API_CONFIG, API_ENDPOINTS, ApiResponse, UploadResponse, TaskStatus, Frame, ArtStyle } from '../config/api'
import Cookies from 'js-cookie'

// Cookie选项
const COOKIE_OPTIONS = {
  expires: 7, // 7天过期
  path: '/',
  sameSite: 'strict' as 'strict',
  secure: window.location.protocol === 'https:'
};

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

  // GET 请求 - 修改以支持查询参数
  async get<T>(endpoint: string, options?: { params?: Record<string, any> }): Promise<ApiResponse<T>> {
    let url = endpoint;
    
    // 如果有查询参数，构建查询字符串
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    
    return this.request<T>(url, { method: 'GET' });
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

  // DELETE 请求 - 修改以支持请求体数据
  async delete<T>(endpoint: string, options?: { data?: any }): Promise<ApiResponse<T>> {
    const requestOptions: RequestInit = { 
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // 如果有数据，添加到请求体
    if (options?.data) {
      requestOptions.body = JSON.stringify(options.data);
    }
    
    return this.request<T>(endpoint, requestOptions);
  }

  // 文件上传方法 - 确保字段名为 'file'
  async uploadFile<T>(endpoint: string, file: File, additionalData: Record<string, any> = {}): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file); // 确保字段名是 'file'
    
    // 添加其他数据
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    // 添加用户ID
    const userId = localStorage.getItem('userId');
    if (userId) {
      formData.append('userId', userId);
    }

    console.log('当前用户ID:', userId);
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Using token for authorization:', token.substring(0, 20) + '...');
    }

    console.log('Uploading file to:', this.baseURL + endpoint);
    console.log('Headers:', headers);
    console.log('Additional Data:', additionalData);

    try {
      const response = await fetch(this.baseURL + endpoint, {
        method: 'POST',
        body: formData,
        headers
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(`Upload failed! status: ${response.status}, details: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Upload success:', data);
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
    // 获取用户统计信息
    getUserStats: async () => {
      interface UserStatsResponse {
        userCount: number;
      }
      
      try {
        const response = await apiService.get<UserStatsResponse>(API_ENDPOINTS.AUTH.STATS);
        return response;
      } catch (error) {
        console.error("获取用户统计信息失败:", error);
        throw error;
      }
    },
    
    // 用户注册
  register: async (username: string, password: string) => {
    const url = API_ENDPOINTS.AUTH.REGISTER;
    const body = { username, password };
    try {
      const response = await apiService.post<{ token: string; user: { id: string; username: string } }>(url, body);
      
      if (response.success && response.data) {
        // 存储到Cookie
        Cookies.set('token', response.data.token, COOKIE_OPTIONS);
        Cookies.set('userId', response.data.user.id, COOKIE_OPTIONS);
        Cookies.set('username', response.data.user.username, COOKIE_OPTIONS);
        
        // 同时保留localStorage存储以兼容现有代码
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('username', response.data.user.username);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  login: async (username: string, password: string, remember: boolean = true) => {
    try {
      const response = await apiService.post<{ token: string; user: { id: string; username: string } }>(
        API_ENDPOINTS.AUTH.LOGIN, 
        { username, password }
      );
      
      if (response.success) {
        // 根据"记住我"选项设置Cookie过期时间
        const cookieOptions = remember ? COOKIE_OPTIONS : { ...COOKIE_OPTIONS, expires: 1 };
        
        // 存储到Cookie
        Cookies.set('token', response.data.token, cookieOptions);
        Cookies.set('userId', response.data.user.id, cookieOptions);
        Cookies.set('username', response.data.user.username, cookieOptions);
        
        // 同时保留localStorage存储以兼容现有代码
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('username', response.data.user.username);
        
        message.info(`欢迎回来，${response.data.user.username}！`);
        console.log('登录成功，存储用户信息:', response.data.user);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
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

  // 添加水印
  addWatermark: (params: {
    avatarFileId: string;
    watermarkType: string;
    content: string;
    options: {
      position: string;
      opacity: number;
      fontSize: number;
      color: string;
    }
  }) => {
    return apiService.post(API_ENDPOINTS.COPYRIGHT.WATERMARK, params);
  },

  // 预设头像框
  getPresetFrames: (category?: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(category && category !== 'all' && { category })
    })
    const url = `${API_ENDPOINTS.FRAMES.PRESET_LIST}?${params.toString()}`;
    // message.info(`请求 URL: ${url}`);
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
  getCustomFrames: (page = 1, limit = 20, userId?: string) => {
    // 获取当前登录用户ID或使用传入的ID
    const currentUserId = userId || localStorage.getItem('userId') || '1';
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      userId: currentUserId // 添加用户ID
    });
    
    return apiService.get<{ frames: Frame[], total: number, page: number, limit: number }>(
      `${API_ENDPOINTS.FRAMES.CUSTOM_LIST}?${params}`
    );
  },

  // 删除自定义头像框 - 确保函数名和参数正确
  deleteCustomFrame: (frameId: string, userId?: string) => {
    console.log('API调用 deleteCustomFrame:', { frameId, userId: userId || localStorage.getItem('userId') });
    return apiService.delete<{ deletedFrame: any, fileDeleteResults: any[] }>(
      API_ENDPOINTS.FRAMES.CUSTOM_DELETE(frameId),
      {
        data: { 
          userId: userId || localStorage.getItem('userId') 
        }
      }
    );
  },

  // 批量删除自定义头像框
  deleteMultipleCustomFrames: (frameIds: string[], userId?: string) => {
    console.log('API调用 deleteMultipleCustomFrames:', { frameIds, userId: userId || localStorage.getItem('userId') });
    return apiService.delete<{ 
      deletedCount: number, 
      deletedFrames: any[], 
      fileDeleteResults: any[] 
    }>(
      '/frames/custom/batch',
      {
        data: { 
          frameIds, 
          userId: userId || localStorage.getItem('userId') 
        }
      }
    );
  },

  // AI处理功能 - 头像超分
  superResolution: (avatarFileId: string, scaleFactor: number = 2, quality: string = 'high', userId?: string) =>
    apiService.post<{ resultUrl: string, taskId?: string, status: string }>(
      API_ENDPOINTS.AI.SUPER_RESOLUTION,
      { 
        avatarFileId, 
        scaleFactor, 
        quality,
        userId: userId || localStorage.getItem('userId')
      }
    ),

  // 获取艺术风格列表
  getArtStyles: () => 
    apiService.get<{ styles: ArtStyle[] }>(API_ENDPOINTS.AI.STYLES_LIST),

  // 风格迁移 - 修改参数以匹配后端
  styleTransfer: (avatarFileId: string, styleId: string, customStylePrompt?: string, userId?: string) => 
    apiService.post<{ taskId: string, resultUrl: string }>(
      API_ENDPOINTS.AI.STYLE_TRANSFER,
      { 
        avatarFileId, 
        styleId, 
        customStylePrompt, // 支持自定义风格提示词
        userId: userId || localStorage.getItem('userId') // 从localStorage获取或传入
      }
    ),
    // 获取可用风格列表
  getStylesList(): Promise<any> {
    return apiService.get('/ai/styles')
  },
  // 文本生成图像 - 修改参数以匹配后端
  textToImage: (text: string, width = 1024, height = 1024, model = 'dall-e-3', quality = 'standard', userId?: string) => 
    apiService.post<{ taskId: string, resultUrl: string }>(
      API_ENDPOINTS.AI.TEXT_TO_IMAGE,
      { 
        text, // 后端期望的是 text 而不是 prompt
        width, 
        height, 
        model, 
        quality,
        userId: userId || localStorage.getItem('userId')
      }
    ),

  // 获取文本生成图像历史记录 - 添加userId参数
  getTextToImageHistory: (page = 1, limit = 10, userId?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      userId: userId || localStorage.getItem('userId') || '' // 添加userId参数
    })
    // message.info(`请求文本生成图像历史记录: ${API_ENDPOINTS.AI.TEXT_TO_IMAGE_HISTORY}?${params}`);
    return apiService.get<{ records: any[], total: number, page: number, limit: number }>(
      `${API_ENDPOINTS.AI.TEXT_TO_IMAGE_HISTORY}?${params}`
    )
  },

  // 背景模糊 - 修改参数名称和添加userId
  backgroundBlur: (avatarFileId: string, blurLevel = 5, userId?: string) => 
    apiService.post<{ taskId: string, resultUrl: string }>(
      API_ENDPOINTS.AI.BACKGROUND_BLUR,
      { 
        avatarFileId, 
        blurLevel: blurLevel, // 后端期望的是 blurLevel 而不是 blurIntensity
        userId: userId || localStorage.getItem('userId')
      }
    ),

  // 背景替换 - 修改参数名称和添加userId
  backgroundReplace: (avatarFileId: string, backgroundDescription: string, userId?: string) => 
    apiService.post<{ taskId: string, resultUrl: string }>(
      API_ENDPOINTS.AI.BACKGROUND_REPLACE,
      { 
        avatarFileId, 
        backgroundDescription: backgroundDescription, // 后端期望的是 backgroundDescription
        userId: userId || localStorage.getItem('userId')
      }
    ),

  // 新增：获取所有AI处理历史记录
  getAIHistory: (taskType?: string, page = 1, limit = 10, userId?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      userId: userId || localStorage.getItem('userId') || ''
    })
    
    if (taskType) {
      params.append('taskType', taskType)
    }
    
    return apiService.get<{ records: any[], total: number, page: number, limit: number }>(
      `/ai/history?${params}`
    )
  },

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

  /**
 * 创建分享链接
 * @param imageUrl 要分享的图片URL
 * @param shareType 分享类型
 * @param options 其他选项
 */
  createShare: (imageUrl: string, shareType = 'wechat', options: Record<string, any> = {}) => 
  apiService.post<{ 
    shareId: string;
    shareUrl: string;
    qrCodeUrl: string;
    expiresAt: string;
  }>(
    API_ENDPOINTS.SHARE.CREATE,
    { 
      imageUrl, // 这里传递图片URL (而不是之前的resultFileId)
      shareType,
      ...options
    }
  ),

  // 系统状态
  getSystemStatus: () => 
    apiService.get<{ aiServiceStatus: string, storageStatus: string, queueLength: number, averageProcessTime: number }>(
      API_ENDPOINTS.SYSTEM.STATUS
    ),

  // 获取用户配额/统计信息（处理次数、剩余额度等）
  getUserQuotaStats: () => 
    apiService.get<{ totalProcessed: number, todayProcessed: number, remainingQuota: number, favoriteEffects: string[] }>(
      API_ENDPOINTS.SYSTEM.USER_STATS
    ),

  // 获取超分辨率历史记录
  getSuperResolutionHistory: (page = 1, limit = 10, userId?: string) => 
    apiService.get<{ records: any[], total: number, page: number, totalPages: number }>(
      `${API_ENDPOINTS.AI.SUPER_RESOLUTION}/history`,
      { 
        params: { 
          userId: userId || localStorage.getItem('userId'), 
          page, 
          limit 
        } 
      }
    ),

  // 获取风格迁移历史记录
  getStyleTransferHistory: (page = 1, limit = 10, userId?: string) => 
    apiService.get<{ records: any[], total: number, page: number, totalPages: number }>(
      `${API_ENDPOINTS.AI.STYLE_TRANSFER}/history`,
      { 
        params: { 
          userId: userId || localStorage.getItem('userId'), 
          page, 
          limit 
        } 
      }
    ),

  // 获取背景模糊历史记录
  getBackgroundBlurHistory: (page = 1, limit = 10, userId?: string) => 
    apiService.get<{ records: any[], total: number, page: number, totalPages: number }>(
      `${API_ENDPOINTS.AI.BACKGROUND_BLUR}/history`,
      { 
        params: { 
          userId: userId || localStorage.getItem('userId'), 
          page, 
          limit 
        } 
      }
    ),

  // 获取背景替换历史记录
  getBackgroundReplaceHistory: (page = 1, limit = 10, userId?: string) => 
    apiService.get<{ records: any[], total: number, page: number, totalPages: number }>(
      `${API_ENDPOINTS.AI.BACKGROUND_REPLACE}/history`,
      { 
        params: { 
          userId: userId || localStorage.getItem('userId'), 
          page, 
          limit 
        } 
      }
    ),

  // 删除单个AI记录
  deleteAIRecord: (recordId: string, userId?: string) => 
    apiService.delete<{ deletedRecord: any }>(
      API_ENDPOINTS.AI.DELETE_RECORD(recordId),
      {
        data: { 
          userId: userId || localStorage.getItem('userId') 
        }
      }
    ),

  // 批量删除AI记录
  deleteMultipleAIRecords: (recordIds: string[], userId?: string) => 
    apiService.delete<{ 
      deletedCount: number, 
      deletedRecords: any[], 
      fileDeleteResults: any[] 
    }>(
      API_ENDPOINTS.AI.DELETE_BATCH,
      {
        data: { 
          recordIds, 
          userId: userId || localStorage.getItem('userId') 
        }
      }
    ),

  // 删除所有AI记录
  deleteAllAIRecords: (taskType?: string, userId?: string) => 
    apiService.delete<{ 
      deletedCount: number, 
      taskType: string, 
      fileDeleteResults: any[] 
    }>(
      API_ENDPOINTS.AI.DELETE_ALL,
      {
        data: { 
          taskType, 
          userId: userId || localStorage.getItem('userId') 
        }
      }
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