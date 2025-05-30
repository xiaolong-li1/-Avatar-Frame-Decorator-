import React, { useState } from 'react'
import { Card, Row, Col, Button, Typography, Space, message } from 'antd'
import { BgColorsOutlined, DownloadOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'

const { Title, Paragraph } = Typography

interface StyleTemplate {
  id: string
  name: string
  artist: string
  previewUrl: string
  description: string
}

const StyleTransfer: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<string>('')
  const [selectedStyle, setSelectedStyle] = useState<StyleTemplate | null>(null)
  const [processedImage, setProcessedImage] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const styleTemplates: StyleTemplate[] = [
    {
      id: 'vangogh_starry',
      name: '星空',
      artist: '梵高',
      previewUrl: '/styles/vangogh-starry.jpg',
      description: '梵高经典作品《星空》风格'
    },
    {
      id: 'monet_water',
      name: '水莲',
      artist: '莫奈',
      previewUrl: '/styles/monet-water.jpg',
      description: '莫奈印象派水莲系列风格'
    },
    {
      id: 'picasso_abstract',
      name: '立体派',
      artist: '毕加索',
      previewUrl: '/styles/picasso-abstract.jpg',
      description: '毕加索立体主义抽象风格'
    },
    {
      id: 'chinese_ink',
      name: '水墨画',
      artist: '中式传统',
      previewUrl: '/styles/chinese-ink.jpg',
      description: '中国传统水墨画风格'
    },
    {
      id: 'oil_painting',
      name: '古典油画',
      artist: '欧洲古典',
      previewUrl: '/styles/oil-painting.jpg',
      description: '欧洲古典油画风格'
    },
    {
      id: 'watercolor',
      name: '水彩画',
      artist: '现代水彩',
      previewUrl: '/styles/watercolor.jpg',
      description: '清新水彩画风格'
    }
  ]

  const handleStyleSelect = (style: StyleTemplate) => {
    setSelectedStyle(style)
    if (userAvatar) {
      applyStyle(style)
    }
  }

  const applyStyle = async (style: StyleTemplate) => {
    if (!userAvatar) {
      message.warning('请先上传头像图片')
      return
    }

    setIsProcessing(true)
    try {
      // 模拟风格迁移处理
      await new Promise(resolve => setTimeout(resolve, 3000))
      setProcessedImage(userAvatar) // 实际应该是风格迁移后的图片
      message.success(`${style.name}风格应用成功！`)
    } catch (error) {
      message.error('风格迁移失败，请稍后重试')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!processedImage) {
      message.warning('请先完成风格迁移')
      return
    }
    message.success('艺术风格头像下载成功！')
  }

  return (
    <div className="fade-in-up">
      <Title level={2} style={{ marginBottom: '8px' }}>
        艺术风格迁移
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        将您的头像转换为经典艺术风格，体验不同的艺术表现形式
      </Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="上传头像" style={{ marginBottom: '16px' }}>
            {!userAvatar ? (
              <AvatarUpload onImageChange={setUserAvatar} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="avatar-preview" style={{ 
                  width: '200px', 
                  height: '200px', 
                  margin: '0 auto 16px'
                }}>
                  <img 
                    src={processedImage || userAvatar} 
                    alt="头像预览" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    disabled={!processedImage}
                  >
                    下载头像
                  </Button>
                  <Button onClick={() => setUserAvatar('')}>
                    重新上传
                  </Button>
                </Space>
              </div>
            )}
          </Card>

          {selectedStyle && (
            <Card title="当前风格">
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={selectedStyle.previewUrl} 
                  alt={selectedStyle.name}
                  style={{ 
                    width: '100px', 
                    height: '80px', 
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ fontWeight: 'bold' }}>{selectedStyle.name}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {selectedStyle.artist}
                </div>
                <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                  {selectedStyle.description}
                </Paragraph>
              </div>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={16}>
          <Card title="选择艺术风格">
            <Row gutter={[16, 16]}>
              {styleTemplates.map(style => (
                <Col xs={12} sm={8} md={6} key={style.id}>
                  <Card
                    hoverable
                    style={{ 
                      textAlign: 'center',
                      border: selectedStyle?.id === style.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
                    }}
                    bodyStyle={{ padding: '12px' }}
                    onClick={() => handleStyleSelect(style)}
                  >
                    <img 
                      src={style.previewUrl} 
                      alt={style.name}
                      style={{ 
                        width: '80px', 
                        height: '60px', 
                        objectFit: 'cover',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}
                    />
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}>
                      {style.name}
                    </div>
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#666'
                    }}>
                      {style.artist}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default StyleTransfer 