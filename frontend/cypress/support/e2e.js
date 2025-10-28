// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// 全局配置
Cypress.on('uncaught:exception', (err, runnable) => {
  // 忽略某些不影响测试的错误
  if (err.message.includes('ResizeObserver')) {
    return false
  }
  // 其他错误正常抛出
  return true
})

// 在每个测试前清理
beforeEach(() => {
  // 清除 localStorage
  cy.clearLocalStorage()
  
  // 清除 cookies
  cy.clearCookies()
})

// 自定义日志
Cypress.Commands.overwrite('log', (originalFn, message, ...args) => {
  // 添加时间戳
  const timestamp = new Date().toLocaleTimeString('zh-CN')
  return originalFn(`[${timestamp}] ${message}`, ...args)
})

