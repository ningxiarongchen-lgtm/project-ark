# Project Ark - 核心业务逻辑与API

本文档旨在阐明系统中最核心、最复杂的业务逻辑实现，并定义了关键的API接口。

## A. 核心业务逻辑实现

### 1. 智能选型引擎
- **位置**: `/backend/controllers/selectionController.js`
- **核心算法**:
  1.  接收工况参数，包括**故障安全位置 (`failSafePosition`)**。
  2.  计算所需扭矩 (`requiredTorque`)。
  3.  **根据 `failSafePosition` ('Fail Close' / 'Fail Open') 选择不同的扭矩比较逻辑**：
      - **Fail Close**: 比较弹簧终点扭矩(`SET`)和气源起点扭矩(`AST`)。
      - **Fail Open**: 比较弹簧起点扭矩(`SST`)和气源终点扭矩(`AET`)。
  4.  从数据库中筛选出符合扭矩和安全裕量的 `Actuator` 列表。

### 2. BOM (物料清单) 自动展开
- **位置**: `/backend/controllers/bomController.js`
- **核心规则**:
  1.  基于 `NewProject` 中的 `technicalRequirements` 列表。
  2.  自动关联 `selectedActuator` 及其标准配件 (`Accessory` 模型中 `isStandard: true`)。
  3.  合并手动选择的可选配件。

## B. 核心API接口

### 1. `POST /api/selection/select-actuator`
- **功能**: 执行智能选型。
- **权限**: `Technical Engineer`
- **关键请求体**: `{ valveType, pressure, failSafePosition, ... }`
- **关键响应体**: `{ recommendations: [{ actuator: { model, dimensions, pricing, ... }, ... }] }`

### 2. `POST /api/products/import`
- **功能**: 批量导入/更新产品数据。
- **权限**: `Administrator`
- **请求格式**: `multipart/form-data`，包含一个名为 `productFile` 的 Excel 文件。
- **响应格式**: `{ successCount, errorCount, errors }`

### 3. `POST /api/new-projects`
- **功能**: 创建一个新项目。
- **权限**: `Sales Manager`
- **核心逻辑**: 创建项目骨架，并将状态设置为 `Lead` 或 `In Progress`。

