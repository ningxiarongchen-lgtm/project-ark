# 前端故障安全位置功能实现指南

## 概述
本文档说明如何在前端智能选型页面中添加"故障安全位置"功能的支持。

## 需要修改的文件
- `/frontend/src/pages/SelectionEngine.jsx` (智能选型页面)

## 第一步：添加表单输入组件

### 1. 导入必要的组件
```jsx
import { Form, Radio, InputNumber, Card } from 'antd';
```

### 2. 添加表单状态监听
在组件中添加 `Form.useWatch` 来监听作用类型的变化：

```jsx
const SelectionEngine = () => {
  const [form] = Form.useForm();
  
  // 监听作用类型的变化
  const actionType = Form.useWatch('action_type_preference', form);
  const isSingleActing = actionType === 'SR';
  
  // ... 其他代码
};
```

### 3. 在表单中添加故障安全位置选择器

在作用类型选择组件后面，添加以下代码：

```jsx
{/* 作用类型选择 */}
<Form.Item 
  label="作用类型" 
  name="action_type_preference"
  rules={[{ required: true, message: '请选择作用类型' }]}
>
  <Radio.Group>
    <Radio.Button value="DA">双作用 (DA)</Radio.Button>
    <Radio.Button value="SR">单作用 (SR)</Radio.Button>
  </Radio.Group>
</Form.Item>

{/* 故障安全位置（仅单作用执行器显示） */}
{isSingleActing && (
  <Card 
    size="small" 
    title="故障安全配置" 
    style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}
  >
    <Form.Item 
      label="故障安全位置" 
      name="failSafePosition"
      tooltip="故障关：失去气源时阀门关闭；故障开：失去气源时阀门打开"
      rules={[{ required: true, message: '请选择故障安全位置' }]}
      style={{ marginBottom: 12 }}
    >
      <Radio.Group buttonStyle="solid">
        <Radio.Button value="Fail Close">
          <span style={{ fontSize: '14px' }}>
            🔴 故障关 (STC)
          </span>
          <div style={{ fontSize: '11px', color: '#666' }}>
            弹簧关阀，气源开阀
          </div>
        </Radio.Button>
        <Radio.Button value="Fail Open">
          <span style={{ fontSize: '14px' }}>
            🟢 故障开 (STO)
          </span>
          <div style={{ fontSize: '11px', color: '#666' }}>
            弹簧开阀，气源关阀
          </div>
        </Radio.Button>
      </Radio.Group>
    </Form.Item>
    
    <Form.Item 
      label="开启扭矩 (N·m)" 
      name="requiredOpeningTorque"
      tooltip="阀门从关闭到打开所需的最大扭矩"
      rules={[
        { required: true, message: '请输入阀门开启扭矩' },
        { type: 'number', min: 0, message: '扭矩必须大于0' }
      ]}
      style={{ marginBottom: 12 }}
    >
      <InputNumber 
        style={{ width: '100%' }}
        placeholder="请输入开启扭矩"
        min={0}
        step={10}
      />
    </Form.Item>
    
    <Form.Item 
      label="关闭扭矩 (N·m)" 
      name="requiredClosingTorque"
      tooltip="阀门从打开到关闭所需的最大扭矩"
      rules={[
        { required: true, message: '请输入阀门关闭扭矩' },
        { type: 'number', min: 0, message: '扭矩必须大于0' }
      ]}
      style={{ marginBottom: 0 }}
    >
      <InputNumber 
        style={{ width: '100%' }}
        placeholder="请输入关闭扭矩"
        min={0}
        step={10}
      />
    </Form.Item>
  </Card>
)}
```

### 4. 更新表单初始值
```jsx
const [form] = Form.useForm();

// 设置表单初始值
useEffect(() => {
  form.setFieldsValue({
    action_type_preference: 'DA',
    failSafePosition: 'Fail Close', // 默认故障关
    safetyFactor: 1.3,
    // ... 其他初始值
  });
}, []);
```

## 第二步：修改提交逻辑

### 更新表单提交函数
```jsx
const handleSubmit = async (values) => {
  try {
    setLoading(true);
    
    // 构建请求参数
    const requestData = {
      mechanism: values.mechanism,
      valveTorque: values.valveTorque,
      safetyFactor: values.safetyFactor,
      working_pressure: values.working_pressure,
      working_angle: values.working_angle || 0,
      action_type_preference: values.action_type_preference,
      valveType: values.valveType,
      temperature_code: values.temperature_code || 'No code',
      max_budget: values.max_budget,
    };
    
    // 如果是单作用执行器，添加故障安全相关参数
    if (values.action_type_preference === 'SR') {
      requestData.failSafePosition = values.failSafePosition;
      requestData.requiredOpeningTorque = values.requiredOpeningTorque;
      requestData.requiredClosingTorque = values.requiredClosingTorque;
    }
    
    // 发送请求
    const response = await axios.post('/api/selection/calculate', requestData);
    
    if (response.data.success) {
      setResults(response.data.data);
      setSearchCriteria(response.data.search_criteria);
      message.success(`找到 ${response.data.count} 个匹配的执行器`);
    }
  } catch (error) {
    message.error(error.response?.data?.message || '选型计算失败');
  } finally {
    setLoading(false);
  }
};
```

## 第三步：更新结果展示表格

### 1. 在表格列定义中添加故障安全位置列
```jsx
const columns = [
  {
    title: '推荐型号',
    dataIndex: 'final_model_name',
    key: 'final_model_name',
    width: 180,
    fixed: 'left',
    render: (text, record) => (
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
          {text}
        </div>
        {record.action_type === 'SR' && record.fail_safe_position && (
          <div style={{ fontSize: '11px', marginTop: 4 }}>
            {record.fail_safe_position === 'Fail Close' ? (
              <span style={{ color: '#cf1322' }}>
                🔴 故障关 (STC)
              </span>
            ) : (
              <span style={{ color: '#3f8600' }}>
                🟢 故障开 (STO)
              </span>
            )}
          </div>
        )}
      </div>
    ),
  },
  {
    title: '系列',
    dataIndex: 'series',
    key: 'series',
    width: 80,
  },
  {
    title: '作用类型',
    dataIndex: 'action_type',
    key: 'action_type',
    width: 100,
    render: (text) => (
      <span>
        {text === 'DA' ? '双作用' : '单作用'}
      </span>
    ),
  },
  {
    title: '实际扭矩 (N·m)',
    dataIndex: 'actual_torque',
    key: 'actual_torque',
    width: 130,
    render: (text) => text?.toFixed(1),
  },
  {
    title: '扭矩裕度',
    dataIndex: 'torque_margin',
    key: 'torque_margin',
    width: 100,
    render: (text) => {
      let color = '#52c41a'; // 绿色
      if (text < 10) color = '#faad14'; // 橙色
      if (text < 5) color = '#f5222d'; // 红色
      return (
        <span style={{ color, fontWeight: 'bold' }}>
          {text?.toFixed(1)}%
        </span>
      );
    },
  },
  {
    title: '推荐等级',
    dataIndex: 'recommend_level',
    key: 'recommend_level',
    width: 110,
    render: (text) => {
      const colorMap = {
        '强烈推荐': 'green',
        '推荐': 'blue',
        '可选': 'default',
        '勉强可用': 'orange',
      };
      return <Tag color={colorMap[text] || 'default'}>{text}</Tag>;
    },
  },
  {
    title: '价格 (¥)',
    dataIndex: 'price',
    key: 'price',
    width: 120,
    render: (text) => `¥${text?.toLocaleString()}`,
    sorter: (a, b) => a.price - b.price,
  },
  {
    title: '总价 (¥)',
    dataIndex: 'total_price',
    key: 'total_price',
    width: 120,
    render: (text) => (
      <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
        ¥{text?.toLocaleString()}
      </span>
    ),
    sorter: (a, b) => a.total_price - b.total_price,
  },
  {
    title: '交货期',
    dataIndex: 'lead_time',
    key: 'lead_time',
    width: 100,
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    fixed: 'right',
    render: (_, record) => (
      <Space>
        <Button 
          type="primary" 
          size="small"
          onClick={() => handleSelectActuator(record)}
        >
          选择
        </Button>
        <Button 
          size="small"
          onClick={() => handleViewDetails(record)}
        >
          详情
        </Button>
      </Space>
    ),
  },
];
```

### 2. 在搜索条件展示中添加故障安全位置信息
```jsx
{searchCriteria && (
  <Card 
    title="搜索条件" 
    size="small" 
    style={{ marginBottom: 16 }}
  >
    <Descriptions column={3} size="small">
      <Descriptions.Item label="机构类型">
        {searchCriteria.mechanism}
      </Descriptions.Item>
      <Descriptions.Item label="作用类型">
        {searchCriteria.action_type_preference === 'DA' ? '双作用' : '单作用'}
      </Descriptions.Item>
      
      {searchCriteria.action_type_preference === 'SR' && (
        <>
          <Descriptions.Item label="故障安全位置">
            {searchCriteria.fail_safe_position === 'Fail Close' ? (
              <Tag color="red">🔴 故障关 (STC)</Tag>
            ) : (
              <Tag color="green">🟢 故障开 (STO)</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="开启扭矩">
            {searchCriteria.required_opening_torque} N·m
          </Descriptions.Item>
          <Descriptions.Item label="关闭扭矩">
            {searchCriteria.required_closing_torque} N·m
          </Descriptions.Item>
        </>
      )}
      
      {searchCriteria.action_type_preference === 'DA' && (
        <Descriptions.Item label="需求扭矩">
          {searchCriteria.required_torque} N·m
        </Descriptions.Item>
      )}
      
      <Descriptions.Item label="工作压力">
        {searchCriteria.working_pressure} MPa
      </Descriptions.Item>
      <Descriptions.Item label="安全系数">
        {searchCriteria.safety_factor}
      </Descriptions.Item>
      <Descriptions.Item label="最大预算">
        {searchCriteria.max_budget !== '不限' 
          ? `¥${searchCriteria.max_budget.toLocaleString()}` 
          : '不限'}
      </Descriptions.Item>
    </Descriptions>
  </Card>
)}
```

## 第四步：添加详情弹窗展示

### 执行器详情弹窗
```jsx
const [detailsVisible, setDetailsVisible] = useState(false);
const [selectedActuator, setSelectedActuator] = useState(null);

const handleViewDetails = (record) => {
  setSelectedActuator(record);
  setDetailsVisible(true);
};

// 详情弹窗组件
<Modal
  title="执行器详细信息"
  visible={detailsVisible}
  onCancel={() => setDetailsVisible(false)}
  footer={null}
  width={800}
>
  {selectedActuator && (
    <Descriptions column={2} bordered>
      <Descriptions.Item label="完整型号" span={2}>
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
          {selectedActuator.final_model_name}
        </span>
      </Descriptions.Item>
      
      <Descriptions.Item label="基础型号">
        {selectedActuator.model_base}
      </Descriptions.Item>
      
      <Descriptions.Item label="系列">
        {selectedActuator.series}
      </Descriptions.Item>
      
      <Descriptions.Item label="作用类型">
        {selectedActuator.action_type === 'DA' ? '双作用 (DA)' : '单作用 (SR)'}
      </Descriptions.Item>
      
      {selectedActuator.action_type === 'SR' && selectedActuator.fail_safe_position && (
        <Descriptions.Item label="故障安全位置">
          {selectedActuator.fail_safe_position === 'Fail Close' ? (
            <Tag color="red" style={{ fontSize: '14px' }}>
              🔴 故障关 (STC) - 弹簧关阀，气源开阀
            </Tag>
          ) : (
            <Tag color="green" style={{ fontSize: '14px' }}>
              🟢 故障开 (STO) - 弹簧开阀，气源关阀
            </Tag>
          )}
        </Descriptions.Item>
      )}
      
      {selectedActuator.spring_range && (
        <Descriptions.Item label="弹簧范围">
          {selectedActuator.spring_range}
        </Descriptions.Item>
      )}
      
      <Descriptions.Item label="实际扭矩">
        {selectedActuator.actual_torque?.toFixed(1)} N·m
      </Descriptions.Item>
      
      <Descriptions.Item label="扭矩裕度">
        <span style={{ 
          color: selectedActuator.torque_margin >= 10 ? '#52c41a' : '#faad14',
          fontWeight: 'bold'
        }}>
          {selectedActuator.torque_margin?.toFixed(1)}%
        </span>
      </Descriptions.Item>
      
      <Descriptions.Item label="推荐等级">
        <Tag color={
          selectedActuator.recommend_level === '强烈推荐' ? 'green' :
          selectedActuator.recommend_level === '推荐' ? 'blue' : 'default'
        }>
          {selectedActuator.recommend_level}
        </Tag>
      </Descriptions.Item>
      
      <Descriptions.Item label="基础价格">
        ¥{selectedActuator.price?.toLocaleString()}
      </Descriptions.Item>
      
      <Descriptions.Item label="总价">
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
          ¥{selectedActuator.total_price?.toLocaleString()}
        </span>
      </Descriptions.Item>
      
      <Descriptions.Item label="交货期">
        {selectedActuator.lead_time}
      </Descriptions.Item>
    </Descriptions>
  )}
</Modal>
```

## 样式建议

### 1. 添加自定义样式
```css
/* 故障安全位置卡片样式 */
.fail-safe-card {
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  border: 1px solid #91d5ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

/* 单选按钮组样式 */
.fail-safe-radio-group .ant-radio-button-wrapper {
  height: auto;
  padding: 8px 16px;
  line-height: 1.5;
}

/* 扭矩输入框样式 */
.torque-input {
  width: 100%;
  font-size: 14px;
}

/* 型号展示样式 */
.model-name {
  font-weight: bold;
  font-size: 14px;
  color: #1890ff;
}

.fail-safe-badge {
  font-size: 11px;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 4px;
}

.fail-safe-badge.close {
  background-color: #fff1f0;
  color: #cf1322;
  border: 1px solid #ffccc7;
}

.fail-safe-badge.open {
  background-color: #f6ffed;
  color: #3f8600;
  border: 1px solid #b7eb8f;
}
```

## 用户体验优化建议

### 1. 添加工况说明提示
```jsx
<Alert
  message="故障安全位置说明"
  description={
    <div>
      <p><strong>故障关 (STC):</strong> 当气源失效时，弹簧将阀门关闭。适用于需要在失去动力时自动切断流体的场合。</p>
      <p><strong>故障开 (STO):</strong> 当气源失效时，弹簧将阀门打开。适用于需要在失去动力时保持流通的场合。</p>
    </div>
  }
  type="info"
  showIcon
  closable
  style={{ marginBottom: 16 }}
/>
```

### 2. 添加表单联动验证
```jsx
// 当切换作用类型时，清除单作用相关字段
const handleActionTypeChange = (value) => {
  if (value === 'DA') {
    form.setFieldsValue({
      failSafePosition: undefined,
      requiredOpeningTorque: undefined,
      requiredClosingTorque: undefined,
    });
  } else {
    form.setFieldsValue({
      failSafePosition: 'Fail Close', // 默认故障关
    });
  }
};

<Form.Item 
  label="作用类型" 
  name="action_type_preference"
>
  <Radio.Group onChange={(e) => handleActionTypeChange(e.target.value)}>
    <Radio.Button value="DA">双作用 (DA)</Radio.Button>
    <Radio.Button value="SR">单作用 (SR)</Radio.Button>
  </Radio.Group>
</Form.Item>
```

### 3. 添加加载状态和错误处理
```jsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// 在提交函数中
try {
  setLoading(true);
  setError(null);
  // ... 请求逻辑
} catch (err) {
  setError(err.response?.data?.message || '选型失败，请检查输入参数');
  message.error(err.response?.data?.message || '选型失败');
} finally {
  setLoading(false);
}

// 在表单下方显示错误
{error && (
  <Alert
    message="选型失败"
    description={error}
    type="error"
    showIcon
    closable
    onClose={() => setError(null)}
    style={{ marginBottom: 16 }}
  />
)}
```

## 测试检查清单

- [ ] 切换作用类型时，故障安全配置区域正确显示/隐藏
- [ ] 单作用执行器必填字段验证生效
- [ ] 提交时正确传递所有参数到后端
- [ ] 结果表格正确显示型号（含STC/STO后缀）
- [ ] 故障安全位置标识在结果中清晰显示
- [ ] 搜索条件展示包含故障安全相关信息
- [ ] 详情弹窗正确显示故障安全位置信息
- [ ] 响应式布局在不同屏幕尺寸下正常工作
- [ ] 错误处理和加载状态正常工作

## 完整实现示例

参考文件位置：`/frontend/src/pages/SelectionEngine.jsx`

完整的实现需要整合以上所有步骤，确保：
1. 表单输入流畅
2. 数据验证完整
3. 结果展示清晰
4. 用户体验良好

---

**实现日期:** 2025-10-30  
**版本:** v1.0  
**作者:** AI Assistant

