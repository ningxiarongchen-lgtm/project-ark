import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message, Typography, Steps, Result } from 'antd'
import { UserOutlined, SafetyOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { authAPI } from '../services/api'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [email, setEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const navigate = useNavigate()

  // Step 1: 请求密码重置
  const handleRequestReset = async (values) => {
    try {
      setLoading(true)
      const response = await authAPI.requestPasswordReset(values.email)
      setEmail(values.email)
      message.success(response.data.message || '密码重置请求已提交')
      setCurrentStep(1)
    } catch (error) {
      console.error('Request reset error:', error)
      message.error(error.response?.data?.message || '请求失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: 验证重置码
  const handleValidateCode = async (values) => {
    try {
      setLoading(true)
      await authAPI.validateResetCode(email, values.code)
      setResetCode(values.code)
      message.success('验证码验证成功')
      setCurrentStep(2)
    } catch (error) {
      console.error('Validate code error:', error)
      message.error(error.response?.data?.message || '验证码不正确或已过期')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: 重置密码
  const handleResetPassword = async (values) => {
    try {
      setLoading(true)
      const response = await authAPI.performPasswordReset(email, resetCode, values.newPassword)
      message.success(response.data.message || '密码重置成功')
      setCurrentStep(3)
      // 3秒后跳转到登录页
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      console.error('Reset password error:', error)
      message.error(error.response?.data?.message || '密码重置失败')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Form
            name="request-reset"
            onFinish={handleRequestReset}
            autoComplete="off"
            size="large"
            layout="vertical"
          >
            <Paragraph type="secondary" style={{ marginBottom: 24 }}>
              请输入您的注册邮箱，我们将向管理员提交密码重置请求
            </Paragraph>
            
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="注册邮箱地址"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                style={{ height: 45, marginBottom: 12 }}
              >
                提交重置请求
              </Button>
              <Button 
                block
                onClick={() => navigate('/login')}
                icon={<ArrowLeftOutlined />}
              >
                返回登录
              </Button>
            </Form.Item>
          </Form>
        )

      case 1:
        return (
          <div>
            <Result
              status="info"
              title="等待管理员审批"
              subTitle={
                <div>
                  <Paragraph>
                    密码重置请求已提交给管理员。管理员审批后，会生成一个6位数的验证码。
                  </Paragraph>
                  <Paragraph strong>
                    请联系管理员获取验证码后，在下方输入：
                  </Paragraph>
                </div>
              }
            />

            <Form
              name="validate-code"
              onFinish={handleValidateCode}
              autoComplete="off"
              size="large"
              layout="vertical"
            >
              <Form.Item
                name="code"
                rules={[
                  { required: true, message: '请输入验证码' },
                  { len: 6, message: '验证码为6位数字' },
                  { pattern: /^\d+$/, message: '验证码只能包含数字' }
                ]}
              >
                <Input
                  prefix={<SafetyOutlined />}
                  placeholder="输入6位验证码"
                  maxLength={6}
                  style={{ fontSize: '18px', letterSpacing: '4px', textAlign: 'center' }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  loading={loading}
                  style={{ height: 45, marginBottom: 12 }}
                >
                  验证并继续
                </Button>
                <Button 
                  block
                  onClick={() => navigate('/login')}
                >
                  取消并返回登录
                </Button>
              </Form.Item>
            </Form>
          </div>
        )

      case 2:
        return (
          <Form
            name="reset-password"
            onFinish={handleResetPassword}
            autoComplete="off"
            size="large"
            layout="vertical"
          >
            <Paragraph type="secondary" style={{ marginBottom: 24 }}>
              请设置您的新密码（至少6个字符）
            </Paragraph>

            <Form.Item
              name="newPassword"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少需要6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="新密码"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="确认新密码"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                style={{ height: 45 }}
              >
                重置密码
              </Button>
            </Form.Item>
          </Form>
        )

      case 3:
        return (
          <Result
            status="success"
            title="密码重置成功！"
            subTitle="您的密码已成功重置，页面将自动跳转到登录页面。"
            extra={[
              <Button type="primary" key="login" onClick={() => navigate('/login')}>
                立即登录
              </Button>
            ]}
          />
        )

      default:
        return null
    }
  }

  const steps = [
    { title: '提交请求' },
    { title: '输入验证码' },
    { title: '设置新密码' },
    { title: '完成' }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 600,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>忘记密码</Title>
          <Text type="secondary">按照以下步骤重置您的密码</Text>
        </div>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} />
          ))}
        </Steps>

        {renderStepContent()}
      </Card>
    </div>
  )
}

export default ForgotPassword

