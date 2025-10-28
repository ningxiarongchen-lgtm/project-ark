import { useState } from 'react'
import { Card, Form, Input, Button, message, Descriptions } from 'antd'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../services/api'

const Profile = () => {
  const { user, updateUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleUpdate = async (values) => {
    setLoading(true)
    try {
      const response = await authAPI.updateProfile(values)
      updateUser(response.data)
      message.success('Profile updated successfully')
      setEditing(false)
    } catch (error) {
      message.error(error.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>My Profile</h1>

      {!editing ? (
        <Card
          extra={<Button type="primary" onClick={() => setEditing(true)}>Edit Profile</Button>}
        >
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Name">{user?.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="Role">
              {user?.role?.replace('_', ' ')}
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              {user?.department || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
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
              name: user?.name,
              email: user?.email,
              department: user?.department,
              phone: user?.phone,
            }}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="department" label="Department">
              <Input />
            </Form.Item>

            <Form.Item name="phone" label="Phone">
              <Input />
            </Form.Item>

            <Form.Item name="password" label="New Password">
              <Input.Password placeholder="Leave blank to keep current password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
                Save Changes
              </Button>
              <Button onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  )
}

export default Profile


