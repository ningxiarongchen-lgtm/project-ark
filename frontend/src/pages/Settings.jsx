import { useState } from 'react'
import { Card, Form, Input, Button, message, Divider, Typography, Space, Alert } from 'antd'
import { UserOutlined, PhoneOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../services/api'
import { getRoleNameCN } from '../utils/roleTranslations'

const { Title, Text } = Typography

const Settings = () => {
  const { user, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // 修改个人信息（仅管理员）
  const onFinishProfile = async (values) => {
    try {
      setLoading(true)
      const response = await authAPI.updateProfile({
        full_name: values.full_name,
        phone: values.phone
      })
      
      updateUser(response.data)
      message.success('个人信息更新成功！', 1.5)
      
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Update profile error:', error)
      message.error(error.response?.data?.message || '更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 修改密码
  const onFinishPassword = async (values) => {
    try {
      setPasswordLoading(true)
      await authAPI.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      
      message.success('密码修改成功！')
      passwordForm.resetFields()
    } catch (error) {
      console.error('Change password error:', error)
      message.error(error.response?.data?.message || '密码修改失败，请重试')
    } finally {
      setPasswordLoading(false)
    }
  }

  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        <SafetyOutlined /> 账号设置
      </Title>

      <Alert
        message="管理员权限"
        description="您可以修改账号的核心信息，包括中文姓名、手机号和密码。英文名字和个性签名请在个人资料页面中修改。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 个人信息设置 */}
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>基本信息</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Form
          form={profileForm}
          name="profile"
          onFinish={onFinishProfile}
          layout="vertical"
          initialValues={{
            full_name: user?.full_name,
            phone: user?.phone
          }}
        >
          <Form.Item
            label="中文姓名"
            name="full_name"
            rules={[
              { required: true, message: '请输入姓名' },
              { min: 2, message: '姓名至少2个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入中文姓名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的11位中国大陆手机号' }
            ]}
            extra="手机号用于登录系统"
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="请输入手机号"
              maxLength={11}
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
            >
              保存基本信息
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      {/* 密码修改 */}
      <Card
        title={
          <Space>
            <LockOutlined />
            <span>修改密码</span>
          </Space>
        }
      >
        <Alert
          message="密码要求"
          description="密码长度至少6位，建议包含字母、数字和特殊字符以提高安全性。"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={passwordForm}
          name="password"
          onFinish={onFinishPassword}
          layout="vertical"
        >
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入当前密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入新密码（至少6位）"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="确认新密码"
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
              placeholder="请再次输入新密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={passwordLoading}
                size="large"
              >
                修改密码
              </Button>
              <Button
                onClick={() => passwordForm.resetFields()}
                size="large"
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      {/* 账号信息显示 */}
      <Card
        title="账号信息"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">完整姓名：</Text>
            <Text strong>
              {user?.full_name}
              {user?.english_name && <span style={{ marginLeft: 8 }}>({user.english_name})</span>}
            </Text>
          </div>
          <div>
            <Text type="secondary">角色：</Text>
            <Text strong>{getRoleNameCN(user?.role)}</Text>
          </div>
          <div>
            <Text type="secondary">部门：</Text>
            <Text>{user?.department || '未设置'}</Text>
          </div>
          <div>
            <Text type="secondary">手机号：</Text>
            <Text>{user?.phone}</Text>
          </div>
          <div>
            <Text type="secondary">用户ID：</Text>
            <Text>{user?._id}</Text>
          </div>
          <div>
            <Text type="secondary">账号状态：</Text>
            <Text type={user?.isActive ? 'success' : 'danger'}>
              {user?.isActive ? '✅ 激活' : '❌ 禁用'}
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default Settings
