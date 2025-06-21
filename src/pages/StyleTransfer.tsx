import React, { useState, useEffect, useRef } from 'react'
import { Card, Row, Col, Button, Typography, Space, message, Spin, Modal, Divider } from 'antd'
import { BgColorsOutlined, DownloadOutlined, LoadingOutlined, ShareAltOutlined, HistoryOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'
import api from '../services/api'
import { handleApiError } from '../services/api'
import { useAITask } from '../contexts/AITaskContext'
import usePersistedState from '../hooks/usePersistedState'

// 导入风格图片
import style1 from '../assets/style_1.png'
import style2 from '../assets/style_2.png'
import style3 from '../assets/style_3.png'
import style4 from '../assets/style_4.png'
import style5 from '../assets/style_5.png'
import style6 from '../assets/style_6.png'

const { Title, Paragraph } = Typography

interface AvatarData {
  fileId: string
  url: string
}

interface StyleTemplate {
  id: string
  name: string
  artist: string
  description: string
  image?: string // 添加图片属性
}

interface StyleResult {
  resultUrl?: string
  taskId?: string
}

const StyleTransfer: React.FC = () => {
  const [userAvatar, setUserAvatar] = usePersistedState<AvatarData | null>('style-transfer-avatar', null)
  const [selectedStyle, setSelectedStyle] = useState<StyleTemplate | null>(null)
  const [styleResult, setStyleResult] = useState<StyleResult | null>(null)
  const [availableStyles, setAvailableStyles] = useState<StyleTemplate[]>([])
  const [isLoadingStyles, setIsLoadingStyles] = useState(true)
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [shareData, setShareData] = useState<{
    shareUrl: string
    qrCodeUrl: string
    expiresAt: string
  } | null>(null)

  // 使用AI任务管理
  const { startTask, getTasksByType, isTaskRunning } = useAITask()
  const isProcessing = isTaskRunning('style-transfer')

  // 使用 useRef 来追踪当前请求
  const currentRequestRef = useRef<AbortController | null>(null)

  // 硬编码的风格模板（与后端保持一致）- 添加图片映射
  const defaultStyles: StyleTemplate[] = [
    {
      id: 'vangogh_starry',
      name: '星空',
      artist: '梵高',
      description: '梵高经典作品《星空》风格',
      image: style1
    },
    {
      id: 'monet_water',
      name: '水莲',
      artist: '莫奈',
      description: '莫奈印象派水莲系列风格',
      image: style2
    },
    {
      id: 'picasso_abstract',
      name: '立体派',
      artist: '毕加索',
      description: '毕加索立体主义抽象风格',
      image: style3
    },
    {
      id: 'chinese_ink',
      name: '水墨画',
      artist: '中式传统',
      description: '中国传统水墨画风格',
      image: style4
    },
    {
      id: 'oil_painting',
      name: '古典油画',
      artist: '欧洲古典',
      description: '欧洲古典油画风格',
      image: style5
    },
    {
      id: 'watercolor',
      name: '水彩画',
      artist: '现代水彩',
      description: '清新水彩画风格',
      image: style6
    }
  ]

  // 加载可用风格列表
  useEffect(() => {
    const loadStyles = async () => {
      try {
        const response = await api.getStylesList()
        if (response.success && response.data?.styles) {
          // 将API返回的风格与默认图片合并
          const stylesWithImages = response.data.styles.map((style: StyleTemplate) => {
            const defaultStyle = defaultStyles.find(ds => ds.id === style.id)
            return {
              ...style,
              image: defaultStyle?.image
            }
          })
          setAvailableStyles(stylesWithImages)
        } else {
          // 如果API失败，使用默认风格
          setAvailableStyles(defaultStyles)
        }
      } catch (error) {
        console.error('加载风格列表失败，使用默认风格:', error)
        setAvailableStyles(defaultStyles)
      } finally {
        setIsLoadingStyles(false)
      }
    }

    loadStyles()
  }, [])

  // 检查是否有已完成的风格迁移任务
  useEffect(() => {
    const tasks = getTasksByType('style-transfer')
    const completedTask = tasks.find(task => task.status === 'completed')
    
    if (completedTask && completedTask.result?.resultUrl) {
      setStyleResult({
        resultUrl: completedTask.result.resultUrl,
        taskId: completedTask.id
      })
    }
  }, [getTasksByType])

  // 处理头像上传
  const handleAvatarChange = (data: AvatarData) => {
    setUserAvatar(data)
    setStyleResult(null) // 重置结果
    message.info('头像已上传，选择艺术风格后点击应用')
  }

  // 选择风格
  const handleStyleSelect = (style: StyleTemplate) => {
    setSelectedStyle(style)
  }

  // 应用风格迁移
  const applyStyle = async () => {
    if (!userAvatar || !userAvatar.fileId) {
      message.warning('请先上传头像图片')
      return
    }

    if (!selectedStyle) {
      message.warning('请先选择艺术风格')
      return
    }

    if (isProcessing) {
      message.info('已有风格迁移任务正在处理中，请稍候...')
      return
    }

    try {
      const taskId = await startTask('style-transfer', {
        fileId: userAvatar.fileId,
        styleId: selectedStyle.id
      })

      console.log('风格迁移任务已启动:', taskId)
    } catch (error) {
      console.error('启动风格迁移任务失败:', error)
      handleApiError(error)
    }
  }

  // 取消当前操作
  const cancelOperation = () => {
    if (currentRequestRef.current) {
      currentRequestRef.current.abort()
    }
    message.info('已取消操作')
  }

  // 下载处理后的图片
  const handleDownload = async () => {
    if (!styleResult || !styleResult.resultUrl) {
      message.warning('请先完成风格迁移')
      return
    }

    try {
      // 直接从结果URL获取图片并下载
      const response = await fetch(styleResult.resultUrl)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `style-transfer-${selectedStyle?.name || 'art'}-${Date.now()}.png`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)
      message.success('艺术风格头像下载成功！')
    } catch (error) {
      console.error('下载失败:', error)
      message.error('下载失败，请稍后重试')
    }
  }

  // 分享到微信
  const handleShare = async () => {
    if (!styleResult || !styleResult.resultUrl) {
      message.warning('请先完成风格迁移')
      return
    }
    
    try {
      console.log('分享URL:', styleResult.resultUrl)
      const response = await api.createShare(styleResult.resultUrl, 'wechat', {
        resultFileId: styleResult.resultUrl,
        description: `我用${selectedStyle?.name}风格重新设计了头像！`
      })
      
      if (response.success && response.data) {
        setShareModalVisible(true)
        setShareData(response.data)
        message.success('分享链接创建成功')
      } else {
        throw new Error(response.message || '创建分享失败')
      }
    } catch (error) {
      console.error('分享失败:', error)
      handleApiError(error)
    }
  }

  // 清理函数 - 组件卸载时取消请求
  useEffect(() => {
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort()
      }
    }
  }, [])

  // 超时保护
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    
    if (isProcessing) {
      timer = setTimeout(() => {
        cancelOperation()
        message.warning('操作时间过长，已自动取消')
      }, 180000) // 3分钟超时保护
    }
    
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isProcessing])

  return (
    <div className="fade-in-up">
      <Title level={2} style={{ marginBottom: '8px' }}>
        艺术风格迁移
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        将您的头像转换为经典艺术风格，体验不同的艺术表现形式
      </Paragraph>

      <Row gutter={[24, 24]}>
        {/* 左侧：上传和风格选择 */}
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
                    onClick={applyStyle}
                    disabled={isProcessing || !selectedStyle}
                    style={{ width: '100%' }}
                  >
                    {isProcessing ? '风格迁移中...' : '应用艺术风格'}
                  </Button>
                  
                  {styleResult?.resultUrl && (
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

          <Card 
            title="选择艺术风格" 
            loading={isLoadingStyles}
            extra={
              <Button 
                icon={<HistoryOutlined />} 
                onClick={() => window.open('/ai-history', '_blank')}
                size="small"
              >
                历史记录
              </Button>
            }
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={[12, 12]}>
              {availableStyles.map(style => (
                <Col xs={12} key={style.id}>
                  <Card
                    hoverable
                    style={{ 
                      textAlign: 'center',
                      border: selectedStyle?.id === style.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      cursor: 'pointer'
                    }}
                    bodyStyle={{ padding: '8px' }}
                    onClick={() => handleStyleSelect(style)}
                  >
                    <div style={{ 
                      width: '100%', 
                      height: '60px', 
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      margin: '0 auto 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {style.image ? (
                        <img 
                          src={style.image} 
                          alt={style.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '10px', color: '#999' }}>
                          {style.name}
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: 'bold',
                      marginBottom: '2px'
                    }}>
                      {style.name}
                    </div>
                    <div style={{ 
                      fontSize: '9px', 
                      color: '#666'
                    }}>
                      {style.artist}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* 使用提示 */}
            <div style={{ 
              marginTop: '16px',
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
                <li>选择您喜欢的艺术风格</li>
                <li>处理时间：2-5分钟</li>
                <li>建议使用清晰的头像照片</li>
              </ul>
            </div>
          </Card>
        </Col>

        {/* 右侧：效果展示 */}
        <Col xs={24} lg={16}>
          {styleResult?.resultUrl ? (
            /* 有结果时显示对比效果 */
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BgColorsOutlined style={{ color: '#1890ff' }} />
                  <span>艺术风格效果对比</span>
                  {selectedStyle && (
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#1890ff',
                      backgroundColor: '#e6f7ff',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      {selectedStyle.name}风格
                    </span>
                  )}
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
                      // 风格对比预览模态框
                      Modal.info({
                        title: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BgColorsOutlined />
                            <span>艺术风格效果对比</span>
                            {selectedStyle && (
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#1890ff',
                                backgroundColor: '#e6f7ff',
                                padding: '2px 8px',
                                borderRadius: '10px'
                              }}>
                                {selectedStyle.name}风格
                              </span>
                            )}
                          </div>
                        ),
                        width: '90%',
                        style: { maxWidth: '1200px', top: 20 },
                        content: (
                          <div>
                            <Row gutter={[24, 16]}>
                              <Col xs={24} md={12}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ 
                                    fontSize: '16px', 
                                    fontWeight: 'bold',
                                    marginBottom: '12px', 
                                    color: '#666'
                                  }}>
                                    原图
                                  </div>
                                  <div style={{
                                    border: '2px solid #e8e8e8',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    backgroundColor: '#fafafa',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '400px'
                                  }}>
                                    <img 
                                      src={userAvatar?.url} 
                                      alt="原图" 
                                      style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '400px',
                                        objectFit: 'contain'
                                      }} 
                                    />
                                  </div>
                                </div>
                              </Col>
                              <Col xs={24} md={12}>
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
                                    <BgColorsOutlined />
                                    <span>{selectedStyle?.name}风格</span>
                                  </div>
                                  <div style={{
                                    border: '3px solid #1890ff',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    backgroundColor: '#fafafa',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '400px',
                                    boxShadow: '0 4px 16px rgba(24, 144, 255, 0.15)'
                                  }}>
                                    <img 
                                      src={styleResult.resultUrl} 
                                      alt="风格迁移结果" 
                                      style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '400px',
                                        objectFit: 'contain'
                                      }} 
                                    />
                                  </div>
                                </div>
                              </Col>
                            </Row>
                            
                            {/* 风格信息 */}
                            <div style={{ 
                              marginTop: '20px',
                              padding: '16px',
                              backgroundColor: '#f6ffed',
                              border: '1px solid #b7eb8f',
                              borderRadius: '8px'
                            }}>
                              <Row gutter={[16, 8]}>
                                <Col span={6}>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                                      {selectedStyle?.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>艺术风格</div>
                                  </div>
                                </Col>
                                <Col span={6}>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                                      {selectedStyle?.artist}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>艺术家</div>
                                  </div>
                                </Col>
                                <Col span={6}>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fa541c' }}>
                                      AI
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>智能迁移</div>
                                  </div>
                                </Col>
                                <Col span={6}>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
                                      HD
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>高清重建</div>
                                  </div>
                                </Col>
                              </Row>
                            </div>

                            {/* 风格描述 */}
                            {selectedStyle?.description && (
                              <div style={{ 
                                marginTop: '16px',
                                padding: '12px',
                                backgroundColor: '#f0f9ff',
                                borderRadius: '6px',
                                fontSize: '14px',
                                color: '#1890ff',
                                textAlign: 'center'
                              }}>
                                {selectedStyle.description}
                              </div>
                            )}
                            
                            {/* 操作按钮 */}
                            <div style={{ 
                              marginTop: '20px',
                              textAlign: 'center'
                            }}>
                              <Space size="middle">
                                <Button
                                  type="primary"
                                  icon={<DownloadOutlined />}
                                  onClick={handleDownload}
                                  size="large"
                                >
                                  下载艺术风格头像
                                </Button>
                                <Button
                                  icon={<ShareAltOutlined />}
                                  onClick={handleShare}
                                  size="large"
                                >
                                  分享作品
                                </Button>
                              </Space>
                            </div>
                          </div>
                        ),
                        okText: '关闭',
                        okButtonProps: { size: 'large' }
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
                      点击查看对比预览
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
                      <BgColorsOutlined />
                      <span>{selectedStyle?.name}风格</span>
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
                      // 同样的对比预览
                      Modal.info({
                        title: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BgColorsOutlined />
                            <span>艺术风格效果对比</span>
                            {selectedStyle && (
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#1890ff',
                                backgroundColor: '#e6f7ff',
                                padding: '2px 8px',
                                borderRadius: '10px'
                              }}>
                                {selectedStyle.name}风格
                              </span>
                            )}
                          </div>
                        ),
                        width: '90%',
                        style: { maxWidth: '1200px', top: 20 },
                        content: (
                          // 同样的内容...
                          <div>
                            <Row gutter={[24, 16]}>
                              <Col xs={24} md={12}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ 
                                    fontSize: '16px', 
                                    fontWeight: 'bold',
                                    marginBottom: '12px', 
                                    color: '#666'
                                  }}>
                                    原图
                                  </div>
                                  <div style={{
                                    border: '2px solid #e8e8e8',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    backgroundColor: '#fafafa',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '400px'
                                  }}>
                                    <img 
                                      src={userAvatar?.url} 
                                      alt="原图" 
                                      style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '400px',
                                        objectFit: 'contain'
                                      }} 
                                    />
                                  </div>
                                </div>
                              </Col>
                              <Col xs={24} md={12}>
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
                                    <BgColorsOutlined />
                                    <span>{selectedStyle?.name}风格</span>
                                  </div>
                                  <div style={{
                                    border: '3px solid #1890ff',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    backgroundColor: '#fafafa',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '400px',
                                    boxShadow: '0 4px 16px rgba(24, 144, 255, 0.15)'
                                  }}>
                                    <img 
                                      src={styleResult.resultUrl} 
                                      alt="风格迁移结果" 
                                      style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '400px',
                                        objectFit: 'contain'
                                      }} 
                                    />
                                  </div>
                                </div>
                              </Col>
                            </Row>
                            
                            {/* 风格信息等其他内容... */}
                          </div>
                        ),
                        okText: '关闭',
                        okButtonProps: { size: 'large' }
                      });
                    }}
                    >
                      <img 
                        src={styleResult.resultUrl} 
                        alt="风格迁移效果" 
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
                      点击查看对比预览 • {selectedStyle?.name}风格
                    </div>
                  </div>
                </Col>
              </Row>
              
              {/* 风格信息指标 */}
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <div style={{ 
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: '#e6f7ff',
                    border: '1px solid #91d5ff',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                      {selectedStyle?.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      艺术风格
                    </div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ 
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                      {selectedStyle?.artist}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      艺术家
                    </div>
                  </div>
                </Col>
                <Col span={6}>
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
                      智能迁移
                    </div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ 
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: '#f9f0ff',
                    border: '1px solid #d3adf7',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                      HD
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      高清重建
                    </div>
                  </div>
                </Col>
              </Row>

              {/* 大图对比按钮 */}
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<BgColorsOutlined />}
                  onClick={() => {
                    // 对比预览模态框
                    Modal.info({
                      title: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <BgColorsOutlined />
                          <span>艺术风格效果对比</span>
                          {selectedStyle && (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#1890ff',
                              backgroundColor: '#e6f7ff',
                              padding: '2px 8px',
                              borderRadius: '10px'
                            }}>
                              {selectedStyle.name}风格
                            </span>
                          )}
                        </div>
                      ),
                      width: '90%',
                      style: { maxWidth: '1200px', top: 20 },
                      content: (
                        <div>
                          <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ 
                                  fontSize: '16px', 
                                  fontWeight: 'bold',
                                  marginBottom: '12px', 
                                  color: '#666'
                                }}>
                                  原图
                                </div>
                                <div style={{
                                  border: '2px solid #e8e8e8',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  backgroundColor: '#fafafa',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minHeight: '400px'
                                }}>
                                  <img 
                                    src={userAvatar?.url} 
                                    alt="原图" 
                                    style={{ 
                                      maxWidth: '100%', 
                                      maxHeight: '400px',
                                      objectFit: 'contain'
                                    }} 
                                  />
                                </div>
                              </div>
                            </Col>
                            <Col xs={24} md={12}>
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
                                  <BgColorsOutlined />
                                  <span>{selectedStyle?.name}风格</span>
                                </div>
                                <div style={{
                                  border: '3px solid #1890ff',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  backgroundColor: '#fafafa',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minHeight: '400px',
                                  boxShadow: '0 4px 16px rgba(24, 144, 255, 0.15)'
                                }}>
                                  <img 
                                    src={styleResult.resultUrl} 
                                    alt="风格迁移结果" 
                                    style={{ 
                                      maxWidth: '100%', 
                                      maxHeight: '400px',
                                      objectFit: 'contain'
                                    }} 
                                  />
                                </div>
                              </div>
                            </Col>
                          </Row>
                          
                          {/* 风格信息等... */}
                          <div style={{ 
                            marginTop: '20px',
                            padding: '16px',
                            backgroundColor: '#f6ffed',
                            border: '1px solid #b7eb8f',
                            borderRadius: '8px'
                          }}>
                            <Row gutter={[16, 8]}>
                              <Col span={6}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                                    {selectedStyle?.name}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>艺术风格</div>
                                </div>
                              </Col>
                              <Col span={6}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                                    {selectedStyle?.artist}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>艺术家</div>
                                </div>
                              </Col>
                              <Col span={6}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fa541c' }}>
                                    AI
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>智能迁移</div>
                                </div>
                              </Col>
                              <Col span={6}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
                                    HD
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>高清重建</div>
                                </div>
                              </Col>
                            </Row>
                          </div>

                          {/* 风格描述 */}
                          {selectedStyle?.description && (
                            <div style={{ 
                              marginTop: '16px',
                              padding: '12px',
                              backgroundColor: '#f0f9ff',
                              borderRadius: '6px',
                              fontSize: '14px',
                              color: '#1890ff',
                              textAlign: 'center'
                            }}>
                              {selectedStyle.description}
                            </div>
                          )}
                          
                          {/* 操作按钮 */}
                          <div style={{ 
                            marginTop: '20px',
                            textAlign: 'center'
                          }}>
                            <Space size="middle">
                              <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={handleDownload}
                                size="large"
                              >
                                下载艺术风格头像
                              </Button>
                              <Button
                                icon={<ShareAltOutlined />}
                                onClick={handleShare}
                                size="large"
                              >
                                分享作品
                              </Button>
                            </Space>
                          </div>
                        </div>
                      ),
                      okText: '关闭',
                      okButtonProps: { size: 'large' }
                    });
                  }}
                  style={{ 
                    background: 'linear-gradient(45deg, #1890ff, #722ed1)',
                    border: 'none'
                  }}
                >
                  查看大图对比效果
                </Button>
              </div>
            </Card>
          ) : (
            /* 无结果时显示引导界面 */
            <Card>
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: '#999'
              }}>
                <BgColorsOutlined style={{ fontSize: '64px', marginBottom: '24px' }} />
                <Title level={4} type="secondary">
                  艺术风格迁移预览
                </Title>
                <Paragraph type="secondary">
                  上传头像并选择艺术风格后，这里将显示风格迁移效果对比
                </Paragraph>
                
                {/* 功能特点展示 */}
                <Row gutter={[16, 16]} style={{ marginTop: '40px' }}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '32px', 
                        marginBottom: '8px',
                        color: '#1890ff'
                      }}>
                        🎨
                      </div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        艺术风格
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        6种经典艺术大师风格
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '32px', 
                        marginBottom: '8px',
                        color: '#52c41a'
                      }}>
                        ⚡
                      </div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        智能迁移
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        AI深度学习风格转换
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
                        高保真
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        保持面部特征完整性
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* 分享弹窗 */}
      <Modal
        title="分享您的艺术作品"
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
            <p>扫描二维码查看您的艺术风格头像</p>
            <p style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
              链接有效期至: {shareData.expiresAt}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default StyleTransfer