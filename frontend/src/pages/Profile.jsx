import { useState } from 'react'
import { Card, Form, Input, Button, message, Descriptions, Space } from 'antd'
import { UserOutlined, EditOutlined } from '@ant-design/icons'
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
        english_name: values.english_name
      })
      
      // 立即更新本地用户信息
      updateUser(response.data)
      
      message.success('英文名字更新成功！', 1.5)
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

  // 格式化显示名字
  const formatDisplayName = () => {
    if (user?.english_name) {
      return `${user.full_name} (${user.english_name})`
    }
    return user?.full_name || '-'
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
              编辑英文名字
            </Button>
          }
        >
          <Descriptions bordered column={1}>
            <Descriptions.Item label="姓名">
              {formatDisplayName()}
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
            {user?.signature && (
              <Descriptions.Item label="个性签名">
                {user.signature}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      ) : (
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            initialValues={{
              english_name: user?.english_name || ''
            }}
          >
            <Form.Item
              name="english_name"
              label="英文名字"
              rules={[
                { max: 50, message: '英文名字不能超过50个字符' }
              ]}
              extra="设置您的英文名字，将显示为：中文姓名 (英文名字)"
            >
              <Input 
                prefix={<UserOutlined />}
                placeholder="请输入您的英文名字（可选）" 
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                >
                  保存
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
