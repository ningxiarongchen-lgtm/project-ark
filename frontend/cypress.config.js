import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
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
      apiUrl: 'http://localhost:5001/api',
      // 测试用户凭证
      testUsers: {
        admin: {
          username: 'admin',
          password: 'admin123',
          role: 'Administrator'
        },
        technicalEngineer: {
          username: 'tech_engineer',
          password: 'tech123',
          role: 'Technical Engineer'
        },
        salesEngineer: {
          username: 'sales_engineer',
          password: 'sales123',
          role: 'Sales Engineer'
        },
        salesManager: {
          username: 'sales_manager',
          password: 'manager123',
          role: 'Sales Manager'
        },
        productionPlanner: {
          username: 'production_planner',
          password: 'prod123',
          role: 'Production Planner'
        },
        procurementSpecialist: {
          username: 'procurement',
          password: 'proc123',
          role: 'Procurement Specialist'
        },
        aftersalesEngineer: {
          username: 'aftersales',
          password: 'after123',
          role: 'After-sales Engineer'
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

