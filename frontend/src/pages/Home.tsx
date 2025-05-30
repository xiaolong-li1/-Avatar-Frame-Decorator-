import React from 'react'
import { Card, Row, Col, Button, Typography, Space, Statistic } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  PictureOutlined,
  HighlightOutlined,
  BgColorsOutlined,
  BulbOutlined,
  StarOutlined,
  CameraOutlined
} from '@ant-design/icons'

const { Title, Paragraph } = Typography

const Home: React.FC = () => {
  const navigate = useNavigate()

  const features = [
    {
      title: '预设头像框',
      description: '丰富的节日主题和动态效果头像框',
      icon: <PictureOutlined />,
      path: '/preset-frames',
      color: '#1890ff'
    },
    {
      title: '头像超分处理',
      description: 'AI智能提升头像清晰度和分辨率',
      icon: <HighlightOutlined />,
      path: '/super-resolution',
      color: '#52c41a'
    },
    {
      title: '艺术风格迁移',
      description: '将头像转换为经典艺术风格',
      icon: <BgColorsOutlined />,
      path: '/style-transfer',
      color: '#722ed1'
    },
    {
      title: '文生图头像',
      description: '通过文字描述自动生成个性化头像',
      icon: <BulbOutlined />,
      path: '/text-to-image',
      color: '#fa8c16'
    },
    {
      title: '动态特效头像',
      description: '为头像添加炫酷的动态特效',
      icon: <StarOutlined />,
      path: '/dynamic-effects',
      color: '#eb2f96'
    },
    {
      title: '人像背景虚化',
      description: '智能识别人像并进行背景虚化处理',
      icon: <CameraOutlined />,
      path: '/background-blur',
      color: '#13c2c2'
    }
  ]

  return (
    <div className="fade-in-up">
      {/* 欢迎区域 */}
      <Card
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white'
        }}
      >
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Title level={1} style={{ color: 'white', marginBottom: '16px' }}>
              欢迎使用 WeFrame
            </Title>
            <Title level={4} style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 'normal' }}>
              微信头像智能处理系统
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
              一站式解决您的头像处理需求，提供预设头像框、超分辨率处理、艺术风格迁移、
              文生图头像生成等多种AI智能功能，让您的社交形象更加个性化和专业。
            </Paragraph>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                ghost
                onClick={() => navigate('/preset-frames')}
              >
                立即开始
              </Button>
              <Button
                size="large"
                ghost
                onClick={() => navigate('/super-resolution')}
              >
                了解功能
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="用户数量"
                  value={12568}
                  valueStyle={{ color: 'white' }}
                  suffix="+"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="处理次数"
                  value={89234}
                  valueStyle={{ color: 'white' }}
                  suffix="次"
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 功能展示 */}
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>
        核心功能
      </Title>
      
      <Row gutter={[24, 24]}>
        {features.map((feature) => (
          <Col xs={24} sm={12} lg={8} key={feature.path}>
            <Card
              hoverable
              style={{ height: '200px', textAlign: 'center' }}
              onClick={() => navigate(feature.path)}
            >
              <div
                style={{
                  fontSize: '48px',
                  color: feature.color,
                  marginBottom: '16px'
                }}
              >
                {feature.icon}
              </div>
              <Title level={4} style={{ marginBottom: '8px' }}>
                {feature.title}
              </Title>
              <Paragraph type="secondary">
                {feature.description}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 系统优势 */}
      <Card style={{ marginTop: '32px' }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: '24px' }}>
          系统优势
        </Title>
        <Row gutter={[32, 24]}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'white',
                  fontSize: '24px'
                }}
              >
                <HighlightOutlined />
              </div>
              <Title level={4}>AI智能处理</Title>
              <Paragraph type="secondary">
                采用最新的人工智能算法，提供专业级的图像处理效果
              </Paragraph>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'white',
                  fontSize: '24px'
                }}
              >
                <StarOutlined />
              </div>
              <Title level={4}>操作简单</Title>
              <Paragraph type="secondary">
                直观的用户界面，一键式操作，无需专业技能即可上手
              </Paragraph>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'white',
                  fontSize: '24px'
                }}
              >
                <BulbOutlined />
              </div>
              <Title level={4}>创意无限</Title>
              <Paragraph type="secondary">
                多样化的处理选项，让您的头像独一无二，彰显个性
              </Paragraph>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Home 