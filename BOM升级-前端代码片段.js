/**
 * BOM 清单管理功能升级 - 前端代码片段
 * 
 * 本文件包含了升级后的 BOM 管理功能的关键代码片段
 * 需要将这些代码集成到 ProjectDetails.jsx 中
 */

// ==================== 1. 新增状态变量 ====================
// 在组件顶部的状态声明区域添加

const [productSelectModalVisible, setProductSelectModalVisible] = useState(false) // 产品选择Modal
const [productSearchTerm, setProductSearchTerm] = useState('') // 产品搜索关键词
const [availableProducts, setAvailableProducts] = useState([]) // 可用产品列表
const [loadingProducts, setLoadingProducts] = useState(false) // 加载产品状态
const [selectedProduct, setSelectedProduct] = useState(null) // 选中的产品

// ==================== 2. 修改后的手动添加行函数 ====================

// 手动添加新BOM行（升级版 - 支持手动物料）
const handleAddManualBOMRow = () => {
  const newRow = {
    key: `bom_manual_${Date.now()}`,
    // item_id: null, // 手动物料没有 item_id
    item_type: 'Manual', // 标识为手动添加
    model_name: '', // 使用 model_name 而不是 actuator_model
    description: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    specifications: {},
    notes: '',
    is_manual: true, // 标识为手动物料
  }
  
  setBomData([...bomData, newRow])
  setEditingKey(newRow.key)
  
  // 设置表单初始值
  bomForm.setFieldsValue({
    model_name: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    notes: '',
  })
  
  message.info('已添加手动物料行，所有字段可编辑')
}

// ==================== 3. 新增：从产品库添加函数 ====================

// 打开产品选择Modal
const handleOpenProductSelectModal = async () => {
  setProductSelectModalVisible(true)
  setLoadingProducts(true)
  
  try {
    // 同时获取执行器和配件
    const [actuatorsRes, accessoriesRes] = await Promise.all([
      actuatorsAPI.getAll({ limit: 100 }),
      accessoriesAPI.getAll({ limit: 100 })
    ])
    
    // 合并并标记类型
    const actuators = (actuatorsRes.data.data || []).map(item => ({
      ...item,
      item_type: 'Actuator',
      display_name: item.model_base || item.modelNumber,
      display_price: item.pricing?.basePrice || 0
    }))
    
    const accessories = (accessoriesRes.data.data || []).map(item => ({
      ...item,
      item_type: 'Accessory',
      display_name: item.name || item.part_number,
      display_price: item.price || 0
    }))
    
    setAvailableProducts([...actuators, ...accessories])
  } catch (error) {
    console.error('加载产品列表失败:', error)
    message.error('加载产品列表失败: ' + error.message)
  } finally {
    setLoadingProducts(false)
  }
}

// 从产品库添加到BOM
const handleAddFromDatabase = () => {
  if (!selectedProduct) {
    message.warning('请先选择一个产品')
    return
  }
  
  const newRow = {
    key: `bom_db_${Date.now()}`,
    item_id: selectedProduct._id, // ✅ 引用系统物料
    item_type: selectedProduct.item_type, // 'Actuator' 或 'Accessory'
    model_name: selectedProduct.display_name,
    description: selectedProduct.description || '',
    quantity: 1,
    unit_price: selectedProduct.display_price,
    total_price: selectedProduct.display_price,
    specifications: selectedProduct.specifications || {},
    notes: '',
    is_manual: false, // ❌ 不是手动物料
  }
  
  setBomData([...bomData, newRow])
  setProductSelectModalVisible(false)
  setSelectedProduct(null)
  setProductSearchTerm('')
  
  message.success(`已添加 ${newRow.model_name} 到BOM清单`)
}

// ==================== 4. 修改后的编辑和保存函数 ====================

// 保存编辑（升级版 - 自动计算总价）
const handleSaveEdit = async (key) => {
  try {
    const row = await bomForm.validateFields()
    
    const newData = [...bomData]
    const index = newData.findIndex((item) => key === item.key)
    
    if (index > -1) {
      const item = newData[index]
      
      // ✅ 自动计算总价
      const totalPrice = row.quantity * row.unit_price
      
      newData.splice(index, 1, {
        ...item,
        ...row,
        total_price: totalPrice,
      })
      
      setBomData(newData)
      setEditingKey('')
      message.success('保存成功')
    }
  } catch (error) {
    console.error('保存失败:', error)
    message.error('请检查输入是否正确')
  }
}

// 保存BOM到后端（升级版 - 使用 bill_of_materials 字段）
const handleSaveBOM = async () => {
  if (!bomData || bomData.length === 0) {
    message.warning('BOM清单为空，无法保存')
    return
  }
  
  if (editingKey) {
    message.warning('请先保存或取消当前编辑的行')
    return
  }
  
  setSavingBOM(true)
  
  try {
    // 准备保存数据 - 移除 key 字段，转换为后端格式
    const bomToSave = bomData.map(({ key, ...rest }) => ({
      item_id: rest.item_id || undefined, // 手动物料没有 item_id
      item_type: rest.item_type,
      model_name: rest.model_name,
      description: rest.description || '',
      quantity: rest.quantity,
      unit_price: rest.unit_price,
      total_price: rest.total_price,
      specifications: rest.specifications || {},
      notes: rest.notes || '',
      is_manual: rest.is_manual || false,
    }))
    
    // 调用后端API保存到 bill_of_materials 字段
    await projectsAPI.update(id, {
      bill_of_materials: bomToSave
    })
    
    message.success('BOM清单已保存！')
    
    // 刷新项目数据
    await fetchProject()
  } catch (error) {
    console.error('保存BOM失败:', error)
    message.error('保存失败: ' + (error.response?.data?.message || error.message))
  } finally {
    setSavingBOM(false)
  }
}

// ==================== 5. 升级后的BOM表格列定义 ====================

const editableBOMColumns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    fixed: 'left',
    render: (_, __, index) => index + 1,
  },
  {
    title: '来源',
    dataIndex: 'is_manual',
    key: 'source',
    width: 80,
    render: (isManual) => (
      <Tag color={isManual ? 'orange' : 'blue'}>
        {isManual ? '手动' : '系统'}
      </Tag>
    )
  },
  {
    title: '类型',
    dataIndex: 'item_type',
    key: 'item_type',
    width: 100,
    render: (type) => {
      const typeMap = {
        'Actuator': '执行器',
        'Accessory': '配件',
        'Manual': '手动添加',
        'Valve': '阀门',
        'Other': '其他'
      }
      const colorMap = {
        'Actuator': 'blue',
        'Accessory': 'green',
        'Manual': 'orange',
        'Valve': 'purple',
        'Other': 'default'
      }
      return <Tag color={colorMap[type]}>{typeMap[type] || type}</Tag>
    }
  },
  {
    title: '型号/名称',
    dataIndex: 'model_name',
    key: 'model_name',
    width: 200,
    editable: true,
    render: (model, record) => {
      if (isEditing(record)) {
        return (
          <Form.Item
            name="model_name"
            style={{ margin: 0 }}
            rules={[{ required: true, message: '请输入型号' }]}
          >
            <Input placeholder="例如: AT050-GY" />
          </Form.Item>
        )
      }
      return (
        <div>
          <strong>{model || '-'}</strong>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#999' }}>
              {record.description}
            </div>
          )}
        </div>
      )
    }
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    width: 200,
    editable: true,
    render: (desc, record) => {
      if (isEditing(record)) {
        return (
          <Form.Item name="description" style={{ margin: 0 }}>
            <Input placeholder="物料描述" />
          </Form.Item>
        )
      }
      return desc || '-'
    }
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 100,
    editable: true,
    render: (qty, record) => {
      if (isEditing(record)) {
        return (
          <Form.Item
            name="quantity"
            style={{ margin: 0 }}
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber 
              min={1} 
              style={{ width: '100%' }}
              onChange={(value) => {
                // 实时计算总价
                const unitPrice = bomForm.getFieldValue('unit_price') || 0
                bomForm.setFieldsValue({
                  total_price: value * unitPrice
                })
              }}
            />
          </Form.Item>
        )
      }
      return <Tag color="blue">{qty}</Tag>
    }
  },
  // 单价列 - 根据物料来源决定是否可编辑
  ...(canSeeCost ? [{
    title: '单价 (¥)',
    dataIndex: 'unit_price',
    key: 'unit_price',
    width: 130,
    editable: true,
    render: (price, record) => {
      if (isEditing(record)) {
        // ✅ 手动物料可以编辑价格，系统物料只读
        const isManualItem = record.is_manual
        
        return (
          <Form.Item
            name="unit_price"
            style={{ margin: 0 }}
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }}
              disabled={!isManualItem} // 系统物料价格只读
              onChange={(value) => {
                // 实时计算总价
                const quantity = bomForm.getFieldValue('quantity') || 0
                bomForm.setFieldsValue({
                  total_price: quantity * value
                })
              }}
              addonBefore={!isManualItem && '🔒'} // 锁定图标
            />
          </Form.Item>
        )
      }
      return (
        <div>
          ¥{(price || 0).toLocaleString()}
          {!record.is_manual && (
            <Tag color="blue" style={{ marginLeft: 4 }}>系统价格</Tag>
          )}
        </div>
      )
    }
  }] : []),
  // 总价列
  ...(canSeeCost ? [{
    title: '总价 (¥)',
    dataIndex: 'total_price',
    key: 'total_price',
    width: 140,
    render: (price, record) => {
      if (isEditing(record)) {
        return (
          <Form.Item name="total_price" style={{ margin: 0 }}>
            <InputNumber 
              disabled 
              precision={2}
              style={{ width: '100%', fontWeight: 'bold' }}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
        )
      }
      return (
        <strong style={{ color: '#1890ff' }}>
          ¥{(price || 0).toLocaleString()}
        </strong>
      )
    }
  }] : []),
  {
    title: '备注',
    dataIndex: 'notes',
    key: 'notes',
    width: 200,
    editable: true,
    render: (notes, record) => {
      if (isEditing(record)) {
        return (
          <Form.Item name="notes" style={{ margin: 0 }}>
            <Input.TextArea 
              placeholder="备注信息" 
              autoSize={{ minRows: 1, maxRows: 3 }}
            />
          </Form.Item>
        )
      }
      return notes || '-'
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
    render: (_, record) => {
      const editable = isEditing(record)
      return editable ? (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleSaveEdit(record.key)}
          >
            保存
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleCancelEdit}
          >
            取消
          </Button>
        </Space>
      ) : (
        <Space>
          {canEdit && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              disabled={editingKey !== ''}
              onClick={() => handleEditBOMRow(record)}
            >
              编辑
            </Button>
          )}
          {(canEdit || canDelete) && (
            <Popconfirm
              title="确定删除此条目吗？"
              onConfirm={() => handleDeleteBOMRow(record.key)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                disabled={editingKey !== ''}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    },
  },
]

// ==================== 6. 升级后的按钮区域 JSX ====================

// 在 BOM Tab 的按钮区域替换为以下代码：

<Space size="middle" wrap>
  {/* 从选型自动生成 BOM 按钮 */}
  <RoleBasedAccess allowedRoles={['Administrator', 'Technical Engineer', 'Sales Engineer']}>
    <Button
      type="primary"
      size="large"
      icon={<ThunderboltOutlined />}
      onClick={handleGenerateBOMFromSelections}
      loading={generatingBOM}
      disabled={!project?.selections || project.selections.length === 0}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
      }}
    >
      从选型自动生成
    </Button>
  </RoleBasedAccess>
  
  {/* ✨ 新增：从产品库添加按钮 */}
  {canEdit && (
    <Button
      type="primary"
      icon={<ShoppingCartOutlined />}
      onClick={handleOpenProductSelectModal}
      disabled={editingKey !== ''}
      style={{
        background: '#1890ff',
      }}
    >
      从产品库添加
    </Button>
  )}
  
  {/* ✨ 升级：手动添加行按钮（改名） */}
  {canEdit && (
    <Button
      icon={<PlusOutlined />}
      onClick={handleAddManualBOMRow}
      disabled={editingKey !== ''}
    >
      手动添加物料
    </Button>
  )}
  
  {/* 保存BOM按钮 */}
  {canEdit && (
    <Button
      type="primary"
      icon={<SaveOutlined />}
      onClick={handleSaveBOM}
      loading={savingBOM}
      disabled={bomData.length === 0 || editingKey !== ''}
    >
      保存BOM
    </Button>
  )}
  
  {/* 其他按钮... */}
</Space>

// ==================== 7. 新增：产品选择 Modal ====================

// 在组件的 return JSX 中添加以下 Modal：

<Modal
  title={
    <Space>
      <ShoppingCartOutlined />
      从产品库选择物料
    </Space>
  }
  open={productSelectModalVisible}
  onCancel={() => {
    setProductSelectModalVisible(false)
    setSelectedProduct(null)
    setProductSearchTerm('')
  }}
  onOk={handleAddFromDatabase}
  okText="添加到BOM"
  cancelText="取消"
  width={800}
  okButtonProps={{ disabled: !selectedProduct }}
>
  <div>
    {/* 搜索框 */}
    <Input
      placeholder="搜索产品型号或名称..."
      prefix={<SearchOutlined />}
      value={productSearchTerm}
      onChange={(e) => setProductSearchTerm(e.target.value)}
      style={{ marginBottom: 16 }}
      allowClear
    />
    
    {/* 产品列表 */}
    <Spin spinning={loadingProducts}>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {availableProducts
          .filter(item => 
            !productSearchTerm || 
            item.display_name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(productSearchTerm.toLowerCase()))
          )
          .map((product) => (
            <Card
              key={product._id}
              size="small"
              hoverable
              style={{
                marginBottom: 8,
                cursor: 'pointer',
                border: selectedProduct?._id === product._id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                backgroundColor: selectedProduct?._id === product._id ? '#e6f7ff' : '#fff'
              }}
              onClick={() => setSelectedProduct(product)}
            >
              <Row gutter={16} align="middle">
                <Col span={1}>
                  {selectedProduct?._id === product._id && (
                    <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                  )}
                </Col>
                <Col span={12}>
                  <div>
                    <strong>{product.display_name}</strong>
                    <Tag color={product.item_type === 'Actuator' ? 'blue' : 'green'} style={{ marginLeft: 8 }}>
                      {product.item_type === 'Actuator' ? '执行器' : '配件'}
                    </Tag>
                  </div>
                  {product.description && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                      {product.description}
                    </div>
                  )}
                </Col>
                <Col span={6}>
                  {product.specifications?.torque && (
                    <div style={{ fontSize: '12px' }}>
                      扭矩: {product.specifications.torque.value} Nm
                    </div>
                  )}
                </Col>
                <Col span={5} style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#1890ff', fontSize: '16px' }}>
                    ¥{product.display_price.toLocaleString()}
                  </strong>
                </Col>
              </Row>
            </Card>
          ))}
        
        {availableProducts.filter(item => 
          !productSearchTerm || 
          item.display_name.toLowerCase().includes(productSearchTerm.toLowerCase())
        ).length === 0 && (
          <Empty description="未找到匹配的产品" />
        )}
      </div>
    </Spin>
    
    {/* 选中产品信息 */}
    {selectedProduct && (
      <Alert
        message="已选择产品"
        description={
          <div>
            <strong>{selectedProduct.display_name}</strong>
            {' - '}
            ¥{selectedProduct.display_price.toLocaleString()}
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {selectedProduct.item_type === 'Actuator' ? '执行器' : '配件'}
            </Tag>
          </div>
        }
        type="success"
        showIcon
        style={{ marginTop: 16 }}
      />
    )}
  </div>
</Modal>

// ==================== 8. 需要导入的额外组件 ====================

// 在文件顶部的 import 语句中添加：
import { SearchOutlined, CheckCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { actuatorsAPI, accessoriesAPI } from '../services/api'

// ==================== 完成 ====================

