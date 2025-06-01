import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Typography, Space, message, Upload, Divider, Slider, Spin, Modal } from 'antd'
import { UploadOutlined, DeleteOutlined, EditOutlined, LoadingOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'
import { api, handleApiError } from '../services/api'

const { Title, Paragraph } = Typography
const { Dragger } = Upload

interface CustomFrame {
  id: string
  name: string
  frame_url: string
  thumbnail_url?: string
  created_at: string
}

const CustomFrames: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<string>('')
  const [avatarFileId, setAvatarFileId] = useState<string>('')
  const [customFrames, setCustomFrames] = useState<CustomFrame[]>([])
  const [selectedFrame, setSelectedFrame] = useState<CustomFrame | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [frameOpacity, setFrameOpacity] = useState(100)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [resultTaskId, setResultTaskId] = useState<string>('')
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [shareData, setShareData] = useState<{
    shareUrl: string;
    qrCodeUrl: string;
    expiresAt: string;
  } | null>(null)

  // 加载用户已有的自定义头像框
  useEffect(() => {
    loadCustomFrames()
  }, [])
  
  const loadCustomFrames = async () => {
    setIsLoading(true)
    try {
      const response = await api.getCustomFrames()
      if (response.success && response.data.frames) {
        setCustomFrames(
          response.data.frames.map((frame: any) => ({
            id: frame.id,
            name: frame.name,
            frame_url: frame.frame_url ?? '',
            thumbnail_url: frame.thumbnail_url,
            created_at: frame.created_at ?? '',
          }))
        )
      } else {
        message.error('获取头像框失败')
      }
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = (fileUrl: string, fileId: string) => {
    setUserAvatar(fileUrl)
    setAvatarFileId(fileId)
    setPreviewImage(fileUrl) // 初始预览图是原始头像
  }
  
  const handleFrameUpload = async (file: File) => {
    // 检查文件类型
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件!')
      return false
    }

    // 检查文件大小 (10MB)
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB!')
      return false
    }

    setIsUploading(true)
    
    try {
      // 调用API上传头像框到服务器
      const frameName = file.name.split('.')[0]
      console.log("开始上传头像框文件:", file.name, file.size, file.type); // 添加调试信息
      const response = await api.uploadFrame(file, frameName)
      
      if (response.success && response.data) {
        message.success('头像框上传成功！')
        // 重新加载头像框列表
        await loadCustomFrames()
      } else {
        message.error('头像框上传失败：' + response.message)
      }
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsUploading(false)
    }
    
    return false // 阻止自动上传
  }

  const handleDeleteFrame = async (frameId: string) => {
    try {
      const response = await api.deleteCustomFrame(frameId)
      
      if (response.success) {
        // 从本地状态中移除已删除的头像框
        setCustomFrames(prev => prev.filter(frame => frame.id !== frameId))
        if (selectedFrame?.id === frameId) {
          setSelectedFrame(null)
          setPreviewImage(userAvatar) // 重置预览图为原始头像
        }
        message.success('头像框删除成功！')
      } else {
        message.error('头像框删除失败：' + response.message)
      }
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleFrameSelect = async (frame: CustomFrame) => {
    setSelectedFrame(frame)
    
    if (!userAvatar) {
      message.warning('请先上传头像')
      return
    }
    
    setIsApplying(true)
    
    try {
      // 添加调试信息
      console.log('应用头像框 - 参数:', {
        avatarFileId,
        frameId: frame.id,
        opacity: frameOpacity / 100
      });

      // 超时处理
      const timeout = setTimeout(() => {
        if (isApplying) {
          setIsApplying(false)
          message.error('应用头像框超时，请重试')
        }
      }, 30000) // 30秒超时
    
      // 调用API应用头像框到头像
      const response = await api.applyFrame(avatarFileId, frame.id, { 
        opacity: frameOpacity / 100 
      })
      
      console.log('应用头像框 - 响应:', response);
    
      clearTimeout(timeout) // 清除超时
    
      if (response.success && response.data) {
        // 直接使用结果URL或等待处理完成
        if (response.data.resultUrl) {
          // 直接返回了结果URL - 立即显示
          setPreviewImage(response.data.resultUrl)
          setResultTaskId(response.data.taskId || '')
          setIsApplying(false) // 添加这行！
          message.success('头像框应用成功')
        } else if (response.data.taskId) {
          // 返回的是任务ID - 需要轮询任务状态
          message.info('图片处理中，请稍候...')
          
          // 实现轮询逻辑
          const taskId = response.data.taskId;
          let pollCount = 0;
          
          const checkTaskStatus = async () => {
            if (pollCount > 30) { // 最多轮询30次
              setIsApplying(false)
              message.error('处理超时，请重试')
              return
            }

            try {
              console.log(`轮询任务状态 #${pollCount} - 任务ID: ${taskId}`);
              const statusRes = await api.getTaskStatus(taskId)
              
              if (statusRes.success && statusRes.data) {
                console.log(`任务状态: ${statusRes.data.status}`);
                
                if (statusRes.data.status === 'completed' && statusRes.data.resultUrl) {
                  // 任务完成，显示结果
                  setPreviewImage(statusRes.data.resultUrl)
                  setResultTaskId(taskId)
                  setIsApplying(false)
                  message.success('头像框应用成功')
                } else if (statusRes.data.status === 'failed') {
                  // 任务失败
                  setIsApplying(false)
                  message.error(`处理失败: ${statusRes.data.error || '未知错误'}`)
                } else if (statusRes.data.status === 'processing') {
                  // 任务仍在处理中，继续轮询
                  pollCount++
                  setTimeout(checkTaskStatus, 1000) // 每秒轮询一次
                } else {
                  // 未知状态
                  pollCount++
                  setTimeout(checkTaskStatus, 1000)
                }
              } else {
                // API 调用失败
                throw new Error(statusRes.message || '获取任务状态失败')
              }
            } catch (err) {
              console.error('轮询任务状态失败:', err);
              setIsApplying(false)
              message.error('获取处理状态失败，请重试')
            }
          }
          
          // 开始轮询
          checkTaskStatus()
        } else {
          // 既没有 resultUrl 也没有 taskId，抛出错误
          throw new Error('服务器响应缺少必要数据')
        }
      } else {
        throw new Error(response.message || '应用头像框失败')
      }
    } catch (error) {
      console.error('应用头像框出错:', error);
      handleApiError(error)
      setIsApplying(false)
    }
  }
  
  // 当透明度改变时重新应用头像框
  const handleOpacityChange = (value: number) => {
    setFrameOpacity(value)
    if (selectedFrame) {
      // 延迟应用，避免频繁API调用
      const delayDebounceFn = setTimeout(() => {
        handleFrameSelect(selectedFrame)
      }, 500)
      
      return () => clearTimeout(delayDebounceFn)
    }
  }

  const handleDownload = async () => {
    if (!previewImage) {
      message.warning('请先上传头像并应用头像框')
      return
    }
    
    try {
      // 直接从预览图获取图片并下载
      const response = await fetch(previewImage);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `custom-avatar-frame-${Date.now()}.png`;

      document.body.appendChild(link); // 兼容性
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url); // 释放内存

      message.success('头像下载成功！');
    } catch (error) {
      console.error('下载失败:', error);
      message.error('下载失败，请重试');
    }
  }

  const handleShare = async () => {
    if (!previewImage) {
      message.warning('请先上传头像并应用头像框')
      return
    }
    
    try {
      // 使用正确的参数名 resultFileId
      console.log('分享URL:', previewImage);
      const response = await api.createShare(previewImage, 'wechat', {
        resultFileId: previewImage  // 添加这个参数
      })
      
      if (response.success && response.data) {
        // 显示分享二维码
        setShareModalVisible(true);
        setShareData(response.data);
        message.success('分享链接创建成功');
      } else {
        throw new Error(response.message || '创建分享失败')
      }
    } catch (error) {
      console.error('分享失败:', error);
      handleApiError(error)
    }
  };

  return (
    <div className="fade-in-up">
      <Title level={2} style={{ marginBottom: '8px' }}>
        自定义头像框
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        上传您自己设计的头像框，打造独一无二的个性头像
      </Paragraph>

      <Row gutter={[24, 24]}>
        {/* 头像预览区域 */}
        <Col xs={24} lg={8}>
          <Card title="头像预览" style={{ marginBottom: '16px' }}>
            {!userAvatar ? (
              <AvatarUpload 
                onImageChange={(data) => handleAvatarUpload(data.url, data.fileId)} 
              />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="avatar-preview" style={{ 
                  width: '200px', 
                  height: '200px', 
                  margin: '0 auto 16px',
                  position: 'relative'
                }}>
                  {isApplying ? (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      height: '100%'
                    }}>
                      <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
                      <span style={{ marginLeft: 10 }}>应用中...</span>
                    </div>
                  ) : (
                    <img 
                      src={previewImage} 
                      alt="预览图" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
                
                {selectedFrame && (
                  <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                    <Paragraph strong>透明度调整</Paragraph>
                    <Slider
                      min={10}
                      max={100}
                      value={frameOpacity}
                      onChange={(value) => handleOpacityChange(value)}
                      marks={{
                        10: '10%',
                        50: '50%',
                        100: '100%'
                      }}
                    />
                  </div>
                )}

                <Space>
                  <Button 
                    type="primary" 
                    onClick={handleDownload}
                    disabled={!selectedFrame || isApplying}
                  >
                    下载头像
                  </Button>
                  <Button 
                    onClick={handleShare}
                    disabled={!selectedFrame || isApplying}
                  >
                    分享到微信
                  </Button>
                </Space>
                <Divider />
                <Button 
                  type="link" 
                  onClick={() => {
                    setUserAvatar('')
                    setAvatarFileId('')
                    setPreviewImage('')
                    setSelectedFrame(null)
                  }}
                >
                  重新上传
                </Button>
              </div>
            )}
          </Card>

          {selectedFrame && (
            <Card title="当前选择">
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={selectedFrame.thumbnail_url || selectedFrame.frame_url} 
                  alt={selectedFrame.name}
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ fontWeight: 'bold' }}>{selectedFrame.name}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {new Date(selectedFrame.created_at).toLocaleString()}
                </div>
              </div>
            </Card>
          )}
        </Col>

        {/* 头像框管理区域 */}
        <Col xs={24} lg={16}>
          {/* 上传新头像框 */}
          <Card title="上传头像框" style={{ marginBottom: '16px' }}>
            <Dragger
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleFrameUpload}
              disabled={isUploading}
              style={{ padding: '20px' }}
            >
              {isUploading ? (
                <div style={{ padding: '20px' }}>
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
                  <p style={{ marginTop: '10px' }}>正在上传...</p>
                </div>
              ) : (
                <>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽头像框图片到此区域</p>
                  <p className="ant-upload-hint">
                    支持 PNG、JPG、WebP 格式，建议使用透明背景的 PNG 文件，文件大小不超过 10MB
                  </p>
                </>
              )}
            </Dragger>
          </Card>

          {/* 我的头像框 */}
          <Card title={`我的头像框 (${customFrames.length})`}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin />
              </div>
            ) : customFrames.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: '#999'
              }}>
                <UploadOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>还没有上传任何头像框</div>
                <div style={{ fontSize: '12px' }}>上传您自己设计的头像框开始创作吧</div>
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {customFrames.map(frame => (
                  <Col xs={12} sm={8} md={6} key={frame.id}>
                    <Card
                      hoverable
                      style={{ 
                        textAlign: 'center',
                        border: selectedFrame?.id === frame.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
                      }}
                      bodyStyle={{ padding: '12px' }}
                      actions={[
                        <EditOutlined 
                          key="select" 
                          onClick={() => handleFrameSelect(frame)}
                          title="选择使用"
                        />,
                        <DeleteOutlined 
                          key="delete" 
                          onClick={() => handleDeleteFrame(frame.id)}
                          title="删除"
                          style={{ color: '#ff4d4f' }}
                        />
                      ]}
                    >
                      <img 
                        src={frame.thumbnail_url || frame.frame_url} 
                        alt={frame.name}
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginBottom: '8px'
                        }}
                      />
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        marginBottom: '4px'
                      }}>
                        {frame.name}
                      </div>
                      <div style={{ 
                        fontSize: '10px', 
                        color: '#666'
                      }}>
                        {new Date(frame.created_at).toLocaleString()}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
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
            <p>扫描二维码查看或分享您的头像</p>
            <p style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
              链接有效期至: {new Date(shareData.expiresAt).toLocaleString()}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CustomFrames