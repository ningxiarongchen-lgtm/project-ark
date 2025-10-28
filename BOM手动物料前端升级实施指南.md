# BOM 手动物料功能 - 前端升级实施指南

## 📋 升级概述

本指南详细说明如何升级 `ProjectDetails.jsx` 中的 BOM 清单管理功能，支持：
1. **手动添加物料** - 所有字段可编辑，价格手动输入
2. **从产品库添加** - 选择系统物料，价格自动填充
3. **区分物料来源** - 清晰标识系统物料和手动物料

**目标文件**: `frontend/src/pages/ProjectDetails.jsx`  
**升级日期**: 2025-10-28  
**难度**: 🟡 中等

---

## 🎯 升级效果预览

### 升级前
- ✅ 只有"手动添加行"按钮
- ❌ 单价字段总是可编辑
- ❌ 无法区分物料来源

### 升级后
- ✅ 两个添加按钮："手动添加物料" + "从产品库添加"
- ✅ 手动物料价格可编辑，系统物料价格只读
- ✅ "来源"列显示物料类型（系统/手动）
- ✅ 自动计算总价
- ✅ 产品选择Modal（可搜索）

---

## 📝 实施步骤

### 步骤 1: 添加必要的导入

**位置**: 文件顶部 (第 3-5 行附近)

**已有的导入**:
```javascript
import { SearchOutlined, CheckCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons' // ✅ 已存在
```

**需要添加的导入**:
```javascript
import { actuatorsAPI, accessoriesAPI } from '../services/api'
```

**修改后的完整导入**:
```javascript
import { projectsAPI, quotesAPI, aiAPI, ordersAPI, actuatorsAPI, accessoriesAPI } from '../services/api'
```

---

### 步骤 2: 添加新的状态变量

**位置**: 在组件内部，现有状态声明区域 (约第 39-61 行附近)

**查找**:
```javascript
// 订单生成状态
const [orderModalVisible, setOrderModalVisible] = useState(false)
const [orderForm] = Form.useForm()
const [creatingOrder, setCreatingOrder] = useState(false)
```

**在其后添加**:
```javascript
// 产品选择状态（用于"从产品库添加"功能）
const [productSelectModalVisible, setProductSelectModalVisible] = useState(false) // 产品选择Modal
const [productSearchTerm, setProductSearchTerm] = useState('') // 产品搜索关键词
const [availableProducts, setAvailableProducts] = useState([]) // 可用产品列表
const [loadingProducts, setLoadingProducts] = useState(false) // 加载产品状态
const [selectedProduct, setSelectedProduct] = useState(null) // 选中的产品
```

---

### 步骤 3: 修改手动添加行函数

**位置**: 约第 221-245 行

**查找**:
```javascript
// 手动添加新BOM行
const handleAddBOMRow = () => {
  const newRow = {
    key: `bom_new_${Date.now()}`,
    actuator_model: '',
    total_quantity: 1,
    unit_price: 0,
    total_price: 0,
    covered_tags: [],
    notes: '',
  }
```

**替换为**:
```javascript
// 手动添加新BOM行（升级版 - 支持手动物料）
const handleAddManualBOMRow = () => {
  const newRow = {
    key: `bom_manual_${Date.now()}`,
    item_type: 'Manual', // ✨ 标识为手动添加
    model_name: '', // ✨ 使用 model_name
    description: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    specifications: {},
    notes: '',
    is_manual: true, // ✨ 标识为手动物料
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
```

---

### 步骤 4: 添加从产品库选择的函数

**位置**: 在 `handleAddManualBOMRow` 函数之后

**添加以下三个新函数**:

```javascript
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
```

---

### 步骤 5: 修改保存编辑函数（添加实时计算）

**位置**: 约第 264-292 行

**查找**:
```javascript
// 保存编辑
const handleSaveEdit = async (key) => {
  try {
    const row = await bomForm.validateFields()
    
    const newData = [...bomData]
    const index = newData.findIndex((item) => key === item.key)
    
    if (index > -1) {
      const item = newData[index]
      
      // 计算总价
      const totalPrice = row.total_quantity * row.unit_price
```

**替换为**:
```javascript
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
```

---

### 步骤 6: 修改保存BOM函数（使用新的字段名）

**位置**: 约第 301-357 行

**查找**:
```javascript
// 保存BOM到后端
const handleSaveBOM = async () => {
```

**修改数据准备部分**:
```javascript
try {
  // 准备保存数据 - 移除 key 字段，转换为后端格式
  const bomToSave = bomData.map(({ key, ...rest }) => ({
    item_id: rest.item_id || undefined, // ✨ 手动物料没有 item_id
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
    bill_of_materials: bomToSave // ✨ 使用新字段名
  })
  
  message.success('BOM清单已保存！')
  
  // 刷新项目数据
  await fetchProject()
} catch (error) {
  // ... 错误处理
}
```

---

### 步骤 7: 升级BOM表格列定义

**位置**: 约第 897-1100 行

**需要修改的地方很多，建议完整替换 `editableBOMColumns` 数组**

#### 7.1 添加"来源"列

**在"序号"列之后添加**:
```javascript
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
```

#### 7.2 添加"类型"列

```javascript
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
```

#### 7.3 修改"型号"列（支持 model_name）

**查找**:
```javascript
{
  title: '执行器型号',
  dataIndex: 'actuator_model',
  key: 'actuator_model',
```

**替换为**:
```javascript
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
```

#### 7.4 添加"描述"列

```javascript
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
```

#### 7.5 修改"数量"列（添加实时计算）

**查找**:
```javascript
{
  title: '数量',
  dataIndex: 'total_quantity',
  key: 'total_quantity',
```

**修改 InputNumber 的 onChange**:
```javascript
<InputNumber 
  min={1} 
  style={{ width: '100%' }}
  onChange={(value) => {
    // ✨ 实时计算总价
    const unitPrice = bomForm.getFieldValue('unit_price') || 0
    const totalPrice = value * unitPrice
    bomForm.setFieldsValue({ total_price: totalPrice })
  }}
/>
```

#### 7.6 修改"单价"列（根据来源决定可编辑性）⭐ 关键

**查找**:
```javascript
{
  title: '单价 (¥)',
  dataIndex: 'unit_price',
  key: 'unit_price',
```

**替换 render 函数**:
```javascript
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
          disabled={!isManualItem} // ✨ 系统物料价格只读
          onChange={(value) => {
            // ✨ 实时计算总价
            const quantity = bomForm.getFieldValue('quantity') || 1
            const totalPrice = quantity * value
            bomForm.setFieldsValue({ total_price: totalPrice })
          }}
          addonBefore={!isManualItem ? '🔒' : undefined} // 锁定图标
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
},
```

#### 7.7 修改"总价"列（显示实时计算值）

**在编辑模式下添加只读的总价输入框**:
```javascript
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
```

---

### 步骤 8: 修改按钮区域

**位置**: 约第 1468-1496 行

**查找**:
```javascript
<Space size="middle" wrap>
  {/* 生成BOM按钮 - 技术工程师和销售工程师可用 */}
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
  
  {/* 手动添加行 - 可编辑角色 */}
  {canEdit && (
    <Button
      icon={<PlusOutlined />}
      onClick={handleAddBOMRow}
      disabled={editingKey !== ''}
    >
      手动添加行
    </Button>
  )}
```

**替换为**:
```javascript
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
  
  {/* ✨ 升级：手动添加行按钮（改名和函数名） */}
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
  
  {/* 其他按钮保持不变... */}
```

---

### 步骤 9: 添加产品选择 Modal

**位置**: 在组件 return 的 JSX 最后，所有 Modal 之后（约第 2300 行附近）

**查找**:
```javascript
      </Spin>
    </div>
  )
}

export default ProjectDetails
```

**在 `export default ProjectDetails` 之前添加**:
```javascript
      {/* ✨ 新增：产品选择 Modal */}
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

      </Spin>
    </div>
  )
}

export default ProjectDetails
```

---

### 步骤 10: 修改数据加载逻辑（可选但推荐）

**位置**: 约第 66-81 行

**查找**:
```javascript
// 当项目数据加载后，初始化BOM数据和版本历史
useEffect(() => {
  if (project?.optimized_bill_of_materials) {
    // 为每行添加唯一的key
    const dataWithKeys = project.optimized_bill_of_materials.map((item, index) => ({
      ...item,
      key: `bom_${index}_${item.actuator_model}`,
    }))
    setBomData(dataWithKeys)
  }
```

**修改为（支持新的字段名）**:
```javascript
// 当项目数据加载后，初始化BOM数据
useEffect(() => {
  // ✨ 优先使用新的 bill_of_materials 字段，向后兼容 optimized_bill_of_materials
  const bomSource = project?.bill_of_materials || project?.optimized_bill_of_materials
  
  if (bomSource && bomSource.length > 0) {
    // 为每行添加唯一的key
    const dataWithKeys = bomSource.map((item, index) => ({
      ...item,
      key: `bom_${index}_${item.model_name || item.actuator_model}`,
      // 向后兼容旧字段名
      model_name: item.model_name || item.actuator_model,
      quantity: item.quantity || item.total_quantity,
    }))
    setBomData(dataWithKeys)
  }
```

---

## ✅ 实施检查清单

### 代码修改

- [ ] 步骤 1: 添加 API 导入
- [ ] 步骤 2: 添加状态变量
- [ ] 步骤 3: 修改 `handleAddBOMRow` → `handleAddManualBOMRow`
- [ ] 步骤 4: 添加产品选择函数
- [ ] 步骤 5: 修改 `handleSaveEdit`
- [ ] 步骤 6: 修改 `handleSaveBOM`
- [ ] 步骤 7: 升级表格列定义
  - [ ] 7.1 添加"来源"列
  - [ ] 7.2 添加"类型"列
  - [ ] 7.3 修改"型号"列
  - [ ] 7.4 添加"描述"列
  - [ ] 7.5 修改"数量"列（实时计算）
  - [ ] 7.6 修改"单价"列（可编辑性控制）⭐
  - [ ] 7.7 修改"总价"列
- [ ] 步骤 8: 修改按钮区域
- [ ] 步骤 9: 添加产品选择 Modal
- [ ] 步骤 10: 修改数据加载逻辑

### 功能测试

- [ ] 点击"手动添加物料"按钮，新增行
- [ ] 手动物料的所有字段可编辑
- [ ] 手动物料的单价可以输入
- [ ] 修改数量或单价时，总价自动计算
- [ ] 点击"从产品库添加"按钮，打开Modal
- [ ] 可以搜索产品
- [ ] 选择产品后添加到BOM
- [ ] 系统物料的单价显示锁定图标🔒
- [ ] 系统物料的单价不可编辑
- [ ] "来源"列正确显示（系统/手动）
- [ ] "类型"列正确显示
- [ ] 保存BOM成功
- [ ] 刷新后数据正确显示

---

## 🐛 常见问题

### Q1: 产品选择Modal打不开？

**原因**: API 导入不正确或 API 路径错误

**解决**:
```javascript
// 确认导入正确
import { actuatorsAPI, accessoriesAPI } from '../services/api'

// 检查 API 是否存在
console.log(actuatorsAPI, accessoriesAPI)
```

### Q2: 总价不会自动计算？

**原因**: InputNumber 的 onChange 没有正确设置

**解决**: 确保步骤 7.5 和 7.6 的 onChange 代码正确复制

### Q3: 系统物料的价格还是可编辑？

**原因**: `disabled` 属性逻辑错误

**解决**:
```javascript
disabled={!isManualItem} // 注意是 !isManualItem
```

### Q4: 保存后刷新，数据字段对不上？

**原因**: 后端返回的字段名不匹配

**解决**: 确保步骤 10 的数据加载逻辑已修改，支持字段映射

---

## 📊 字段映射对照表

| 旧字段名 | 新字段名 | 说明 |
|---------|---------|------|
| `actuator_model` | `model_name` | 型号名称 |
| `total_quantity` | `quantity` | 数量 |
| - | `item_id` | 系统物料ID（新增） |
| - | `item_type` | 物料类型（新增） |
| - | `description` | 描述（新增） |
| - | `is_manual` | 手动标识（新增） |

---

## 🎨 UI 效果预览

### BOM 表格结构

```
┌────┬────┬──────┬──────────┬────────┬──────┬────────┬────────┬──────┬────────┐
│序号│来源│ 类型 │型号/名称 │ 描述   │ 数量 │ 单价   │ 总价   │ 备注 │ 操作   │
├────┼────┼──────┼──────────┼────────┼──────┼────────┼────────┼──────┼────────┤
│ 1  │系统│执行器│AT050-GY  │双作用  │ 2    │15000🔒│30000  │      │编辑删除│
│ 2  │系统│配件  │SWITCH-01 │限位开关│ 4    │500🔒  │2000   │      │编辑删除│
│ 3  │手动│手动  │自定义阀门│特殊定制│ 1    │5000✏️ │5000   │客户指定│编辑删除│
│ 4  │手动│其他  │密封件组  │高温    │ 10   │150✏️  │1500   │      │编辑删除│
└────┴────┴──────┴──────────┴────────┴──────┴────────┴────────┴──────┴────────┘
                                                        总计: ¥38,500
```

### 按钮布局

```
[从选型自动生成] [从产品库添加] [手动添加物料] [保存BOM] [导出BOM ▼] [生成报价单PDF] [历史版本] [AI优化建议] [清空BOM]
```

---

## 📞 技术支持

如果在实施过程中遇到问题：

1. **检查控制台错误** - 打开浏览器开发者工具
2. **对比代码片段** - 参考 `BOM升级-前端代码片段.js`
3. **查看后端文档** - 参考 `BOM手动物料支持升级完成报告.md`

---

**实施状态**: 📝 待实施  
**预计耗时**: 1-2 小时  
**文档版本**: 1.0  
**最后更新**: 2025-10-28

