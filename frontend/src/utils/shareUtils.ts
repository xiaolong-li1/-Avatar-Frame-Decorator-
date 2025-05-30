import QRCode from 'qrcode';

/**
 * 微信分享模式
 */
export enum WeChatShareMode {
  QR_CODE = 'qrcode', // 生成二维码分享
  WEB_DIALOG = 'web_dialog', // 网页对话框分享
  MOBILE_APP = 'mobile_app' // 移动应用分享
}

/**
 * 分享到微信的选项
 */
export interface WeChatShareOptions {
  mode?: WeChatShareMode;
  title?: string;
  desc?: string;
  imageUrl?: string;
  linkUrl?: string;
  qrSize?: number;
}

/**
 * 检测当前环境是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * 检测当前环境是否为微信浏览器
 * @returns {boolean} 是否为微信浏览器
 */
export const isWeChatBrowser = (): boolean => {
  return /MicroMessenger/i.test(navigator.userAgent);
};

/**
 * 生成二维码
 * @param {string} content - 二维码内容
 * @param {number} size - 二维码大小
 * @returns {Promise<string>} 二维码数据URL
 */
export const generateQRCode = async (content: string, size: number = 200): Promise<string> => {
  try {
    return await QRCode.toDataURL(content, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (error) {
    console.error('生成二维码失败:', error);
    throw error;
  }
};

/**
 * 创建临时图片URL
 * @param {Blob} blob - 图片Blob数据
 * @returns {string} 临时图片URL
 */
export const createTempImageUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

/**
 * 分享到微信
 * @param {WeChatShareOptions} options - 分享选项
 * @returns {Promise<string>} 分享结果
 */
export const shareToWeChat = async (options: WeChatShareOptions): Promise<string> => {
  const {
    mode = isMobileDevice() ? (isWeChatBrowser() ? WeChatShareMode.MOBILE_APP : WeChatShareMode.WEB_DIALOG) : WeChatShareMode.QR_CODE,
    title = '分享自WeFrame微信头像处理系统',
    desc = '我用WeFrame制作了一个精美的头像，快来看看吧！',
    imageUrl,
    linkUrl = window.location.href,
    qrSize = 300
  } = options;

  switch (mode) {
    case WeChatShareMode.QR_CODE:
      // 创建包含图片的临时页面URL
      const shareUrl = imageUrl 
        ? `${linkUrl}?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(desc)}&img=${encodeURIComponent(imageUrl)}`
        : linkUrl;
      
      // 生成二维码
      const qrCodeDataUrl = await generateQRCode(shareUrl, qrSize);
      return qrCodeDataUrl;

    case WeChatShareMode.WEB_DIALOG:
      // 打开一个新窗口，引导用户手动分享
      const shareWindowUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(linkUrl)}&title=${encodeURIComponent(title)}&pic=${encodeURIComponent(imageUrl || '')}`;
      window.open(shareWindowUrl, '_blank', 'width=700,height=500');
      return 'dialog_opened';

    case WeChatShareMode.MOBILE_APP:
      // 如果在微信浏览器中，尝试调用微信分享API
      if (isWeChatBrowser() && window.wx) {
        // 注意：这需要微信JSSDK的支持，通常需要后端配合
        // 这里只是一个示例框架，实际实现需要微信公众号的配置
        window.wx.ready(() => {
          window.wx.updateAppMessageShareData({
            title,
            desc,
            link: linkUrl,
            imgUrl: imageUrl || '',
            success: function () {
              console.log('分享设置成功');
            }
          });
        });
        return 'wx_share_ready';
      }
      
      // 如果不是微信浏览器，回退到二维码模式
      return shareToWeChat({
        ...options,
        mode: WeChatShareMode.QR_CODE
      });

    default:
      throw new Error(`不支持的分享模式: ${mode}`);
  }
};

// 为微信JSSDK扩展Window接口
declare global {
  interface Window {
    wx?: any;
  }
} 