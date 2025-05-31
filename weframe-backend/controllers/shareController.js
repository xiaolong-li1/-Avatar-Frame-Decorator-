const QRCode = require('qrcode');
const fileStorageService = require('../services/fileStorageService');

exports.createShare = async (req, res) => {
  const { resultFileId, shareType = 'wechat' } = req.body;

  if (!resultFileId || !/^https?:\/\/.+/.test(resultFileId)) {
    return res.status(400).json({ success: false, message: '无效的 resultFileId' });
  }

  try {
    // 1. 生成二维码 Buffer
    const qrBuffer = await QRCode.toBuffer(resultFileId, { width: 300 });

    // 2. 上传二维码图片
    const timestamp = Date.now();
    const filePath = `qrCodes/${timestamp}_${shareType}.png`;
    const qrCodeUrl = await fileStorageService.uploadFile(qrBuffer, filePath, 'image/png');

    // 3. 返回分享信息
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 天有效期

    return res.json({
      success: true,
      code: 200,
      message: '分享链接创建成功',
      data: {
        shareId: `${timestamp}`,
        shareUrl: resultFileId,
        qrCodeUrl,
        expiresAt
      }
    });
  } catch (error) {
    console.error('❌ 生成分享链接失败:', error);
    return res.status(500).json({ success: false, message: '生成分享失败，请稍后重试' });
  }
};
