import { useState } from 'react'
import { Card, Form, Input, Button, message, Descriptions, Space } from 'antd'
import { UserOutlined, PhoneOutlined, LockOutlined, EditOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../services/api'
import { getRoleNameCN } from '../utils/roleTranslations'

const Profile = () => {
  const { user, updateUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleUpdate = async (values) => {
    setLoading(true)
    try {
      const response = await authAPI.updateProfile({
        full_name: values.full_name,
        phone: values.phone,
        department: values.department
      })
      
      // 立即更新本地用户信息
      updateUser(response.data)
      
      message.success('个人信息更新成功！', 1.5)
      setEditing(false)
      
      // 短暂延迟后刷新页面，确保所有组件显示最新信息
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      message.error(error.response?.data?.message || '更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>我的个人资料</h1>

      {!editing ? (
        <Card
          extra={
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
            >
              编辑个人资料
            </Button>
          }
        >
          <Descriptions bordered column={1}>
            <Descriptions.Item label="姓名">
              {user?.full_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="角色">
              {getRoleNameCN(user?.role)}
            </Descriptions.Item>
            <Descriptions.Item label="部门">
              {user?.department || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="电话">
              {user?.phone || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ) : (
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            initialValues={{
              full_name: user?.full_name,
              department: user?.department,
              phone: user?.phone,
            }}
          >
            <Form.Item
              name="full_name"
              label="姓名"
              rules={[
                { required: true, message: '请输入姓名' },
                { min: 2, message: '姓名至少2个字符' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />}
                placeholder="请输入您的姓名" 
              />
            </Form.Item>

            <Form.Item 
              name="department" 
              label="部门"
            >
              <Input placeholder="请输入部门名称（可选）" />
            </Form.Item>

            <Form.Item 
              name="phone" 
              label="电话"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的11位中国大陆手机号' }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined />}
                placeholder="请输入手机号" 
                maxLength={11}
              />
            </Form.Item>

            <Form.Item 
              name="password" 
              label="新密码"
              extra="留空则保持当前密码不变"
            >
              <Input.Password 
                prefix={<LockOutlined />}
                placeholder="留空则保留当前密码" 
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                >
                  保存更改
                </Button>
                <Button onClick={() => setEditing(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  )
}

export default Profile
