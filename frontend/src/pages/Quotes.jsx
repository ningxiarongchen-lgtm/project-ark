import { useEffect, useState } from 'react'
import { Table, Card, Tag, Button, Space, message } from 'antd'
import { EyeOutlined, FilePdfOutlined } from '@ant-design/icons'
import { quotesAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const Quotes = () => {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    setLoading(true)
    try {
      const response = await quotesAPI.getAll()
      setQuotes(response.data.quotes)
    } catch (error) {
      message.error('Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Quote Number',
      dataIndex: 'quoteNumber',
      key: 'quoteNumber',
      render: (text, record) => (
        <a onClick={() => navigate(`/quotes/${record._id}`)}>{text}</a>
      ),
    },
    {
      title: 'Project',
      dataIndex: ['project', 'projectNumber'],
      key: 'project',
      render: (text, record) => (
        <a onClick={() => navigate(`/projects/${record.project._id}`)}>{text}</a>
      ),
    },
    {
      title: 'Client',
      dataIndex: ['project', 'client', 'name'],
      key: 'client',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (version) => `v${version}`,
    },
    {
      title: 'Total',
      key: 'total',
      render: (_, record) => (
        `${record.pricing.currency} ${record.pricing.total.toLocaleString()}`
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'Draft': 'default',
          'Sent': 'processing',
          'Reviewed': 'cyan',
          'Accepted': 'success',
          'Rejected': 'error',
          'Expired': 'warning',
          'Revised': 'default',
        }
        return <Tag color={colors[status]}>{status}</Tag>
      },
    },
    {
      title: 'Valid Until',
      dataIndex: ['terms', 'validUntil'],
      key: 'validUntil',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Issued',
      dataIndex: 'issuedDate',
      key: 'issuedDate',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Prepared By',
      dataIndex: ['preparedBy', 'name'],
      key: 'preparedBy',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/quotes/${record._id}`)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<FilePdfOutlined />}
            onClick={() => message.info('PDF generation coming soon')}
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Quotes</h1>

      <Card>
        <Table
          columns={columns}
          dataSource={quotes}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} quotes`,
          }}
        />
      </Card>
    </div>
  )
}

export default Quotes


