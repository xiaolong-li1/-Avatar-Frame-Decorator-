import React, { useState } from 'react'
import { Card, Row, Col, Button, Typography, Input, message, Space } from 'antd'
import { BulbOutlined, DownloadOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { TextArea } = Input

const TextToImage: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('')
  const [generatedImage, setGeneratedImage] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  const promptExamples = [
    '星空下的猫咪，梦幻风格',
    '戴着帽子的可爱熊猫',
    '水彩风格的独角兽',
    '古典肖像画风格的女性',
    '赛博朋克风格的机器人',
    '动漫风格的少女'
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning('请输入文字描述')
      return
    }

    setIsGenerating(true)
    try {
      // 模拟AI生成过程
      await new Promise(resolve => setTimeout(resolve, 3000))
      setGeneratedImage('/api/placeholder/300/300') // 模拟生成的图片
      message.success('头像生成成功！')
    } catch (error) {
      message.error('生成失败，请稍后重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) {
      message.warning('请先生成头像')
      return
    }
    message.success('头像下载成功！')
  }

  const useExample = (example: string) => {
    setPrompt(example)
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
          <Card title="文字描述">
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
                  <Button onClick={() => setGeneratedImage('')}>
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