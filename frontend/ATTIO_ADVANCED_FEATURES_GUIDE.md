# Attio 高级布局和交互功能指南

> **完整实现 Attio 风格的高级功能**  
> 可调整面板 | 命令面板 | 上下文菜单 | 流畅动画

---

## 📦 已安装的库

```bash
npm install react-resizable-panels cmdk
```

- **react-resizable-panels**: 可调整大小的面板系统
- **cmdk**: 命令面板组件（用于 ⌘K 搜索）

---

## 🎯 实现的功能

### ✅ 1. 可调整面板 (Resizable Panels)
### ✅ 2. 命令面板 (Command Palette)
### ✅ 3. 上下文菜单 (Context Menu)
### ✅ 4. 流畅动画系统

---

## 1. 可调整面板系统

### 📁 文件位置
- **组件**: `components/Attio/AttioResizablePanels.jsx`
- **样式**: `components/Attio/AttioResizablePanels.css`

### 🎨 设计特点

- **1px 细分隔线** (#F1F1F0)
- **Hover 变紫色** (#6E62E4)
- **平滑拖拽体验**
- **三栏可调整布局**

### 💻 使用示例

#### 基础三栏布局

```jsx
import {
  AttioPanelGroup,
  AttioPanel,
  AttioResizeHandle,
} from '@/components'

function ThreeColumnLayout() {
  return (
    <AttioPanelGroup direction="horizontal">
      {/* 左侧面板 - 项目列表 */}
      <AttioPanel defaultSize={20} minSize={15} maxSize={30}>
        <div className="attio-panel-content attio-panel-left">
          <h3>项目导航</h3>
          {/* 导航内容 */}
        </div>
      </AttioPanel>

      <AttioResizeHandle />

      {/* 中间面板 - 主内容区 */}
      <AttioPanel defaultSize={50} minSize={40}>
        <div className="attio-panel-content attio-panel-middle">
          <h3>BOM 清单</h3>
          {/* 主要内容 */}
        </div>
      </AttioPanel>

      <AttioResizeHandle />

      {/* 右侧面板 - 详情/协同 */}
      <AttioPanel defaultSize={30} minSize={25} maxSize={40}>
        <div className="attio-panel-content attio-panel-right">
          <h3>任务列表</h3>
          {/* 详情内容 */}
        </div>
      </AttioPanel>
    </AttioPanelGroup>
  )
}
```

#### 垂直分割布局

```jsx
<AttioPanelGroup direction="vertical">
  <AttioPanel defaultSize={40}>
    {/* 顶部内容 */}
  </AttioPanel>

  <AttioResizeHandle />

  <AttioPanel defaultSize={60}>
    {/* 底部内容 */}
  </AttioPanel>
</AttioPanelGroup>
```

### 🎯 完整示例

查看 `pages/ProjectDetailsAttio.jsx` 获取完整的三栏布局实现示例。

---

## 2. 命令面板 (Command Palette)

### 📁 文件位置
- **组件**: `components/Attio/AttioCommandPalette.jsx`
- **样式**: `components/Attio/AttioCommandPalette.css`

### ⌨️ 快捷键

- **打开**: `⌘K` (Mac) 或 `Ctrl+K` (Windows)
- **关闭**: `ESC` 或点击外部

### 🎨 设计特点

- **中央覆盖层**
- **模糊搜索**
- **键盘导航**
- **分组显示**
- **快捷键提示**

### 💻 使用方法

#### 集成到布局 (已在 AttioLayout 中实现)

```jsx
import { useState } from 'react'
import AttioCommandPalette from './components/Attio/AttioCommandPalette'

function App() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  return (
    <>
      <AttioCommandPalette 
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
      
      {/* 其他内容 */}
    </>
  )
}
```

#### 自定义命令组

修改 `AttioCommandPalette.jsx` 中的命令组：

```jsx
<Command.Group heading="自定义操作" className="attio-command-group">
  <Command.Item
    onSelect={() => handleSelect(() => customAction())}
    className="attio-command-item"
  >
    <YourIcon />
    <span>执行自定义操作</span>
    <kbd className="attio-command-shortcut">⌘⇧A</kbd>
  </Command.Item>
</Command.Group>
```

### 🚀 功能特性

- ✅ 快速导航到任何页面
- ✅ 搜索项目、订单
- ✅ 执行快捷操作
- ✅ 键盘完全控制
- ✅ 动态结果过滤

---

## 3. 上下文菜单 (Context Menu)

### 📁 文件位置
- **组件**: `components/Attio/AttioContextMenu.jsx`
- **样式**: `components/Attio/AttioContextMenu.css`

### 🎨 设计特点

- **白色背景**
- **无阴影，细边框**
- **替换浏览器默认菜单**
- **平滑动画 (150ms)**

### 💻 使用示例

#### 基础用法

```jsx
import { 
  AttioContextMenu, 
  commonContextMenuItems 
} from '@/components'

function MyTable() {
  const contextMenuItems = [
    commonContextMenuItems.view(() => console.log('查看')),
    commonContextMenuItems.edit(() => console.log('编辑')),
    commonContextMenuItems.divider(),
    commonContextMenuItems.delete(() => console.log('删除')),
  ]

  return (
    <AttioContextMenu items={contextMenuItems}>
      <div>右键点击这里</div>
    </AttioContextMenu>
  )
}
```

#### 表格行右键菜单

```jsx
import { AttioTable, AttioContextMenu } from '@/components'

function ProjectTable() {
  const columns = [/* 列定义 */]
  const dataSource = [/* 数据 */]

  const getContextMenu = (record) => [
    {
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: () => viewDetails(record),
    },
    {
      label: '编辑',
      icon: <EditOutlined />,
      shortcut: '⌘E',
      onClick: () => edit(record),
    },
    { divider: true },
    {
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => deleteItem(record),
    },
  ]

  return (
    <AttioTable
      columns={columns}
      dataSource={dataSource}
      components={{
        body: {
          row: (props) => {
            const record = dataSource.find(d => d.key === props['data-row-key'])
            return record ? (
              <AttioContextMenu items={getContextMenu(record)}>
                <tr {...props} />
              </AttioContextMenu>
            ) : <tr {...props} />
          },
        },
      }}
    />
  )
}
```

#### 预定义菜单项

```jsx
import { commonContextMenuItems } from '@/components'

// 可用的预定义菜单项：
const items = [
  commonContextMenuItems.view(onClick),       // 查看详情
  commonContextMenuItems.edit(onClick),       // 编辑
  commonContextMenuItems.copy(onClick),       // 复制
  commonContextMenuItems.delete(onClick),     // 删除
  commonContextMenuItems.divider(),           // 分隔线
]
```

#### 自定义菜单项

```jsx
const customItems = [
  {
    label: '导出 PDF',
    icon: <FilePdfOutlined />,
    shortcut: '⌘P',
    onClick: () => exportPDF(),
  },
  {
    label: '发送邮件',
    icon: <MailOutlined />,
    onClick: () => sendEmail(),
  },
  {
    label: '禁用的选项',
    icon: <LockOutlined />,
    disabled: true,
    onClick: () => {},
  },
  { divider: true },
  {
    label: '危险操作',
    icon: <DeleteOutlined />,
    danger: true,
    onClick: () => dangerousAction(),
  },
]
```

---

## 4. 流畅动画系统

### 📁 文件位置
- **动画样式**: `styles/animations.css`

### 🎨 动画类型

#### Fade 动画

```jsx
<div className="attio-fade-in">
  淡入内容
</div>

<div className="attio-fade-out">
  淡出内容
</div>
```

#### Slide 动画

```jsx
<div className="attio-slide-up">向上滑入</div>
<div className="attio-slide-down">向下滑入</div>
<div className="attio-slide-left">向左滑入</div>
<div className="attio-slide-right">向右滑入</div>
```

#### Scale 动画

```jsx
<div className="attio-scale-in">缩放进入</div>
<div className="attio-scale-out">缩放退出</div>
```

#### 加载动画

```jsx
<div className="attio-pulse">脉冲效果</div>
<div className="attio-spin">旋转效果</div>
```

#### Hover 效果

```jsx
<div className="attio-hover-lift">悬浮抬起</div>
<div className="attio-hover-scale">悬浮缩放</div>
```

### ⚙️ 动画变量

```css
:root {
  --attio-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --attio-transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --attio-transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 🔧 工具类

```jsx
// 应用过渡到所有属性
<div className="attio-transition-all">...</div>

// 仅颜色过渡
<div className="attio-transition-colors">...</div>

// 仅透明度过渡
<div className="attio-transition-opacity">...</div>

// 仅变换过渡
<div className="attio-transition-transform">...</div>
```

---

## 📊 完整页面示例

### ProjectDetailsAttio.jsx - 三栏布局

```jsx
import {
  AttioPanelGroup,
  AttioPanel,
  AttioResizeHandle,
  AttioTable,
  AttioContextMenu,
} from '@/components'

export default function ProjectDetailsAttio() {
  return (
    <div style={{ height: '100vh' }}>
      <AttioPanelGroup direction="horizontal">
        {/* 左侧 - 导航 */}
        <AttioPanel defaultSize={20}>
          {/* 项目列表 */}
        </AttioPanel>

        <AttioResizeHandle />

        {/* 中间 - 主内容 */}
        <AttioPanel defaultSize={50}>
          <AttioTable 
            columns={columns}
            dataSource={data}
            components={{
              body: {
                row: (props) => (
                  <AttioContextMenu items={menuItems}>
                    <tr {...props} />
                  </AttioContextMenu>
                ),
              },
            }}
          />
        </AttioPanel>

        <AttioResizeHandle />

        {/* 右侧 - 详情 */}
        <AttioPanel defaultSize={30}>
          {/* 任务和文件 */}
        </AttioPanel>
      </AttioPanelGroup>
    </div>
  )
}
```

### DashboardPageAttio.jsx - 网格布局

```jsx
import { Row, Col, Statistic } from 'antd'
import { AttioCard, AttioTable } from '@/components'

export default function DashboardPageAttio() {
  return (
    <div className="attio-fade-in">
      {/* KPI 卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <AttioCard>
            <Statistic 
              title="总项目数" 
              value={45} 
              prefix={<ProjectOutlined />}
            />
          </AttioCard>
        </Col>
        {/* 更多 KPI 卡片 */}
      </Row>

      {/* 主表格 */}
      <AttioCard title="最近项目">
        <AttioTable 
          columns={columns}
          dataSource={projects}
        />
      </AttioCard>
    </div>
  )
}
```

---

## 🎯 最佳实践

### 1. 面板布局

- **左侧面板**: 15-30% 宽度，用于导航
- **中间面板**: 40-60% 宽度，主要内容
- **右侧面板**: 25-40% 宽度，详情/协同

### 2. 命令面板

- 提供常用导航和操作
- 使用清晰的图标和描述
- 显示键盘快捷键
- 保持搜索结果相关性

### 3. 上下文菜单

- 限制在 5-8 个选项
- 使用分隔线分组
- 危险操作用红色标识
- 提供快捷键提示

### 4. 动画使用

- 页面加载: `attio-fade-in`
- 列表项: `attio-slide-up`
- 模态框: `attio-scale-in`
- 悬浮效果: `attio-hover-lift`

---

## 🚀 快速启动

### 1. 查看示例页面

```bash
# 访问以下路由查看示例：
http://localhost:5173/attio-examples  # 基础组件示例
```

### 2. 使用命令面板

- 按 `⌘K` (Mac) 或 `Ctrl+K` (Windows)
- 输入搜索关键词
- 使用方向键导航
- 按 `Enter` 执行操作

### 3. 测试右键菜单

- 在任何表格行上右键点击
- 选择菜单项执行操作
- 按 `ESC` 关闭菜单

---

## 📝 组件 API

### AttioPanelGroup

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| direction | 'horizontal' \| 'vertical' | 'horizontal' | 面板排列方向 |
| children | ReactNode | - | 子面板 |

### AttioPanel

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| defaultSize | number | - | 默认大小 (百分比) |
| minSize | number | 15 | 最小大小 (百分比) |
| maxSize | number | 85 | 最大大小 (百分比) |

### AttioCommandPalette

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| open | boolean | false | 是否打开 |
| onOpenChange | (open: boolean) => void | - | 打开状态变化回调 |

### AttioContextMenu

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| items | MenuItem[] | [] | 菜单项列表 |
| children | ReactNode | - | 触发元素 |

---

## 🔧 故障排查

### 面板无法拖拽？

1. 确保安装了 `react-resizable-panels`
2. 检查 CSS 是否正确导入
3. 确保父容器有固定高度

### 命令面板快捷键不工作？

1. 检查是否有其他快捷键冲突
2. 确保 AttioLayout 已正确渲染
3. 查看浏览器控制台错误

### 右键菜单位置不对？

1. 检查父容器的 position 属性
2. 确保菜单不会超出视口
3. 调整 z-index 值

---

## 🎉 总结

所有 Attio 高级功能已完全实现：

✅ **可调整面板** - 三栏可拖拽布局  
✅ **命令面板** - ⌘K 快速搜索  
✅ **上下文菜单** - 优雅的右键菜单  
✅ **流畅动画** - 150ms 平滑过渡  

查看示例页面：
- `ProjectDetailsAttio.jsx` - 三栏布局
- `DashboardPageAttio.jsx` - 网格布局

---

*创建日期：2024*  
*Attio 高级功能实现*  
*技术栈：React + react-resizable-panels + cmdk*

