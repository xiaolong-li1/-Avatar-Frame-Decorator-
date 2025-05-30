import React, { useState } from 'react'
import { Card, Row, Col, Button, Typography, Space, message, Upload, Divider, Slider } from 'antd'
import { UploadOutlined, DeleteOutlined, EditOutlined, DownloadOutlined, ShareAltOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'
import { composeAvatarWithFrame } from '../utils/imageUtils'
import { saveAs } from 'file-saver'
import WeChatShareModal from '../components/WeChatShareModal'
import { createTempImageUrl } from '../utils/shareUtils'

const { Title, Paragraph } = Typography
const { Dragger } = Upload

interface CustomFrame {
  id: string
  name: string
  imageUrl: string
  uploadTime: string
}

const CustomFrames: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<string>('')
  const [customFrames, setCustomFrames] = useState<CustomFrame[]>([])
  const [selectedFrame, setSelectedFrame] = useState<CustomFrame | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [frameOpacity, setFrameOpacity] = useState(100)
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [shareImageUrl, setShareImageUrl] = useState<string>('')

  const handleFrameUpload = (file: any) => {
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
    
    // 转换为base64
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        const newFrame: CustomFrame = {
          id: Date.now().toString(),
          name: file.name.split('.')[0],
          imageUrl: e.target.result as string,
          uploadTime: new Date().toLocaleString()
        }
        
        // 添加新头像框到列表
        setCustomFrames(prev => [...prev, newFrame])
        
        // 自动选择新上传的头像框
        setSelectedFrame(newFrame)
        
        message.success('头像框上传成功并已应用！')
      }
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
    
    return false // 阻止自动上传
  }

  const handleDeleteFrame = (frameId: string) => {
    setCustomFrames(prev => prev.filter(frame => frame.id !== frameId))
    if (selectedFrame?.id === frameId) {
      setSelectedFrame(null)
    }
    message.success('头像框删除成功！')
  }

  const handleFrameSelect = (frame: CustomFrame) => {
    setSelectedFrame(frame)
  }

  const handleDownload = async () => {
    if (!userAvatar || !selectedFrame) {
      message.warning('请先上传头像并选择头像框')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // 使用工具函数合成头像和头像框，考虑透明度
      const blob = await composeAvatarWithFrame(userAvatar, selectedFrame.imageUrl, 512, frameOpacity / 100)
      
      // 下载合成后的头像
      saveAs(blob, `weframe-custom-${selectedFrame.id}-${Date.now()}.png`)
      message.success('头像下载成功！')
    } catch (error) {
      console.error('下载头像时出错:', error)
      message.error(`下载头像失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleShare = async () => {
    if (!userAvatar || !selectedFrame) {
      message.warning('请先上传头像并选择头像框')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // 合成头像和头像框，考虑透明度
      const blob = await composeAvatarWithFrame(userAvatar, selectedFrame.imageUrl, 512, frameOpacity / 100)
      
      // 创建临时URL用于分享
      const imageUrl = createTempImageUrl(blob)
      setShareImageUrl(imageUrl)
      
      // 显示分享弹窗
      setShareModalVisible(true)
    } catch (error) {
      console.error('准备分享时出错:', error)
      message.error(`准备分享失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // 关闭分享弹窗
  const handleCloseShareModal = () => {
    setShareModalVisible(false)
    
    // 清理临时URL
    if (shareImageUrl) {
      URL.revokeObjectURL(shareImageUrl)
      setShareImageUrl('')
    }
  }

  return (
    <div className="fade-in-up">
      <Title level={2} style={{ marginBottom: '8px' }}>
        自定义头像框
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        上传您自己设计的头像框，打造独一无二的个性头像。建议使用透明背景的PNG图片作为头像框。
      </Paragraph>

      <Row gutter={[24, 24]}>
        {/* 头像预览区域 */}
        <Col xs={24} lg={8}>
          <Card title="头像预览" style={{ marginBottom: '16px' }}>
            {!userAvatar ? (
              <AvatarUpload onImageChange={setUserAvatar} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="avatar-preview" style={{ 
                  width: '200px', 
                  height: '200px', 
                  margin: '0 auto 16px',
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={userAvatar} 
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
                        backgroundImage: `url(${selectedFrame.imageUrl})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: frameOpacity / 100,
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                      className="frame-overlay"
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
                      onChange={setFrameOpacity}
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
                    disabled={!userAvatar || !selectedFrame}
                    icon={<DownloadOutlined />}
                    loading={isProcessing}
                  >
                    下载头像
                  </Button>
                  <Button 
                    onClick={handleShare}
                    disabled={!userAvatar || !selectedFrame}
                    icon={<ShareAltOutlined />}
                    loading={isProcessing}
                  >
                    分享到微信
                  </Button>
                </Space>
                <Divider />
                <Button 
                  type="link" 
                  onClick={() => setUserAvatar('')}
                >
                  重新上传
                </Button>
              </div>
            )}
          </Card>

          {selectedFrame && (
            <Card title="当前选择">
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  margin: '0 auto 8px',
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={selectedFrame.imageUrl} 
                    alt={selectedFrame.name}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <div style={{ fontWeight: 'bold' }}>{selectedFrame.name}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {selectedFrame.uploadTime}
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
              style={{ padding: '20px' }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽头像框图片到此区域</p>
              <p className="ant-upload-hint">
                支持 PNG、JPG、WebP 格式，建议使用透明背景的 PNG 文件，文件大小不超过 10MB
              </p>
            </Dragger>
          </Card>

          {/* 我的头像框 */}
          <Card title={`我的头像框 (${customFrames.length})`}>
            {customFrames.length === 0 ? (
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
                      <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        margin: '0 auto 8px',
                        position: 'relative',
                        borderRadius: '50%',
                        overflow: 'hidden'
                      }}>
                        <img 
                          src={frame.imageUrl} 
                          alt={frame.name}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover'
                          }}
                        />
                      </div>
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
                        {frame.uploadTime}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      {/* 微信分享弹窗 */}
      <WeChatShareModal
        visible={shareModalVisible}
        onClose={handleCloseShareModal}
        imageUrl={shareImageUrl}
        title={`我用WeFrame创建了一个自定义头像`}
        desc="快来试试WeFrame微信头像智能处理系统吧！"
      />
    </div>
  )
}

export default CustomFrames 