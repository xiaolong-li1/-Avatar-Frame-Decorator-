// 静态资源配置
export const STATIC_URL = (import.meta as any).env?.VITE_STATIC_URL || 'http://localhost:8081';

// 获取静态资源URL
export const getStaticUrl = (path: string): string => {
  // 如果路径已经是完整URL，则直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 确保路径以/开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // 尝试使用相对路径
  // 如果后端服务不可用，直接返回相对路径
  try {
    const testImg = new Image();
    testImg.src = `${STATIC_URL}${normalizedPath}`;
    return `${STATIC_URL}${normalizedPath}`;
  } catch (error) {
    console.warn('静态资源服务器可能不可用，使用相对路径');
    return normalizedPath;
  }
};

export default {
  STATIC_URL,
  getStaticUrl
}; 