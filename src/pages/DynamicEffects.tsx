import React, { useState } from 'react'
import { Card, Row, Col, Button, Upload, Typography, Space, Select, Slider, Progress, message, Radio, Switch } from 'antd'
import { UploadOutlined, PlayCircleOutlined, DownloadOutlined, StarOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import AvatarUpload from '../components/AvatarUpload'

const { Title, Paragraph } = Typography
const { Option } = Select

interface EffectConfig {
  type: string
  speed: number
  density: number
  color: string
  direction: string
  size: number
}

const DynamicEffects: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [effectConfig, setEffectConfig] = useState<EffectConfig>({
    type: 'particles',
    speed: 50,
    density: 30,
    color: '#ffffff',
    direction: 'down',
    size: 5
  })
  const [outputFormat, setOutputFormat] = useState<'gif' | 'mp4'>('gif')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [processedUrl, setProcessedUrl] = useState<string>('')
  const [isAutoLoop, setIsAutoLoop] = useState(true)

  const effectTypes = [
    { value: 'particles', label: '粒子飘落', description: '雪花、花瓣等粒子效果' },
    { value: 'sparkle', label: '闪烁星光', description: '随机闪烁的星光特效' },
    { value: 'glow', label: '光晕效果', description: '柔和的光晕边缘效果' },
    { value: 'rain', label: '雨滴效果', description: '动态雨滴飘洒效果' },
    { value: 'flame', label: '火焰特效', description: '动态火焰燃烧效果' },
    { value: 'electric', label: '电流特效', description: '酷炫的电流闪烁效果' }
  ]

  const handleFileUpload = (imageUrl: string) => {
    setPreviewUrl(imageUrl)
    // Convert data URL to blob for file handling
    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        setUploadedFile(file)
      })
  }

  const handleProcessing = async () => {
    if (!uploadedFile) {
      message.error('请先上传头像图片')
      return
    }

    setIsProcessing(true)
    setProcessProgress(0)

    // 模拟处理过程
    const interval = setInterval(() => {
      setProcessProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          // 模拟生成的动态头像URL
          setProcessedUrl(previewUrl + '#processed')
          message.success('动态特效添加成功！')
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const handleDownload = () => {
    if (!processedUrl) return
    
    const link = document.createElement('a')
    link.href = processedUrl
    link.download = `dynamic-avatar-${Date.now()}.${outputFormat}`
    link.click()
    message.success('头像下载成功！')
  }

  const getEffectDescription = (type: string) => {
    const effect = effectTypes.find(e => e.value === type)
    return effect?.description || ''
  }

  return (
    <div className="fade-in-up">
      <Title level={2} style={{ marginBottom: '24px' }}>
        <StarOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />
        动态特效头像
      </Title>
      
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        为您的头像添加炫酷的动态特效，支持粒子飘落、光影变化等多种效果，生成GIF或MP4格式的动态头像
      </Paragraph>

      <Row gutter={[24, 24]}>
        {/* 左侧：上传和预览 */}
        <Col xs={24} lg={12}>
          <Card title="头像上传" style={{ marginBottom: '24px' }}>
            <AvatarUpload onImageChange={handleFileUpload} />
            
            {previewUrl && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Title level={5}>原始头像预览</Title>
                <div className="avatar-preview" style={{ width: '200px', height: '200px', margin: '0 auto' }}>
                  <img src={previewUrl} alt="Original Avatar" />
                </div>
              </div>
            )}
          </Card>

          {/* 处理结果 */}
          {processedUrl && (
            <Card title="动态效果预览">
              <div style={{ textAlign: 'center' }}>
                <div className="avatar-preview" style={{ width: '200px', height: '200px', margin: '0 auto 16px' }}>
                  <img src={processedUrl} alt="Processed Avatar" />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {outputFormat.toUpperCase()}
                  </div>
                </div>
                
                <Space>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                  >
                    下载动态头像
                  </Button>
                  <Button onClick={() => setProcessedUrl('')}>
                    重新处理
                  </Button>
                </Space>
              </div>
            </Card>
          )}
        </Col>

        {/* 右侧：特效配置 */}
        <Col xs={24} lg={12}>
          <Card title="特效设置">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 特效类型选择 */}
              <div>
                <Title level={5}>特效类型</Title>
                <Select
                  value={effectConfig.type}
                  onChange={(value) => setEffectConfig(prev => ({ ...prev, type: value }))}
                  style={{ width: '100%' }}
                  placeholder="选择特效类型"
                >
                  {effectTypes.map(effect => (
                    <Option key={effect.value} value={effect.value}>
                      <div>
                        <div>{effect.label}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>{effect.description}</div>
                      </div>
                    </Option>
                  ))}
                </Select>
                <Paragraph type="secondary" style={{ marginTop: '8px', fontSize: '12px' }}>
                  {getEffectDescription(effectConfig.type)}
                </Paragraph>
              </div>

              {/* 速度设置 */}
              <div>
                <Title level={5}>动画速度</Title>
                <Slider
                  value={effectConfig.speed}
                  onChange={(value) => setEffectConfig(prev => ({ ...prev, speed: value }))}
                  min={10}
                  max={100}
                  marks={{
                    10: '慢',
                    50: '中',
                    100: '快'
                  }}
                />
              </div>

              {/* 密度设置 */}
              <div>
                <Title level={5}>特效密度</Title>
                <Slider
                  value={effectConfig.density}
                  onChange={(value) => setEffectConfig(prev => ({ ...prev, density: value }))}
                  min={10}
                  max={100}
                  marks={{
                    10: '稀疏',
                    50: '适中',
                    100: '密集'
                  }}
                />
              </div>

              {/* 大小设置 */}
              <div>
                <Title level={5}>特效大小</Title>
                <Slider
                  value={effectConfig.size}
                  onChange={(value) => setEffectConfig(prev => ({ ...prev, size: value }))}
                  min={1}
                  max={20}
                  marks={{
                    1: '小',
                    10: '中',
                    20: '大'
                  }}
                />
              </div>

              {/* 颜色设置 */}
              <div>
                <Title level={5}>特效颜色</Title>
                <Radio.Group
                  value={effectConfig.color}
                  onChange={(e) => setEffectConfig(prev => ({ ...prev, color: e.target.value }))}
                >
                  <Radio.Button value="#ffffff">白色</Radio.Button>
                  <Radio.Button value="#1890ff">蓝色</Radio.Button>
                  <Radio.Button value="#52c41a">绿色</Radio.Button>
                  <Radio.Button value="#faad14">金色</Radio.Button>
                  <Radio.Button value="#eb2f96">粉色</Radio.Button>
                </Radio.Group>
              </div>

              {/* 方向设置 */}
              {(effectConfig.type === 'particles' || effectConfig.type === 'rain') && (
                <div>
                  <Title level={5}>运动方向</Title>
                  <Select
                    value={effectConfig.direction}
                    onChange={(value) => setEffectConfig(prev => ({ ...prev, direction: value }))}
                    style={{ width: '100%' }}
                  >
                    <Option value="down">向下</Option>
                    <Option value="up">向上</Option>
                    <Option value="left">向左</Option>
                    <Option value="right">向右</Option>
                    <Option value="random">随机</Option>
                  </Select>
                </div>
              )}

              {/* 输出格式 */}
              <div>
                <Title level={5}>输出格式</Title>
                <Radio.Group
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                >
                  <Radio.Button value="gif">GIF动图</Radio.Button>
                  <Radio.Button value="mp4">MP4视频</Radio.Button>
                </Radio.Group>
                <div style={{ marginTop: '8px' }}>
                  <Switch
                    checked={isAutoLoop}
                    onChange={setIsAutoLoop}
                    size="small"
                  />
                  <span style={{ marginLeft: '8px', fontSize: '12px' }}>自动循环播放</span>
                </div>
              </div>
            </Space>
          </Card>

          {/* 处理按钮和进度 */}
          <Card style={{ marginTop: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                size="large"
                block
                icon={<PlayCircleOutlined />}
                onClick={handleProcessing}
                loading={isProcessing}
                disabled={!uploadedFile}
              >
                {isProcessing ? '正在添加动态特效...' : '开始处理'}
              </Button>
              
              {isProcessing && (
                <div>
                  <Progress percent={processProgress} status="active" />
                  <Paragraph type="secondary" style={{ textAlign: 'center', marginTop: '8px' }}>
                    预计处理时间：15-30秒
                  </Paragraph>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 温馨提示 */}
      <Card style={{ marginTop: '24px' }}>
        <Title level={5}>💡 使用提示</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Paragraph>
              <strong>最佳效果：</strong><br />
              建议使用正方形、清晰的头像图片，效果会更加自然
            </Paragraph>
          </Col>
          <Col xs={24} md={8}>
            <Paragraph>
              <strong>文件大小：</strong><br />
              GIF格式通常较小，MP4格式画质更清晰但文件较大
            </Paragraph>
          </Col>
          <Col xs={24} md={8}>
            <Paragraph>
              <strong>平台兼容：</strong><br />
              微信支持GIF格式，部分平台可能不支持MP4头像
            </Paragraph>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default DynamicEffects 