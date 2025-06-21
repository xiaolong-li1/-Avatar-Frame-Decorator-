import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Checkbox, 
  Typography, 
  message, 
  Divider, 
  Space, 
  Tabs 
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  LoginOutlined, 
  UserAddOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import Cookies from 'js-cookie';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

// Cookie选项
const COOKIE_OPTIONS = {
  expires: 7, // 7天过期
  path: '/',
  sameSite: 'strict' as 'strict',
  secure: window.location.protocol === 'https:'
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  
  // 从URL参数中获取重定向路径
  const from = new URLSearchParams(location.search).get('from') || '/';
  
  // 检查是否已登录
  useEffect(() => {
    const token = Cookies.get('token');
    const username = Cookies.get('username');
    
    if (token && username) {
      navigate(from);
    }
  }, [navigate, from]);

  // 处理登录
  const handleLogin = async (values: any) => {
    try {
      setLoading(true);
      const { username, password, remember } = values;
      
      const response = await api.login(username, password);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // 使用Cookie存储用户信息
        const cookieOptions = remember ? COOKIE_OPTIONS : { ...COOKIE_OPTIONS, expires: 1 };
        
        Cookies.set('token', token, cookieOptions);
        Cookies.set('userId', user.id, cookieOptions);
        Cookies.set('username', user.username, cookieOptions);
        
        // 依然保持localStorage存储以兼容现有代码
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('username', user.username);
        
        message.success(`欢迎回来，${user.username}！`);
        navigate(from);
      } else {
        message.error(response.message || '登录失败');
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      message.error(error.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理注册
  const handleRegister = async (values: any) => {
    try {
      setLoading(true);
      const { username, password } = values;
      
      const response = await api.register(username, password);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // 使用Cookie存储用户信息
        Cookies.set('token', token, COOKIE_OPTIONS);
        Cookies.set('userId', user.id, COOKIE_OPTIONS);
        Cookies.set('username', user.username, COOKIE_OPTIONS);
        
        // 依然保持localStorage存储以兼容现有代码
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('username', user.username);
        
        message.success(`注册成功，欢迎 ${user.username}！`);
        navigate(from);
      } else {
        message.error(response.message || '注册失败');
      }
    } catch (error: any) {
      console.error('注册失败:', error);
      
      if (error.message && error.message.includes('用户名已存在')) {
        message.error('用户名已存在，请更换用户名');
      } else {
        message.error(error.message || '注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div 
      className="login-container" 
      style={{ 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}
    >
      <Card 
        style={{ 
          width: '400px',
          borderRadius: '12px',
          boxShadow: '0 20px 80px rgba(0, 0, 0, 0.25)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)'
        }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div 
            style={{ 
              width: '64px',
              height: '64px',
              borderRadius: 0,
              background: 'transparent',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            <img src="/src/assets/images/logo.png" alt="WeFrame Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          
          <Title level={3} style={{ marginBottom: '8px' }}>WeFrame</Title>
          <Paragraph type="secondary">
            智慧头像装饰器
          </Paragraph>
        </div>
        
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          animated={true}
          destroyInactiveTabPane={true}
        >
          <TabPane 
            tab={
              <span>
                <LoginOutlined /> 登录
              </span>
            } 
            key="login"
          >
            <Form
              name="login"
              initialValues={{ remember: true }}
              onFinish={handleLogin}
              size="large"
              layout="vertical"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
                  placeholder="用户名"
                />
              </Form.Item>
              
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                  placeholder="密码"
                />
              </Form.Item>
              
              <Form.Item>
                <Form.Item 
                  name="remember" 
                  valuePropName="checked" 
                  noStyle
                >
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                
                <a 
                  style={{ float: 'right' }} 
                  href="#/reset-password"
                  onClick={(e) => {
                    e.preventDefault();
                    message.info('密码重置功能即将上线');
                  }}
                >
                  忘记密码?
                </a>
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  style={{ 
                    width: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }} 
                  loading={loading}
                >
                  登录
                </Button>
              </Form.Item>
              
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  还没有账号? <a onClick={() => setActiveTab('register')}>立即注册</a>
                </Text>
              </div>
            </Form>
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <UserAddOutlined /> 注册
              </span>
            } 
            key="register"
          >
            <Form
              name="register"
              onFinish={handleRegister}
              size="large"
              layout="vertical"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名长度至少为3位' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                  placeholder="用户名"
                />
              </Form.Item>
              
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码长度至少为6位' }
                ]}
                hasFeedback
              >
                <Input.Password 
                  prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                  placeholder="密码" 
                />
              </Form.Item>
              
              <Form.Item
                name="confirm"
                dependencies={['password']}
                hasFeedback
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                  placeholder="确认密码" 
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  style={{ 
                    width: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                  loading={loading}
                >
                  注册
                </Button>
              </Form.Item>
              
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  已有账号? <a onClick={() => setActiveTab('login')}>立即登录</a>
                </Text>
              </div>
            </Form>
          </TabPane>
        </Tabs>
        
        <Divider plain>
          <Text type="secondary" style={{ fontSize: '12px' }}>WeFrame © 2025</Text>
        </Divider>
      </Card>
    </div>
  );
};

export default Login; 