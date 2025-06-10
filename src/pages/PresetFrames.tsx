import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Space, message, Divider, Spin, Modal } from 'antd';
import { DownloadOutlined, ShareAltOutlined,QrcodeOutlined } from '@ant-design/icons';
import AvatarUpload from '../components/AvatarUpload';
import { api, pollTaskStatus } from '../services/api';

const { Title, Paragraph } = Typography;

interface FrameTemplate {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  frameUrl: string;
}

interface AvatarData {
  fileId: string;
  url: string;
}

interface AppliedResult {
  resultUrl?: string;
}

const PresetFrames: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<AvatarData | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameTemplate | null>(null);
  const [appliedResult, setAppliedResult] = useState<AppliedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [frames, setFrames] = useState<FrameTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const categories = ['全部', '节日', '经典', '时尚', '复古'];
  const [selectedCategory, setSelectedCategory] = useState('全部');
  // 添加这些新的状态变量
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareData, setShareData] = useState<{
    shareUrl: string;
    qrCodeUrl: string;
    expiresAt: string;
  } | null>(null);

  useEffect(() => {
    const fetchFrames = async () => {
      setLoading(true);
      try {
        const response = await api.getPresetFrames(
          selectedCategory === '全部' ? undefined : selectedCategory,
          1,
          20
        );
        setFrames(
          response.data.frames.map((frame) => ({
            id: frame.id,
            name: frame.name,
            category: frame.category,
            thumbnailUrl: frame.thumbnailUrl,
            frameUrl: frame.frameUrl,
          }))
        );
      } catch (error) {
        message.error('加载头像框失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchFrames();
  }, [selectedCategory]);

  const handleFrameSelect = (frame: FrameTemplate) => {
    setSelectedFrame(frame);
    if (userAvatar) {
      applyFrame(frame);
    }
  };

  const handleAvatarChange = (data: AvatarData) => {
    setUserAvatar(data);
    setAppliedResult(null);
    message.info('没有头像框...');
    if (selectedFrame) {
      message.info('头像已上传，正在应用头像框...');
      applyFrame(selectedFrame);
    }
  };

  // 修改 applyFrame 函数，添加更完善的处理
  const applyFrame = async (frame: FrameTemplate) => {
    if (!userAvatar || !userAvatar.fileId) {
      message.warning('请先上传头像图片');
      return;
    }
    if (!frame.id) {
      message.warning('请选择一个头像框');
      return;
    }

    setIsProcessing(true); // 显示处理中状态

    try {
      // 添加调试信息
      console.log('应用头像框 - 参数:', {
        avatarFileId: userAvatar.fileId,
        frameId: frame.id
      });

      // 超时处理
      const timeout = setTimeout(() => {
        if (isProcessing) { // 如果还在处理中
          setIsProcessing(false);
          message.error('应用头像框超时，请重试');
        }
      }, 30000); // 30秒超时

      // 调用API应用头像框
      const response = await api.applyFrame(userAvatar.fileId, frame.id);
      
      console.log('应用头像框 - 响应:', response);
      
      clearTimeout(timeout); // 清除超时

      // 处理响应
      if (response.success && response.data) {
        // 直接使用结果URL或等待处理完成
        if (response.data.resultUrl) {
          // 直接返回了结果URL - 立即显示
          setAppliedResult({ resultUrl: response.data.resultUrl });
          setIsProcessing(false); // 添加这行关键代码
          message.success('头像框应用成功！');
        } else if (response.data.taskId) {
          // 返回的是任务ID - 需要轮询任务状态
          message.info('图片处理中，请稍候...');
          
          // 实现轮询逻辑
          const taskId = response.data.taskId;
          let pollCount = 0;
          
          const checkTaskStatus = async () => {
            if (pollCount > 30) { // 最多轮询30次
              setIsProcessing(false);
              message.error('处理超时，请重试');
              return;
            }

            try {
              console.log(`轮询任务状态 #${pollCount} - 任务ID: ${taskId}`);
              const statusRes = await api.getTaskStatus(taskId);
              
              if (statusRes.success && statusRes.data) {
                console.log(`任务状态: ${statusRes.data.status}`);
                
                if (statusRes.data.status === 'completed' && statusRes.data.resultUrl) {
                  // 任务完成，显示结果
                  setAppliedResult({ resultUrl: statusRes.data.resultUrl });
                  setIsProcessing(false);
                  message.success('头像框应用成功！');
                } else if (statusRes.data.status === 'failed') {
                  // 任务失败
                  setIsProcessing(false);
                  message.error(`处理失败: ${statusRes.data.error || '未知错误'}`);
                } else if (statusRes.data.status === 'processing') {
                  // 任务仍在处理中，继续轮询
                  pollCount++;
                  setTimeout(checkTaskStatus, 1000); // 每秒轮询一次
                } else {
                  // 未知状态
                  pollCount++;
                  setTimeout(checkTaskStatus, 1000);
                }
              } else {
                // API 调用失败
                throw new Error(statusRes.message || '获取任务状态失败');
              }
            } catch (err) {
              console.error('轮询任务状态失败:', err);
              setIsProcessing(false);
              message.error('获取处理状态失败，请重试');
            }
          };
          
          // 开始轮询
          checkTaskStatus();
        } else {
          // 既没有 resultUrl 也没有 taskId，抛出错误
          throw new Error('服务器响应缺少必要数据');
        }
      } else {
        throw new Error(response.message || '应用头像框失败');
      }
    } catch (error) {
      console.error('应用头像框出错:', error);
      message.error('头像框应用失败，请稍后重试');
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!appliedResult || !appliedResult.resultUrl) {
      message.warning('请先应用头像框');
      return;
    }

    try {
      const response = await fetch(appliedResult.resultUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'avatar-with-frame.png';

      document.body.appendChild(link); // 兼容性
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url); // 释放内存

      message.success('头像下载成功！');
    } catch (err) {
      console.error('下载失败:', err);
      message.error('下载失败，请重试');
    }
  };

  // 修改分享逻辑，使用与 CustomFrames 相同的方式
  const handleShare = async () => {
    if (!appliedResult || !appliedResult.resultUrl) {
      message.warning('请先应用头像框');
      return;
    }
    
    setIsProcessing(true);
    try {
      // 确保传递的是完整URL
      const imageUrl = appliedResult.resultUrl;
      console.log('分享图片URL:', imageUrl);
      
      // 调用API创建分享，参数与 CustomFrames 保持一致
      const shareResponse = await api.createShare(imageUrl, 'wechat', {
        resultFileId: imageUrl // 添加这个参数，确保与后端期望的格式一致
      });
      
      if (shareResponse.success && shareResponse.data) {
        // 保存分享数据
        setShareData(shareResponse.data);
        // 显示二维码弹窗
        setShareModalVisible(true);
        message.success('分享链接创建成功');
      } else {
        throw new Error(shareResponse.message || '创建分享失败');
      }
    } catch (error) {
      console.error('分享失败:', error);
      message.error('分享失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let timer: number | null = null;
    
    if (isProcessing) {
      // 安全超时：如果超过30秒仍在加载，自动重置状态
      timer = setTimeout(() => {
        setIsProcessing(false);
        message.warning('操作时间过长，已自动取消');
      }, 30000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isProcessing]);

  return (
    <div className="fade-in-up">
      <Title level={2} style={{ marginBottom: '8px' }}>
        预设头像框
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        为您的头像添加精美的预设框架，快速美化社交形象
      </Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="上传头像" style={{ marginBottom: '16px' }}>
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
                  {appliedResult && appliedResult.resultUrl ? (
                    <img
                      src={appliedResult.resultUrl}
                      alt="应用后的头像"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <>
                      <img
                        src={userAvatar.url}
                        alt="用户头像"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {selectedFrame && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url(${selectedFrame.frameUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </>
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

          {selectedFrame && (
            <Card title="当前选择">
              <div style={{ textAlign: 'center' }}>
                <img
                  src={selectedFrame.thumbnailUrl}
                  alt={selectedFrame.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}
                />
                <div style={{ fontWeight: 'bold' }}>{selectedFrame.name}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>{selectedFrame.category}</div>
              </div>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={16}>
          <Card title="选择头像框">
            <div style={{ marginBottom: '16px' }}>
              <Space wrap>
                {categories.map((category) => (
                  <Button
                    key={category}
                    type={selectedCategory === category ? 'primary' : 'default'}
                    size="small"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </Space>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {frames.map((frame) => (
                  <Col xs={12} sm={8} md={6} key={frame.id}>
                    <Card
                      hoverable
                      style={{
                        textAlign: 'center',
                        border:
                          selectedFrame?.id === frame.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      }}
                      bodyStyle={{ padding: '12px' }}
                      onClick={() => handleFrameSelect(frame)}
                    >
                      <img
                        src={frame.thumbnailUrl}
                        alt={frame.name}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginBottom: '8px',
                        }}
                      />
                      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {frame.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#666' }}>{frame.category}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

            {frames.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                该分类下暂无头像框
              </div>
            )}
          </Card>
        </Col>
      </Row>
      
      {/* 二维码分享弹窗 */}
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
            <p>扫描二维码查看或分享您的头像</p>
            <p style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
              链接有效期至: {new Date(shareData.expiresAt).toLocaleString()}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PresetFrames;