interface FrameConfig {
  id: string;
  name: string;
  category: string;
  color: string;
  previewSize: number;
  frameSize: number;
  borderWidth: number;
  previewBorderWidth: number;
}

/**
 * 创建圆形SVG头像框
 * @param {string} color - 边框颜色
 * @param {number} size - 图像大小
 * @param {number} borderWidth - 边框宽度
 * @returns {string} - SVG字符串
 */
export const createCircularFrameSVG = (color: string, size: number = 512, borderWidth: number = 20): string => {
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - borderWidth/2}" 
        fill="none" 
        stroke="${color}" 
        stroke-width="${borderWidth}"/>
    </svg>
  `;
};

/**
 * 创建圆形头像框的Data URL
 * @param {string} color - 边框颜色
 * @param {number} size - 图像大小
 * @param {number} borderWidth - 边框宽度
 * @returns {string} - Data URL
 */
export const createCircularFrameDataURL = (color: string, size: number = 512, borderWidth: number = 20): string => {
  const svg = createCircularFrameSVG(color, size, borderWidth);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
};

/**
 * 获取预设圆形头像框
 * @returns {Array} - 预设头像框数组
 */
export const getPresetCircularFrames = (): FrameConfig[] => {
  return [
    {
      id: 'spring_festival',
      name: '春节主题',
      category: '节日',
      color: '#FF4D4F',
      previewSize: 200,
      frameSize: 512,
      borderWidth: 24,
      previewBorderWidth: 10
    },
    {
      id: 'valentine',
      name: '情人节',
      category: '节日',
      color: '#FF85C0',
      previewSize: 200,
      frameSize: 512,
      borderWidth: 24,
      previewBorderWidth: 10
    },
    {
      id: 'christmas',
      name: '圣诞节',
      category: '节日',
      color: '#52C41A',
      previewSize: 200,
      frameSize: 512,
      borderWidth: 24,
      previewBorderWidth: 10
    },
    {
      id: 'golden_classic',
      name: '金色经典',
      category: '经典',
      color: '#FAAD14',
      previewSize: 200,
      frameSize: 512,
      borderWidth: 24,
      previewBorderWidth: 10
    },
    {
      id: 'neon_glow',
      name: '霓虹光效',
      category: '时尚',
      color: '#722ED1',
      previewSize: 200,
      frameSize: 512,
      borderWidth: 24,
      previewBorderWidth: 10
    },
    {
      id: 'vintage_film',
      name: '复古胶片',
      category: '复古',
      color: '#8C8C8C',
      previewSize: 200,
      frameSize: 512,
      borderWidth: 24,
      previewBorderWidth: 10
    }
  ];
}; 