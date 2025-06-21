// App.tsx
import React, { useState, useEffect } from 'react'
import { Layout, Menu, Typography, Avatar, Space, Button, message, Popover, QRCode } from 'antd'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  UserOutlined,
  PictureOutlined,
  UploadOutlined,
  HighlightOutlined,
  BgColorsOutlined,
  BulbOutlined,
  SafetyOutlined,
  CameraOutlined,
  LoginOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownloadOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import Home from './pages/Home'
import PresetFrames from './pages/PresetFrames'
import CustomFrames from './pages/CustomFrames'
import SuperResolution from './pages/SuperResolution'
import StyleTransfer from './pages/StyleTransfer'
import TextToImage from './pages/TextToImage'
import Login from './pages/Login'
import Copyright from './pages/Copyright'
import BackgroundBlur from './pages/BackgroundBlur'
import AIHistory from './pages/AIHistory';
import { AITaskProvider } from './contexts/AITaskContext'
import AITaskIndicator from './components/AITaskIndicator'
import Cookies from 'js-cookie'
import './styles/sidebar.css'
// 导入logo图像 - 使用相对路径
// 注意：在TypeScript项目中需要为图像创建类型声明

const { Sider, Content } = Layout
const { Title } = Typography

// 路由保护组件
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = Cookies.get('token') || localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    // 重定向到登录页面，并记录当前路径以便登录后返回
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  // 组件挂载以及路由切换时，从 Cookie/localStorage 恢复登录状态与侧边栏折叠状态
  useEffect(() => {
    const storedUsername = Cookies.get('username') || localStorage.getItem('username')
    const storedToken = Cookies.get('token') || localStorage.getItem('token')
    const storedCollapsed = localStorage.getItem('siderCollapsed')
    
    if (storedUsername && storedToken) {
      setUsername(storedUsername)
      console.log('已恢复登录状态:', storedUsername)
    }
    
    if (storedCollapsed) {
      setCollapsed(JSON.parse(storedCollapsed))
    }
  }, [location.pathname])

  // 保存侧边栏折叠状态到localStorage
  useEffect(() => {
    localStorage.setItem('siderCollapsed', JSON.stringify(collapsed))
  }, [collapsed])

  const handleMenuClick = (key: string) => {
    navigate(key)
  }

  // 处理用户登出
  const handleLogout = () => {
    // 清除Cookie
    Cookies.remove('token');
    Cookies.remove('userId');
    Cookies.remove('username');
    
    // 清除localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    
    setUsername('')
    message.success('已退出登录')
    navigate('/login')
  }

  const menuItems = [
    { key: '/', icon: <UserOutlined />, label: '首页' },
    { key: '/preset-frames', icon: <PictureOutlined />, label: '预设头像框' },
    { key: '/custom-frames', icon: <UploadOutlined />, label: '自定义头像框' },
    { key: '/super-resolution', icon: <HighlightOutlined />, label: '头像超分处理' },
    { key: '/style-transfer', icon: <BgColorsOutlined />, label: '艺术风格迁移' },
    { key: '/text-to-image', icon: <BulbOutlined />, label: '文本生成头像' },
    { key: '/background-blur', icon: <CameraOutlined />, label: '人像背景虚化' },
    { key: '/copyright', icon: <SafetyOutlined />, label: '头像版权保护' },
    { key: '/ai-history', icon: <HistoryOutlined />, label: 'AI 处理历史' }
  ]

  // 判断当前是否在登录页面
  const isLoginPage = location.pathname === '/login';

  // 如果是登录页面，不显示侧边栏和顶部栏
  if (isLoginPage) {
    return (
      <AITaskProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AITaskProvider>
    );
  }

  return (
    <AITaskProvider>
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Sider 
          width={250} 
          collapsed={collapsed}
          collapsedWidth={80}
          className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
        >
          {/* 顶部Logo区域 */}
          <div style={{ 
            padding: collapsed ? '16px 0 12px' : '16px', 
            textAlign: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            position: 'relative'
          }}>
            <Avatar 
              size={collapsed ? 40 : 56} 
              style={{ 
                background: 'transparent',
                marginBottom: collapsed ? 10 : 12,
                transition: 'all 0.3s',
                overflow: 'hidden',
                borderRadius: 0
              }}
              src="/src/assets/images/logo.png"
            />
            {!collapsed && (
              <>
                <Title level={4} style={{ margin: 0, marginTop: 8 }}>WeFrame</Title>
                <div style={{ color: '#666', fontSize: 12 }}>智慧头像装饰器</div>
              </>
            )}
            
            {/* 侧边栏内部的展开/收起按钮 */}
            <Button 
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className={`sider-toggle-btn ${collapsed ? 'sider-toggle-btn-collapsed' : ''}`}
              style={{
                position: collapsed ? 'relative' : 'absolute',
                right: collapsed ? 'auto' : 8,
                top: collapsed ? 'auto' : 8,
                marginTop: collapsed ? 0 : 0,
                fontSize: '14px',
                width: 28,
                height: 28,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </div>

          {/* 中间菜单区域 - 自动填充剩余空间 */}
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => handleMenuClick(key)}
              style={{ 
                border: 'none', 
                background: 'transparent', 
                flex: 1,
                fontSize: '14px',
              }}
              inlineCollapsed={collapsed}
              theme="light"
              // 使用CSS自定义菜单样式
              className="custom-menu"
            />
          </div>
          
          {/* 底部下载App区域 - 固定在底部 */}
          <div className="sidebar-footer">
            <Popover
              placement="top"
              title={
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                  下载 WeFrame APP
                </div>
              }
              content={
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px',
                  minWidth: '180px'
                }}>
                  <QRCode
                    value="https://weframe.app/download"
                    size={140}
                    style={{ marginBottom: '12px' }}
                  />
                  <div style={{ 
                    color: '#666', 
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    支持 iOS / Android
                  </div>
                  <div style={{ 
                    color: '#999', 
                    fontSize: '12px',
                    marginTop: '4px'
                  }}>
                    智慧头像装饰器
                  </div>
                </div>
              }
              trigger="hover"
              overlayStyle={{ zIndex: 1050 }}
            >
              <div
                className={`menu-like-item ${collapsed ? 'collapsed' : ''}`}
                style={{ width: collapsed ? 'calc(100% - 8px)' : '100%' }}
              >
                <DownloadOutlined 
                  className="ant-menu-item-icon" 
                  style={{ 
                    marginRight: collapsed ? 0 : '10px', 
                    marginLeft: 0,
                    fontSize: '16px'
                  }}
                />
                {!collapsed && (
                  <span className="ant-menu-title-content">
                    下载 App
                  </span>
                )}
              </div>
            </Popover>
          </div>

          {/* 用户信息区域 */}
          <div className="sidebar-footer" style={{ paddingTop: '8px' }}>
            <div
              className={`menu-like-item ${collapsed ? 'collapsed' : ''}`}
              style={{ width: collapsed ? 'calc(100% - 8px)' : '100%' }}
            >
              <Avatar size="small" icon={<UserOutlined />} />
              {!collapsed && (
                <span style={{ color: '#666', marginLeft: 8, flex: 1 }}>{username || '未登录'}</span>
              )}
              {username ? (
                <Button 
                  icon={<LoginOutlined />} 
                  type="link" 
                  size="small"
                  onClick={handleLogout}
                >
                  {!collapsed && '退出'}
                </Button>
              ) : (
                <Button 
                  icon={<LoginOutlined />} 
                  type="link" 
                  size="small"
                  onClick={() => navigate('/login')}
                >
                  {!collapsed && '登录/注册'}
                </Button>
              )}
            </div>
          </div>
        </Sider>

        <Layout style={{ 
          marginLeft: collapsed ? '80px' : '250px',
          transition: 'all 0.2s ease-out',
          height: '100vh',
          overflow: 'hidden'
        }}>
          <Content style={{ 
            margin: '24px', 
            padding: '24px', 
            background: 'rgba(255,255,255,0.95)', 
            borderRadius: 12,
            height: 'calc(100vh - 48px)',
            overflow: 'auto',
            transition: 'all 0.2s ease-out',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/preset-frames" element={<ProtectedRoute><PresetFrames /></ProtectedRoute>} />
              <Route path="/custom-frames" element={<ProtectedRoute><CustomFrames /></ProtectedRoute>} />
              <Route path="/super-resolution" element={<ProtectedRoute><SuperResolution /></ProtectedRoute>} />
              <Route path="/style-transfer" element={<ProtectedRoute><StyleTransfer /></ProtectedRoute>} />
              <Route path="/text-to-image" element={<ProtectedRoute><TextToImage /></ProtectedRoute>} />
              <Route path="/background-blur" element={<ProtectedRoute><BackgroundBlur /></ProtectedRoute>} />
              <Route path="/copyright" element={<ProtectedRoute><Copyright /></ProtectedRoute>} />
              <Route path="/ai-history" element={<ProtectedRoute><AIHistory /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </AITaskProvider>
  )
}

export default App
