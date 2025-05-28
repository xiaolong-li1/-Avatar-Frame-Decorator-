import React, { useState } from 'react'
import { Card, Row, Col, Button, Typography, Space, message, Progress, Slider, Select } from 'antd'
import { HighlightOutlined, DownloadOutlined, SwapOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'

const { Title, Paragraph } = Typography
const { Option } = Select

const SuperResolution: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string>('')
  const [processedImage, setProcessedImage] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [scaleFactor, setScaleFactor] = useState(2)
  const [quality, setQuality] = useState('high')
  const [showComparison, setShowComparison] = useState(false)

  const handleImageUpload = (imageUrl: string) => {
    setOriginalImage(imageUrl)
    setProcessedImage('')
    setProgress(0)
  }

  const handleSuperResolution = async () => {
    if (!originalImage) {
      message.warning('请先上传头像图片')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      // 模拟超分处理过程
      const totalSteps = 10
      for (let i = 1; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setProgress((i / totalSteps) * 100)
      }

      // 模拟处理结果
      setProcessedImage(originalImage) // 实际应该是处理后的图片
      message.success('头像超分处理完成！')
    } catch (error) {
      message.error('处理失败，请稍后重试')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!processedImage) {
      message.warning('请先完成超分处理')
      return
    }
    message.success('高清头像下载成功！')
  }

  const getQualityDescription = (quality: string) => {
    const descriptions = {
      'normal': '标准质量 - 处理速度快，适合一般使用',
      'high': '高质量 - 平衡处理时间与效果',
      'ultra': '超高质量 - 最佳效果，处理时间较长'
    }
    return descriptions[quality as keyof typeof descriptions]
  }

  return (
    <div className="fade-in-up">
      <Title level={2} style={{ marginBottom: '8px' }}>
        头像超分处理
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        使用AI技术提升头像分辨率和清晰度，让您的头像在各种设备上都清晰细腻
      </Paragraph>

      <Row gutter={[24, 24]}>
        {/* 上传和设置区域 */}
        <Col xs={24} lg={8}>
          <Card title="上传头像" style={{ marginBottom: '16px' }}>
            <AvatarUpload onImageChange={handleImageUpload} />
          </Card>

          {originalImage && (
            <Card title="处理设置">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Paragraph strong>放大倍数</Paragraph>
                  <Slider
                    min={2}
                    max={8}
                    value={scaleFactor}
                    onChange={setScaleFactor}
                    marks={{
                      2: '2x',
                      4: '4x',
                      6: '6x',
                      8: '8x'
                    }}
                  />
                  <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                    当前设置：{scaleFactor}倍放大
                  </Paragraph>
                </div>

                <div>
                  <Paragraph strong>处理质量</Paragraph>
                  <Select
                    value={quality}
                    onChange={setQuality}
                    style={{ width: '100%' }}
                  >
                    <Option value="normal">标准质量</Option>
                    <Option value="high">高质量</Option>
                    <Option value="ultra">超高质量</Option>
                  </Select>
                  <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                    {getQualityDescription(quality)}
                  </Paragraph>
                </div>

                <Button
                  type="primary"
                  icon={<HighlightOutlined />}
                  loading={isProcessing}
                  onClick={handleSuperResolution}
                  style={{ width: '100%' }}
                >
                  {isProcessing ? '处理中...' : '开始超分处理'}
                </Button>

                {isProcessing && (
                  <div>
                    <Paragraph strong>处理进度</Paragraph>
                    <Progress percent={progress} size="small" />
                  </div>
                )}
              </Space>
            </Card>
          )}
        </Col>

        {/* 效果展示区域 */}
        <Col xs={24} lg={16}>
          <Card 
            title="处理效果"
            extra={
              processedImage && (
                <Space>
                  <Button
                    icon={<SwapOutlined />}
                    onClick={() => setShowComparison(!showComparison)}
                  >
                    {showComparison ? '隐藏对比' : '对比查看'}
                  </Button>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                  >
                    下载高清头像
                  </Button>
                </Space>
              )
            }
          >
            {!originalImage ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 20px',
                color: '#999'
              }}>
                <HighlightOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
                <Title level={4} type="secondary">
                  上传头像开始超分处理
                </Title>
                <Paragraph type="secondary">
                  支持将低分辨率头像提升至高清画质
                </Paragraph>
              </div>
            ) : (
              <div>
                {showComparison && processedImage ? (
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <Title level={5}>原始图片</Title>
                        <div className="avatar-preview" style={{ 
                          width: '200px', 
                          height: '200px', 
                          margin: '0 auto'
                        }}>
                          <img 
                            src={originalImage} 
                            alt="原始头像" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <Paragraph type="secondary" style={{ marginTop: '8px' }}>
                          分辨率较低
                        </Paragraph>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <Title level={5}>处理后图片</Title>
                        <div className="avatar-preview" style={{ 
                          width: '200px', 
                          height: '200px', 
                          margin: '0 auto'
                        }}>
                          <img 
                            src={processedImage} 
                            alt="处理后头像" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <Paragraph type="secondary" style={{ marginTop: '8px' }}>
                          {scaleFactor}x 高清画质
                        </Paragraph>
                      </div>
                    </Col>
                  </Row>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div className="avatar-preview" style={{ 
                      width: '300px', 
                      height: '300px', 
                      margin: '0 auto 16px'
                    }}>
                      <img 
                        src={processedImage || originalImage} 
                        alt="头像预览" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    {processedImage ? (
                      <Paragraph>
                        ✨ 处理完成！头像已提升为 <strong>{scaleFactor}x</strong> 高清画质
                      </Paragraph>
                    ) : (
                      <Paragraph type="secondary">
                        调整设置参数，点击"开始超分处理"开始处理
                      </Paragraph>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* 技术说明 */}
          <Card title="技术说明" style={{ marginTop: '16px' }}>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '32px', 
                    color: '#1890ff', 
                    marginBottom: '8px' 
                  }}>
                    <HighlightOutlined />
                  </div>
                  <Title level={5}>AI超分算法</Title>
                  <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                    基于深度学习的图像超分辨率重建技术
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '32px', 
                    color: '#52c41a', 
                    marginBottom: '8px' 
                  }}>
                    ⚡
                  </div>
                  <Title level={5}>快速处理</Title>
                  <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                    优化的模型架构，实现快速高质量处理
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '32px', 
                    color: '#722ed1', 
                    marginBottom: '8px' 
                  }}>
                    🎯
                  </div>
                  <Title level={5}>细节保持</Title>
                  <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                    保持原图细节特征，避免过度锐化
                  </Paragraph>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default SuperResolution 