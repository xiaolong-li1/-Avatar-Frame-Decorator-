import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Typography, Input, message, Select, Slider, Space, Upload, Image } from 'antd'
import { SafetyOutlined, UploadOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'
import { api } from '../services/api'
import { useAITask } from '../contexts/AITaskContext'
import usePersistedState from '../hooks/usePersistedState'

const { Title, Paragraph } = Typography
const { Option } = Select

const Copyright: React.FC = () => {
  const [userAvatar, setUserAvatar] = usePersistedState<any>('copyright-avatar', null)
  const [watermarkText, setWatermarkText] = useState<string>('')
  const [watermarkColor, setWatermarkColor] = useState<string>('#ffffff')
  const [watermarkPosition, setWatermarkPosition] = useState<string>('bottom-right')
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(30)
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(16)
  const [watermarkedImage, setWatermarkedImage] = useState<string>('')
  const [processing, setProcessing] = useState<boolean>(false)
  const { startTask, finishTask } = useAITask()
  
  // Handle image upload
  const handleImageChange = (data: any) => {
    setUserAvatar(data)
    setWatermarkedImage('') // Reset watermarked image when new image is uploaded
  }

  // Handle applying watermark
  const handleAddWatermark = async () => {
    if (!userAvatar) {
      message.warning('请先上传图片')
      return
    }

    if (!watermarkText) {
      message.warning('请输入水印文字')
      return
    }

    try {
      setProcessing(true)
      startTask('添加水印')

      const response = await api.addWatermark({
        avatarFileId: userAvatar.fileId,
        watermarkType: 'text',
        content: watermarkText,
        options: {
          position: watermarkPosition,
          opacity: watermarkOpacity / 100, // Convert to 0-1 range
          fontSize: watermarkFontSize,
          color: watermarkColor
        }
      })

      if (response.success) {
        setWatermarkedImage(response.data.resultUrl)
        message.success('水印添加成功')
      }
    } catch (error) {
      console.error('添加水印失败:', error)
      message.error('添加水印失败，请稍后重试')
    } finally {
      setProcessing(false)
      finishTask()
    }
  }

  // Handle download watermarked image
  const handleDownload = () => {
    if (!watermarkedImage) return

    const link = document.createElement('a')
    link.href = watermarkedImage
    link.download = `watermarked_${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success('图片下载成功')
  }

  // Handle copy watermarked image
  const handleCopy = async () => {
    if (!watermarkedImage) return

    try {
      const response = await fetch(watermarkedImage)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ])
      message.success('图片已复制到剪贴板')
    } catch (err) {
      console.error('复制到剪贴板失败:', err)
      message.error('复制失败，请手动下载图片')
    }
  }

  return (
    <div className="fade-in-up">
      <Title level={2}>头像版权保护</Title>
      <Paragraph type="secondary">
        为您的头像添加文字水印，保护您的头像版权
      </Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="上传头像">
            <div style={{ marginBottom: '20px' }}>
              <AvatarUpload onImageChange={handleImageChange} />
            </div>
            
            {userAvatar && userAvatar.url && (
              <div style={{ textAlign: 'center' }}>
                <Image
                  src={userAvatar.url}
                  alt="原始头像"
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                />
                <Paragraph style={{ marginTop: '10px' }}>原始头像</Paragraph>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="水印设置">
            <div style={{ marginBottom: '16px' }}>
              <Paragraph strong>水印文字：</Paragraph>
              <Input
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="输入水印文字"
                maxLength={50}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Paragraph strong>水印位置：</Paragraph>
              <Select 
                style={{ width: '100%' }}
                value={watermarkPosition}
                onChange={(value) => setWatermarkPosition(value)}
              >
                <Option value="center">居中</Option>
                <Option value="top-left">左上角</Option>
                <Option value="top-right">右上角</Option>
                <Option value="bottom-left">左下角</Option>
                <Option value="bottom-right">右下角</Option>
                <Option value="tile">整体平铺</Option>
              </Select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Paragraph strong>水印颜色：</Paragraph>
              <input 
                type="color" 
                value={watermarkColor}
                onChange={(e) => setWatermarkColor(e.target.value)}
                style={{ width: '100%', height: '36px', padding: '0', border: '1px solid #d9d9d9', borderRadius: '2px' }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Paragraph strong>水印透明度：{watermarkOpacity}%</Paragraph>
              <Slider
                min={5}
                max={100}
                value={watermarkOpacity}
                onChange={(value) => setWatermarkOpacity(value)}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Paragraph strong>字体大小：{watermarkFontSize}px</Paragraph>
              <Slider
                min={8}
                max={72}
                value={watermarkFontSize}
                onChange={(value) => setWatermarkFontSize(value)}
              />
            </div>

            <Button
              type="primary"
              icon={<SafetyOutlined />}
              onClick={handleAddWatermark}
              loading={processing}
              style={{ width: '100%', marginBottom: '16px' }}
            >
              添加版权水印
            </Button>
          </Card>
        </Col>
      </Row>

      {watermarkedImage && (
        <Card title="处理结果" style={{ marginTop: '24px' }}>
          <Row gutter={[16, 16]} justify="center">
            <Col xs={24} md={16}>
              <div style={{ textAlign: 'center' }}>
                <Image
                  src={watermarkedImage}
                  alt="带水印的头像"
                  style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                />
              </div>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  block
                >
                  下载图片
                </Button>
                <Button 
                  icon={<CopyOutlined />}
                  onClick={handleCopy}
                  block
                >
                  复制到剪贴板
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  )
}

export default Copyright 