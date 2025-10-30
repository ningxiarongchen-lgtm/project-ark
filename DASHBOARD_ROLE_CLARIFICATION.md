# Dashboard 角色说明与澄清

**创建时间**: 2025-10-30  
**版本**: v1.0

---

## 🎯 重要澄清

### 售后工程师 = 技术工程师

经过业务需求确认，系统中**没有独立的"售后工程师"角色**。

**正确的角色划分**：

```
技术工程师 (Technical Engineer) = 技术选型 + 售后工单处理
```

---

## 📋 实际角色与Dashboard对应关系

| 序号 | 角色中文名 | 角色英文名 | Dashboard组件 | 核心功能 |
|-----|-----------|-----------|--------------|---------|
| 1 | 管理员 | Administrator | AdminDashboard | 系统管理、用户管理、数据管理 |
| 2 | 销售经理 | Sales Manager | SalesManagerDashboard | 创建项目、跟踪进度、提交售后工单 |
| 3 | 技术工程师 | Technical Engineer | TechnicalEngineerDashboard | **技术选型 + 售后工单处理** |
| 4 | 商务工程师 | Sales Engineer | SalesEngineerDashboard | 报价、BOM生成、价格审核 |
| 5 | 采购专员 | Procurement Specialist | ProcurementSpecialistDashboard | 采购订单、供应商管理 |
| 6 | 生产计划员 | Production Planner | ProductionPlannerDashboard | 生产排期、资源分配 |

**总计**: 6个实际角色，6个Dashboard

---

## 🔄 售后工单业务流程

### 1. 销售经理创建售后工单

```javascript
// 销售经理在售后服务页面创建工单
POST /api/tickets
{
  "title": "执行器故障",
  "description": "客户反馈执行器无法正常工作",
  "priority": "紧急",
  "service_type": "维修",
  // 可以指定技术工程师，或由系统分配
  "assigned_engineer": "技术工程师ID"
}
```

### 2. 技术工程师接收并处理工单

技术工程师在Dashboard中看到：
- 📊 **待受理工单** - 需要接单
- 🔧 **处理中工单** - 正在处理
- ✅ **已解决工单** - 今日完成

```javascript
// 技术工程师Dashboard展示
stats: {
  pendingTickets: 3,      // 待我处理的售后工单
  completedTickets: 5     // 我已完成的售后工单
}
```

### 3. 销售经理查看工单状态

销售经理可以在售后服务页面查看工单状态：
- ⏳ **待技术受理** - 工单已创建，等待技术接单
- 🔧 **技术处理中** - 技术工程师正在处理
- ✅ **问题已解决-待确认** - 技术认为已解决，等待确认
- 🎉 **已关闭** - 工单完成并关闭

---

## 🎨 技术工程师Dashboard功能

`TechnicalEngineerDashboard.jsx` 包含两大功能模块：

### 功能模块1: 技术选型

```javascript
stats: {
  pendingProjects: 5,     // 待我选型的项目
  completedProjects: 12   // 我已完成选型的项目
}
```

**快捷操作**：
- 查看待选型项目
- 开始技术选型
- 提交选型结果

### 功能模块2: 售后工单处理

```javascript
stats: {
  pendingTickets: 3,      // 待我处理的售后工单
  completedTickets: 5     // 我已完成的售后工单
}
```

**快捷操作**：
- 接单（将待受理工单改为处理中）
- 记录处理过程
- 提交解决方案
- 关闭工单

---

## 📊 数据库角色定义

虽然数据库中存在 `After-sales Engineer` 角色定义，但实际业务中：

**后端 User.js**：
```javascript
role: {
  type: String,
  enum: [
    'Administrator',
    'Sales Manager',
    'Technical Engineer',    // ✅ 实际使用
    'Sales Engineer',
    'Procurement Specialist',
    'Production Planner',
    'QA Inspector',
    'Logistics Specialist',
    'After-sales Engineer',  // ⚠️ 保留但不实际使用（与Technical Engineer功能合并）
    'Shop Floor Worker'
  ]
}
```

**建议**：
- 保持数据库定义不变（避免破坏现有数据）
- 前端不创建独立的售后工程师Dashboard
- 技术工程师Dashboard承担两个职责

---

## 🔧 相关API

### 售后工单API

```javascript
// frontend/src/services/api.js
export const ticketsAPI = {
  create: (data) => api.post('/tickets', data),
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  updateStatus: (id, data) => api.patch(`/tickets/${id}/status`, data),
  assignEngineer: (id, data) => api.post(`/tickets/${id}/assign`, data),
  addFollowUp: (id, data) => api.post(`/tickets/${id}/follow-up`, data),
}
```

### 工单状态

```javascript
status: {
  '待技术受理',              // Pending Acceptance
  '技术处理中',              // In Progress
  '方案待审批',              // Pending Solution Approval
  '等待客户反馈',            // Pending Customer Feedback
  '问题已解决-待确认',        // Resolved-Pending Confirmation
  '已关闭'                   // Closed
}
```

---

## 📝 已删除的文件

- ❌ `AfterSalesEngineerDashboard.jsx` - 已删除（功能已整合到TechnicalEngineerDashboard）

---

## ✅ 总结

1. **技术工程师** = 技术选型 + 售后工单处理
2. **销售经理** 可以创建售后工单并查看状态
3. **技术工程师Dashboard** 包含技术选型和售后工单两个Tab
4. **不存在**独立的售后工程师Dashboard
5. 数据库保留 `After-sales Engineer` 角色定义，但实际不使用

---

**文档版本**: v1.0  
**最后更新**: 2025-10-30  
**维护者**: AI Assistant



