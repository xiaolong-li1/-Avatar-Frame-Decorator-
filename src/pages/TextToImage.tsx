import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Typography, Input, message, Space, Progress } from 'antd'
import { BulbOutlined, DownloadOutlined, HistoryOutlined } from '@ant-design/icons'
import { api, pollTaskStatus, handleApiError } from '../services/api'

const { Title, Paragraph } = Typography
const { TextArea } = Input

const TextToImage: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('')
  const [generatedImage, setGeneratedImage] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [taskId, setTaskId] = useState<string>('')
  const [generationHistory, setGenerationHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const promptExamples = [
    '星空下的猫咪，梦幻风格',
    '戴着帽子的可爱熊猫',
    '水彩风格的独角兽',
    '古典肖像画风格的女性',
    '赛博朋克风格的机器人',
    '动漫风格的少女'
  ]

  // 加载历史记录
  useEffect(() => {
    if (showHistory) {
      loadHistory()
    }
  }, [showHistory])

  const loadHistory = async () => {
    try {
      const response = await api.getTextToImageHistory()
      if (response.success) {
        setGenerationHistory(response.data.records)
      }
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning('请输入文字描述')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    
    try {
      // 调用后端 API 生成图像
      const response = await api.textToImage(prompt, 1024, 1024, 'dall-e-3', 'standard')
      
      if (response.success) {
        setTaskId(response.data.taskId)
        
        // 如果返回了直接可用的 resultUrl，使用它
        if (response.data.resultUrl) {
          setGeneratedImage(response.data.resultUrl)
          setIsGenerating(false)
          message.success('头像生成成功！')
        } else {
          // 否则，开始轮询任务状态
          pollTaskStatus(response.data.taskId, (status) => {
            // 更新进度
            if (status.progress) {
              setProgress(status.progress)
            }
            
            // 任务完成后，获取图像 URL
            if (status.status === 'completed' && status.resultUrl) {
              setGeneratedImage(status.resultUrl)
              setIsGenerating(false)
              message.success('头像生成成功！')
            }
          }).catch(error => {
            console.error('生成失败:', error)
            message.error(`生成失败: ${error.message || '请稍后重试'}`)
            setIsGenerating(false)
          })
        }
      }
    } catch (error) {
      console.error('API调用失败:', error)
      handleApiError(error)
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedImage) {
      message.warning('请先生成头像')
      return
    }

    try {
      if (taskId && false) {
        // 使用 saveResult API 获取下载链接
        const response = await api.saveResult(taskId)
        if (response.success && response.data.downloadUrl) {
          // 创建临时链接并触发下载
          const link = document.createElement('a')
          link.href = response.data.downloadUrl
          link.download = `ai-avatar-${Date.now()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          message.success('头像下载成功！')
        } else {
          throw new Error('获取下载链接失败')
        }
      } else {
        // 如果没有 taskId，直接使用图片 URL
        const link = document.createElement('a')
        link.href = generatedImage
        link.download = `ai-avatar-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        message.success('头像下载成功！')
      }
    } catch (error) {
      console.error('下载失败:', error)
      message.error('下载失败，请稍后重试')
    }
  }

  const useExample = (example: string) => {
    setPrompt(example)
  }

  const useHistoryItem = (item: any) => {
    // 使用历史记录中的提示词并加载历史图像
    setPrompt(item.prompt)
    setGeneratedImage(item.result_url)
    setShowHistory(false)
  }

  return (
    <div className="fade-in-up">
      <Title level={2} style={{ marginBottom: '8px' }}>
        文生图头像生成
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        通过文字描述自动生成个性化头像，释放您的创意想象
      </Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            title="文字描述" 
            extra={
              <Button 
                icon={<HistoryOutlined />} 
                type="link" 
                onClick={() => setShowHistory(!showHistory)}
              >
                历史记录
              </Button>
            }
          >
            {!showHistory ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <TextArea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="请描述您想要的头像，例如：星空下的猫咪，梦幻风格"
                  rows={4}
                  maxLength={200}
                  showCount
                />
                
                <Button
                  type="primary"
                  icon={<BulbOutlined />}
                  loading={isGenerating}
                  onClick={handleGenerate}
                  style={{ width: '100%' }}
                >
                  {isGenerating ? '生成中...' : '生成头像'}
                </Button>

                {isGenerating && progress > 0 && (
                  <Progress percent={progress} status="active" />
                )}

                <div>
                  <Paragraph strong>示例描述：</Paragraph>
                  <Space wrap>
                    {promptExamples.map((example, index) => (
                      <Button
                        key={index}
                        size="small"
                        onClick={() => useExample(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </Space>
                </div>
              </Space>
            ) : (
              <div>
                <Paragraph>您之前生成的头像：</Paragraph>
                {generationHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Paragraph type="secondary">暂无生成记录</Paragraph>
                  </div>
                ) : (
                  <Row gutter={[16, 16]}>
                    {generationHistory.map((item, index) => (
                      <Col span={8} key={index}>
                        <div 
                          style={{ cursor: 'pointer' }}
                          onClick={() => useHistoryItem(item)}
                        >
                          <img 
                            src={item.result_url} 
                            alt={item.prompt} 
                            style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                          />
                          <p style={{ 
                            fontSize: '12px', 
                            marginTop: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.prompt.length > 15 
                              ? `${item.prompt.substring(0, 15)}...` 
                              : item.prompt}
                          </p>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
                <Button 
                  style={{ marginTop: '10px' }} 
                  onClick={() => setShowHistory(false)}
                >
                  返回编辑
                </Button>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="生成结果">
            {!generatedImage ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 20px',
                color: '#999'
              }}>
                <BulbOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
                <Title level={4} type="secondary">
                  输入描述生成头像
                </Title>
                <Paragraph type="secondary">
                  AI将根据您的描述创造独特的头像
                </Paragraph>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="avatar-preview" style={{ 
                  width: '250px', 
                  height: '250px', 
                  margin: '0 auto 16px'
                }}>
                  <img 
                    src={generatedImage} 
                    alt="生成的头像" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                  >
                    下载头像
                  </Button>
                  <Button 
                    onClick={() => {
                      setGeneratedImage('')
                      setTaskId('')
                    }}
                  >
                    重新生成
                  </Button>
                </Space>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default TextToImage