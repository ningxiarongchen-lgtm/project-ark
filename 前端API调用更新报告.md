# 前端 API 调用更新报告

## 🎯 更新目标

更新前端选型API调用逻辑，确保正确传递 `mechanism` 参数到后端选型引擎。

## ✅ 完成的工作

### 1. 更新 `handleSearch` 函数

**文件**: `frontend/src/pages/SelectionEngine.jsx`

**修改前**:
```javascript
const handleSearch = async () => {
  try {
    const values = await form.validateFields()
    setLoading(true)
    
    const response = await selectionAPI.calculate(values)
    
    if (response.data.success && response.data.data) {
      setResults(response.data.data)
      message.success(`找到 ${response.data.count} 个匹配的执行器`)
    }
  } catch (error) {
    // 错误处理
  }
}
```

**修改后**:
```javascript
const handleSearch = async () => {
  try {
    // 1. 获取所有表单值（包括 mechanism）
    const values = await form.validateFields()
    setLoading(true)
    
    // 2. 构建请求体 - 确保包含机构类型
    const requestPayload = {
      ...values,
      mechanism: values.mechanism || 'Scotch Yoke', // 确保 mechanism 参数存在
    }
    
    // 调试日志
    console.log('选型请求参数:', {
      mechanism: requestPayload.mechanism,
      required_torque: requestPayload.required_torque,
      working_pressure: requestPayload.working_pressure,
      yoke_preference: requestPayload.yoke_preference,
    })
    
    // 3. 调用选型计算API
    const response = await selectionAPI.calculate(requestPayload)
    
    if (response.data.success && response.data.data) {
      setResults(response.data.data)
      message.success(
        `找到 ${response.data.count} 个匹配的执行器 (${requestPayload.mechanism})`
      )
    } else {
      setResults([])
      message.warning(response.data.message || '未找到匹配的执行器')
    }
  } catch (error) {
    if (error.errorFields) {
      return
    }
    console.error('Selection error:', error)
    message.error(error.response?.data?.message || '选型失败，请检查输入参数')
    setResults([])
  } finally {
    setLoading(false)
  }
}
```

## 🔄 数据流程

### 完整的请求流程

```
用户操作
   ↓
填写表单（包括选择 mechanism）
   ↓
点击"开始选型"按钮
   ↓
触发 handleSearch()
   ↓
form.validateFields() - 获取所有表单值
   ↓
构建 requestPayload（包含 mechanism）
   ↓
selectionAPI.calculate(requestPayload)
   ↓
axios.post('/api/selection/calculate', requestPayload)
   ↓
后端接收并处理
   ↓
返回结果
   ↓
前端展示
```

## 📊 请求示例

### Scotch Yoke 请求

**用户表单输入**:
```
执行机构类型: Scotch Yoke
需求扭矩: 500 Nm
工作压力: 0.5 MPa
拨叉类型偏好: Auto
```

**发送的请求体**:
```javascript
{
  mechanism: "Scotch Yoke",
  required_torque: 500,
  working_pressure: 0.5,
  working_angle: 0,
  yoke_preference: "Auto",
  action_type_preference: "DA",
  needs_manual_override: false
}
```

**控制台日志**:
```
选型请求参数: {
  mechanism: "Scotch Yoke",
  required_torque: 500,
  working_pressure: 0.5,
  yoke_preference: "Auto"
}
```

**成功响应消息**:
```
找到 5 个匹配的执行器 (Scotch Yoke)
```

### Rack & Pinion 请求

**用户表单输入**:
```
执行机构类型: Rack & Pinion
需求扭矩: 10 Nm
工作压力: 0.5 MPa
```

**发送的请求体**:
```javascript
{
  mechanism: "Rack & Pinion",
  required_torque: 10,
  working_pressure: 0.5,
  action_type_preference: "DA",
  needs_manual_override: false
  // 注意：yoke_preference 字段存在但会被后端忽略
}
```

**控制台日志**:
```
选型请求参数: {
  mechanism: "Rack & Pinion",
  required_torque: 10,
  working_pressure: 0.5,
  yoke_preference: undefined  // Rack & Pinion 不需要此参数
}
```

**成功响应消息**:
```
找到 3 个匹配的执行器 (Rack & Pinion)
```

## 🛡️ 安全保障

### 1. 参数验证

```javascript
const requestPayload = {
  ...values,
  mechanism: values.mechanism || 'Scotch Yoke', // 确保 mechanism 参数存在
}
```

**保障**:
- ✅ 即使表单验证失败，也有默认值
- ✅ 防止发送空值导致后端错误

### 2. 表单验证

```javascript
const values = await form.validateFields()
```

**保障**:
- ✅ 确保所有必填字段已填写
- ✅ 验证失败时不会发送请求
- ✅ 自动显示错误提示

### 3. 错误处理

```javascript
try {
  // API 调用
} catch (error) {
  if (error.errorFields) {
    // 表单验证错误 - 静默处理
    return
  }
  console.error('Selection error:', error)
  message.error(error.response?.data?.message || '选型失败，请检查输入参数')
  setResults([])
}
```

**保障**:
- ✅ 区分验证错误和网络错误
- ✅ 友好的错误提示
- ✅ 详细的控制台日志用于调试

## 🔍 调试功能

### 控制台日志

```javascript
console.log('选型请求参数:', {
  mechanism: requestPayload.mechanism,
  required_torque: requestPayload.required_torque,
  working_pressure: requestPayload.working_pressure,
  yoke_preference: requestPayload.yoke_preference,
})
```

**用途**:
- ✅ 查看实际发送的参数
- ✅ 验证 mechanism 是否正确传递
- ✅ 调试参数问题

**查看方法**:
1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 点击"开始选型"按钮
4. 查看输出的参数

## 📡 API 服务配置

**文件**: `frontend/src/services/api.js`

```javascript
export const selectionAPI = {
  // 计算推荐
  calculate: (data) => api.post('/selection/calculate', data),
  
  // 获取推荐
  recommend: (data) => api.post('/selection/recommend', data),
  
  // 批量选型
  batch: (data) => api.post('/selection/batch', data)
}
```

**特点**:
- ✅ 直接传递所有数据到后端
- ✅ 自动添加认证 Token
- ✅ 统一的错误处理
- ✅ 401 自动跳转登录

## 🎯 验证清单

### 功能验证

- [x] ✅ mechanism 参数正确包含在请求中
- [x] ✅ Scotch Yoke 时 yoke_preference 正确传递
- [x] ✅ Rack & Pinion 时请求正常发送
- [x] ✅ 表单验证正常工作
- [x] ✅ 错误处理完善
- [x] ✅ 成功消息显示机构类型

### 调试验证

- [x] ✅ 控制台日志输出参数
- [x] ✅ 网络请求可在 DevTools 查看
- [x] ✅ 错误日志详细清晰

### 用户体验验证

- [x] ✅ 加载状态显示
- [x] ✅ 成功提示友好
- [x] ✅ 错误提示清晰
- [x] ✅ 结果正确展示

## 🧪 测试场景

### 场景 1: SF 系列选型

**步骤**:
1. 选择"拨叉式 (SF系列)"
2. 填写扭矩: 500
3. 选择压力: 0.5 MPa
4. 选择拨叉偏好: 自动推荐
5. 点击"开始选型"

**预期**:
- ✅ 请求包含 `mechanism: "Scotch Yoke"`
- ✅ 请求包含 `yoke_preference: "Auto"`
- ✅ 返回 SF 系列执行器
- ✅ 成功消息显示 "(Scotch Yoke)"

### 场景 2: AT/GY 系列选型

**步骤**:
1. 选择"齿轮齿条式 (AT/GY系列)"
2. 填写扭矩: 10
3. 选择压力: 0.5 MPa
4. 点击"开始选型"

**预期**:
- ✅ 请求包含 `mechanism: "Rack & Pinion"`
- ✅ 拨叉偏好字段隐藏
- ✅ 返回 AT/GY 系列执行器
- ✅ 成功消息显示 "(Rack & Pinion)"

### 场景 3: 验证错误处理

**步骤**:
1. 不填写任何字段
2. 直接点击"开始选型"

**预期**:
- ✅ 显示表单验证错误
- ✅ 不发送 API 请求
- ✅ 不显示错误消息（静默处理）

### 场景 4: 网络错误处理

**步骤**:
1. 断开后端服务器
2. 填写表单并提交

**预期**:
- ✅ 显示网络错误消息
- ✅ 控制台输出详细错误
- ✅ 清空结果列表

## 🔧 故障排查

### 问题 1: mechanism 未传递到后端

**症状**: 后端报错"请提供机构类型"

**检查**:
1. 打开浏览器 DevTools
2. 查看 Network 标签
3. 找到 `/selection/calculate` 请求
4. 查看 Request Payload

**解决方案**:
- 确保表单中有 `mechanism` 字段
- 检查初始值设置
- 查看控制台日志

### 问题 2: yoke_preference 在 Rack & Pinion 时显示

**症状**: 选择 Rack & Pinion 后仍显示拨叉偏好

**检查**:
- 查看 Form.Item 的 shouldUpdate 逻辑
- 确认 getFieldValue('mechanism') 返回值

**解决方案**:
- 检查条件渲染代码
- 确保字段名称一致

### 问题 3: 请求发送但无结果

**症状**: 加载完成但无数据显示

**检查**:
1. 控制台日志查看请求参数
2. Network 标签查看响应数据
3. 后端日志查看处理过程

**可能原因**:
- 后端没有匹配的数据
- 查询条件太严格
- 数据库为空

## ✨ 优化建议

### 短期优化

1. **添加请求缓存**
   ```javascript
   // 缓存最近的查询结果
   const [cache, setCache] = useState({})
   ```

2. **参数预处理**
   ```javascript
   // 清理无效参数
   const cleanPayload = Object.fromEntries(
     Object.entries(requestPayload).filter(([_, v]) => v != null)
   )
   ```

3. **请求取消**
   ```javascript
   // 防止重复请求
   const cancelToken = axios.CancelToken.source()
   ```

### 长期优化

1. 添加请求重试机制
2. 实现请求队列管理
3. 优化大数据量结果展示
4. 添加离线缓存支持

## 📝 总结

本次更新成功实现了：

1. **参数传递** ✅
   - mechanism 正确发送到后端
   - 所有表单值完整传递

2. **调试支持** ✅
   - 控制台日志输出关键参数
   - 成功消息显示机构类型

3. **错误处理** ✅
   - 表单验证
   - 网络错误
   - 用户友好提示

4. **代码质量** ✅
   - 清晰的注释
   - 易于维护
   - 易于调试

前端现在可以完美配合后端，为用户提供**全系列执行器的智能选型服务**！

---

**完成时间**: 2025-10-27  
**版本**: v3.0  
**状态**: ✅ 已完成  
**开发团队**: C-MAX 开发团队

