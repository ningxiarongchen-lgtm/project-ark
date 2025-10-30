import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Table, Button, Tag, Space, Spin, message, Select, Typography } from 'antd'
import { FilePdfOutlined, EditOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { quotesAPI } from '../services/api'
import { generateQuotePDF } from '../utils/pdfGenerator'
import dayjs from 'dayjs'

const QuoteDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuote()
  }, [id])

  const fetchQuote = async () => {
    try {
      const response = await quotesAPI.getById(id)
      setQuote(response.data)
    } catch (error) {
      message.error('Failed to load quote details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await quotesAPI.update(id, { status: newStatus })
      message.success('Quote status updated')
      fetchQuote()
    } catch (error) {
      message.error('Failed to update status')
    }
  }

  const handleDownloadPDF = () => {
    if (quote) {
      generateQuotePDF(quote)
      message.success('PDF generated successfully')
    }
  }

  const itemColumns = [
    {
      title: 'Item',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Type',
      dataIndex: 'itemType',
      key: 'itemType',
      render: (type) => <Tag>{type}</Tag>,
    },
    {
      title: 'Specifications',
      dataIndex: 'specifications',
      key: 'specifications',
      ellipsis: true,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price, record) => `${quote?.pricing.currency} ${price.toLocaleString()}`,
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      render: (discount) => discount ? `${discount}%` : '-',
    },
    {
      title: 'Net Price',
      dataIndex: 'netPrice',
      key: 'netPrice',
      render: (price) => `${quote?.pricing.currency} ${price.toLocaleString()}`,
    },
    {
      title: 'Line Total',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      render: (total) => `${quote?.pricing.currency} ${total.toLocaleString()}`,
    },
    {
      title: 'Lead Time',
      dataIndex: 'leadTime',
      key: 'leadTime',
      render: (days) => `${days} days`,
    },
  ]

  if (loading) {
    return <div className="loading-container"><Spin size="large" /></div>
  }

  if (!quote) {
    return <div>Quote not found</div>
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 - 替代废弃的PageHeader组件 */}
      <div style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space align="center">
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate(-1)}
              >
                返回
              </Button>
              <div>
                <Typography.Title level={3} style={{ margin: 0 }}>
                  {quote.quoteNumber}
                </Typography.Title>
                <Typography.Text type="secondary">报价详情</Typography.Text>
              </div>
            </Space>
            <Space>
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={handleDownloadPDF}
              >
                Download PDF
              </Button>
              <Button icon={<EditOutlined />}>
                Revise Quote
              </Button>
            </Space>
          </Space>
        </Space>
      </div>

      <Card title="Quote Information" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Quote Number">{quote.quoteNumber}</Descriptions.Item>
          <Descriptions.Item label="Version">v{quote.version}</Descriptions.Item>
          <Descriptions.Item label="Project">
            <a onClick={() => navigate(`/projects/${quote.project._id}`)}>
              {quote.project.projectNumber} - {quote.project.projectName}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Select
              value={quote.status}
              onChange={handleStatusChange}
              style={{ width: 150 }}
            >
              <Select.Option value="Draft">Draft</Select.Option>
              <Select.Option value="Sent">Sent</Select.Option>
              <Select.Option value="Reviewed">Reviewed</Select.Option>
              <Select.Option value="Accepted">Accepted</Select.Option>
              <Select.Option value="Rejected">Rejected</Select.Option>
            </Select>
          </Descriptions.Item>
          <Descriptions.Item label="Client Name">
            {quote.project.client.name}
          </Descriptions.Item>
          <Descriptions.Item label="Client Company">
            {quote.project.client.company || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Prepared By">
            {quote.preparedBy.name}
          </Descriptions.Item>
          <Descriptions.Item label="Issued Date">
            {dayjs(quote.issuedDate).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="Valid Until">
            <Tag color={dayjs(quote.terms.validUntil).isAfter(dayjs()) ? 'success' : 'error'}>
              {dayjs(quote.terms.validUntil).format('YYYY-MM-DD')}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Quote Items" style={{ marginBottom: 16 }}>
        <Table
          columns={itemColumns}
          dataSource={quote.items}
          rowKey="_id"
          pagination={false}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Card title="Pricing Summary">
        <Descriptions bordered column={1} style={{ maxWidth: 500, marginLeft: 'auto' }}>
          <Descriptions.Item label="Subtotal">
            {quote.pricing.currency} {quote.pricing.subtotal.toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label={`Tax (${quote.pricing.tax.rate}%)`}>
            {quote.pricing.currency} {quote.pricing.tax.amount.toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Shipping">
            {quote.pricing.currency} {quote.pricing.shipping.cost.toLocaleString()}
          </Descriptions.Item>
          {quote.pricing.discount > 0 && (
            <Descriptions.Item label="Discount">
              -{quote.pricing.currency} {quote.pricing.discount.toLocaleString()}
            </Descriptions.Item>
          )}
          <Descriptions.Item label={<strong>TOTAL</strong>}>
            <strong style={{ fontSize: '18px', color: '#1890ff' }}>
              {quote.pricing.currency} {quote.pricing.total.toLocaleString()}
            </strong>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Terms & Conditions" style={{ marginTop: 16 }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Payment Terms">
            {quote.terms.paymentTerms}
          </Descriptions.Item>
          <Descriptions.Item label="Delivery Terms">
            {quote.terms.deliveryTerms || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Warranty">
            {quote.terms.warranty}
          </Descriptions.Item>
          {quote.externalNotes && (
            <Descriptions.Item label="Notes">
              {quote.externalNotes}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  )
}

export default QuoteDetails


