import React, { useState } from 'react';
import { Card, Row, Col, Button, Typography, Space, message, Divider, Slider, Select, Modal, Spin } from 'antd';
import { DownloadOutlined, ShareAltOutlined, ZoomInOutlined, HistoryOutlined } from '@ant-design/icons';
import AvatarUpload from '../components/AvatarUpload';
import { api, handleApiError } from '../services/api';

const { Title, Paragraph } = Typography;
const { Option } = Select;

interface AvatarData {
  fileId: string;
  url: string;
}

interface SuperResResult {
  resultUrl?: string;
  taskId?: string;
}

const SuperResolution: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<AvatarData | null>(null);
  const [superResResult, setSuperResResult] = useState<SuperResResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(2);
  const [quality, setQuality] = useState<string>('high');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareData, setShareData] = useState<{
    shareUrl: string;
    qrCodeUrl: string;
    expiresAt: string;
  } | null>(null);

  const handleAvatarChange = (data: AvatarData) => {
    setUserAvatar(data);
    setSuperResResult(null);
    message.info('头像已上传，点击"开始处理"进行超分辨增强');
  };

  const applySuperResolution = async () => {
    if (!userAvatar || !userAvatar.fileId) {
      message.warning('请先上传头像图片');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('开始超分辨处理:', {
        fileId: userAvatar.fileId,
        scaleFactor,
        quality
      });

      const response = await api.superResolution(userAvatar.fileId, scaleFactor, quality);
      
      if (response.success && response.data.resultUrl) {
        setSuperResResult({ 
          resultUrl: response.data.resultUrl, 
          taskId: response.data.taskId 
        });
        message.success('超分辨处理完成！图像质量已显著提升');
      } else {
        throw new Error(response.message || '超分辨处理失败');
      }
    } catch (error) {
      console.error('超分辨处理失败:', error);
      handleApiError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!superResResult?.resultUrl) {
      message.warning('请先完成超分辨处理');
      return;
    }

    try {
      const response = await fetch(superResResult.resultUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `super-resolution-${scaleFactor}x-${quality}-${Date.now()}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      message.success('超分辨头像下载成功！');
    } catch (error) {
      console.error('下载失败:', error);
      message.error('下载失败，请稍后重试');
    }
  };

  const handleShare = async () => {
    if (!superResResult?.resultUrl) {
      message.warning('请先完成超分辨处理');
      return;
    }
    
    try {
      const response = await api.createShare(superResResult.resultUrl, 'wechat', {
        resultFileId: superResResult.resultUrl,
        description: `我用AI超分辨技术将头像提升到${scaleFactor}x分辨率！`
      });
      
      if (response.success && response.data) {
        setShareModalVisible(true);
        setShareData(response.data);
        message.success('分享链接创建成功');
      } else {
        throw new Error(response.message || '创建分享失败');
      }
    } catch (error) {
      console.error('分享失败:', error);
      handleApiError(error);
    }
  };

  return (
    <div className="fade-in-up">
      <Title level={2} style={{ marginBottom: '8px' }}>
        AI超分辨增强
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        使用 AI 技术将您的头像进行超分辨重建，获得更清晰、更高质量的图像效果
      </Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card title="上传头像" style={{ marginBottom: '16px' }}>
            {!userAvatar ? (
              <AvatarUpload onImageChange={handleAvatarChange} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div
                  className="avatar-preview"
                  style={{
                    width: '240px',
                    height: '240px',
                    margin: '0 auto 16px',
                    position: 'relative',
                  }}
                >
                  <img
                    src={superResResult?.resultUrl || userAvatar.url}
                    alt="头像预览"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />

                  {isProcessing && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.7)',
                        borderRadius: '8px',
                      }}
                    >
                      <Spin size="large" />
                      <span style={{ color: '#fff', marginTop: '12px' }}>
                        AI增强处理中...
                      </span>
                    </div>
                  )}
                </div>

                <Space>
                  <Button
                    type="primary"
                    icon={<ZoomInOutlined />}
                    onClick={applySuperResolution}
                    loading={isProcessing}
                    disabled={isProcessing}
                  >
                    开始处理
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    disabled={!superResResult?.resultUrl}
                  >
                    下载头像
                  </Button>
                  <Button
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                    disabled={!superResResult?.resultUrl}
                  >
                    分享到微信
                  </Button>
                </Space>

                <Divider />
                <Button 
                  type="link" 
                  onClick={() => {
                    setUserAvatar(null);
                    setSuperResResult(null);
                  }}
                >
                  重新上传
                </Button>
              </div>
            )}
          </Card>

          {/* 效果对比卡片 */}
          {superResResult?.resultUrl && (
            <Card title="效果对比">
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', marginBottom: '4px', color: '#666' }}>原图</div>
                    <img 
                      src={userAvatar?.url} 
                      alt="原图" 
                      style={{ 
                        width: '100%', 
                        height: '80px', 
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', marginBottom: '4px', color: '#666' }}>
                      超分辨({scaleFactor}x)
                    </div>
                    <img 
                      src={superResResult.resultUrl} 
                      alt="超分辨效果" 
                      style={{ 
                        width: '100%', 
                        height: '80px', 
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={14}>
          <Card title="处理参数设置">
            {/* 添加历史记录按钮 */}
            <div style={{ marginBottom: '16px', textAlign: 'right' }}>
              <Button 
                icon={<HistoryOutlined />} 
                onClick={() => window.open('/ai-history', '_blank')}
              >
                查看历史记录
              </Button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Title level={5}>放大倍数: {scaleFactor}x</Title>
              <Slider
                min={1}
                max={4}
                step={1}
                value={scaleFactor}
                onChange={setScaleFactor}
                marks={{
                  1: '1x',
                  2: '2x',
                  3: '3x',
                  4: '4x'
                }}
                disabled={isProcessing}
              />
              <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                选择图像放大倍数，倍数越高处理时间越长
              </Paragraph>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Title level={5}>处理质量</Title>
              <Select
                value={quality}
                onChange={setQuality}
                style={{ width: '100%' }}
                disabled={isProcessing}
              >
                <Option value="standard">标准质量 (快速)</Option>
                <Option value="high">高质量 (推荐)</Option>
                <Option value="ultra">超高质量 (较慢)</Option>
              </Select>
              <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                质量越高，处理效果越好，但耗时更长
              </Paragraph>
            </div>

            <Card size="small" style={{ backgroundColor: '#f8f9fa' }}>
              <Title level={5} style={{ color: '#1890ff', marginBottom: '8px' }}>
                💡 使用提示
              </Title>
              <ul style={{ fontSize: '13px', color: '#666', paddingLeft: '20px' }}>
                <li>建议上传清晰度较好的原图，效果更佳</li>
                <li>人像图片的超分辨效果通常最好</li>
                <li>处理时间约30-60秒，请耐心等待</li>
                <li>支持JPG、PNG等常见格式</li>
              </ul>
            </Card>
          </Card>
        </Col>
      </Row>

      {/* 分享二维码弹窗 */}
      <Modal
        title="微信分享"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setShareModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="copy" 
            type="primary" 
            onClick={() => {
              if (shareData) {
                navigator.clipboard.writeText(shareData.shareUrl);
                message.success('链接已复制到剪贴板');
              }
            }}
          >
            复制链接
          </Button>
        ]}
      >
        {shareData && (
          <div style={{ textAlign: 'center' }}>
            <img 
              src={shareData.qrCodeUrl} 
              alt="分享二维码" 
              style={{ maxWidth: '100%', height: 'auto', marginBottom: 16 }} 
            />
            <p>扫描二维码查看您的超分辨头像</p>
            <p style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
              链接有效期至: {new Date(shareData.expiresAt).toLocaleString()}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperResolution;
