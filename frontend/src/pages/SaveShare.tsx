import React, { useState } from 'react'
import { Card, Row, Col, Button, Typography, Select, message } from 'antd'
import { SaveOutlined, ShareAltOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'

const { Title, Paragraph } = Typography
const { Option } = Select

const SaveShare: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<string>('')
  const [format, setFormat] = useState<string>('png')
  const [quality, setQuality] = useState<string>('high')

  const handleSave = () => {
    if (!userAvatar) {
      message.warning('请先上传头像')
      return
    }
    message.success(`头像已保存为 ${format.toUpperCase()} 格式`)
  }

  const handleShare = () => {
    if (!userAvatar) {
      message.warning('请先上传头像')
      return
    }
    message.success('头像已分享到微信')
  }

  return (
    <div className="fade-in-up">
      <Title level={2}>头像保存与分享</Title>
      <Paragraph type="secondary">
        将处理后的头像保存至本地或一键分享到微信，快速更新社交资料
      </Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="上传头像">
            <AvatarUpload onImageChange={setUserAvatar} />
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="保存设置">
            <div style={{ marginBottom: '16px' }}>
              <Paragraph strong>文件格式：</Paragraph>
              <Select
                value={format}
                onChange={setFormat}
                style={{ width: '100%' }}
              >
                <Option value="png">PNG</Option>
                <Option value="jpg">JPG</Option>
                <Option value="gif">GIF</Option>
              </Select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Paragraph strong>图片质量：</Paragraph>
              <Select
                value={quality}
                onChange={setQuality}
                style={{ width: '100%' }}
              >
                <Option value="high">高质量</Option>
                <Option value="medium">中等质量</Option>
                <Option value="low">压缩质量</Option>
              </Select>
            </div>

            <div>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                style={{ marginRight: '12px' }}
              >
                保存到本地
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={handleShare}
              >
                分享到微信
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default SaveShare 