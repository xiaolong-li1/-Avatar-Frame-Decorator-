import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Typography, message, Slider, Space, Spin, Modal } from 'antd'
import { CameraOutlined, DownloadOutlined, ShareAltOutlined, LoadingOutlined, HistoryOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'
import { api, handleApiError } from '../services/api'

const { Title, Paragraph } = Typography

interface AvatarData {
  fileId: string
  url: string
}

interface BlurResult {
  resultUrl?: string
  taskId?: string
}

const BackgroundBlur: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<AvatarData | null>(null)
  const [blurLevel, setBlurLevel] = useState(5)
  const [blurResult, setBlurResult] = useState<BlurResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [shareData, setShareData] = useState<{
    shareUrl: string
    qrCodeUrl: string
    expiresAt: string
  } | null>(null)

  // 处理头像上传
  const handleAvatarChange = (data: AvatarData) => {
    setUserAvatar(data)
    setBlurResult(null) // 重置结果
    message.info('头像已上传，调整模糊强度后点击应用')
  }

  // 应用背景模糊
  const applyBlur = async () => {
    if (!userAvatar || !userAvatar.fileId) {
      message.warning('请先上传头像图片')
      return
    }

    if (isProcessing) {
      console.log('正在处理中，跳过重复请求')
      return
    }

    setIsProcessing(true)

    try {
      console.log('应用背景模糊 - 参数:', {
        avatarFileId: userAvatar.fileId,
        blurLevel
      })

      // 调用API应用背景模糊（前端超时设置为150秒，给后端足够时间）
      const response = await api.backgroundBlur(userAvatar.fileId, blurLevel)
      
      console.log('背景模糊 - 响应:', response)

      if (response.success && response.data) {
        if (response.data.resultUrl) {
          // 直接返回了结果URL - 立即显示
          setBlurResult({ resultUrl: response.data.resultUrl, taskId: response.data.taskId })
          message.success('背景模糊处理成功！')
        } else if (response.data.taskId) {
          // 返回的是任务ID - 需要轮询任务状态
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
                  setBlurResult({ resultUrl: statusRes.data.resultUrl, taskId })
                  setIsProcessing(false)
                  message.success('背景模糊处理成功！')
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
        throw new Error(response.message || '背景模糊处理失败')
      }
    } catch (error) {
      console.error('背景模糊处理出错:', error)
      
      // 特殊处理AbortError
      if (typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'AbortError') {
        message.warning('请求已取消')
      } else {
        handleApiError(error)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // 下载处理后的图片
  const handleDownload = async () => {
    if (!blurResult || !blurResult.resultUrl) {
      message.warning('请先应用背景模糊效果')
      return
    }

    try {
      const response = await fetch(blurResult.resultUrl)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `blurred-avatar-${Date.now()}.png`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)

      message.success('图片下载成功！')
    } catch (error) {
      console.error('下载失败:', error)
      message.error('下载失败，请重试')
    }
  }

  // 分享功能
  const handleShare = async () => {
    if (!blurResult || !blurResult.resultUrl) {
      message.warning('请先应用背景模糊效果')
      return
    }
    
    try {
      const imageUrl = blurResult.resultUrl
      console.log('分享图片URL:', imageUrl)
      
      const shareResponse = await api.createShare(imageUrl, 'wechat', {
        resultFileId: imageUrl
      })
      
      if (shareResponse.success && shareResponse.data) {
        setShareData(shareResponse.data)
        setShareModalVisible(true)
        message.success('分享链接创建成功')
      } else {
        throw new Error(shareResponse.message || '创建分享失败')
      }
    } catch (error) {
      console.error('分享失败:', error)
      handleApiError(error)
    }
  }

  // 移除自动防抖功能，只保留手动点击
  // useEffect(() => {
  //   if (userAvatar && blurResult) {
  //     const delayDebounceFn = setTimeout(() => {
  //       applyBlur()
  //     }, 800) // 800ms延迟

  //     return () => clearTimeout(delayDebounceFn)
  //   }
  // }, [blurLevel]) // 移除自动触发

  // 只保留手动取消的超时保护
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    
    if (isProcessing) {
      timer = setTimeout(() => {
        setIsProcessing(false)
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
        人像背景虚化
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        智能识别人像并进行背景虚化处理，突出主体并提升专业感
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
                  {blurResult && blurResult.resultUrl ? (
                    <img
                      src={blurResult.resultUrl}
                      alt="模糊后的头像"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  ) : (
                    <img
                      src={userAvatar.url}
                      alt="原始头像"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                    />
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
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '8px',
                      }}
                    >
                      <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: '#fff' }} spin />} />
                      <span style={{ color: '#fff', marginTop: '8px' }}>处理中...</span>
                      <Button
                        size="small"
                        style={{ marginTop: '8px' }}
                        onClick={() => {
                          setIsProcessing(false)
                          message.info('已取消操作')
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  )}
                </div>

                <Space>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    disabled={!blurResult || isProcessing}
                  >
                    下载图片
                  </Button>
                  <Button
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                    disabled={!blurResult || isProcessing}
                  >
                    分享到微信
                  </Button>
                </Space>

                <div style={{ marginTop: '16px' }}>
                  <Button type="link" onClick={() => {
                    setUserAvatar(null)
                    setBlurResult(null)
                  }}>
                    重新上传
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* 模糊强度控制 */}
          {userAvatar && (
            <Card title="模糊强度">
              <div style={{ padding: '16px 0' }}>
                <Paragraph strong style={{ marginBottom: '16px' }}>
                  调整背景模糊强度：{blurLevel}
                </Paragraph>
                <Slider
                  min={1}
                  max={10}
                  value={blurLevel}
                  onChange={(value) => setBlurLevel(value)}
                  marks={{
                    1: '轻微',
                    5: '中等',
                    10: '强烈'
                  }}
                  disabled={isProcessing}
                />
                <Button
                  type="primary"
                  onClick={applyBlur}
                  loading={isProcessing}
                  style={{ marginTop: '16px', width: '100%' }}
                >
                  应用模糊效果
                </Button>
              </div>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={16}>
          <Card 
            title="虚化效果预览"
            extra={
              <Button 
                icon={<HistoryOutlined />} 
                onClick={() => window.open('/ai-history', '_blank')}
              >
                查看历史
              </Button>
            }
          >
            {!userAvatar ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                <CameraOutlined style={{ fontSize: '48px' }} />
                <div style={{ marginTop: '16px' }}>上传头像查看虚化效果</div>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>
                  支持JPG、PNG格式，建议上传清晰的人像照片
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: '16px' }}>
                      <Title level={4}>原图</Title>
                      <img 
                        src={userAvatar.url} 
                        alt="原始头像" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '300px',
                          borderRadius: '8px',
                          border: '1px solid #d9d9d9'
                        }}
                      />
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: '16px' }}>
                      <Title level={4}>模糊效果</Title>
                      {blurResult && blurResult.resultUrl ? (
                        <img 
                          src={blurResult.resultUrl} 
                          alt="模糊后的头像" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '300px',
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '300px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px dashed #d9d9d9',
                          borderRadius: '8px',
                          color: '#999'
                        }}>
                          {isProcessing ? (
                            <div>
                              <Spin />
                              <div style={{ marginTop: '8px' }}>处理中...</div>
                            </div>
                          ) : (
                            <div>
                              <CameraOutlined style={{ fontSize: '24px' }} />
                              <div style={{ marginTop: '8px' }}>调整模糊强度并应用</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
                
                {blurResult && (
                  <div style={{ 
                    marginTop: '24px', 
                    padding: '16px', 
                    backgroundColor: '#f6f6f6', 
                    borderRadius: '8px' 
                  }}>
                    <Paragraph>
                      ✅ 背景模糊处理完成！当前模糊强度：<strong>{blurLevel}</strong>
                    </Paragraph>
                  </div>
                )}
              </div>
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
            <p>扫描二维码查看或分享您的背景模糊头像</p>
            <p style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
              链接有效期至: {new Date(shareData.expiresAt).toLocaleString()}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default BackgroundBlur