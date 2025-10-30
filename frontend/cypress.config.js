import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5176',
    viewportWidth: 1920,
    viewportHeight: 1080,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    
    // 环境变量
    env: {
      apiUrl: 'http://localhost:5001',
      // 测试用户凭证 - 使用手机号登录（对应 seed_test_users.js 中的测试账户）
      testUsers: {
        admin: {
          phone: '13800000001',
          password: 'test123456',
          role: 'Administrator'
        },
        salesManager: {
          phone: '13800000002',
          password: 'test123456',
          role: 'Sales Manager'
        },
        salesEngineer: {
          phone: '13800000003',
          password: 'test123456',
          role: 'Sales Engineer'
        },
        technicalEngineer: {
          phone: '13800000004',
          password: 'test123456',
          role: 'Technical Engineer'
        },
        procurementSpecialist: {
          phone: '13800000005',
          password: 'test123456',
          role: 'Procurement Specialist'
        },
        productionPlanner: {
          phone: '13800000006',
          password: 'test123456',
          role: 'Production Planner'
        },
        aftersalesEngineer: {
          phone: '13800000007',
          password: 'test123456',
          role: 'After-sales Engineer'
        },
        qaInspector: {
          phone: '13800000008',
          password: 'test123456',
          role: 'QA Inspector'
        },
        logisticsSpecialist: {
          phone: '13800000009',
          password: 'test123456',
          role: 'Logistics Specialist'
        },
        shopFloorWorker: {
          phone: '13800000010',
          password: 'test123456',
          role: 'Shop Floor Worker'
        }
      }
    }
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})

