import React, { useState, useEffect } from 'react';
import { Modal, Spin, Typography, Button, Space } from 'antd';
import { QrcodeOutlined, MobileOutlined, CloseOutlined } from '@ant-design/icons';
import { shareToWeChat, WeChatShareMode, isMobileDevice, isWeChatBrowser } from '../utils/shareUtils';

const { Title, Paragraph, Text } = Typography;

interface WeChatShareModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  desc?: string;
  imageUrl?: string;
  linkUrl?: string;
}

const WeChatShareModal: React.FC<WeChatShareModalProps> = ({
  visible,
  onClose,
  title = '分享自WeFrame微信头像处理系统',
  desc = '我用WeFrame制作了一个精美的头像，快来看看吧！',
  imageUrl,
  linkUrl
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [shareMode, setShareMode] = useState<WeChatShareMode>(
    isMobileDevice() 
      ? (isWeChatBrowser() ? WeChatShareMode.MOBILE_APP : WeChatShareMode.WEB_DIALOG)
      : WeChatShareMode.QR_CODE
  );

  useEffect(() => {
    if (visible && shareMode === WeChatShareMode.QR_CODE) {
      generateQRCode();
    }
  }, [visible, shareMode]);

  const generateQRCode = async () => {
    if (!visible) return;
    
    setLoading(true);
    try {
      const qrUrl = await shareToWeChat({
        mode: WeChatShareMode.QR_CODE,
        title,
        desc,
        imageUrl,
        linkUrl
      });
      
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('生成分享二维码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    setLoading(true);
    
    try {
      await shareToWeChat({
        mode: shareMode,
        title,
        desc,
        imageUrl,
        linkUrl
      });
      
      if (shareMode === WeChatShareMode.MOBILE_APP || shareMode === WeChatShareMode.WEB_DIALOG) {
        onClose();
      }
    } catch (error) {
      console.error('分享失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 16 }}>
            正在准备分享...
          </Paragraph>
        </div>
      );
    }

    switch (shareMode) {
      case WeChatShareMode.QR_CODE:
        return (
          <div style={{ textAlign: 'center' }}>
            <Title level={4}>微信扫码分享</Title>
            <Paragraph>
              <Text type="secondary">使用微信扫描下方二维码</Text>
            </Paragraph>
            
            <div style={{ 
              margin: '20px auto', 
              padding: '10px', 
              background: '#fff', 
              width: 'fit-content',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              borderRadius: '4px'
            }}>
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="微信分享二维码" 
                  style={{ width: 200, height: 200 }} 
                />
              ) : (
                <Spin />
              )}
            </div>
            
            <Paragraph>
              <Text type="secondary">扫描后在微信中打开并分享给好友</Text>
            </Paragraph>

            {!isWeChatBrowser() && isMobileDevice() && (
              <Button 
                type="link" 
                icon={<MobileOutlined />}
                onClick={() => setShareMode(WeChatShareMode.WEB_DIALOG)}
              >
                使用其他方式分享
              </Button>
            )}
          </div>
        );
        
      case WeChatShareMode.WEB_DIALOG:
      case WeChatShareMode.MOBILE_APP:
        return (
          <div style={{ textAlign: 'center' }}>
            <Title level={4}>分享到微信</Title>
            
            {imageUrl && (
              <div style={{ margin: '20px auto', width: '200px', height: '200px' }}>
                <img 
                  src={imageUrl} 
                  alt="分享图片预览" 
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }} 
                />
              </div>
            )}
            
            <Paragraph style={{ margin: '20px 0' }}>
              {isWeChatBrowser() ? '点击下方按钮，分享给微信好友或朋友圈' : '点击下方按钮，打开分享页面'}
            </Paragraph>
            
            <Button 
              type="primary" 
              size="large"
              onClick={handleShare}
              block
            >
              立即分享
            </Button>
            
            {isMobileDevice() && !isWeChatBrowser() && (
              <Button 
                type="link" 
                icon={<QrcodeOutlined />}
                onClick={() => setShareMode(WeChatShareMode.QR_CODE)}
                style={{ marginTop: '16px' }}
              >
                使用二维码分享
              </Button>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={400}
      centered
      closeIcon={<CloseOutlined />}
      bodyStyle={{ padding: '24px 24px 32px' }}
    >
      {renderContent()}
    </Modal>
  );
};

export default WeChatShareModal; 