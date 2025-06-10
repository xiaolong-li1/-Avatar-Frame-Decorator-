import React, { useState, useEffect, useRef } from 'react'
import { Card, Row, Col, Button, Typography, Space, message, Spin, Modal } from 'antd'
import { BgColorsOutlined, DownloadOutlined, LoadingOutlined, ShareAltOutlined, HistoryOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'
import api from '../services/api'
import { handleApiError } from '../services/api'

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
}

interface StyleResult {
  resultUrl?: string
  taskId?: string
}

const StyleTransfer: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<AvatarData | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StyleTemplate | null>(null)
  const [styleResult, setStyleResult] = useState<StyleResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [availableStyles, setAvailableStyles] = useState<StyleTemplate[]>([])
  const [isLoadingStyles, setIsLoadingStyles] = useState(true)
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [shareData, setShareData] = useState<{
    shareUrl: string
    qrCodeUrl: string
    expiresAt: string
  } | null>(null)

  // 使用 useRef 来追踪当前请求
  const currentRequestRef = useRef<AbortController | null>(null)

  // 硬编码的风格模板（与后端保持一致）
  const defaultStyles: StyleTemplate[] = [
    {
      id: 'vangogh_starry',
      name: '星空',
      artist: '梵高',
      description: '梵高经典作品《星空》风格'
    },
    {
      id: 'monet_water',
      name: '水莲',
      artist: '莫奈',
      description: '莫奈印象派水莲系列风格'
    },
    {
      id: 'picasso_abstract',
      name: '立体派',
      artist: '毕加索',
      description: '毕加索立体主义抽象风格'
    },
    {
      id: 'chinese_ink',
      name: '水墨画',
      artist: '中式传统',
      description: '中国传统水墨画风格'
    },
    {
      id: 'oil_painting',
      name: '古典油画',
      artist: '欧洲古典',
      description: '欧洲古典油画风格'
    },
    {
      id: 'watercolor',
      name: '水彩画',
      artist: '现代水彩',
      description: '清新水彩画风格'
    }
  ]

  // 加载可用风格列表
  useEffect(() => {
    const loadStyles = async () => {
      try {
        const response = await api.getStylesList()
        if (response.success && response.data?.styles) {
          setAvailableStyles(response.data.styles)
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
      console.log('正在处理中，跳过重复请求')
      return
    }

    // 取消之前的请求
    if (currentRequestRef.current) {
      currentRequestRef.current.abort()
    }

    setIsProcessing(true)
    let isPollingMode = false // 标记是否进入轮询模式

    try {
      console.log('应用风格迁移 - 参数:', {
        avatarFileId: userAvatar.fileId,
        styleId: selectedStyle.id
      })

      // 调用API应用风格迁移
      const response = await api.styleTransfer(userAvatar.fileId, selectedStyle.id)
      
      console.log('风格迁移 - 响应:', response)

      if (response.success && response.data) {
        if (response.data.resultUrl) {
          // 直接返回了结果URL - 立即显示
          setStyleResult({ resultUrl: response.data.resultUrl, taskId: response.data.taskId })
          message.success(`${selectedStyle.name}风格应用成功！`)
          // 直接完成，不进入轮询模式
        } else if (response.data.taskId) {
          // 返回的是任务ID - 需要轮询任务状态
          isPollingMode = true // 标记进入轮询模式
          message.info('图片处理中，请稍候...')
          
          const taskId = response.data.taskId
          let pollCount = 0
          
          const checkTaskStatus = async () => {
            if (pollCount > 30) { // 最多轮询30次
              setIsProcessing(false)
              message.error('处理超时，请重试')
              return
            }

            try {
              console.log(`轮询任务状态 #${pollCount} - 任务ID: ${taskId}`)
              const statusRes = await api.getTaskStatus(taskId)
              
              if (statusRes.success && statusRes.data) {
                console.log(`任务状态: ${statusRes.data.status}`)
                
                if (statusRes.data.status === 'completed' && statusRes.data.resultUrl) {
                  setStyleResult({ resultUrl: statusRes.data.resultUrl, taskId })
                  setIsProcessing(false)
                  message.success(`${selectedStyle.name}风格应用成功！`)
                } else if (statusRes.data.status === 'failed') {
                  setIsProcessing(false)
                  message.error(`处理失败: ${statusRes.data.error || '未知错误'}`)
                } else if (statusRes.data.status === 'processing') {
                  pollCount++
                  setTimeout(checkTaskStatus, 2000) // 每2秒轮询一次
                } else {
                  pollCount++
                  setTimeout(checkTaskStatus, 2000)
                }
              } else {
                throw new Error(statusRes.message || '获取任务状态失败')
              }
            } catch (err) {
              console.error('轮询任务状态失败:', err)
              setIsProcessing(false)
              message.error('获取处理状态失败，请重试')
            }
          }
          
          checkTaskStatus()
        } else {
          throw new Error('服务器响应缺少必要数据')
        }
      } else {
        throw new Error(response.message || '风格迁移处理失败')
      }
    } catch (error) {
      console.error('风格迁移处理出错:', error)
      
      // 特殊处理AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('请求被中止，可能是用户取消或超时')
        message.warning('请求已取消')
      } else {
        message.error('风格迁移处理失败，请重试')
      }
      
      // 出错时重置状态
      setIsProcessing(false)
    } finally {
      // 只有在非轮询模式下才在这里重置状态
      if (!isPollingMode) {
        setIsProcessing(false)
      }
      currentRequestRef.current = null
    }
  }

  // 取消当前操作
  const cancelOperation = () => {
    if (currentRequestRef.current) {
      currentRequestRef.current.abort()
    }
    setIsProcessing(false)
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
        <Col xs={24} lg={8}>
          <Card title="上传头像" style={{ marginBottom: '16px', position: 'relative' }}>
            {!userAvatar ? (
              <AvatarUpload onImageChange={handleAvatarChange} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="avatar-preview" style={{ 
                  width: '200px', 
                  height: '200px', 
                  margin: '0 auto 16px',
                  position: 'relative'
                }}>
                  <img 
                    src={styleResult?.resultUrl || userAvatar.url} 
                    alt="头像预览" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  {isProcessing && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.7)',
                        borderRadius: '8px',
                      }}
                    >
                      <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: '#fff' }} spin />} />
                      <span style={{ color: '#fff', marginTop: '8px', fontSize: '12px' }}>处理中...</span>
                    </div>
                  )}
                </div>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<BgColorsOutlined />}
                    onClick={applyStyle}
                    disabled={!selectedStyle || isProcessing}
                    loading={isProcessing}
                  >
                    应用风格
                  </Button>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    disabled={!styleResult?.resultUrl}
                  >
                    下载头像
                  </Button>
                  <Button 
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                    disabled={!styleResult?.resultUrl}
                  >
                    分享到微信
                  </Button>
                </Space>
                <div style={{ marginTop: '8px' }}>
                  <Button 
                    size="small" 
                    onClick={() => {
                      setUserAvatar(null)
                      setStyleResult(null)
                      setSelectedStyle(null)
                    }}
                  >
                    重新上传
                  </Button>
                  {isProcessing && (
                    <Button 
                      size="small" 
                      onClick={cancelOperation}
                      style={{ marginLeft: '8px' }}
                    >
                      取消处理
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>

          {selectedStyle && (
            <Card title="当前风格" style={{ marginBottom: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedStyle.name}</div>
                <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                  {selectedStyle.artist}
                </div>
                <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                  {selectedStyle.description}
                </Paragraph>
              </div>
            </Card>
          )}

          {/* 预览效果卡片 - 确保在当前风格卡片下面 */}
          {styleResult?.resultUrl && (
            <Card title="风格效果对比" style={{ marginBottom: '16px' }}>
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', marginBottom: '8px', color: '#666' }}>原图</div>
                    <div style={{ 
                      width: '100%', 
                      height: '100px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderRadius: '4px',
                      backgroundColor: '#f5f5f5'
                    }}>
                      <img 
                        src={userAvatar?.url} 
                        alt="原图" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          objectFit: 'contain',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', marginBottom: '8px', color: '#666' }}>
                      {selectedStyle?.name}风格
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '100px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderRadius: '4px',
                      backgroundColor: '#f5f5f5'
                    }}>
                      <img 
                        src={styleResult.resultUrl} 
                        alt="风格化效果" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          objectFit: 'contain',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={16}>
          <Card 
            title="选择艺术风格" 
            loading={isLoadingStyles}
            extra={
              <Button 
                icon={<HistoryOutlined />} 
                onClick={() => window.open('/ai-history', '_blank')}
              >
                查看历史
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              {availableStyles.map(style => (
                <Col xs={12} sm={8} md={6} key={style.id}>
                  <Card
                    hoverable
                    style={{ 
                      textAlign: 'center',
                      border: selectedStyle?.id === style.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      cursor: 'pointer'
                    }}
                    bodyStyle={{ padding: '12px' }}
                    onClick={() => handleStyleSelect(style)}
                  >
                    <div style={{ 
                      width: '80px', 
                      height: '60px', 
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px',
                      margin: '0 auto 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      {style.name}
                    </div>
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
                navigator.clipboard.writeText(shareData.shareUrl)
                message.success('链接已复制到剪贴板')
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
            <p>扫描二维码查看您的{selectedStyle?.name}风格头像</p>
            <p style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
              链接有效期至: {new Date(shareData.expiresAt).toLocaleString()}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default StyleTransfer