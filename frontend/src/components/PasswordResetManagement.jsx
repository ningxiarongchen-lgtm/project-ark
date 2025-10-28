import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Tag, message, Modal, Typography, Tooltip } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons'
import { authAPI } from '../services/api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Text, Paragraph } = Typography

const PasswordResetManagement = () => {
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState([])
  const [resetCodeModalVisible, setResetCodeModalVisible] = useState(false)
  const [currentResetCode, setCurrentResetCode] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getPasswordResetRequests()
      setRequests(response.data || [])
    } catch (error) {
      console.error('获取密码重置请求失败:', error)
      message.error('获取密码重置请求失败')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId, userEmail) => {
    try {
      setLoading(true)
      const response = await authAPI.approvePasswordReset(userId)
      
      // 显示验证码
      setCurrentResetCode({
        code: response.data.resetCode,
        email: userEmail,
        expiresIn: response.data.expiresIn
      })
      setResetCodeModalVisible(true)
      
      message.success('密码重置已批准')
      fetchRequests()
    } catch (error) {
      console.error('批准失败:', error)
      message.error(error.response?.data?.message || '批准失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeny = async (userId) => {
    try {
      setLoading(true)
      await authAPI.denyPasswordReset(userId)
      message.success('已拒绝密码重置请求')
      fetchRequests()
    } catch (error) {
      console.error('拒绝失败:', error)
      message.error(error.response?.data?.message || '拒绝失败')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('验证码已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  const columns = [
    {
      title: '用户名',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '请求时间',
      dataIndex: 'passwordResetRequestedAt',
      key: 'passwordResetRequestedAt',
      width: 180,
      render: (date) => {
        if (!date) return '-'
        return (
          <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
            <span>{dayjs(date).fromNow()}</span>
          </Tooltip>
        )
      }
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: () => (
        <Tag color="warning">待审批</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApprove(record._id, record.email)}
          >
            批准
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleDeny(record._id)}
          >
            拒绝
          </Button>
        </Space>
      )
    }
  ]

  return (
    <>
      <Card
        title={`密码重置请求管理（${requests.length}个待处理）`}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchRequests}
          >
            刷新
          </Button>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={requests}
          rowKey="_id"
          scroll={{ x: 1000 }}
          pagination={{
            total: requests.length,
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条待审批请求`,
            showSizeChanger: true,
          }}
          locale={{
            emptyText: '暂无待审批的密码重置请求'
          }}
        />
      </Card>

      {/* 重置码显示 Modal */}
      <Modal
        title="密码重置验证码"
        open={resetCodeModalVisible}
        onCancel={() => {
          setResetCodeModalVisible(false)
          setCurrentResetCode(null)
        }}
        footer={[
          <Button key="close" onClick={() => setResetCodeModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={500}
      >
        {currentResetCode && (
          <div style={{ textAlign: 'center' }}>
            <Text strong>请将以下验证码提供给用户：</Text>
            <div style={{ 
              margin: '24px 0', 
              padding: '24px', 
              background: '#f5f5f5', 
              borderRadius: 8,
              border: '2px dashed #d9d9d9'
            }}>
              <Text 
                copyable={{ 
                  text: currentResetCode.code,
                  onCopy: () => message.success('验证码已复制')
                }}
                style={{ 
                  fontSize: 32, 
                  fontWeight: 'bold', 
                  letterSpacing: 8,
                  fontFamily: 'monospace'
                }}
              >
                {currentResetCode.code}
              </Text>
            </div>
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">
                用户邮箱：<Text strong>{currentResetCode.email}</Text>
              </Text>
              <Text type="danger">
                验证码有效期：{currentResetCode.expiresIn}
              </Text>
              <Button
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(currentResetCode.code)}
                block
                type="primary"
              >
                复制验证码
              </Button>
            </Space>

            <Paragraph type="secondary" style={{ marginTop: 24, fontSize: 12 }}>
              请注意：验证码生成后30分钟内有效，请及时通知用户使用。
            </Paragraph>
          </div>
        )}
      </Modal>
    </>
  )
}

export default PasswordResetManagement

