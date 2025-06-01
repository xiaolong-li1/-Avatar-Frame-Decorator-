// App.tsx
import React, { useState } from 'react'
import { Layout, Menu, Typography, Avatar, Space, Button, Modal, Form, Input, message } from 'antd'
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
  CameraOutlined,
  LoginOutlined
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
import api from './services/api' // 替换 axios

const { Header, Sider, Content } = Layout
const { Title } = Typography

const App: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [form] = Form.useForm()
  const [username, setUsername] = useState('')

  const handleMenuClick = (key: string) => {
    navigate(key)
  }
const handleLoginRegister = async (values: { username: string; password: string }) => {
  const { username, password } = values;
  try {
    // 调用 API
    const response = isLogin
      ? await api.login(username, password)
      : await api.register(username, password);

    console.log('API调用结果:', response);

    // 检查响应是否成功
    if (response.success && response.data) {
      // 从 response.data 中获取 token 和用户信息
      const { token, user } = response.data;
      
      if (token && user) {
        setUsername(user.username);
        setIsModalVisible(false);
        message.success(isLogin ? '登录成功' : '注册成功');
        
        // 存储用户信息到 localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('username', user.username);
      } else {
        message.error('返回的用户数据格式不正确');
      }
    } else {
      // 处理成功响应但业务失败的情况
      message.error(response.message || '登录或注册失败，请重试');
    }
  } catch (err: any) {
    console.error('API调用错误:', err);

    // 尝试从不同位置获取错误信息
    let errorMsg = '';
    if (err.response?.data?.message) {
      // API 返回的错误消息
      errorMsg = err.response.data.message;
    } else if (err.message) {
      // 一般错误消息
      errorMsg = err.message;
    }
    
    console.log('后端错误信息:', errorMsg);

    if (!isLogin && errorMsg.includes('用户名已存在')) {
      message.error('用户名已存在，请更换用户名');
      return;
    }

    message.error(errorMsg || '请求失败，请稍后重试');
  }
};






  const menuItems = [
    { key: '/', icon: <UserOutlined />, label: '首页' },
    { key: '/preset-frames', icon: <PictureOutlined />, label: '预设头像框' },
    { key: '/custom-frames', icon: <UploadOutlined />, label: '自定义头像框' },
    { key: '/super-resolution', icon: <HighlightOutlined />, label: '头像超分处理' },
    { key: '/style-transfer', icon: <BgColorsOutlined />, label: '艺术风格迁移' },
    { key: '/text-to-image', icon: <BulbOutlined />, label: '文生图头像' },
    { key: '/dynamic-effects', icon: <StarOutlined />, label: '动态特效头像' },
    { key: '/background-blur', icon: <CameraOutlined />, label: '人像背景虚化' },
    { key: '/copyright', icon: <SafetyOutlined />, label: '头像版权保护' },
    { key: '/save-share', icon: <SaveOutlined />, label: '头像保存分享' }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Avatar size={64} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', marginBottom: 12 }}>
            <UserOutlined />
          </Avatar>
          <Title level={4} style={{ margin: 0 }}>WeFrame</Title>
          <div style={{ color: '#666', fontSize: 12 }}>微信头像智能处理系统</div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          style={{ border: 'none', background: 'transparent' }}
        />
      </Sider>

      <Layout>
        <Header style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            {menuItems.find(item => item.key === location.pathname)?.label || '首页'}
          </Title>
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <span style={{ color: '#666' }}>{username || '未登录'}</span>
            <Button icon={<LoginOutlined />} type="link" onClick={() => setIsModalVisible(true)}>
              {username ? '切换用户' : '登录/注册'}
            </Button>
          </Space>
        </Header>

        <Content style={{ margin: '24px', padding: '24px', background: 'rgba(255,255,255,0.95)', borderRadius: 12 }}>
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

      <Modal
        title={isLogin ? '用户登录' : '用户注册'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleLoginRegister}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>{isLogin ? '登录' : '注册'}</Button>
            <Button type="link" block onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? '没有账号？注册' : '已有账号？登录'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default App
