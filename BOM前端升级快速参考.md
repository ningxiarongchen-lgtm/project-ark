# BOM 前端升级 - 快速参考

## 🎯 核心变更

### 3 个关键函数

```javascript
// 1. 手动添加物料
handleAddManualBOMRow() {
  // ✨ is_manual: true
  // ✨ item_type: 'Manual'
  // ✨ 所有字段可编辑
}

// 2. 从产品库添加
handleAddFromDatabase() {
  // ✅ item_id: 产品ID
  // ✅ is_manual: false
  // ✅ 价格从数据库获取
}

// 3. 实时计算总价
onChange={(value) => {
  const quantity = bomForm.getFieldValue('quantity')
  const unitPrice = bomForm.getFieldValue('unit_price')
  bomForm.setFieldsValue({ total_price: quantity * unitPrice })
}}
```

---

## 📊 数据结构

### 系统物料
```javascript
{
  item_id: "507f...",        // ✅ 有ID
  item_type: "Actuator",
  model_name: "AT050-GY",
  quantity: 2,
  unit_price: 15000,         // 🔒 只读
  is_manual: false
}
```

### 手动物料
```javascript
{
  // item_id: 无              // ❌ 无ID
  item_type: "Manual",
  model_name: "自定义物料",
  quantity: 1,
  unit_price: 5000,          // ✏️ 可编辑
  is_manual: true
}
```

---

## 🎨 UI 变化

### 按钮

```
旧: [手动添加行]

新: [从产品库添加] [手动添加物料]
```

### 表格列

```
新增:
- 来源 (系统/手动)
- 类型 (执行器/配件/手动添加)
- 描述

修改:
- 型号 (actuator_model → model_name)
- 数量 (total_quantity → quantity)
- 单价 (根据来源决定可编辑性)
```

---

## 🔑 关键代码片段

### 单价可编辑性控制⭐

```javascript
render: (price, record) => {
  if (isEditing(record)) {
    const isManualItem = record.is_manual  // 判断是否手动物料
    
    return (
      <InputNumber 
        disabled={!isManualItem}  // 🔒 系统物料锁定
        onChange={(value) => {
          // 实时计算总价
          const qty = bomForm.getFieldValue('quantity')
          bomForm.setFieldsValue({ total_price: qty * value })
        }}
        addonBefore={!isManualItem ? '🔒' : undefined}
      />
    )
  }
}
```

### 产品选择 Modal

```javascript
<Modal
  open={productSelectModalVisible}
  onOk={handleAddFromDatabase}
>
  <Input 
    placeholder="搜索..." 
    value={productSearchTerm}
    onChange={(e) => setProductSearchTerm(e.target.value)}
  />
  
  {availableProducts
    .filter(item => item.display_name.includes(productSearchTerm))
    .map(product => (
      <Card onClick={() => setSelectedProduct(product)}>
        {product.display_name} - ¥{product.display_price}
      </Card>
    ))
  }
</Modal>
```

---

## ✅ 测试要点

- [ ] 手动添加 → 所有字段可编辑
- [ ] 产品库添加 → 价格只读
- [ ] 修改数量/单价 → 总价自动更新
- [ ] 保存后刷新 → 数据正确显示
- [ ] 来源/类型列 → 显示正确

---

## 📁 相关文件

- **实施指南**: `BOM手动物料前端升级实施指南.md` (详细步骤)
- **代码片段**: `BOM升级-前端代码片段.js` (完整代码)
- **后端文档**: `BOM手动物料支持升级完成报告.md`

---

**版本**: 1.0  
**日期**: 2025-10-28

