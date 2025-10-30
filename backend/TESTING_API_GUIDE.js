/**
 * =====================================================
 *  测试 API 完整使用指南
 * =====================================================
 * 
 * 本文档提供了测试环境专用 API 的完整使用说明
 * 这些 API 仅在 NODE_ENV=test 时可用
 */

// =====================================================
// 1. 核心接口：POST /api/testing/reset-and-seed
// =====================================================

/**
 * 功能：重置数据库并填充测试数据
 * 
 * 这是E2E测试的核心接口，提供：
 * - 按依赖关系顺序清空所有数据表
 * - 填充完整的测试数据（用户、供应商、产品）
 * - 确保每次测试从相同的干净状态开始
 */

// 基础用法（使用默认测试数据）
const basicUsage = {
  method: 'POST',
  url: '/api/testing/reset-and-seed',
  body: {
    clearAll: true
  }
};

// 响应示例
const basicResponse = {
  success: true,
  message: "System reset and seeded successfully.",
  details: {
    totalCleared: 150,
    totalSeeded: 19,
    cleared: {
      users: 5,
      projects: 10,
      salesOrders: 8,
      // ... 其他集合
    },
    seeded: {
      users: 10,
      suppliers: 3,
      actuators: 6,
      accessories: 0
    }
  },
  testData: {
    users: [
      {
        id: "507f1f77bcf86cd799439011",
        fullName: "Admin User",
        phone: "18800000001",
        role: "Administrator",
        department: "管理部"
      }
      // ... 其他9个用户
    ],
    suppliers: [
      {
        id: "507f1f77bcf86cd799439012",
        name: "苏阀自控",
        code: "SF",
        status: "Active"
      }
      // ... 其他供应商
    ],
    actuators: [
      {
        id: "507f1f77bcf86cd799439013",
        model: "SF10-DA",
        series: "SF",
        actionType: "DA"
      }
      // ... 其他产品
    ]
  },
  timestamp: "2025-10-29T10:00:00.000Z"
};

// 高级用法（自定义测试数据）
const advancedUsage = {
  method: 'POST',
  url: '/api/testing/reset-and-seed',
  body: {
    clearAll: true,
    seedData: {
      users: [
        {
          full_name: '自定义测试用户',
          phone: '19900000001',
          password: 'CustomPass123!',
          role: 'Administrator',
          department: '测试部',
          isActive: true,
          passwordChangeRequired: false
        }
      ],
      suppliers: [
        {
          name: '自定义供应商',
          code: 'CUSTOM',
          contact_person: '张三',
          phone: '010-88888888',
          email: 'custom@example.com',
          status: 'Active',
          rating: 5
        }
      ],
      actuators: [
        {
          model_base: 'CUSTOM-100',
          series: 'CUSTOM',
          supplier_code: 'CUSTOM',  // 会自动关联到上面创建的供应商
          action_type: 'DA',
          torque_6bar: 100,
          price_base: 1000
        }
      ]
    }
  }
};

// =====================================================
// 2. 默认测试数据说明
// =====================================================

/**
 * 默认创建的测试用户（10个角色，每个角色1个用户）
 */
const defaultTestUsers = [
  { role: 'Administrator',           phone: '18800000001', password: 'Test123456!' },
  { role: 'Sales Manager',           phone: '18800000002', password: 'Test123456!' },
  { role: 'Sales Engineer',          phone: '18800000003', password: 'Test123456!' },
  { role: 'Technical Engineer',      phone: '18800000004', password: 'Test123456!' },
  { role: 'Procurement Specialist',  phone: '18800000005', password: 'Test123456!' },
  { role: 'Production Planner',      phone: '18800000006', password: 'Test123456!' },
  { role: 'After-sales Engineer',    phone: '18800000007', password: 'Test123456!' },
  { role: 'QA Inspector',            phone: '18800000008', password: 'Test123456!' },
  { role: 'Logistics Specialist',    phone: '18800000009', password: 'Test123456!' },
  { role: 'Shop Floor Worker',       phone: '18800000010', password: 'Test123456!' }
];

/**
 * 默认创建的供应商（3个：2个合作 + 1个临时）
 */
const defaultSuppliers = [
  {
    name: '苏阀自控',
    code: 'SF',
    status: 'Active',
    rating: 5,
    remarks: '合作供应商 - 主力供应商'
  },
  {
    name: '奥托尼克斯',
    code: 'AT',
    status: 'Active',
    rating: 5,
    remarks: '合作供应商 - 进口品牌'
  },
  {
    name: '临时供应商A',
    code: 'TEMP-A',
    status: 'Pending',
    rating: 3,
    remarks: '临时供应商 - 特殊项目'
  }
];

/**
 * 默认创建的产品（6个代表性型号）
 */
const defaultActuators = [
  { model: 'SF10-DA',      series: 'SF', type: 'DA', torque: 110,  price: 1200 },
  { model: 'SF16-DA',      series: 'SF', type: 'DA', torque: 730,  price: 2800 },
  { model: 'SF10-SR-K8',   series: 'SF', type: 'SR', torque: 88,   price: 1450 },
  { model: 'SF14-SR-K10',  series: 'SF', type: 'SR', torque: 420,  price: 2200 },
  { model: 'AT100-DA',     series: 'AT', type: 'DA', torque: 120,  price: 1800 },
  { model: 'AT200-SR-K8',  series: 'AT', type: 'SR', torque: 250,  price: 3200 }
];

// =====================================================
// 3. 其他测试接口
// =====================================================

/**
 * 清理指定前缀的测试数据
 */
const cleanupByPrefix = {
  method: 'POST',
  url: '/api/testing/cleanup',
  body: {
    projectNamePrefix: 'E2E-Test-Project-'
  }
};

/**
 * 获取测试环境状态
 */
const getStatus = {
  method: 'GET',
  url: '/api/testing/status'
};

/**
 * 清空所有数据（危险操作）
 */
const cleanupAll = {
  method: 'DELETE',
  url: '/api/testing/cleanup-all'
};

/**
 * 创建测试用户
 */
const seedUsers = {
  method: 'POST',
  url: '/api/testing/seed-users',
  body: {
    users: {
      admin: {
        phone: '18800000000',
        password: 'Admin123456!',
        fullName: '超级管理员',
        role: 'Administrator',
        department: '管理部门'
      }
    }
  }
};

// =====================================================
// 4. Cypress 集成示例
// =====================================================

/**
 * Cypress 自定义命令
 * 文件位置：cypress/support/test-helpers.js
 */
const cypressCommands = `
// 重置数据库
Cypress.Commands.add('resetDatabase', () => {
  cy.request({
    method: 'POST',
    url: '/api/testing/reset-and-seed',
    body: { clearAll: true }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.be.true;
  });
});

// 使用角色登录
Cypress.Commands.add('loginAsRole', (role) => {
  const credentials = {
    'Administrator': { phone: '18800000001', password: 'Test123456!' },
    'Sales Manager': { phone: '18800000002', password: 'Test123456!' }
    // ... 其他角色
  };
  
  const creds = credentials[role];
  cy.visit('/login');
  cy.get('input[name="phone"]').type(creds.phone);
  cy.get('input[name="password"]').type(creds.password);
  cy.get('button[type="submit"]').click();
});
`;

/**
 * Cypress 测试用例示例
 */
const cypressTestExample = `
describe('可重复的 E2E 测试', () => {
  beforeEach(() => {
    // 每个测试前重置数据库
    cy.resetDatabase();
  });

  it('管理员应该能够创建项目', () => {
    cy.loginAsRole('Administrator');
    
    cy.visit('/projects/new');
    cy.get('input[name="projectName"]').type('Test-Project-001');
    cy.get('button[type="submit"]').click();
    
    cy.contains('项目创建成功').should('be.visible');
  });
});
`;

// =====================================================
// 5. cURL 测试示例
// =====================================================

/**
 * 使用 cURL 测试接口
 */
const curlExamples = {
  // 基础重置
  basic: `
curl -X POST http://localhost:5001/api/testing/reset-and-seed \\
  -H "Content-Type: application/json" \\
  -d '{
    "clearAll": true
  }'
  `,
  
  // 自定义数据
  custom: `
curl -X POST http://localhost:5001/api/testing/reset-and-seed \\
  -H "Content-Type: application/json" \\
  -d '{
    "clearAll": true,
    "seedData": {
      "users": [
        {
          "full_name": "Custom User",
          "phone": "19900000001",
          "password": "Custom123!",
          "role": "Administrator",
          "department": "测试部",
          "isActive": true,
          "passwordChangeRequired": false
        }
      ]
    }
  }'
  `,
  
  // 获取状态
  status: `
curl -X GET http://localhost:5001/api/testing/status
  `,
  
  // 清理数据
  cleanup: `
curl -X POST http://localhost:5001/api/testing/cleanup \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectNamePrefix": "E2E-Test-"
  }'
  `
};

// =====================================================
// 6. 快速启动指南
// =====================================================

/**
 * 步骤 1：启动测试环境后端
 */
const step1_startServer = `
# 方式1：使用环境变量
NODE_ENV=test npm start

# 方式2：使用测试脚本（如果有）
npm run start:test
`;

/**
 * 步骤 2：重置数据库
 */
const step2_resetDatabase = `
# 使用提供的测试脚本
bash backend/test-reset-and-seed.sh

# 或使用 cURL
curl -X POST http://localhost:5001/api/testing/reset-and-seed \\
  -H "Content-Type: application/json" \\
  -d '{"clearAll": true}'
`;

/**
 * 步骤 3：运行 Cypress 测试
 */
const step3_runTests = `
# 打开 Cypress GUI
npx cypress open

# 或运行无头测试
npx cypress run
`;

// =====================================================
// 7. 注意事项和最佳实践
// =====================================================

const bestPractices = {
  security: [
    '✅ 仅在 NODE_ENV=test 时加载测试路由',
    '✅ 生产环境会自动禁用这些接口',
    '✅ 双重检查确保不在生产环境执行危险操作'
  ],
  
  testing: [
    '✅ 每个测试前调用 resetDatabase()',
    '✅ 使用统一的测试数据前缀（如 E2E-Test-）',
    '✅ 测试后清理创建的数据',
    '✅ 使用 cy.loginAsRole() 而不是硬编码凭证'
  ],
  
  performance: [
    '✅ reset-and-seed 操作应在 5 秒内完成',
    '✅ 只填充必要的测试数据',
    '✅ 考虑使用数据库快照恢复（高级优化）'
  ],
  
  maintenance: [
    '✅ 保持测试数据与生产数据结构一致',
    '✅ 定期更新默认测试数据',
    '✅ 文档化自定义测试场景'
  ]
};

// =====================================================
// 8. 故障排查
// =====================================================

const troubleshooting = {
  '接口404': {
    problem: '访问测试接口返回 404',
    solution: '确保 NODE_ENV=test，测试路由仅在测试环境加载'
  },
  
  '数据未清空': {
    problem: '调用 reset-and-seed 后数据仍然存在',
    solution: '检查 clearAll 参数是否为 true，查看服务器日志'
  },
  
  '供应商关联失败': {
    problem: '执行器创建失败，提示供应商不存在',
    solution: '确保先创建供应商，或使用 supplier_code 自动关联'
  },
  
  '测试速度慢': {
    problem: 'E2E 测试运行很慢',
    solution: '减少 beforeEach 中的数据填充量，只填充必要数据'
  }
};

// =====================================================
// 导出供参考
// =====================================================
module.exports = {
  basicUsage,
  advancedUsage,
  defaultTestUsers,
  defaultSuppliers,
  defaultActuators,
  cypressCommands,
  cypressTestExample,
  curlExamples,
  bestPractices,
  troubleshooting
};

// =====================================================
// 完整示例：从零到运行测试
// =====================================================

console.log(`
╔════════════════════════════════════════════════════════════╗
║        测试 API 完整使用指南                               ║
╚════════════════════════════════════════════════════════════╝

📚 快速开始：

1️⃣  启动测试环境后端：
   NODE_ENV=test npm start

2️⃣  重置数据库（使用提供的脚本）：
   bash backend/test-reset-and-seed.sh

3️⃣  运行 Cypress E2E 测试：
   npx cypress open

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 默认测试账户：

   角色              手机号          密码
   ────────────────────────────────────────────
   Administrator     18800000001     Test123456!
   Sales Manager     18800000002     Test123456!
   Technical Eng.    18800000004     Test123456!
   
   (共10个角色账户，密码均为 Test123456!)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 核心接口：

   POST /api/testing/reset-and-seed
   - 清空所有数据
   - 填充测试数据
   - 返回创建的测试账户信息

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 最佳实践：

   1. 每个测试前调用 cy.resetDatabase()
   2. 使用 cy.loginAsRole('Administrator') 登录
   3. 测试后清理创建的数据
   4. 使用统一的测试数据前缀

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 完整文档：backend/TESTING_API_GUIDE.js
📋 示例测试：frontend/cypress/e2e/example-reset-seed.cy.js
🛠️  辅助函数：frontend/cypress/support/test-helpers.js

╚════════════════════════════════════════════════════════════╝
`);

