import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Typography, Space, Statistic, Skeleton } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  PictureOutlined,
  HighlightOutlined,
  BgColorsOutlined,
  BulbOutlined,
  StarOutlined,
  CameraOutlined,
  SafetyOutlined,
  UserOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { api } from '../services/api'

const { Title, Paragraph } = Typography

// 定义用户统计类型
interface UserStats {
  userCount: number;
  processCount: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [userStats, setUserStats] = useState<UserStats>({
    userCount: 0,
    processCount: 0
  })
  const [loading, setLoading] = useState(true)

  // 获取用户统计信息
  useEffect(() => {
    // 设置一个定时器模拟API调用延时
    const timer = setTimeout(() => {
      // 模拟用户数据
      const mockUserCount = 96
      // 用户数量 = 实际用户数量 * 131.4
      const scaledUserCount = Math.round(mockUserCount * 131.4)
      // 处理次数 = 用户数量 * 5.8 + 12000
      const processCount = Math.round(scaledUserCount * 5.8 + 12000)
      
      setUserStats({
        userCount: scaledUserCount,
        processCount
      })
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
    
    // 下面注释的是真实API调用代码，在后端API准备好后可以取消注释使用
    /*
    const fetchUserStats = async () => {
      try {
        const response = await api.getUserStats()
        if (response && response.success && response.data && response.data.userCount) {
          // 用户数量 = 实际用户数量 * 131.4
          const scaledUserCount = Math.round(response.data.userCount * 131.4)
          // 处理次数 = 用户数量 * 5.8 + 12000
          const processCount = Math.round(scaledUserCount * 5.8 + 12000)
          
          setUserStats({
            userCount: scaledUserCount,
            processCount
          })
        } else {
          // 如果响应不成功，使用默认值
          setUserStats({
            userCount: 12568,
            processCount: 89234
          })
        }
      } catch (error) {
        console.error('获取用户统计信息失败:', error)
        // 设置默认值
        setUserStats({
          userCount: 12568,
          processCount: 89234
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserStats()
    */
  }, [])

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
      title: '文本生成头像',
      description: '通过文字描述自动生成个性化头像',
      icon: <BulbOutlined />,
      path: '/text-to-image',
      color: '#fa8c16'
    },
    {
      title: '自定义头像框',
      description: '上传并使用您自己设计的个性化头像框',
      icon: <StarOutlined />,
      path: '/custom-frames',
      color: '#eb2f96'
    },
    {
      title: '人像背景虚化',
      description: '智能识别人像并进行背景虚化处理',
      icon: <CameraOutlined />,
      path: '/background-blur',
      color: '#13c2c2'
    },
    {
      title: '头像版权保护',
      description: '为头像添加文字水印，保护版权',
      icon: <SafetyOutlined />,
      path: '/copyright',
    }
  ]

  return (
    <div className="fade-in-up">
      {/* 欢迎区域 - 优化样式 */}
      <Card
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #5271ff 0%, #764ba2 100%)',
          border: 'none',
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 20px rgba(118, 75, 162, 0.2)',
          overflow: 'hidden'
        }}
      >
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Title level={1} style={{ 
              color: 'white', 
              marginBottom: '16px', 
              fontSize: '36px',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              欢迎使用 WeFrame
            </Title>
            <Title level={4} style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontWeight: 'normal',
              marginBottom: '20px'
            }}>
              智慧头像装饰器
            </Title>
            <Paragraph style={{ 
              color: 'rgba(255,255,255,0.8)', 
              fontSize: '16px',
              lineHeight: '1.6',
              maxWidth: '90%'
            }}>
              一站式解决您的头像处理需求，提供预设头像框、自定义头像框、超分辨率增强、艺术风格迁移、
              文本生成头像、背景虚化、头像版权保护等7大核心功能，让您的社交形象更加个性化和专业。
            </Paragraph>
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={[16, 24]}>
              <Col span={12}>
                <Card 
                  style={{ 
                    background: 'rgba(255,255,255,0.15)', 
                    borderRadius: '8px',
                    border: 'none'
                  }}
                >
                  {loading ? (
                    <Skeleton active paragraph={{ rows: 1 }} />
                  ) : (
                <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>用户数量</span>}
                      value={userStats.userCount}
                      valueStyle={{ color: 'white', fontWeight: 'bold' }}
                      prefix={<UserOutlined style={{ marginRight: '5px' }} />}
                  suffix="+"
                />
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  style={{ 
                    background: 'rgba(255,255,255,0.15)', 
                    borderRadius: '8px',
                    border: 'none'
                  }}
                >
                  {loading ? (
                    <Skeleton active paragraph={{ rows: 1 }} />
                  ) : (
                <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>处理次数</span>}
                      value={userStats.processCount}
                      valueStyle={{ color: 'white', fontWeight: 'bold' }}
                      prefix={<ThunderboltOutlined style={{ marginRight: '5px' }} />}
                  suffix="次"
                />
                  )}
                </Card>
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
              style={{ 
                height: '200px', 
                textAlign: 'center',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
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
      <Card style={{ 
        marginTop: '32px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
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
                  background: 'linear-gradient(135deg, #5271ff 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'white',
                  fontSize: '24px',
                  boxShadow: '0 4px 8px rgba(118, 75, 162, 0.2)'
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
                  background: 'linear-gradient(135deg, #5271ff 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'white',
                  fontSize: '24px',
                  boxShadow: '0 4px 8px rgba(118, 75, 162, 0.2)'
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
                  background: 'linear-gradient(135deg, #5271ff 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'white',
                  fontSize: '24px',
                  boxShadow: '0 4px 8px rgba(118, 75, 162, 0.2)'
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