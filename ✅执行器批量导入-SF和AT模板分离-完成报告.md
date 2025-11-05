# ✅ 执行器批量导入 - SF和AT模板分离 - 完成报告

**完成时间**: 2025-11-05  
**状态**: ✅ 已完成并重启后端服务器

---

## 📋 更新概述

已实现**SF系列**和**AT/GY系列**执行器使用**不同的导入模板**！

---

## 🎯 更新内容

### 1. 后端模板生成（downloadTemplate）

#### ✅ 现在支持两种模板

**SF系列模板**（默认）
```
GET /api/actuators/template
或
GET /api/actuators/template?type=SF
```

**AT/GY系列模板**
```
GET /api/actuators/template?type=AT
```

### 2. SF系列模板字段

| 字段 | 说明 | 示例 |
|------|------|------|
| model_base | 型号 | SF10-150DA |
| series | 系列 | SF |
| mechanism | 机构类型 | Scotch Yoke |
| valve_type | 阀门类型 | Ball Valve / Butterfly Valve |
| body_size | 本体尺寸 | SF10 |
| action_type | 作用类型 | DA / SR |
| base_price_normal | 常温价格 | 5000 |
| base_price_low | 低温价格 | 5200 |
| base_price_high | 高温价格 | 5500 |
| **torque_symmetric** | 对称拨叉扭矩（JSON） | `{"0_3_0":309,"0_4_0":412}` |
| **torque_canted** | 偏心拨叉扭矩（JSON） | `{"0_3_0":417,"0_4_0":556}` |
| specifications | 规格（JSON） | 压力、温度、重量等 |
| description | 描述 | SF10 双作用气动执行器 |

### 3. AT/GY系列模板字段

| 字段 | 说明 | 示例 |
|------|------|------|
| model_base | 型号 | AT-SR52K8, AT-DA52 |
| series | 系列 | AT (铝合金) / GY (不锈钢) |
| mechanism | 机构类型 | Rack & Pinion |
| valve_type | 阀门类型 | Ball Valve / Butterfly Valve |
| body_size | 本体尺寸 | AT-052 |
| action_type | 作用类型 | SR (单作用) / DA (双作用) |
| **base_price_normal** | 常温价格 | 75 |
| **base_price_low** | 低温-40°C价格 | 77 |
| **base_price_high** | 高温100°C价格 | 86 |
| **manual_override_model** | 手轮型号 | SD-1, SD-2, SD-3 |
| **manual_override_price** | 手轮加价 | 127, 167, 249 |
| **spare_parts_model** | 维修包型号 | 1.5包, 2.6包 |
| **spare_parts_price** | 维修包价格 | 1.5, 2.6, 3.0 |
| **flange_standard** | 法兰标准 | F05/φ50/4-M6 |
| **flange_D** | 法兰直径(mm) | 50, 70, 102 |
| **flange_A** | 方口尺寸(mm) | 36, 50, 70 |
| **flange_C** | 中心孔直径(mm) | 30, 40, 50 |
| **flange_thread** | 螺纹规格 | 4-M6, 4-M8, 4-M10 |
| **pneumatic_size** | 气动接口 | G1/4", G1/2" |
| description | 描述 | 单作用铝合金齿轮齿条式 |

---

## 🚀 使用方法

### 方法1：通过前端界面（推荐）

#### 步骤1：登录管理员账号
```
手机号：18322695661
密码：Kay@2024
```

#### 步骤2：进入执行器管理
```
导航：数据管理 → 执行器管理
```

#### 步骤3：下载对应模板

**前端需要更新**以支持选择模板类型：
- 点击"下载模板"按钮
- **目前默认下载SF模板**
- 需要在前端添加下拉选择框让用户选择SF或AT模板

#### 步骤4：填写数据并上传
- 用Excel打开模板
- 填写数据（可以有多行）
- 另存为CSV UTF-8格式
- 点击"批量导入"上传文件

### 方法2：直接API调用

#### 下载SF系列模板
```bash
curl -X GET "http://localhost:5001/api/actuators/template" \
  -H "Cookie: accessToken=your_token" \
  -o actuator_template_SF.xlsx
```

#### 下载AT/GY系列模板
```bash
curl -X GET "http://localhost:5001/api/actuators/template?type=AT" \
  -H "Cookie: accessToken=your_token" \
  -o actuator_template_AT_GY.xlsx
```

---

## 📝 数据示例

### SF系列数据示例
```csv
model_base,series,mechanism,valve_type,body_size,action_type,base_price_normal,base_price_low,base_price_high,torque_symmetric,torque_canted,description
SF10-150DA,SF,Scotch Yoke,Ball Valve,SF10,DA,5000,5200,5500,"{""0_3_0"":309,""0_4_0"":412,""0_5_0"":515}","{""0_3_0"":417,""0_4_0"":556,""0_5_0"":695}",SF10 双作用气动执行器
```

### AT系列数据示例
```csv
model_base,series,mechanism,valve_type,action_type,body_size,base_price_normal,base_price_low,base_price_high,manual_override_model,manual_override_price,spare_parts_model,spare_parts_price,flange_standard,flange_D,flange_A,flange_C,flange_thread,pneumatic_size,description
AT-SR52K8,AT,Rack & Pinion,Ball Valve,SR,AT-052,75,77,86,SD-1,127,1.5包,1.5,F05/φ50/4-M6,50,36,30,4-M6,G1/4",单作用铝合金齿轮齿条式 AT-052
AT-DA52,AT,Rack & Pinion,Ball Valve,DA,AT-052,64,66,76,SD-1,127,1.5包,1.5,F05/φ50/4-M6,50,36,30,4-M6,G1/4",双作用铝合金齿轮齿条式 AT-052
```

---

## ⚠️ 重要说明

### 1. 价格字段兼容性

后端同时支持旧字段和新字段：
- 旧字段：`base_price` → 自动映射到 `base_price_normal`
- 新字段：`base_price_normal`, `base_price_low`, `base_price_high`

### 2. 连接尺寸存储

AT/GY系列的连接尺寸会自动存储到`dimensions`字段：
```javascript
{
  dimensions: {
    flange: {
      standard: "F05/φ50/4-M6",
      D: 50,
      A: 36,
      C: 30,
      threadSpec: "4-M6"
    },
    pneumaticConnection: {
      size: "G1/4\""
    }
  }
}
```

### 3. 导入验证

系统会自动验证：
- ✅ 必填字段：`model_base`, `action_type`
- ✅ 价格字段：必须为数字
- ✅ 型号唯一性：重复型号可选择跳过或更新

---

## 📊 测试结果

### ✅ 已测试功能

1. ✅ SF系列模板下载（默认）
2. ✅ AT/GY系列模板下载（通过参数）
3. ✅ Excel解析支持所有新字段
4. ✅ 价格字段正确解析（三种价格）
5. ✅ 手轮和维修包价格正确解析
6. ✅ 连接尺寸正确存储到dimensions

### ⏳ 待测试

1. ⏳ 前端界面模板选择功能（需要更新前端）
2. ⏳ 完整的32个AT型号批量导入

---

## 🔧 前端更新建议

需要更新 `DataManagementTable.jsx` 组件，添加模板类型选择：

```jsx
// 在下载模板按钮旁边添加选择框
<Select 
  defaultValue="SF" 
  style={{ width: 120, marginRight: 8 }}
  onChange={(value) => setTemplateType(value)}
>
  <Select.Option value="SF">SF系列</Select.Option>
  <Select.Option value="AT">AT/GY系列</Select.Option>
</Select>

<Button
  icon={<DownloadOutlined />}
  onClick={() => handleDownloadTemplate(templateType)}
>
  下载模板
</Button>
```

---

## 📁 文件更新

### 已更新文件
1. ✅ `backend/controllers/actuatorController.js`
   - `downloadTemplate` 函数 - 支持type参数
   - `uploadExcel` 函数 - 解析AT/GY字段
   
2. ✅ `AT系列执行器完整导入模板.csv` (已创建)
   - 包含32个AT型号示例数据

### 待更新文件
1. ⏳ `frontend/src/components/dataManagement/DataManagementTable.jsx`
   - 添加模板类型选择功能

---

## 💡 下一步操作

1. **测试AT模板**：
   ```bash
   # 管理员登录后访问
   http://localhost:5173/data-management
   # 下载模板 → 填写数据 → 上传测试
   ```

2. **使用预填充的AT模板**：
   - 已创建 `AT系列执行器完整导入模板.csv`
   - 包含32个型号的完整数据
   - 可以直接上传测试

3. **更新前端**（可选）：
   - 添加模板类型选择下拉框
   - 提升用户体验

---

## ✅ 验收标准

- [x] SF系列和AT/GY系列有不同的模板
- [x] AT模板包含价格、手轮、维修包字段
- [x] AT模板包含连接尺寸字段
- [x] 后端正确解析所有字段
- [x] 后端服务器已重启
- [ ] 前端添加模板选择功能（可选）
- [ ] 完整测试32个AT型号导入

---

**准备就绪！🚀**

现在您可以：
1. 使用`AT系列执行器完整导入模板.csv`直接批量导入
2. 或者下载空白模板填写后上传

**访问地址**: http://localhost:5173  
**管理员账号**: 18322695661 / Kay@2024  
**导航路径**: 数据管理 → 执行器管理 → 批量导入

