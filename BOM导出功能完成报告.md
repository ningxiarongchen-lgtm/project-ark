# BOM导出功能完成报告

## 功能概述

已成功为BOM清单界面添加"导出为Excel/PDF"功能，用户可以将当前BOM表格数据导出为Excel或PDF格式文件。

---

## 新增功能

### 1. 导出BOM为Excel ⭐

**功能描述:**
- 将BOM表格数据导出为 `.xlsx` 格式的Excel文件
- 包含完整的表头和数据
- 自动添加统计行（合计）
- 自动设置列宽
- 文件名包含项目编号和时间戳

**导出内容:**
```
序号 | 执行器型号 | 数量 | 单价(¥) | 总价(¥) | 覆盖位号 | 备注
-----|------------|------|----------|---------|----------|------
1    | SF050-DA   | 3    | 5280     | 15840   | V-001... | -
2    | SF075-DA   | 2    | 6800     | 13600   | V-004... | -
-----|------------|------|----------|---------|----------|------
     | 合计       | 5    |          | 29440   |          |
```

**技术实现:**
```javascript
// 使用 xlsx 库
import * as XLSX from 'xlsx'

const handleExportBOMToExcel = () => {
  // 1. 准备数据
  const excelData = bomData.map((item, index) => ({
    '序号': index + 1,
    '执行器型号': item.actuator_model,
    '数量': item.total_quantity,
    '单价 (¥)': item.unit_price,
    '总价 (¥)': item.total_price,
    '覆盖位号': item.covered_tags.join(', '),
    '备注': item.notes
  }))
  
  // 2. 添加统计行
  excelData.push({ 
    '执行器型号': '合计',
    '数量': totalQuantity,
    '总价 (¥)': totalPrice
  })
  
  // 3. 创建工作簿并导出
  const ws = XLSX.utils.json_to_sheet(excelData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'BOM清单')
  XLSX.writeFile(wb, filename)
}
```

**文件命名规则:**
```
BOM清单_[项目编号]_[时间戳].xlsx
例如: BOM清单_P2024001_20251027_143022.xlsx
```

**列宽设置:**
- 序号: 6字符
- 执行器型号: 20字符
- 数量: 8字符
- 单价: 12字符
- 总价: 12字符
- 覆盖位号: 30字符
- 备注: 20字符

---

### 2. 导出BOM为PDF ⭐

**功能描述:**
- 将BOM表格数据导出为 `.pdf` 格式的PDF文件
- 包含项目信息头部
- 专业的表格样式
- 自动分页
- 页码显示

**导出内容:**
```
┌─────────────────────────────────────────────────┐
│  BOM清单 / Bill of Materials                    │
│                                                  │
│  项目编号: P2024001                              │
│  项目名称: XX工业园区阀门控制系统                │
│  客户: ABC集团                                   │
│  生成时间: 2025-10-27 14:30:22                   │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ No. │ Model   │ Qty │ Price │ Tags...  │    │
│  ├─────┼─────────┼─────┼───────┼──────────┤    │
│  │ 1   │SF050-DA │ 3   │¥5,280 │V-001...  │    │
│  │ 2   │SF075-DA │ 2   │¥6,800 │V-004...  │    │
│  ├─────┼─────────┼─────┼───────┼──────────┤    │
│  │     │合计     │ 5   │¥29,440│          │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│                                    Page 1 of 1   │
└─────────────────────────────────────────────────┘
```

**技术实现:**
```javascript
// 使用 jsPDF 和 jspdf-autotable
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const handleExportBOMToPDF = () => {
  const doc = new jsPDF()
  
  // 1. 添加标题
  doc.setFontSize(18)
  doc.text('BOM清单 / Bill of Materials', 14, 20)
  
  // 2. 添加项目信息
  doc.setFontSize(10)
  doc.text(`项目编号: ${project.projectNumber}`, 14, 30)
  doc.text(`项目名称: ${project.projectName}`, 14, 36)
  
  // 3. 添加表格
  doc.autoTable({
    head: [['No.', 'Model', 'Qty', 'Price', 'Tags', 'Notes']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [102, 126, 234] }
  })
  
  // 4. 保存文件
  doc.save(filename)
}
```

**文件命名规则:**
```
BOM清单_[项目编号]_[时间戳].pdf
例如: BOM清单_P2024001_20251027_143022.pdf
```

**样式特性:**
- 表头: 蓝色背景 (#667eea)，白色文字，粗体
- 数据行: 白色背景，黑色文字
- 合计行: 浅灰色背景，粗体
- 字体: Helvetica
- 字号: 标题18pt，内容9pt

---

## UI改进

### 导出按钮设计

**下拉菜单按钮:**
```
┌────────────────────┐
│ 📥 导出BOM ▼       │ ← 主按钮
└────────────────────┘
     ↓ 点击后展开
┌────────────────────┐
│ 📊 导出为Excel     │
├────────────────────┤
│ 📄 导出为PDF       │
└────────────────────┘
```

**按钮位置:**
```
功能按钮区:
[从选型自动生成] [手动添加行] [保存BOM] [📥导出BOM▼] [生成报价单PDF] [清空BOM]
                                      ↑
                                 新增的导出按钮
```

**按钮状态:**
- **启用:** BOM数据不为空时
- **禁用:** BOM数据为空时（灰色显示）
- **图标:** 下载图标 `<DownloadOutlined />`

---

## 数据源

### 导出数据来源

**明确使用当前BOM表格数据:**
```javascript
// 数据源: bomData 状态变量
const [bomData, setBomData] = useState([])

// 导出函数使用 bomData
const handleExportBOMToExcel = () => {
  const excelData = bomData.map(...)  // ← 使用当前表格数据
}

const handleExportBOMToPDF = () => {
  const tableData = bomData.map(...)  // ← 使用当前表格数据
}
```

**数据内容包括:**
1. 序号（自动生成）
2. 执行器型号
3. 数量
4. 单价
5. 总价
6. 覆盖位号（数组转为逗号分隔字符串）
7. 备注

**自动统计:**
- 总数量 = Σ(每行数量)
- 总价 = Σ(每行总价)

---

## 安装的依赖

### npm 包

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",          // ← 新安装（Excel导出）
    "jspdf": "^2.5.1",          // ✅ 已存在（PDF生成）
    "jspdf-autotable": "^3.8.0" // ✅ 已存在（PDF表格）
  }
}
```

**安装命令:**
```bash
npm install xlsx --save
```

---

## 使用流程

### 导出Excel流程

```
1. 用户编辑/生成BOM数据
   ↓
2. 点击"导出BOM"按钮
   ↓
3. 在下拉菜单中选择"导出为Excel"
   ↓
4. 系统处理数据
   - 格式化为Excel格式
   - 添加统计行
   - 设置列宽
   ↓
5. 自动下载Excel文件
   ↓
6. 显示成功提示消息
```

### 导出PDF流程

```
1. 用户编辑/生成BOM数据
   ↓
2. 点击"导出BOM"按钮
   ↓
3. 在下拉菜单中选择"导出为PDF"
   ↓
4. 系统生成PDF
   - 添加标题和项目信息
   - 创建专业表格
   - 添加统计行
   - 添加页码
   ↓
5. 自动下载PDF文件
   ↓
6. 显示成功提示消息
```

---

## 代码实现

### 核心函数

#### 1. Excel导出函数

```javascript
const handleExportBOMToExcel = () => {
  // 验证数据
  if (!bomData || bomData.length === 0) {
    message.warning('BOM清单为空，无法导出')
    return
  }
  
  try {
    console.log('📊 导出BOM为Excel...')
    
    // 准备Excel数据
    const excelData = bomData.map((item, index) => ({
      '序号': index + 1,
      '执行器型号': item.actuator_model || '',
      '数量': item.total_quantity || 0,
      '单价 (¥)': item.unit_price || 0,
      '总价 (¥)': item.total_price || 0,
      '覆盖位号': Array.isArray(item.covered_tags) 
        ? item.covered_tags.join(', ') 
        : '',
      '备注': item.notes || ''
    }))
    
    // 添加统计行
    const totalQuantity = bomData.reduce(
      (sum, item) => sum + (item.total_quantity || 0), 0
    )
    const totalPrice = bomData.reduce(
      (sum, item) => sum + (item.total_price || 0), 0
    )
    
    excelData.push({
      '序号': '',
      '执行器型号': '合计',
      '数量': totalQuantity,
      '单价 (¥)': '',
      '总价 (¥)': totalPrice,
      '覆盖位号': '',
      '备注': ''
    })
    
    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(excelData)
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 6 },  // 序号
      { wch: 20 }, // 执行器型号
      { wch: 8 },  // 数量
      { wch: 12 }, // 单价
      { wch: 12 }, // 总价
      { wch: 30 }, // 覆盖位号
      { wch: 20 }  // 备注
    ]
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'BOM清单')
    
    // 生成文件名
    const projectNumber = project?.projectNumber || 'PROJECT'
    const timestamp = dayjs().format('YYYYMMDD_HHmmss')
    const filename = `BOM清单_${projectNumber}_${timestamp}.xlsx`
    
    // 下载文件
    XLSX.writeFile(wb, filename)
    
    message.success(`Excel文件已导出: ${filename}`)
    console.log('✅ Excel导出成功')
  } catch (error) {
    console.error('导出Excel失败:', error)
    message.error('导出Excel失败: ' + error.message)
  }
}
```

#### 2. PDF导出函数

```javascript
const handleExportBOMToPDF = () => {
  // 验证数据
  if (!bomData || bomData.length === 0) {
    message.warning('BOM清单为空，无法导出')
    return
  }
  
  try {
    console.log('📄 导出BOM为PDF...')
    
    // 创建PDF文档
    const doc = new jsPDF()
    
    // 添加标题
    doc.setFontSize(18)
    doc.text('BOM清单 / Bill of Materials', 14, 20)
    
    // 添加项目信息
    doc.setFontSize(10)
    const projectInfo = [
      `项目编号: ${project?.projectNumber || '-'}`,
      `项目名称: ${project?.projectName || '-'}`,
      `客户: ${project?.client?.name || '-'}`,
      `生成时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
    ]
    
    let yPos = 30
    projectInfo.forEach(info => {
      doc.text(info, 14, yPos)
      yPos += 6
    })
    
    // 准备表格数据
    const tableData = bomData.map((item, index) => [
      index + 1,
      item.actuator_model || '',
      item.total_quantity || 0,
      `¥${(item.unit_price || 0).toLocaleString()}`,
      `¥${(item.total_price || 0).toLocaleString()}`,
      Array.isArray(item.covered_tags) 
        ? item.covered_tags.join(', ') 
        : '',
      item.notes || ''
    ])
    
    // 添加统计行
    const totalQuantity = bomData.reduce(
      (sum, item) => sum + (item.total_quantity || 0), 0
    )
    const totalPrice = bomData.reduce(
      (sum, item) => sum + (item.total_price || 0), 0
    )
    
    tableData.push([
      '',
      '合计 / Total',
      totalQuantity,
      '',
      `¥${totalPrice.toLocaleString()}`,
      '',
      ''
    ])
    
    // 添加表格
    doc.autoTable({
      startY: yPos + 5,
      head: [['No.', 'Model', 'Qty', 'Unit Price', 'Total Price', 'Tags', 'Notes']],
      body: tableData,
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15 },  // No.
        1: { cellWidth: 35 },  // Model
        2: { cellWidth: 20 },  // Qty
        3: { cellWidth: 25 },  // Unit Price
        4: { cellWidth: 25 },  // Total Price
        5: { cellWidth: 40 },  // Tags
        6: { cellWidth: 30 }   // Notes
      },
      // 最后一行（合计行）使用特殊样式
      didParseCell: function(data) {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [240, 240, 240]
        }
      }
    })
    
    // 添加页脚
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 30,
        doc.internal.pageSize.getHeight() - 10
      )
    }
    
    // 生成文件名
    const projectNumber = project?.projectNumber || 'PROJECT'
    const timestamp = dayjs().format('YYYYMMDD_HHmmss')
    const filename = `BOM清单_${projectNumber}_${timestamp}.pdf`
    
    // 保存文件
    doc.save(filename)
    
    message.success(`PDF文件已导出: ${filename}`)
    console.log('✅ PDF导出成功')
  } catch (error) {
    console.error('导出PDF失败:', error)
    message.error('导出PDF失败: ' + error.message)
  }
}
```

---

## 文件格式对比

### Excel vs PDF

| 特性 | Excel | PDF |
|------|-------|-----|
| **文件扩展名** | .xlsx | .pdf |
| **可编辑性** | ✅ 可编辑 | ❌ 只读 |
| **数据处理** | ✅ 支持公式、筛选、排序 | ❌ 不支持 |
| **打印友好** | ⚠️ 需要调整 | ✅ 直接打印 |
| **分享便利** | ⚠️ 需要软件打开 | ✅ 任何设备可查看 |
| **文件大小** | 较小 | 较大 |
| **适用场景** | 数据分析、二次编辑 | 正式文档、存档 |

### 推荐使用场景

**导出Excel:**
- 需要进一步编辑BOM数据
- 需要进行数据分析
- 需要与其他系统集成
- 内部使用和协作

**导出PDF:**
- 提交给客户或上级
- 正式存档
- 打印纸质文档
- 确保格式不变

---

## 测试场景

### 功能测试

#### 测试1: Excel导出
```
前置条件: BOM表格中有5条数据
步骤:
1. 点击"导出BOM"按钮
2. 选择"导出为Excel"
3. 等待下载完成

预期结果:
✅ 文件自动下载
✅ 文件名格式正确
✅ Excel包含7列数据
✅ 数据行数 = BOM行数 + 1（统计行）
✅ 统计行数据正确
✅ 列宽自动调整
✅ 显示成功提示
```

#### 测试2: PDF导出
```
前置条件: BOM表格中有5条数据
步骤:
1. 点击"导出BOM"按钮
2. 选择"导出为PDF"
3. 等待下载完成
4. 打开PDF文件

预期结果:
✅ 文件自动下载
✅ 文件名格式正确
✅ PDF包含项目信息
✅ 表格样式专业
✅ 数据完整准确
✅ 统计行样式正确
✅ 页码显示正确
✅ 显示成功提示
```

#### 测试3: 空BOM导出
```
前置条件: BOM表格为空
步骤:
1. 点击"导出BOM"按钮

预期结果:
✅ 按钮显示为禁用状态
✅ 无法点击
```

#### 测试4: 大数据导出
```
前置条件: BOM表格中有100条数据
步骤:
1. 点击"导出BOM"
2. 选择"导出为Excel"
3. 选择"导出为PDF"

预期结果:
✅ Excel正常导出所有数据
✅ PDF自动分页
✅ 统计数据正确
✅ 性能良好（< 3秒）
```

---

## 用户反馈

### 成功提示
- ✅ "Excel文件已导出: BOM清单_P2024001_20251027_143022.xlsx"
- ✅ "PDF文件已导出: BOM清单_P2024001_20251027_143022.pdf"

### 警告提示
- ⚠️ "BOM清单为空，无法导出"

### 错误提示
- ❌ "导出Excel失败: [错误信息]"
- ❌ "导出PDF失败: [错误信息]"

---

## 优化建议

### 已实现的优化

1. **数据验证** - 导出前检查数据是否为空
2. **错误处理** - 完整的try-catch错误捕获
3. **用户反馈** - 成功/失败消息提示
4. **文件命名** - 包含项目信息和时间戳
5. **格式化** - 金额千分位显示，数组转字符串

### 可选的进一步优化

1. **自定义导出范围**
   ```javascript
   // 支持选择导出部分数据
   const [selectedRows, setSelectedRows] = useState([])
   ```

2. **导出模板自定义**
   ```javascript
   // 允许用户自定义导出列
   const [exportColumns, setExportColumns] = useState([...])
   ```

3. **批量导出**
   ```javascript
   // 同时导出Excel和PDF
   const handleExportBoth = () => {
     handleExportBOMToExcel()
     handleExportBOMToPDF()
   }
   ```

4. **云端保存**
   ```javascript
   // 上传到云存储
   const handleUploadToCloud = async (file) => {
     await uploadAPI.upload(file)
   }
   ```

5. **邮件发送**
   ```javascript
   // 直接发送到邮箱
   const handleEmailBOM = async (email, format) => {
     await emailAPI.send({ email, format, data: bomData })
   }
   ```

---

## 总结

### ✅ 已完成

1. **Excel导出** - 完整功能，包含统计行
2. **PDF导出** - 专业样式，包含项目信息
3. **下拉菜单** - 优雅的UI设计
4. **数据验证** - 完善的错误处理
5. **用户反馈** - 清晰的提示消息
6. **文件命名** - 智能命名规则

### 📊 代码统计

- **新增函数:** 2个（Excel导出、PDF导出）
- **新增UI组件:** 1个（下拉菜单按钮）
- **新增依赖:** 1个（xlsx）
- **代码行数:** ~200行

### 🎯 核心价值

1. **灵活导出** - 支持两种格式，满足不同需求
2. **数据准确** - 使用当前BOM表格数据
3. **格式专业** - Excel和PDF都有专业样式
4. **操作简便** - 一键导出，自动下载
5. **命名智能** - 文件名包含项目信息

---

**完成时间:** 2025-10-27  
**版本:** v1.0  
**状态:** ✅ 完成并通过测试

