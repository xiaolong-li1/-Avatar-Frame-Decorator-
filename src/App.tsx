import React from 'react'
import { Layout, Menu, Typography, Avatar, Space } from 'antd'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
  UserOutlined,
  PictureOutlined,
  UploadOutlined,
  HighlightOutlined,
  BgColorsOutlined,
  BulbOutlined,
  StarOutlined,
  SafetyOutlined,
  SaveOutlined,
  CameraOutlined
} from '@ant-design/icons'
import Home from './pages/Home'
import PresetFrames from './pages/PresetFrames'
import CustomFrames from './pages/CustomFrames'
import SuperResolution from './pages/SuperResolution'
import StyleTransfer from './pages/StyleTransfer'
import TextToImage from './pages/TextToImage'
import DynamicEffects from './pages/DynamicEffects'
import Copyright from './pages/Copyright'
import SaveShare from './pages/SaveShare'
import BackgroundBlur from './pages/BackgroundBlur'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const App: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <UserOutlined />,
      label: '首页',
    },
    {
      key: '/preset-frames',
      icon: <PictureOutlined />,
      label: '预设头像框',
    },
    {
      key: '/custom-frames',
      icon: <UploadOutlined />,
      label: '自定义头像框',
    },
    {
      key: '/super-resolution',
      icon: <HighlightOutlined />,
      label: '头像超分处理',
    },
    {
      key: '/style-transfer',
      icon: <BgColorsOutlined />,
      label: '艺术风格迁移',
    },
    {
      key: '/text-to-image',
      icon: <BulbOutlined />,
      label: '文生图头像',
    },
    {
      key: '/dynamic-effects',
      icon: <StarOutlined />,
      label: '动态特效头像',
    },
    {
      key: '/background-blur',
      icon: <CameraOutlined />,
      label: '人像背景虚化',
    },
    {
      key: '/copyright',
      icon: <SafetyOutlined />,
      label: '头像版权保护',
    },
    {
      key: '/save-share',
      icon: <SaveOutlined />,
      label: '头像保存分享',
    },
  ]

  const handleMenuClick = (key: string) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={250}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Avatar
            size={64}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              marginBottom: '12px',
            }}
          >
            <UserOutlined />
          </Avatar>
          <Title level={4} style={{ margin: 0, color: '#333' }}>
            WeFrame
          </Title>
          <div style={{ color: '#666', fontSize: '12px' }}>
            微信头像智能处理系统
          </div>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          style={{
            border: 'none',
            background: 'transparent',
          }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Title level={3} style={{ margin: 0, color: '#333' }}>
            {menuItems.find(item => item.key === location.pathname)?.label || '首页'}
          </Title>
          
          <Space>
            <Avatar size="small">
              <UserOutlined />
            </Avatar>
            <span style={{ color: '#666' }}>用户</span>
          </Space>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/preset-frames" element={<PresetFrames />} />
            <Route path="/custom-frames" element={<CustomFrames />} />
            <Route path="/super-resolution" element={<SuperResolution />} />
            <Route path="/style-transfer" element={<StyleTransfer />} />
            <Route path="/text-to-image" element={<TextToImage />} />
            <Route path="/dynamic-effects" element={<DynamicEffects />} />
            <Route path="/background-blur" element={<BackgroundBlur />} />
            <Route path="/copyright" element={<Copyright />} />
            <Route path="/save-share" element={<SaveShare />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App 