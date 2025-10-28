/**
 * Jest 配置文件
 * 
 * 用于配置单元测试环境
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  
  // 覆盖率收集
  collectCoverageFrom: [
    'utils/**/*.js',
    'models/**/*.js',
    'controllers/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // 测试超时时间（毫秒）
  testTimeout: 10000,
  
  // 详细输出
  verbose: true,
  
  // 清除模拟
  clearMocks: true,
  
  // 重置模块
  resetMocks: true,
  
  // 恢复模拟
  restoreMocks: true
};

