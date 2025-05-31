import React, { useState } from 'react';
import { Card, Row, Col, Button, Typography, Space, message, Divider, Progress, Spin } from 'antd';
import { DownloadOutlined, ShareAltOutlined } from '@ant-design/icons';
import AvatarUpload from '../components/AvatarUpload';
import { api, pollTaskStatus } from '../services/api';

const { Title, Paragraph } = Typography;

interface AvatarData {
  fileId: string;
  url: string;
}

interface SuperResResult {
  resultUrl?: string;
}

const AvatarSuperResolution: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<AvatarData | null>(null);
  const [superResResult, setSuperResResult] = useState<SuperResResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAvatarChange = (data: AvatarData) => {
    setUserAvatar(data);
    setSuperResResult(null);
    message.info('头像已上传，正在进行超分辨处理...');
    applySuperResolution(data.fileId);
  };
  const applySuperResolution = async (fileId: string) => {
    setIsProcessing(true);
    try {
      const response = await api.superResolution(fileId, 4, 'high');
      if (response.data.resultUrl) {
        setSuperResResult({ resultUrl: response.data.resultUrl });
        message.success('超分辨完成！');
      } else {
        throw new Error('未返回处理结果');
      }
    } catch (error) {
      message.error('超分辨处理失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };


  const handleDownload = () => {
    if (!superResResult?.resultUrl) {
      message.warning('请先完成超分辨处理');
      return;
    }
    const link = document.createElement('a');
    link.href = superResResult.resultUrl;
    link.download = 'avatar-superres.png';
    link.click();
    message.success('头像下载成功！');
  };

  const handleShare = async () => {
    if (!superResResult?.resultUrl) {
      message.warning('请先完成超分辨处理');
      return;
    }
    setIsProcessing(true);
    try {
      const shareResponse = await api.createShare(superResResult.resultUrl, 'wechat');
      message.success(`分享链接: ${shareResponse.data.shareUrl}`);
    } catch (error) {
      message.error('分享失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fade-in-up">
      <Title level={2} style={{ marginBottom: '8px' }}>
        头像超分辨
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        使用 AI 技术将您的头像进行超分辨重建，获得更清晰的图像效果
      </Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card title="上传头像">
            {!userAvatar ? (
              <AvatarUpload onImageChange={handleAvatarChange} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div
                  className="avatar-preview"
                  style={{
                    width: '200px',
                    height: '200px',
                    margin: '0 auto 16px',
                    position: 'relative',
                  }}
                >
                  {superResResult?.resultUrl ? (
                    <img
                      src={superResResult.resultUrl}
                      alt="处理后头像"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src={userAvatar.url}
                      alt="原始头像"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}

                  {isProcessing && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.3)',
                      }}
                    >
                      <Spin />
                    </div>
                  )}
                </div>

                {isProcessing && (
                  <Progress percent={progress} size="small" style={{ marginBottom: 12 }} />
                )}

                <Space>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    loading={isProcessing}
                  >
                    下载头像
                  </Button>
                  <Button
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                    loading={isProcessing}
                  >
                    分享到微信
                  </Button>
                </Space>

                <Divider />
                <Button type="link" onClick={() => setUserAvatar(null)}>
                  重新上传
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AvatarSuperResolution;
