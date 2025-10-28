import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Form, Input, Button, Card, message, Typography } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

const { Title, Text } = Typography

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuthStore()

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const onFinish = async (values) => {
    try {
      setLoading(true)
      const response = await authAPI.login(values)
      
      // 🔒 安全改进：后端使用 HttpOnly Cookie 存储 token
      // 响应中不再包含 token，只包含用户信息
      const user = response.data
      
      // 不再传递 token 参数，因为 token 已在 HttpOnly Cookie 中
      login(user, null)
      message.success('登录成功！')
      
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Login error:', error)
      message.error(error.response?.data?.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card
        style={{
          width: 450,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>C-MAX 选型系统</Title>
          <Title level={3} style={{ marginBottom: 12, color: '#1890ff' }}>Project Ark</Title>
          <Text type="secondary">SF系列气动执行器智能选型平台</Text>
        </div>

        <Form
          name="login"
          initialValues={{ 
            username: 'admin',
            password: 'admin123'
          }}
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              icon={<LoginOutlined />}
              style={{ height: 45 }}
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>
            忘记密码？请联系您的系统管理员进行重置。
          </div>
        </Form>

        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <Text strong>测试账号：</Text>
          <div style={{ marginTop: 8, fontSize: '12px' }}>
            <div><strong>管理员：</strong> admin / admin123</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Login


