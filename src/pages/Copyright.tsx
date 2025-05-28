import React, { useState } from 'react'
import { Card, Row, Col, Button, Typography, Input, Switch, message } from 'antd'
import { SafetyOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'

const { Title, Paragraph } = Typography

const Copyright: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<string>('')
  const [watermarkText, setWatermarkText] = useState<string>('')
  const [invisibleWatermark, setInvisibleWatermark] = useState<boolean>(true)

  const handleAddWatermark = () => {
    if (!userAvatar) {
      message.warning('请先上传头像')
      return
    }
    message.success('版权保护已添加')
  }

  return (
    <div className="fade-in-up">
      <Title level={2}>头像版权保护</Title>
      <Paragraph type="secondary">
        为生成的头像添加隐形水印或版权信息，防止他人盗用
      </Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="上传头像">
            <AvatarUpload onImageChange={setUserAvatar} />
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="版权设置">
            <div>
              <Paragraph strong>版权文字：</Paragraph>
              <Input
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="输入版权信息"
                maxLength={50}
              />
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <Paragraph strong>隐形水印：</Paragraph>
              <Switch
                checked={invisibleWatermark}
                onChange={setInvisibleWatermark}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </div>

            <Button
              type="primary"
              icon={<SafetyOutlined />}
              onClick={handleAddWatermark}
              style={{ marginTop: '16px', width: '100%' }}
            >
              添加版权保护
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Copyright 