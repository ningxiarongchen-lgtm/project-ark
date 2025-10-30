/**
 * Attio Components Examples Page
 * 
 * This page demonstrates all Attio-styled components in action.
 * Use this as a reference for implementing Attio design across the app.
 */

import { useState } from 'react'
import { Space, Divider, Row, Col, Form } from 'antd'
import { 
  AttioButton, 
  AttioCard, 
  AttioInput, 
  AttioTable, 
  AttioTag 
} from '../components'
import {
  PlusOutlined,
  SearchOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'

const AttioExamples = () => {
  const [form] = Form.useForm()

  // Sample data for table
  const dataSource = [
    {
      key: '1',
      name: '项目 Alpha',
      status: 'active',
      priority: 'high',
      date: '2024-01-15',
    },
    {
      key: '2',
      name: '项目 Beta',
      status: 'pending',
      priority: 'medium',
      date: '2024-01-20',
    },
    {
      key: '3',
      name: '项目 Gamma',
      status: 'completed',
      priority: 'low',
      date: '2024-01-10',
    },
  ]

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          active: 'success',
          pending: 'warning',
          completed: 'primary',
        }
        const labelMap = {
          active: '进行中',
          pending: '待处理',
          completed: '已完成',
        }
        return <AttioTag color={colorMap[status]}>{labelMap[status]}</AttioTag>
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const colorMap = {
          high: 'error',
          medium: 'warning',
          low: 'default',
        }
        const labelMap = {
          high: '高',
          medium: '中',
          low: '低',
        }
        return <AttioTag color={colorMap[priority]}>{labelMap[priority]}</AttioTag>
      },
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="small">
          <AttioButton variant="text" size="small">
            <EditOutlined />
          </AttioButton>
          <AttioButton variant="text" size="small">
            <DeleteOutlined />
          </AttioButton>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Attio 组件示例</h1>

      {/* Buttons Section */}
      <AttioCard title="按钮组件 (AttioButton)" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <h4 style={{ marginBottom: '12px' }}>按钮变体</h4>
            <Space wrap>
              <AttioButton variant="primary">主要按钮 (Primary)</AttioButton>
              <AttioButton variant="secondary">次要按钮 (Secondary)</AttioButton>
              <AttioButton variant="ghost">幽灵按钮 (Ghost)</AttioButton>
            </Space>
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#8A8A87' }}>
              • Primary: 紫色背景 (#6E62E4)，白色文字<br/>
              • Secondary: 浅灰背景 (#F1F1F0)，黑色文字<br/>
              • Ghost: 透明背景，无边框，灰色文字，hover 变黑
            </p>
          </div>

          <Divider />

          <div>
            <h4 style={{ marginBottom: '12px' }}>按钮尺寸</h4>
            <Space wrap align="center">
              <AttioButton variant="primary" size="small">小按钮</AttioButton>
              <AttioButton variant="primary" size="medium">中按钮</AttioButton>
              <AttioButton variant="primary" size="large">大按钮</AttioButton>
            </Space>
          </div>

          <Divider />

          <div>
            <h4 style={{ marginBottom: '12px' }}>带图标的按钮</h4>
            <Space wrap>
              <AttioButton variant="primary" icon={<PlusOutlined />}>
                新建项目
              </AttioButton>
              <AttioButton variant="default" icon={<SearchOutlined />}>
                搜索
              </AttioButton>
              <AttioButton variant="default" icon={<DownloadOutlined />}>
                导出
              </AttioButton>
            </Space>
          </div>
        </Space>
      </AttioCard>

      {/* Input Section */}
      <AttioCard title="输入组件 (AttioInput)" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  标准输入 (点击查看焦点效果)
                </label>
                <AttioInput placeholder="请输入内容..." />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#8A8A87' }}>
                  背景 #FBFBFA，焦点时底部显示紫色线
                </p>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  密码输入
                </label>
                <AttioInput.Password placeholder="请输入密码..." />
              </div>
            </Col>
          </Row>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              文本区域
            </label>
            <AttioInput.TextArea 
              placeholder="请输入多行文本..." 
              rows={4}
            />
          </div>
        </Space>
      </AttioCard>

      {/* Tags Section */}
      <AttioCard title="标签组件 (AttioTag)" style={{ marginBottom: '24px' }}>
        <Space wrap size="middle">
          <AttioTag color="default">默认标签</AttioTag>
          <AttioTag color="primary">主要标签</AttioTag>
          <AttioTag color="success">成功标签</AttioTag>
          <AttioTag color="warning">警告标签</AttioTag>
          <AttioTag color="error">错误标签</AttioTag>
          <AttioTag color="info">信息标签</AttioTag>
        </Space>
      </AttioCard>

      {/* Table Section */}
      <AttioCard title="表格组件 (AttioTable)" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
          <Space>
            <AttioButton variant="primary" icon={<PlusOutlined />}>
              新建项目
            </AttioButton>
            <AttioInput 
              placeholder="搜索项目..." 
              prefix={<SearchOutlined />}
              style={{ width: '300px' }}
            />
          </Space>
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#8A8A87' }}>
            ✨ 表格特点：无边框、无斑马线、透明表头、hover 显示浅灰背景
          </p>
        </div>
        <AttioTable 
          columns={columns} 
          dataSource={dataSource}
          pagination={{ pageSize: 5 }}
        />
      </AttioCard>

      {/* Card Variants Section */}
      <AttioCard title="卡片变体" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <AttioCard 
              title="默认卡片" 
              padding="default"
              extra={<AttioButton variant="text" size="small">查看更多</AttioButton>}
            >
              <p>这是一个默认填充的卡片示例。</p>
              <p>可以包含任意内容。</p>
            </AttioCard>
          </Col>
          <Col span={8}>
            <AttioCard 
              title="紧凑卡片" 
              padding="compact"
            >
              <p>这是一个紧凑填充的卡片。</p>
              <p>适合信息密集的场景。</p>
            </AttioCard>
          </Col>
          <Col span={8}>
            <AttioCard 
              title="宽松卡片" 
              padding="loose"
            >
              <p>这是一个宽松填充的卡片。</p>
              <p>适合强调重要内容。</p>
            </AttioCard>
          </Col>
        </Row>
      </AttioCard>

      {/* Form Example */}
      <AttioCard title="表单示例" style={{ marginBottom: '24px' }}>
        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: '600px' }}
        >
          <Form.Item
            label="项目名称"
            name="projectName"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <AttioInput placeholder="输入项目名称..." />
          </Form.Item>

          <Form.Item
            label="项目描述"
            name="description"
          >
            <AttioInput.TextArea 
              placeholder="输入项目描述..." 
              rows={4}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <AttioButton variant="primary" htmlType="submit">
                提交
              </AttioButton>
              <AttioButton variant="default" onClick={() => form.resetFields()}>
                重置
              </AttioButton>
            </Space>
          </Form.Item>
        </Form>
      </AttioCard>
    </div>
  )
}

export default AttioExamples

