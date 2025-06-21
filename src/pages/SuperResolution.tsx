import React, { useState, useEffect } from 'react';
import usePersistedState from '../hooks/usePersistedState';
import { Card, Row, Col, Button, Typography, Space, message, Divider, Slider, Select, Modal, Spin } from 'antd';
import { DownloadOutlined, ShareAltOutlined, ZoomInOutlined, HistoryOutlined, LoadingOutlined, BgColorsOutlined } from '@ant-design/icons';
import AvatarUpload from '../components/AvatarUpload';
import { api, handleApiError } from '../services/api';
import { useAITask } from '../contexts/AITaskContext';

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
  const [userAvatar, setUserAvatar] = usePersistedState<AvatarData | null>('super-resolution-avatar', null);
  const [superResResult, setSuperResResult] = useState<SuperResResult | null>(null);
  const [scaleFactor, setScaleFactor] = useState(2);
  const [quality, setQuality] = useState<string>('high');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareData, setShareData] = useState<{
    shareUrl: string;
    qrCodeUrl: string;
    expiresAt: string;
  } | null>(null);

  // 使用AI任务管理
  const { startTask, getTasksByType, isTaskRunning } = useAITask();
  const isProcessing = isTaskRunning('super-resolution');

  const handleAvatarChange = (data: AvatarData) => {
    setUserAvatar(data);
    setSuperResResult(null);
    message.info('头像已上传，点击"开始处理"进行超分辨增强');
  };

  // 检查是否有已完成的超分辨率任务
  useEffect(() => {
    const tasks = getTasksByType('super-resolution');
    const completedTask = tasks.find(task => task.status === 'completed');
    
    if (completedTask && completedTask.result?.resultUrl) {
      setSuperResResult({
        resultUrl: completedTask.result.resultUrl,
        taskId: completedTask.id
      });
    }
  }, [getTasksByType]);

  const applySuperResolution = async () => {
    if (!userAvatar || !userAvatar.fileId) {
      message.warning('请先上传头像图片');
      return;
    }

    if (isProcessing) {
      message.info('已有超分辨率任务正在处理中，请稍候...');
      return;
    }

    try {
      const taskId = await startTask('super-resolution', {
        fileId: userAvatar.fileId,
        scaleFactor,
        quality
      });

      console.log('超分辨率任务已启动:', taskId);
    } catch (error) {
      console.error('启动超分辨率任务失败:', error);
      handleApiError(error);
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
        {/* 左侧：上传和参数设置 */}
        <Col xs={24} lg={8}>
          <Card title="上传头像" style={{ marginBottom: '24px' }}>
            {!userAvatar ? (
              <AvatarUpload onImageChange={handleAvatarChange} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '200px',
                  height: '200px',
                  margin: '0 auto 16px',
                  border: '2px solid #e8e8e8',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={userAvatar.url} 
                    alt="用户头像" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'cover'
                    }}
                  />
                </div>
                
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Button 
                    type="text" 
                    size="small"
                    onClick={() => setUserAvatar(null)}
                  >
                    重新上传
                  </Button>
                </Space>

                <Divider />
                
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={isProcessing ? <LoadingOutlined /> : <BgColorsOutlined />}
                    onClick={applySuperResolution}
                    disabled={isProcessing}
                    style={{ width: '100%' }}
                  >
                    {isProcessing ? '处理中...' : '开始超分辨处理'}
                  </Button>
                  
                  {superResResult?.resultUrl && (
                    <Space size="small" style={{ width: '100%' }}>
                      <Button
                        type="default"
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                        style={{ flex: 1 }}
                      >
                        下载
                      </Button>
                      <Button
                        type="default"
                        icon={<ShareAltOutlined />}
                        onClick={handleShare}
                        style={{ flex: 1 }}
                      >
                        分享
                      </Button>
                    </Space>
                  )}
                </Space>
              </div>
            )}
          </Card>

          {/* 参数设置卡片 */}
          <Card title="处理参数" style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ fontWeight: 'bold' }}>放大倍数</span>
                <span style={{ 
                  color: '#1890ff', 
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  {scaleFactor}x
                </span>
              </div>
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
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                fontWeight: 'bold',
                marginBottom: '12px'
              }}>
                处理质量
              </div>
              <Select
                value={quality}
                onChange={setQuality}
                style={{ width: '100%' }}
                disabled={isProcessing}
                size="large"
              >
                <Option value="standard">标准质量（快速）</Option>
                <Option value="high">高质量（推荐）</Option>
                <Option value="ultra">超高质量（较慢）</Option>
              </Select>
            </div>

            {/* 使用提示 */}
            <div style={{ 
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                color: '#1890ff', 
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                💡 使用提示
              </div>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '16px',
                fontSize: '12px',
                color: '#666',
                lineHeight: '1.5'
              }}>
                <li>建议上传清晰的正面头像照片</li>
                <li>处理时间：1-3分钟（根据参数而定）</li>
                <li>支持最大 4 倍分辨率提升</li>
              </ul>
            </div>

            {/* 历史记录按钮 */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Button 
                icon={<HistoryOutlined />} 
                onClick={() => window.open('/ai-history', '_blank')}
                style={{ width: '100%' }}
              >
                查看历史记录
              </Button>
            </div>
          </Card>
        </Col>

        {/* 右侧：效果展示 */}
        <Col xs={24} lg={16}>
          {superResResult?.resultUrl ? (
            /* 有结果时显示对比效果 */
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ZoomInOutlined style={{ color: '#1890ff' }} />
                  <span>超分辨效果对比</span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#1890ff',
                    backgroundColor: '#e6f7ff',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    {scaleFactor}x 增强
                  </span>
                </div>
              }
            >
              <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      marginBottom: '12px', 
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <span>原图</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '280px',
                      border: '2px solid #e8e8e8',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#fafafa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => {
                      Modal.info({
                        title: '原图预览',
                        width: '80%',
                        style: { maxWidth: '800px' },
                        content: (
                          <div style={{ textAlign: 'center' }}>
                            <img 
                              src={userAvatar?.url} 
                              alt="原图放大预览" 
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '70vh',
                                objectFit: 'contain'
                              }} 
                            />
                          </div>
                        ),
                        okText: '关闭'
                      });
                    }}
                    >
                      <img 
                        src={userAvatar?.url} 
                        alt="原图" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '12px', 
                      color: '#999' 
                    }}>
                      点击查看大图
                    </div>
                  </div>
                </Col>
                
                <Col xs={24} sm={12}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      marginBottom: '12px', 
                      color: '#1890ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <ZoomInOutlined />
                      <span>超分辨结果</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '280px',
                      border: '3px solid #1890ff',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#fafafa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(24, 144, 255, 0.15)',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => {
                      Modal.info({
                        title: `超分辨效果预览 (${scaleFactor}x)`,
                        width: '80%',
                        style: { maxWidth: '800px' },
                        content: (
                          <div style={{ textAlign: 'center' }}>
                            <img 
                              src={superResResult.resultUrl} 
                              alt="超分辨放大预览" 
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '70vh',
                                objectFit: 'contain'
                              }} 
                            />
                            <div style={{ 
                              marginTop: '12px', 
                              fontSize: '14px', 
                              color: '#1890ff' 
                            }}>
                              分辨率提升 {scaleFactor}x • 质量：{quality === 'standard' ? '标准' : quality === 'high' ? '高质量' : '超高质量'}
                            </div>
                          </div>
                        ),
                        okText: '关闭'
                      });
                    }}
                    >
                      <img 
                        src={superResResult.resultUrl} 
                        alt="超分辨效果" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '12px', 
                      color: '#1890ff',
                      fontWeight: 'bold'
                    }}>
                      点击查看大图 • 分辨率提升{scaleFactor}倍
                    </div>
                  </div>
                </Col>
              </Row>
              
              {/* 质量提升指标 */}
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div style={{ 
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                      {scaleFactor}x
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      分辨率提升
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ 
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: '#e6f7ff',
                    border: '1px solid #91d5ff',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                      {quality === 'standard' ? '标准' : quality === 'high' ? '高' : '超高'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      处理质量
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ 
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: '#fff2e8',
                    border: '1px solid #ffbb96',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa541c' }}>
                      AI
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      智能增强
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          ) : (
            /* 无结果时显示引导界面 */
            <Card>
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: '#999'
              }}>
                <ZoomInOutlined style={{ fontSize: '64px', marginBottom: '24px' }} />
                <Title level={4} type="secondary">
                  AI超分辨增强预览
                </Title>
                <Paragraph type="secondary">
                  上传头像并设置参数后，这里将显示超分辨效果对比
                </Paragraph>
                
                {/* 功能特点展示 */}
                <Row gutter={[16, 16]} style={{ marginTop: '40px' }}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '32px', 
                        marginBottom: '8px',
                        color: '#52c41a'
                      }}>
                        🔍
                      </div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        细节增强
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        AI智能识别并增强图像细节
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '32px', 
                        marginBottom: '8px',
                        color: '#1890ff'
                      }}>
                        ⚡
                      </div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        快速处理
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        1-3分钟完成超分辨处理
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '32px', 
                        marginBottom: '8px',
                        color: '#fa541c'
                      }}>
                        🎯
                      </div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        高质量
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        最高支持4倍分辨率提升
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          )}
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
              链接有效期至: {shareData.expiresAt}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperResolution;
