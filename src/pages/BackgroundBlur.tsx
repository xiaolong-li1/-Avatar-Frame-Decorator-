import React, { useState } from 'react'
import { Card, Row, Col, Button, Typography, message } from 'antd'
import { CameraOutlined } from '@ant-design/icons'
import AvatarUpload from '../components/AvatarUpload'

const { Title, Paragraph } = Typography

const BackgroundBlur: React.FC = () => {
  const [userAvatar, setUserAvatar] = useState<string>('')

  return (
    <div className="fade-in-up">
      <Title level={2}>人像背景虚化</Title>
      <Paragraph type="secondary">
        智能识别人像并进行背景虚化处理，突出主体并提升专业感
      </Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="上传头像">
            <AvatarUpload onImageChange={setUserAvatar} />
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="虚化效果">
            {!userAvatar ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                <CameraOutlined style={{ fontSize: '48px' }} />
                <div>上传头像查看虚化效果</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={userAvatar} 
                  alt="虚化效果" 
                  style={{ maxWidth: '300px', borderRadius: '8px' }}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default BackgroundBlur 