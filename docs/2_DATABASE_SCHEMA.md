# Project Ark - 核心数据库模型

本文档定义了系统的核心数据结构和关系，是数据库设计的唯一真实来源。

## A. 核心模型详解

### 1. User - 用户模型
- **集合名**: `users`
- **关键字段**:
  - `phone`: (String, Unique) - **登录唯一标识**
  - `password`: (String) - Bcrypt 哈希加密
  - `role`: (String, Enum) - 角色，决定了整个系统的访问权限 (RBAC)

### 2. Actuator - 执行器模型 (产品核心)
- **集合名**: `actuators`
- **关键字段**:
  - `model`: (String, Unique) - **产品唯一标识**
  - `series`: (String) - 'AT', 'GY', 'SF'
  - `type`: (String) - 'Single Acting', 'Double Acting'
  - `material`: (String) - 缸体材质
  - `torqueData`: (Object) - **核心扭矩数据**，用于选型计算
  - `dimensions`: (Object) - **核心尺寸数据**，用于生成技术文档
  - `pricing`: (Object) - 结构化价格 (标准/低温/高温)
  - `handwheel`: (Object) - 可选手轮配置
  - `repairKit`: (Object) - 可选维修包

### 3. NewProject - 项目模型 (业务核心)
- **集合名**: `newprojects`
- **关键字段**:
  - `projectNumber`: (String, Unique) - 项目编号
  - `status`: (String, Enum) - **项目生命周期状态机**
  - `salesManager`, `technicalEngineer`: (ObjectId, Ref: 'User') - **关键关系: 关联到用户**
  - `technicalRequirements`: (Array of Objects) - **业务核心，技术需求列表**
    - `selectedActuator`: (ObjectId, Ref: 'Actuator') - **关键关系: 关联到执行器**
    - `failSafePosition`: (String, Enum) - **核心业务逻辑: 故障安全位置**

### 4. ProductionOrder - 生产订单模型
- **集合名**: `productionorders`
- **关键字段**:
  - `project`: (ObjectId, Ref: 'NewProject') - **关键关系: 关联到项目**
  - `bom`: (Array of Objects) - **BOM清单**，由项目需求展开而来

## B. 核心数据关系图 (简化)
- `User` -> `NewProject` (一个销售经理有多个项目)
- `NewProject` -> `Actuator` (项目的技术需求选定一个执行器)
- `NewProject` -> `ProductionOrder` (项目赢单后生成生产订单)

