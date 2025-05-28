import React, { useState } from 'react'
import { Card, Row, Col, Button, Typography, Space, message, Upload, Divider, Slider } from 'antd'
import { UploadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'

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
  const [frameOpacity, setFrameOpacity] = useState(100)

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
        setCustomFrames(prev => [...prev, newFrame])
        message.success('头像框上传成功！')
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

  const handleDownload = () => {
    if (!userAvatar || !selectedFrame) {
      message.warning('请先上传头像并选择头像框')
      return
    }
    message.success('头像下载成功！')
  }

  const handleShare = () => {
    if (!userAvatar || !selectedFrame) {
      message.warning('请先上传头像并选择头像框')
      return
    }
    message.success('头像分享成功！')
  }

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
              <AvatarUpload onImageChange={setUserAvatar} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="avatar-preview" style={{ 
                  width: '200px', 
                  height: '200px', 
                  margin: '0 auto 16px',
                  position: 'relative'
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
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: frameOpacity / 100,
                        pointerEvents: 'none'
                      }}
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
                    disabled={!selectedFrame}
                  >
                    下载头像
                  </Button>
                  <Button 
                    onClick={handleShare}
                    disabled={!selectedFrame}
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
                <img 
                  src={selectedFrame.imageUrl} 
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
                      <img 
                        src={frame.imageUrl} 
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
    </div>
  )
}

export default CustomFrames 