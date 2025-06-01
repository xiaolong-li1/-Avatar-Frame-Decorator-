const QRCode = require('qrcode');
const fileStorageService = require('../services/fileStorageService');

exports.createShare = async (req, res) => {
  try {
    // 从请求体中获取imageUrl而不是resultFileId
    const { imageUrl, shareType = 'wechat' } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: '缺少图片URL' });
    }

    // 验证imageUrl是否是有效的URL
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(imageUrl)) {
      return res.status(400).json({ success: false, message: '无效的图片URL' });
    }

    // 生成分享URL (可以直接使用imageUrl或创建自己的短链接)
    const shareUrl = imageUrl;

    // 生成二维码
    const qrBuffer = await QRCode.toBuffer(shareUrl, { width: 300 });

    // 上传二维码图片
    const timestamp = Date.now();
    const filePath = `qrCodes/${timestamp}_${shareType}.png`;
    const qrCodeUrl = await fileStorageService.uploadFile(qrBuffer, filePath, 'image/png');

    // 设置过期时间
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 天后过期

    return res.json({
      success: true,
      message: '分享链接创建成功',
      data: {
        shareId: `${timestamp}`,
        shareUrl,
        qrCodeUrl,
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('生成分享链接失败:', error);
    return res.status(500).json({ success: false, message: '生成分享失败，请稍后重试' });
  }
};
