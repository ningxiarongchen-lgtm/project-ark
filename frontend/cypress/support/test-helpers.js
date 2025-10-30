/**
 * Cypress E2E 测试辅助函数
 * 
 * 提供数据库重置、用户登录等常用测试功能
 */

/**
 * 重置数据库并填充测试数据
 * 
 * 在每个测试之前调用此函数，确保从已知的干净状态开始
 * 
 * @example
 * beforeEach(() => {
 *   cy.resetDatabase();
 * });
 */
Cypress.Commands.add('resetDatabase', () => {
  cy.log('🔄 重置数据库并填充测试数据...');
  
  cy.request({
    method: 'POST',
    url: '/api/testing/reset-and-seed',
    body: {
      clearAll: true
    },
    failOnStatusCode: true
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.be.true;
    expect(response.body.message).to.equal('System reset and seeded successfully.');
    
    cy.log('✅ 数据库重置完成');
    cy.log(`   用户: ${response.body.details.seeded.users} 个`);
    cy.log(`   供应商: ${response.body.details.seeded.suppliers} 个`);
    cy.log(`   产品: ${response.body.details.seeded.actuators} 个`);
    
    // 将测试数据存储到 Cypress 环境中，供后续测试使用
    Cypress.env('testUsers', response.body.testData.users);
    Cypress.env('testSuppliers', response.body.testData.suppliers);
    Cypress.env('testActuators', response.body.testData.actuators);
  });
});

/**
 * 使用测试用户登录
 * 
 * @param {string} role - 用户角色（例如：'Administrator', 'Sales Manager'）
 * @example
 * cy.loginAsRole('Administrator');
 * cy.loginAsRole('Technical Engineer');
 */
Cypress.Commands.add('loginAsRole', (role) => {
  const credentials = {
    'Administrator': { phone: '18800000001', password: 'Test123456!' },
    'Sales Manager': { phone: '18800000002', password: 'Test123456!' },
    'Sales Engineer': { phone: '18800000003', password: 'Test123456!' },
    'Technical Engineer': { phone: '18800000004', password: 'Test123456!' },
    'Procurement Specialist': { phone: '18800000005', password: 'Test123456!' },
    'Production Planner': { phone: '18800000006', password: 'Test123456!' },
    'After-sales Engineer': { phone: '18800000007', password: 'Test123456!' },
    'QA Inspector': { phone: '18800000008', password: 'Test123456!' },
    'Logistics Specialist': { phone: '18800000009', password: 'Test123456!' },
    'Shop Floor Worker': { phone: '18800000010', password: 'Test123456!' }
  };

  const creds = credentials[role];
  if (!creds) {
    throw new Error(`未知的角色: ${role}`);
  }

  cy.log(`🔐 以 ${role} 身份登录 (${creds.phone})`);
  
  cy.visit('/login');
  cy.get('input[name="phone"]').clear().type(creds.phone);
  cy.get('input[name="password"]').clear().type(creds.password);
  cy.get('button[type="submit"]').click();
  
  // 等待登录成功并跳转到首页
  cy.url().should('not.include', '/login');
  cy.log(`✅ 登录成功 (${role})`);
});

/**
 * 快捷登录命令 - 直接使用手机号和密码
 * 
 * @param {string} phone - 手机号
 * @param {string} password - 密码
 * @example
 * cy.login('18800000001', 'Test123456!');
 */
Cypress.Commands.add('login', (phone, password = 'Test123456!') => {
  cy.log(`🔐 登录: ${phone}`);
  
  cy.visit('/login');
  cy.get('input[name="phone"]').clear().type(phone);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
  
  cy.url().should('not.include', '/login');
  cy.log('✅ 登录成功');
});

/**
 * 登出
 */
Cypress.Commands.add('logout', () => {
  cy.log('🚪 登出...');
  
  // 根据你的应用实际登出方式调整
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  
  cy.url().should('include', '/login');
  cy.log('✅ 已登出');
});

/**
 * 获取当前环境的测试数据
 * 
 * @returns {Object} 包含用户、供应商、产品等测试数据
 */
Cypress.Commands.add('getTestData', () => {
  return {
    users: Cypress.env('testUsers') || [],
    suppliers: Cypress.env('testSuppliers') || [],
    actuators: Cypress.env('testActuators') || []
  };
});

/**
 * 清理特定前缀的测试数据
 * 
 * @param {string} prefix - 项目名称前缀
 * @example
 * cy.cleanupTestData('E2E-Test-Project-');
 */
Cypress.Commands.add('cleanupTestData', (prefix) => {
  cy.log(`🧹 清理测试数据: ${prefix}*`);
  
  cy.request({
    method: 'POST',
    url: '/api/testing/cleanup',
    body: {
      projectNamePrefix: prefix
    },
    failOnStatusCode: true
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.be.true;
    
    cy.log('✅ 测试数据清理完成');
  });
});

/**
 * 获取测试环境状态
 */
Cypress.Commands.add('getTestStatus', () => {
  cy.log('📊 获取测试环境状态...');
  
  cy.request({
    method: 'GET',
    url: '/api/testing/status',
    failOnStatusCode: true
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.be.true;
    
    cy.log('✅ 状态获取成功');
    cy.log(`   环境: ${response.body.status.environment}`);
    
    return response.body.status;
  });
});

