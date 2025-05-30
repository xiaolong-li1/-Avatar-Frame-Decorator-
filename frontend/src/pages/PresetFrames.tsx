import React, { useState, useEffect, useRef } from 'react'
import { Card, Row, Col, Button, Typography, Avatar, Space, message, Divider } from 'antd'
import { DownloadOutlined, ShareAltOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'
import { getStaticUrl } from '../config/staticAssets'
import { getPresetCircularFrames, createCircularFrameDataURL } from '../utils/createCircularFrames'
import { saveAs } from 'file-saver'
import { composeAvatarWithFrame } from '../utils/imageUtils'
import WeChatShareModal from '../components/WeChatShareModal'
import { createTempImageUrl } from '../utils/shareUtils'

const { Title, Paragraph } = Typography

interface FrameTemplate {
  id: string
  name: string
  category: string
  previewUrl: string
  frameUrl: string
  color: string
}

interface FrameConfig {
  id: string;
  name: string;
  category: string;
  color: string;
  previewSize: number;
  frameSize: number;
  borderWidth: number;
  previewBorderWidth: number;
}

const PresetFrames: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<string>('')
  const [selectedFrame, setSelectedFrame] = useState<FrameTemplate | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [frameTemplates, setFrameTemplates] = useState<FrameTemplate[]>([])
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [shareImageUrl, setShareImageUrl] = useState<string>('')

  // 初始化圆形头像框
  useEffect(() => {
    const presetFrames = getPresetCircularFrames();
    const templates = presetFrames.map((frame: FrameConfig) => {
      // 创建动态SVG头像框
      const previewUrl = createCircularFrameDataURL(frame.color, frame.previewSize, frame.previewBorderWidth);
      const frameUrl = createCircularFrameDataURL(frame.color, frame.frameSize, frame.borderWidth);
      
      return {
        id: frame.id,
        name: frame.name,
        category: frame.category,
        previewUrl,
        frameUrl,
        color: frame.color
      };
    });
    
    setFrameTemplates(templates);
  }, []);

  // 处理头像框图片加载
  useEffect(() => {
    if (selectedFrame) {
      // 预加载头像框图片
      const img = new Image();
      img.src = selectedFrame.frameUrl;
    }
  }, [selectedFrame]);

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

  const handleDownload = async () => {
    if (!userAvatar || !selectedFrame) {
      message.warning('请先上传头像并选择头像框')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // 使用工具函数合成头像和头像框
      const blob = await composeAvatarWithFrame(userAvatar, selectedFrame.frameUrl, 512)
      
      // 下载合成后的头像
      saveAs(blob, `weframe-${selectedFrame.id}-${Date.now()}.png`)
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
      // 合成头像和头像框
      const blob = await composeAvatarWithFrame(userAvatar, selectedFrame.frameUrl, 512)
      
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
                        backgroundImage: `url(${selectedFrame.frameUrl})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        pointerEvents: 'none'
                      }}
                      className="frame-overlay"
                      data-frame-url={selectedFrame.frameUrl}
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
                    src={selectedFrame.previewUrl} 
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
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      margin: '0 auto 8px',
                      position: 'relative',
                      borderRadius: '50%',
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={frame.previewUrl} 
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

      {/* 微信分享弹窗 */}
      <WeChatShareModal
        visible={shareModalVisible}
        onClose={handleCloseShareModal}
        imageUrl={shareImageUrl}
        title={`我用WeFrame创建了一个${selectedFrame?.name || '精美'}头像`}
        desc="快来试试WeFrame微信头像智能处理系统吧！"
      />
    </div>
  )
}

export default PresetFrames 