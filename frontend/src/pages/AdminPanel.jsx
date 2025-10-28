import { useState, useEffect } from 'react'
import { 
  Tabs, Table, Button, Space, Card, Modal, Form, Input, 
  InputNumber, message, Popconfirm, Upload, Tag, Select, Typography,
  Radio, Divider
} from 'antd'
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  UploadOutlined, DownloadOutlined, ReloadOutlined,
  InboxOutlined, MinusCircleOutlined
} from '@ant-design/icons'
import { actuatorsAPI, manualOverridesAPI, accessoriesAPI, suppliersAPI } from '../services/api'
import PasswordResetManagement from '../components/PasswordResetManagement'

const { Title, Text } = Typography
const { Dragger } = Upload

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('actuators')
  const [actuators, setActuators] = useState([])
  const [manualOverrides, setManualOverrides] = useState([])
  const [accessories, setAccessories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const [uploadType, setUploadType] = useState('actuators')
  const [pricingModel, setPricingModel] = useState('fixed')

  useEffect(() => {
    fetchActuators()
    fetchManualOverrides()
    fetchAccessories()
    fetchSuppliers()
  }, [])

  const fetchActuators = async () => {
    try {
      setLoading(true)
      const response = await actuatorsAPI.getAll()
      setActuators(response.data || [])
    } catch (error) {
      message.error('获取执行器列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchManualOverrides = async () => {
    try {
      setLoading(true)
      const response = await manualOverridesAPI.getAll()
      setManualOverrides(response.data || [])
    } catch (error) {
      message.error('获取手动操作装置列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchAccessories = async () => {
    try {
      setLoading(true)
      const response = await accessoriesAPI.getAll()
      setAccessories(response.data || [])
    } catch (error) {
      message.error('获取配件列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll({ status: 'active' })
      setSuppliers(response.data.data || [])
    } catch (error) {
      console.error('获取供应商列表失败:', error)
    }
  }

  const handleCreate = (type) => {
    setEditingItem(null)
    setUploadType(type)
    setPricingModel('fixed') // 重置为固定价格模式
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (record, type) => {
    setEditingItem(record)
    setUploadType(type)
    // 设置计价模式
    setPricingModel(record.pricing_model || 'fixed')
    form.setFieldsValue(record)
    setIsModalVisible(true)
  }

  const handleDelete = async (id, type) => {
    try {
      if (type === 'actuators') {
        await actuatorsAPI.delete(id)
        fetchActuators()
      } else if (type === 'manualOverrides') {
        await manualOverridesAPI.delete(id)
        fetchManualOverrides()
      } else if (type === 'accessories') {
        await accessoriesAPI.delete(id)
        fetchAccessories()
      }
      message.success('删除成功')
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (uploadType === 'actuators') {
        if (editingItem) {
          await actuatorsAPI.update(editingItem._id, values)
        } else {
          await actuatorsAPI.create(values)
        }
        fetchActuators()
      } else if (uploadType === 'manualOverrides') {
        if (editingItem) {
          await manualOverridesAPI.update(editingItem._id, values)
        } else {
          await manualOverridesAPI.create(values)
        }
        fetchManualOverrides()
      } else if (uploadType === 'accessories') {
        if (editingItem) {
          await accessoriesAPI.update(editingItem._id, values)
        } else {
          await accessoriesAPI.create(values)
        }
        fetchAccessories()
      }
      
      message.success(editingItem ? '更新成功' : '创建成功')
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      if (error.errorFields) return
      message.error(editingItem ? '更新失败' : '创建失败')
    }
  }

  const handleDownloadTemplate = async (type) => {
    try {
      let response
      if (type === 'actuators') {
        response = await actuatorsAPI.downloadTemplate()
      } else if (type === 'manualOverrides') {
        response = await manualOverridesAPI.downloadTemplate()
      } else if (type === 'accessories') {
        response = await accessoriesAPI.downloadTemplate()
      }
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const fileName = type === 'actuators' ? '执行器' : 
                      type === 'manualOverrides' ? '手动操作装置' : '配件'
      link.setAttribute('download', `${fileName}_导入模板.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      message.success('模板下载成功')
    } catch (error) {
      message.error('模板下载失败')
    }
  }

  const handleShowUploadModal = (type) => {
    setUploadType(type)
    setIsUploadModalVisible(true)
  }

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                      file.type === 'application/vnd.ms-excel'
      if (!isExcel) {
        message.error('只能上传Excel文件！')
      }
      return isExcel
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        let response
        if (uploadType === 'actuators') {
          response = await actuatorsAPI.uploadExcel(file)
        } else if (uploadType === 'manualOverrides') {
          response = await manualOverridesAPI.uploadExcel(file)
        } else if (uploadType === 'accessories') {
          response = await accessoriesAPI.uploadExcel(file)
        }
        
        if (response.data.success) {
          message.success('导入成功！')
          onSuccess(response.data)
          setIsUploadModalVisible(false)
          
          // 刷新数据
          if (uploadType === 'actuators') {
            fetchActuators()
          } else if (uploadType === 'manualOverrides') {
            fetchManualOverrides()
          } else if (uploadType === 'accessories') {
            fetchAccessories()
          }
        } else {
          message.error(response.data.message || '导入失败')
          onError(new Error(response.data.message))
        }
      } catch (error) {
        message.error('文件上传失败')
        onError(error)
      }
    }
  }

  // 执行器表格列
  const actuatorColumns = [
    {
      title: '型号',
      dataIndex: 'model_base',
      key: 'model_base',
      width: 150,
    },
    {
      title: '机身尺寸',
      dataIndex: 'body_size',
      key: 'body_size',
      width: 100,
    },
    {
      title: '作用类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'DA' ? 'blue' : 'green'}>{type}</Tag>
      ),
    },
    {
      title: '计价模式',
      dataIndex: 'pricing_model',
      key: 'pricing_model',
      width: 120,
      render: (model) => {
        const modeMap = {
          'fixed': { text: '固定价格', color: 'blue' },
          'tiered': { text: '阶梯价格', color: 'green' }
        }
        const mode = modeMap[model] || { text: '固定价格', color: 'blue' }
        return <Tag color={mode.color}>{mode.text}</Tag>
      },
    },
    {
      title: '基础价格',
      dataIndex: 'base_price',
      key: 'base_price',
      width: 120,
      render: (price) => `¥${price?.toLocaleString()}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'actuators')}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record._id, 'actuators')}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 手动操作装置表格列
  const overrideColumns = [
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => `¥${price?.toLocaleString()}`,
    },
    {
      title: '兼容机身',
      dataIndex: 'compatible_body_sizes',
      key: 'compatible_body_sizes',
      render: (sizes) => (
        <Space wrap>
          {sizes?.map(size => (
            <Tag key={size} color="blue">{size}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'manualOverrides')}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record._id, 'manualOverrides')}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 配件表格列
  const accessoryColumns = [
    {
      title: '配件名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        const colorMap = {
          '控制类': 'blue',
          '连接与传动类': 'green',
          '安全与保护类': 'red',
          '检测与反馈类': 'orange',
          '辅助与安装工具': 'purple'
        }
        return <Tag color={colorMap[category] || 'default'}>{category}</Tag>
      },
    },
    {
      title: '规格',
      dataIndex: 'specifications',
      key: 'specifications',
      width: 200,
      render: (specs) => {
        if (!specs || Object.keys(specs).length === 0) return '-'
        return (
          <Space direction="vertical" size="small">
            {Object.entries(specs).slice(0, 2).map(([key, value]) => (
              <Text key={key} style={{ fontSize: 12 }}>
                {key}: {value}
              </Text>
            ))}
            {Object.keys(specs).length > 2 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                +{Object.keys(specs).length - 2} 更多...
              </Text>
            )}
          </Space>
        )
      },
    },
    {
      title: '计价模式',
      dataIndex: 'pricing_model',
      key: 'pricing_model',
      width: 110,
      render: (model) => {
        const modeMap = {
          'fixed': { text: '固定价格', color: 'blue' },
          'tiered': { text: '阶梯价格', color: 'green' }
        }
        const mode = modeMap[model] || { text: '固定价格', color: 'blue' }
        return <Tag color={mode.color}>{mode.text}</Tag>
      },
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => `¥${price?.toLocaleString()}`,
    },
    {
      title: '兼容性规则',
      dataIndex: 'compatibility_rules',
      key: 'compatibility_rules',
      width: 180,
      render: (rules) => {
        if (!rules || (!rules.body_sizes && !rules.action_types)) return '-'
        return (
          <Space direction="vertical" size="small">
            {rules.body_sizes && (
              <Space wrap size="small">
                {rules.body_sizes.slice(0, 3).map(size => (
                  <Tag key={size} color="blue" style={{ fontSize: 11 }}>{size}</Tag>
                ))}
                {rules.body_sizes.length > 3 && (
                  <Tag style={{ fontSize: 11 }}>+{rules.body_sizes.length - 3}</Tag>
                )}
              </Space>
            )}
            {rules.action_types && (
              <Space wrap size="small">
                {rules.action_types.map(type => (
                  <Tag key={type} color="green" style={{ fontSize: 11 }}>{type}</Tag>
                ))}
              </Space>
            )}
          </Space>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'accessories')}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record._id, 'accessories')}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'actuators',
      label: '执行器管理',
      children: (
        <Card
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchActuators}
              >
                刷新
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadTemplate('actuators')}
              >
                下载模板
              </Button>
              <Button
                type="dashed"
                icon={<UploadOutlined />}
                onClick={() => handleShowUploadModal('actuators')}
              >
                批量导入
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreate('actuators')}
              >
                新增执行器
              </Button>
            </Space>
          }
        >
          <Table
            loading={loading}
            columns={actuatorColumns}
            dataSource={actuators}
            rowKey="_id"
            scroll={{ x: 800 }}
            pagination={{
              total: actuators.length,
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条`,
              showSizeChanger: true,
            }}
          />
        </Card>
      )
    },
    {
      key: 'manualOverrides',
      label: '手动操作装置管理',
      children: (
        <Card
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchManualOverrides}
              >
                刷新
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadTemplate('manualOverrides')}
              >
                下载模板
              </Button>
              <Button
                type="dashed"
                icon={<UploadOutlined />}
                onClick={() => handleShowUploadModal('manualOverrides')}
              >
                批量导入
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreate('manualOverrides')}
              >
                新增装置
              </Button>
            </Space>
          }
        >
          <Table
            loading={loading}
            columns={overrideColumns}
            dataSource={manualOverrides}
            rowKey="_id"
            scroll={{ x: 800 }}
            pagination={{
              total: manualOverrides.length,
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条`,
              showSizeChanger: true,
            }}
          />
        </Card>
      )
    },
    {
      key: 'accessories',
      label: '配件管理',
      children: (
        <Card
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchAccessories}
              >
                刷新
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadTemplate('accessories')}
              >
                下载模板
              </Button>
              <Button
                type="dashed"
                icon={<UploadOutlined />}
                onClick={() => handleShowUploadModal('accessories')}
              >
                批量导入
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreate('accessories')}
              >
                新增配件
              </Button>
            </Space>
          }
        >
          <Table
            loading={loading}
            columns={accessoryColumns}
            dataSource={accessories}
            rowKey="_id"
            scroll={{ x: 1000 }}
            pagination={{
              total: accessories.length,
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条`,
              showSizeChanger: true,
            }}
          />
        </Card>
      )
    },
    {
      key: 'password-reset',
      label: '密码重置审批',
      children: <PasswordResetManagement />
    }
  ]

  return (
    <div>
      <Card 
        title={<Title level={4} style={{ margin: 0 }}>数据管理</Title>}
        style={{ marginBottom: 16 }}
      >
        <Text type="secondary">
          管理执行器、手动操作装置和配件数据。支持单个添加和Excel批量导入。
        </Text>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      {/* 创建/编辑 Modal */}
      <Modal
        title={editingItem ? '编辑' : '新增'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
          setPricingModel('fixed')
        }}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          {uploadType === 'actuators' ? (
            <>
              <Form.Item
                label="型号"
                name="model_base"
                rules={[{ required: true, message: '请输入型号' }]}
              >
                <Input placeholder="如: SF10-150DA" />
              </Form.Item>
              <Form.Item
                label="机身尺寸"
                name="body_size"
                rules={[{ required: true, message: '请输入机身尺寸' }]}
              >
                <Input placeholder="如: SF10" />
              </Form.Item>
              <Form.Item
                label="作用类型"
                name="action_type"
                rules={[{ required: true, message: '请选择作用类型' }]}
              >
                <Select>
                  <Select.Option value="DA">DA - 双作用</Select.Option>
                  <Select.Option value="SR">SR - 单作用弹簧复位</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="供应商"
                name="supplier_id"
              >
                <Select
                  placeholder="选择供应商（可选）"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={suppliers.map(supplier => ({
                    value: supplier._id,
                    label: supplier.name
                  }))}
                />
              </Form.Item>

              <Divider orientation="left">价格设置</Divider>

              {/* 计价模式选择器 */}
              <Form.Item
                label="计价模式"
                name="pricing_model"
                initialValue="fixed"
                rules={[{ required: true, message: '请选择计价模式' }]}
              >
                <Radio.Group onChange={(e) => setPricingModel(e.target.value)}>
                  <Radio value="fixed">固定单价 (Fixed Price)</Radio>
                  <Radio value="tiered">阶梯报价 (Tiered Pricing)</Radio>
                </Radio.Group>
              </Form.Item>

              {/* 固定价格 - 显示单个价格输入框 */}
              {pricingModel === 'fixed' && (
                <Form.Item
                  label="基础价格"
                  name="base_price"
                  rules={[{ required: true, message: '请输入价格' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={100}
                    placeholder="输入价格"
                    prefix="¥"
                  />
                </Form.Item>
              )}

              {/* 阶梯价格 - 显示动态表单列表 */}
              {pricingModel === 'tiered' && (
                <>
                  <Form.Item
                    label="基础价格（可选）"
                    name="base_price"
                    tooltip="用于快速查询和排序，建议设置为标准价格"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={100}
                      placeholder="输入基础价格"
                      prefix="¥"
                    />
                  </Form.Item>

                  <Form.Item label="价格阶梯">
                    <Form.List 
                      name="price_tiers"
                      rules={[
                        {
                          validator: async (_, tiers) => {
                            if (!tiers || tiers.length === 0) {
                              return Promise.reject(new Error('至少添加一个价格阶梯'))
                            }
                          },
                        },
                      ]}
                    >
                      {(fields, { add, remove }, { errors }) => (
                        <>
                          {fields.map((field, index) => (
                            <Space 
                              key={field.key} 
                              style={{ display: 'flex', marginBottom: 8 }} 
                              align="baseline"
                            >
                              <Form.Item
                                {...field}
                                name={[field.name, 'min_quantity']}
                                rules={[
                                  { required: true, message: '请输入最小数量' },
                                  { type: 'number', min: 1, message: '数量必须大于0' }
                                ]}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber
                                  placeholder="最小数量"
                                  min={1}
                                  style={{ width: 120 }}
                                />
                              </Form.Item>

                              <Form.Item
                                {...field}
                                name={[field.name, 'unit_price']}
                                rules={[
                                  { required: true, message: '请输入单价' },
                                  { type: 'number', min: 0, message: '价格不能为负' }
                                ]}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber
                                  placeholder="单价"
                                  min={0}
                                  step={100}
                                  prefix="¥"
                                  style={{ width: 180 }}
                                />
                              </Form.Item>

                              <Form.Item
                                {...field}
                                name={[field.name, 'price_type']}
                                style={{ marginBottom: 0 }}
                              >
                                <Select
                                  placeholder="价格类型"
                                  style={{ width: 120 }}
                                  allowClear
                                >
                                  <Select.Option value="normal">标准</Select.Option>
                                  <Select.Option value="low">优惠</Select.Option>
                                  <Select.Option value="high">高价</Select.Option>
                                </Select>
                              </Form.Item>

                              <MinusCircleOutlined 
                                onClick={() => remove(field.name)} 
                                style={{ color: '#ff4d4f' }}
                              />
                            </Space>
                          ))}

                          <Button 
                            type="dashed" 
                            onClick={() => add()} 
                            block 
                            icon={<PlusOutlined />}
                          >
                            添加价格阶梯
                          </Button>

                          <Form.ErrorList errors={errors} />
                        </>
                      )}
                    </Form.List>
                  </Form.Item>
                </>
              )}
            </>
          ) : uploadType === 'manualOverrides' ? (
            <>
              <Form.Item
                label="型号"
                name="model"
                rules={[{ required: true, message: '请输入型号' }]}
              >
                <Input placeholder="如: HG, HW" />
              </Form.Item>
              <Form.Item
                label="价格"
                name="price"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={100}
                  placeholder="输入价格"
                  prefix="¥"
                />
              </Form.Item>
              <Form.Item
                label="兼容机身尺寸"
                name="compatible_body_sizes"
                rules={[{ required: true, message: '请选择兼容机身' }]}
              >
                <Select
                  mode="tags"
                  placeholder="输入机身尺寸，支持多个"
                  style={{ width: '100%' }}
                >
                  <Select.Option value="SF10">SF10</Select.Option>
                  <Select.Option value="SF12">SF12</Select.Option>
                  <Select.Option value="SF14">SF14</Select.Option>
                  <Select.Option value="SF16">SF16</Select.Option>
                </Select>
              </Form.Item>
            </>
          ) : uploadType === 'accessories' ? (
            <>
              <Form.Item
                label="配件名称"
                name="name"
                rules={[{ required: true, message: '请输入配件名称' }]}
              >
                <Input placeholder="如: 双作用电磁阀" />
              </Form.Item>
              <Form.Item
                label="配件类别"
                name="category"
                rules={[{ required: true, message: '请选择配件类别' }]}
              >
                <Select placeholder="选择配件类别">
                  <Select.Option value="控制类">控制类</Select.Option>
                  <Select.Option value="连接与传动类">连接与传动类</Select.Option>
                  <Select.Option value="安全与保护类">安全与保护类</Select.Option>
                  <Select.Option value="检测与反馈类">检测与反馈类</Select.Option>
                  <Select.Option value="辅助与安装工具">辅助与安装工具</Select.Option>
                </Select>
              </Form.Item>

              <Divider orientation="left">价格设置</Divider>

              {/* 计价模式选择器 */}
              <Form.Item
                label="计价模式"
                name="pricing_model"
                initialValue="fixed"
                rules={[{ required: true, message: '请选择计价模式' }]}
              >
                <Radio.Group onChange={(e) => setPricingModel(e.target.value)}>
                  <Radio value="fixed">固定单价 (Fixed Price)</Radio>
                  <Radio value="tiered">阶梯报价 (Tiered Pricing)</Radio>
                </Radio.Group>
              </Form.Item>

              {/* 固定价格 - 显示单个价格输入框 */}
              {pricingModel === 'fixed' && (
                <Form.Item
                  label="价格"
                  name="price"
                  rules={[{ required: true, message: '请输入价格' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={100}
                    placeholder="输入价格"
                    prefix="¥"
                  />
                </Form.Item>
              )}

              {/* 阶梯价格 - 显示动态表单列表 */}
              {pricingModel === 'tiered' && (
                <>
                  <Form.Item
                    label="基础价格（可选）"
                    name="price"
                    tooltip="用于快速查询和排序，建议设置为标准价格"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={100}
                      placeholder="输入基础价格"
                      prefix="¥"
                    />
                  </Form.Item>

                  <Form.Item label="价格阶梯">
                    <Form.List 
                      name="price_tiers"
                      rules={[
                        {
                          validator: async (_, tiers) => {
                            if (!tiers || tiers.length === 0) {
                              return Promise.reject(new Error('至少添加一个价格阶梯'))
                            }
                          },
                        },
                      ]}
                    >
                      {(fields, { add, remove }, { errors }) => (
                        <>
                          {fields.map((field, index) => (
                            <Space 
                              key={field.key} 
                              style={{ display: 'flex', marginBottom: 8 }} 
                              align="baseline"
                            >
                              <Form.Item
                                {...field}
                                name={[field.name, 'min_quantity']}
                                rules={[
                                  { required: true, message: '请输入最小数量' },
                                  { type: 'number', min: 1, message: '数量必须大于0' }
                                ]}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber
                                  placeholder="最小数量"
                                  min={1}
                                  style={{ width: 120 }}
                                />
                              </Form.Item>

                              <Form.Item
                                {...field}
                                name={[field.name, 'unit_price']}
                                rules={[
                                  { required: true, message: '请输入单价' },
                                  { type: 'number', min: 0, message: '价格不能为负' }
                                ]}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber
                                  placeholder="单价"
                                  min={0}
                                  step={100}
                                  prefix="¥"
                                  style={{ width: 180 }}
                                />
                              </Form.Item>

                              <Form.Item
                                {...field}
                                name={[field.name, 'price_type']}
                                style={{ marginBottom: 0 }}
                              >
                                <Select
                                  placeholder="价格类型"
                                  style={{ width: 120 }}
                                  allowClear
                                >
                                  <Select.Option value="normal">标准</Select.Option>
                                  <Select.Option value="low">优惠</Select.Option>
                                  <Select.Option value="high">高价</Select.Option>
                                </Select>
                              </Form.Item>

                              <MinusCircleOutlined 
                                onClick={() => remove(field.name)} 
                                style={{ color: '#ff4d4f' }}
                              />
                            </Space>
                          ))}

                          <Button 
                            type="dashed" 
                            onClick={() => add()} 
                            block 
                            icon={<PlusOutlined />}
                          >
                            添加价格阶梯
                          </Button>

                          <Form.ErrorList errors={errors} />
                        </>
                      )}
                    </Form.List>
                  </Form.Item>
                </>
              )}

              <Divider />

              <Form.Item
                label="描述"
                name="description"
              >
                <Input.TextArea 
                  rows={3}
                  placeholder="配件描述信息"
                />
              </Form.Item>
              <Form.Item
                label="制造商"
                name="manufacturer"
              >
                <Input placeholder="如: ASCO" />
              </Form.Item>
              <Form.Item
                label="型号"
                name="model_number"
              >
                <Input placeholder="如: SCG353A044" />
              </Form.Item>
            </>
          ) : null}
        </Form>
      </Modal>

      {/* Excel上传 Modal */}
      <Modal
        title={`批量导入${
          uploadType === 'actuators' ? '执行器' : 
          uploadType === 'manualOverrides' ? '手动操作装置' : '配件'
        }`}
        open={isUploadModalVisible}
        onCancel={() => setIsUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Text>
            请先下载模板，按照模板格式填写数据后再上传。
          </Text>
          
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadTemplate(uploadType)}
            block
          >
            下载Excel模板
          </Button>

          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 .xlsx 和 .xls 格式的Excel文件
            </p>
          </Dragger>
        </Space>
      </Modal>
    </div>
  )
}

export default AdminPanel
