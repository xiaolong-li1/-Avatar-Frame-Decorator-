/**
 * 将图像绘制为圆形
 * @param ctx - Canvas上下文
 * @param img - 图像元素
 * @param x - X坐标
 * @param y - Y坐标
 * @param size - 尺寸
 */
export const drawCircularImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number
): void => {
  // 保存当前上下文状态
  ctx.save();
  
  // 创建圆形裁剪区域
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  
  // 绘制图像
  ctx.drawImage(img, x, y, size, size);
  
  // 恢复上下文状态
  ctx.restore();
};

/**
 * 检测图像是否有透明背景
 * @param img - 图像元素
 * @returns boolean - 是否有透明背景
 */
export const hasTransparentBackground = (img: HTMLImageElement): boolean => {
  // 创建临时Canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return false;
  
  // 绘制图像
  ctx.drawImage(img, 0, 0);
  
  // 检查边缘像素的透明度
  const checkPoints = [
    { x: 0, y: 0 }, // 左上
    { x: img.width - 1, y: 0 }, // 右上
    { x: 0, y: img.height - 1 }, // 左下
    { x: img.width - 1, y: img.height - 1 }, // 右下
    { x: Math.floor(img.width / 2), y: Math.floor(img.height / 2) } // 中心
  ];
  
  // 如果至少有3个检查点是透明的，认为图像有透明背景
  let transparentCount = 0;
  for (const point of checkPoints) {
    const pixel = ctx.getImageData(point.x, point.y, 1, 1).data;
    if (pixel[3] < 200) { // alpha通道值小于200认为是透明的
      transparentCount++;
    }
  }
  
  return transparentCount >= 3;
};

/**
 * 合成头像和头像框
 * @param avatarUrl - 头像URL
 * @param frameUrl - 头像框URL
 * @param size - 输出尺寸
 * @param frameOpacity - 头像框透明度 (0-1)
 * @returns Promise<Blob> - 合成后的图像Blob
 */
export const composeAvatarWithFrame = (
  avatarUrl: string,
  frameUrl: string,
  size: number = 512,
  frameOpacity: number = 1
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // 创建Canvas
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'));
        return;
      }
      
      // 设置透明背景
      ctx.clearRect(0, 0, size, size);
      
      // 加载头像
      const avatarImg = new Image();
      avatarImg.crossOrigin = 'anonymous'; // 允许跨域图像
      
      avatarImg.onload = () => {
        // 计算头像的缩放和位置，确保头像居中且填满圆形区域
        const scale = Math.max(size / avatarImg.width, size / avatarImg.height);
        const scaledWidth = avatarImg.width * scale;
        const scaledHeight = avatarImg.height * scale;
        const offsetX = (size - scaledWidth) / 2;
        const offsetY = (size - scaledHeight) / 2;
        
        // 创建圆形裁剪区域
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // 绘制头像，确保完全覆盖圆形区域
        ctx.drawImage(avatarImg, offsetX, offsetY, scaledWidth, scaledHeight);
        
        // 加载头像框
        const frameImg = new Image();
        frameImg.crossOrigin = 'anonymous';
        
        frameImg.onload = () => {
          // 设置头像框透明度
          ctx.globalAlpha = frameOpacity;
          
          // 检测头像框是否有透明背景，如果没有，尝试使用不同的合成模式
          const hasTransparent = hasTransparentBackground(frameImg);
          
          if (!hasTransparent) {
            // 如果头像框没有透明背景，使用"源图像在顶部"的合成模式
            ctx.globalCompositeOperation = 'source-atop';
          }
          
          // 绘制头像框
          ctx.drawImage(frameImg, 0, 0, size, size);
          
          // 恢复默认合成模式
          ctx.globalCompositeOperation = 'source-over';
          
          // 恢复透明度
          ctx.globalAlpha = 1;
          
          // 导出为Blob，只包含圆形区域
          // 创建一个新的Canvas，只保留圆形区域
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = size;
          finalCanvas.height = size;
          const finalCtx = finalCanvas.getContext('2d');
          
          if (!finalCtx) {
            reject(new Error('无法创建最终Canvas上下文'));
            return;
          }
          
          // 设置透明背景
          finalCtx.clearRect(0, 0, size, size);
          
          // 将原始Canvas的内容绘制到新Canvas上，但只保留圆形区域
          finalCtx.save();
          finalCtx.beginPath();
          finalCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          finalCtx.closePath();
          finalCtx.clip();
          finalCtx.drawImage(canvas, 0, 0, size, size);
          finalCtx.restore();
          
          // 导出为Blob
          finalCanvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('无法导出图像'));
            }
          }, 'image/png');
        };
        
        frameImg.onerror = () => {
          reject(new Error('头像框加载失败'));
        };
        
        frameImg.src = frameUrl;
      };
      
      avatarImg.onerror = () => {
        reject(new Error('头像加载失败'));
      };
      
      avatarImg.src = avatarUrl;
    } catch (error) {
      reject(error);
    }
  });
}; 