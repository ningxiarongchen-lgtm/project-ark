# 技术选型功能优化方案

**日期**: 2025-10-30  
**目标**: 优化技术工程师的选型体验

---

## 📋 需求分析

### 用户反馈
1. ✅ **技术工程师查看项目** - 可以查看项目参数进行选型
2. ❌ **技术不能新建项目** - 新建项目只有销售可以做
3. ❌ **去掉版本历史** - 不需要版本历史功能
4. ✅ **选型功能入口** - 点进项目后，可以通过按钮开始选型
5. ✅ **选型便利性** - 支持边看技术文件或销售提供的参数边选型

---

## 🎯 优化方案

### 1. 项目详情页面调整

#### 为技术工程师添加专属Tab

```
项目详情页面结构：
├── 项目信息 Card (Project Information)
│   ├── 基本信息
│   ├── 客户信息
│   └── 📝 客户技术需求（突出显示）
│
└── Tabs区域
    ├── 📋 技术清单 (Technical Item List) ⭐ 新增/优化
    │   ├── 左侧：客户技术需求参考卡片（固定显示）
    │   ├── 右侧：技术选型表格
    │   ├── 按钮：添加技术项、开始选型、导出技术清单
    │   └── 功能：内联编辑、删除、保存
    │
    ├── 🔍 选型详情 (Selections) - 仅部分角色可见
    ├── 📦 BOM清单 (BOM List) - 技术工程师不可见
    └── 💰 报价工作台 - 技术工程师不可见
```

### 2. 技术清单Tab设计

```jsx
<Tabs.TabPane tab="📋 技术清单" key="technical-list">
  <Row gutter={16}>
    {/* 左侧：技术需求参考卡片 */}
    <Col span={8}>
      <Card title="客户技术需求" style={{ position: 'sticky', top: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 显示销售提供的技术需求 */}
          {project.technical_requirements}
          
          {/* 显示上传的技术文件 */}
          {project.project_files.map(file => (
            <Button icon={<FileTextOutlined />} 
                    onClick={() => window.open(file.url)}>
              {file.name}
            </Button>
          ))}
        </Space>
      </Card>
    </Col>
    
    {/* 右侧：选型表格 */}
    <Col span={16}>
      <TechnicalItemList 
        project={project} 
        onUpdate={fetchProject}
        showQuickActions={true}
      />
    </Col>
  </Row>
</Tabs.TabPane>
```

### 3. 按钮位置和功能

#### 主要操作按钮
```
页面顶部按钮区域：
- 返回按钮
- [技术工程师专属] 
  - "📋 开始选型" - 跳转到技术清单Tab
  - "💾 保存技术清单" - 保存当前选型
  - "📤 导出技术清单(PDF)" - 导出技术清单
```

#### Tab内按钮
```
技术清单Tab内：
- "➕ 添加技术项" - 添加新的选型项
- "🤖 智能选型助手" - AI辅助选型
- "💾 保存" - 保存当前编辑
- "📊 导出Excel" - 导出为Excel
```

---

## 🛠️ 实现细节

### 1. 权限控制

```javascript
// 技术工程师权限
const isTechnicalEngineer = user?.role === 'Technical Engineer'

// 只有技术工程师和管理员可以编辑技术清单
const canEditTechnicalList = ['Technical Engineer', 'Administrator'].includes(user?.role)

// 新建项目权限（排除技术工程师）
const canCreateProject = ['Sales Manager', 'Sales Engineer', 'Administrator'].includes(user?.role)
```

### 2. 去掉版本历史功能

```javascript
// 移除以下按钮和Modal
❌ "历史版本与对比" 按钮
❌ versionModalVisible 相关代码
❌ handleOpenVersionComparison 函数
```

### 3. 技术清单组件增强

```javascript
// TechnicalItemList 组件新增props
<TechnicalItemList
  project={project}
  onUpdate={fetchProject}
  showReferencePanel={true}  // 显示参考面板
  technicalRequirements={project.technical_requirements}  // 技术需求
  projectFiles={project.project_files}  // 项目文件
/>
```

---

## 📐 界面布局

### 桌面端布局（推荐）

```
┌──────────────────────────────────────────────────────────────┐
│  🏠 返回  │  项目: PRJ-2025-0004  │  选型中                 │
│  [📋 开始选型]  [💾 保存]  [📤 导出PDF]                      │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  Project Information                                         │
│  ├── 项目编号: PRJ-2025-0004                                 │
│  ├── 客户: 广州化工厂                                        │
│  └── 📝 客户技术需求: 扭距2000，单作用，故障关...           │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  [ 📋 技术清单 ] [ 📁 项目文件 ]                             │
│  ┌─────────────────┬────────────────────────────────────────┐ │
│  │ 客户技术需求    │  技术选型表格                          │ │
│  │                 │  ┌──────────────────────────────────┐ │ │
│  │ 📝 扭距: 2000   │  │ Tag | 型号 | 数量 | 操作         │ │ │
│  │ 📝 单作用       │  ├──────────────────────────────────┤ │ │
│  │ 📝 故障关       │  │ XV-501 | [输入] | 1 | [编辑][删]│ │ │
│  │                 │  └──────────────────────────────────┘ │ │
│  │ 📄 技术文件     │  [➕ 添加技术项] [🤖 智能助手]        │ │
│  │ - 图纸.pdf      │                                        │ │
│  │ - 参数表.xlsx   │                                        │ │
│  └─────────────────┴────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 移动端布局

```
┌────────────────────────────────┐
│ 🏠 返回  │  PRJ-2025-0004      │
├────────────────────────────────┤
│  [ 📋 技术清单 ]  [ 💾 保存 ]   │
├────────────────────────────────┤
│  📝 客户技术需求（可展开/收起） │
│  - 扭距: 2000                  │
│  - 单作用                      │
│  - 故障关                      │
├────────────────────────────────┤
│  技术选型表格（全宽）           │
│  Tag    | 型号   | 数量        │
│  XV-501 | [输入] | 1           │
│  [编辑] [删除]                 │
├────────────────────────────────┤
│  [➕ 添加技术项]               │
└────────────────────────────────┘
```

---

## 🚀 实施步骤

### Phase 1: 移除不需要的功能（已完成）
- [ ] 移除版本历史按钮
- [ ] 移除版本对比Modal
- [ ] 清理相关state和函数

### Phase 2: 添加技术清单Tab
- [ ] 创建技术清单Tab
- [ ] 左侧显示技术需求参考
- [ ] 右侧显示TechnicalItemList组件
- [ ] 响应式布局适配

### Phase 3: 优化按钮和交互
- [ ] 添加"开始选型"快捷按钮
- [ ] 添加"保存技术清单"按钮
- [ ] 添加"导出技术清单"功能
- [ ] 优化移动端体验

### Phase 4: 权限控制
- [ ] 技术工程师不能新建项目
- [ ] 技术工程师只能编辑技术清单
- [ ] 技术工程师不能查看报价相关

---

## 📱 用户操作流程

### 技术工程师选型流程

```
1. Dashboard → 看到"待我选型的项目: 5个"
   ↓
2. 点击项目列表中的某个项目
   ↓
3. 进入项目详情页
   - 自动跳转到"技术清单"Tab
   - 或点击顶部"📋 开始选型"按钮
   ↓
4. 查看左侧的客户技术需求
   - 阅读技术参数
   - 下载/查看技术文件
   ↓
5. 在右侧进行选型
   - 添加技术项
   - 填写位号、型号、数量等
   - 填写技术参数
   ↓
6. 保存技术清单
   - 点击"💾 保存"按钮
   - 系统提示保存成功
   ↓
7. 导出技术清单（可选）
   - 点击"📤 导出PDF"
   - 生成技术清单PDF文件
```

---

## 🎨 UI/UX改进

### 1. 视觉提示
- 技术需求区域使用淡蓝色背景
- 技术清单Tab使用图标+文字标签
- 添加hover效果和loading状态

### 2. 交互优化
- 技术需求卡片固定在左侧（sticky）
- 表格支持内联编辑
- 自动保存草稿功能

### 3. 快捷操作
- Ctrl+S 保存技术清单
- Ctrl+N 添加新技术项
- ESC 取消编辑

---

## 🔧 技术实现

### 关键代码片段

```jsx
// ProjectDetails.jsx 中添加技术清单Tab
const technicalListTab = canEditTechnicalList ? {
  key: 'technical-list',
  label: (
    <span>
      <FileSearchOutlined />
      技术清单
      {project.technical_item_list?.length > 0 && 
        <Tag color="blue">{project.technical_item_list.length}</Tag>
      }
    </span>
  ),
  children: (
    <Row gutter={16}>
      {/* 左侧参考面板 */}
      <Col xs={24} md={8}>
        <Card 
          title="客户技术需求"
          style={{ position: 'sticky', top: 16 }}
        >
          {project.technical_requirements && (
            <div style={{ 
              background: '#f0f5ff',
              padding: 16,
              borderRadius: 4,
              whiteSpace: 'pre-wrap'
            }}>
              {project.technical_requirements}
            </div>
          )}
          
          {project.project_files && project.project_files.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Divider>项目文件</Divider>
              <Space direction="vertical" style={{ width: '100%' }}>
                {project.project_files.map((file, idx) => (
                  <Button 
                    key={idx}
                    icon={<FileTextOutlined />}
                    onClick={() => window.open(file.file_url, '_blank')}
                    block
                  >
                    {file.file_name}
                  </Button>
                ))}
              </Space>
            </div>
          )}
        </Card>
      </Col>
      
      {/* 右侧选型表格 */}
      <Col xs={24} md={16}>
        <TechnicalItemList
          project={project}
          onUpdate={fetchProject}
        />
      </Col>
    </Row>
  )
} : null
```

---

## ✅ 完成标准

- [ ] 技术工程师可以方便地看到技术需求
- [ ] 技术工程师可以方便地进行选型
- [ ] 支持边看文档边选型（分屏/并排显示）
- [ ] 移除版本历史功能
- [ ] 技术工程师无法新建项目
- [ ] 界面简洁直观，操作流畅

---

**预计完成时间**: 2小时  
**优先级**: P0（高）  
**影响范围**: ProjectDetails.jsx, TechnicalItemList.jsx

