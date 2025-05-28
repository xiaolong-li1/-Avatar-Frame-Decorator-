import React, { useState } from 'react'
import { Card, Row, Col, Button, Typography, Avatar, Space, message, Divider } from 'antd'
import { DownloadOutlined, ShareAltOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'

const { Title, Paragraph } = Typography

interface FrameTemplate {
  id: string
  name: string
  category: string
  previewUrl: string
  frameUrl: string
}

const PresetFrames: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<string>('')
  const [selectedFrame, setSelectedFrame] = useState<FrameTemplate | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // 模拟预设头像框数据
  const frameTemplates: FrameTemplate[] = [
    {
      id: 'spring_festival',
      name: '春节主题',
      category: '节日',
      previewUrl: '/frames/spring-festival-preview.png',
      frameUrl: '/frames/spring-festival-frame.png'
    },
    {
      id: 'valentine',
      name: '情人节',
      category: '节日',
      previewUrl: '/frames/valentine-preview.png',
      frameUrl: '/frames/valentine-frame.png'
    },
    {
      id: 'christmas',
      name: '圣诞节',
      category: '节日',
      previewUrl: '/frames/christmas-preview.png',
      frameUrl: '/frames/christmas-frame.png'
    },
    {
      id: 'golden_classic',
      name: '金色经典',
      category: '经典',
      previewUrl: '/frames/golden-preview.png',
      frameUrl: '/frames/golden-frame.png'
    },
    {
      id: 'neon_glow',
      name: '霓虹光效',
      category: '时尚',
      previewUrl: '/frames/neon-preview.png',
      frameUrl: '/frames/neon-frame.png'
    },
    {
      id: 'vintage_film',
      name: '复古胶片',
      category: '复古',
      previewUrl: '/frames/vintage-preview.png',
      frameUrl: '/frames/vintage-frame.png'
    }
  ]

  const categories = ['全部', '节日', '经典', '时尚', '复古']
  const [selectedCategory, setSelectedCategory] = useState('全部')

  const filteredFrames = selectedCategory === '全部' 
    ? frameTemplates 
    : frameTemplates.filter(frame => frame.category === selectedCategory)

  const handleFrameSelect = (frame: FrameTemplate) => {
    setSelectedFrame(frame)
    if (userAvatar) {
      applyFrame(frame)
    }
  }

  const applyFrame = async (frame: FrameTemplate) => {
    if (!userAvatar) {
      message.warning('请先上传头像图片')
      return
    }

    setIsProcessing(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000))
      message.success('头像框应用成功！')
    } catch (error) {
      message.error('头像框应用失败，请稍后重试')
    } finally {
      setIsProcessing(false)
    }
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
        预设头像框
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        为您的头像添加精美的预设框架，快速美化社交形象
      </Paragraph>

      <Row gutter={[24, 24]}>
        {/* 头像上传和预览区域 */}
        <Col xs={24} lg={8}>
          <Card title="上传头像" style={{ marginBottom: '16px' }}>
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
                        backgroundImage: `url(${selectedFrame.frameUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        pointerEvents: 'none'
                      }}
                    />
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
                  src={selectedFrame.previewUrl} 
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
                  {selectedFrame.category}
                </div>
              </div>
            </Card>
          )}
        </Col>

        {/* 头像框选择区域 */}
        <Col xs={24} lg={16}>
          <Card title="选择头像框">
            {/* 分类筛选 */}
            <div style={{ marginBottom: '16px' }}>
              <Space wrap>
                {categories.map(category => (
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

            {/* 头像框网格 */}
            <Row gutter={[16, 16]}>
              {filteredFrames.map(frame => (
                <Col xs={12} sm={8} md={6} key={frame.id}>
                  <Card
                    hoverable
                    style={{ 
                      textAlign: 'center',
                      border: selectedFrame?.id === frame.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
                    }}
                    bodyStyle={{ padding: '12px' }}
                    onClick={() => handleFrameSelect(frame)}
                  >
                    <img 
                      src={frame.previewUrl} 
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
                      {frame.category}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {filteredFrames.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: '#999'
              }}>
                该分类下暂无头像框
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default PresetFrames 