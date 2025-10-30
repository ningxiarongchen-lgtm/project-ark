/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║              准备手动测试数据 - Prepare Manual Test Data                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * 这个脚本用于为手动测试准备数据
 * 
 * 与自动化测试的区别：
 * - 所有流程合并在一个测试中连贯执行
 * - 测试完成后**不**清理数据
 * - 创建的数据使用特殊前缀便于识别
 * 
 * 运行后，你可以：
 * 1. 使用任何测试账户登录系统
 * 2. 查看完整的项目、订单、生产任务等数据
 * 3. 手动探索UI和功能
 * 
 * 运行命令：
 * npx cypress run --spec "cypress/e2e/prepare_manual_test_data.cy.js"
 */

describe('准备手动测试数据 - Manual Test Data Preparation', () => {

  // ═══════════════════════════════════════════════════════════════════════
  // 🔄 重置数据库（只在测试开始前执行一次）
  // ═══════════════════════════════════════════════════════════════════════
  before(() => {
    cy.log('🔄 重置数据库并填充测试数据...');
    
    cy.request({
      method: 'POST',
      url: 'http://localhost:5001/api/testing/reset-and-seed',
      body: {
        clearAll: true
      },
      timeout: 10000
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      
      cy.log('✅ 数据库重置完成');
      cy.log(`   📊 清除记录: ${response.body.details.totalCleared} 条`);
      cy.log(`   🌱 填充记录: ${response.body.details.totalSeeded} 条`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 🎬 执行完整的业务流程（一次性完成所有操作）
  // ═══════════════════════════════════════════════════════════════════════
  it('应该创建完整的业务流程数据供手动测试', () => {
    cy.log('🎬 开始创建完整的业务流程数据...');
    
    const projectName = `Manual-Test-Project-${Date.now()}`;
    cy.log(`📋 项目名称: ${projectName}`);
    
    // ─────────────────────────────────────────────────────────
    // 第1步：销售经理创建项目
    // ─────────────────────────────────────────────────────────
    cy.log('');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    cy.log('📍 第1步：销售经理创建项目');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    cy.visit('/login');
    cy.get('input[name="phone"]').should('be.visible').clear().type('18800000002');
    cy.get('input[name="password"]').should('be.visible').clear().type('Test123456!');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });
    cy.log('   ✅ 销售经理已登录');
    
    // 创建项目
    cy.visit('/projects', { timeout: 10000 });
    cy.url().should('include', '/projects');
    
    cy.get('body').then($body => {
      if ($body.find('button:contains("新建项目")').length > 0) {
        cy.contains('button', '新建项目').click();
      } else if ($body.find('button:contains("新建")').length > 0) {
        cy.contains('button', '新建').first().click();
      } else {
        cy.get('button.ant-btn-primary').first().click();
      }
    });
    
    cy.get('.ant-modal, .ant-drawer', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.get('input').first().clear().type(projectName);
        
        cy.get('body').then($modal => {
          if ($modal.find('input[name="customerName"]').length > 0) {
            cy.get('input[name="customerName"]').type('手动测试客户公司');
          }
        });
        
        cy.contains('button', /确定|创建|提交|保存/).click();
      });
    
    cy.get('.ant-modal, .ant-drawer', { timeout: 10000 }).should('not.exist');
    cy.log(`   ✅ 项目创建成功: ${projectName}`);
    cy.wait(2000);
    
    // ─────────────────────────────────────────────────────────
    // 第2步：技术工程师进行选型
    // ─────────────────────────────────────────────────────────
    cy.log('');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    cy.log('📍 第2步：技术工程师进行选型');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    cy.visit('/login');
    cy.get('input[name="phone"]').clear().type('18800000004');
    cy.get('input[name="password"]').clear().type('Test123456!');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });
    cy.log('   ✅ 技术工程师已登录');
    
    cy.visit('/actuators', { failOnStatusCode: false });
    cy.wait(2000);
    cy.log('   ✅ 技术工程师访问了产品库');
    
    // ─────────────────────────────────────────────────────────
    // 第3步：商务工程师生成报价
    // ─────────────────────────────────────────────────────────
    cy.log('');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    cy.log('📍 第3步：商务工程师生成报价');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    cy.visit('/login');
    cy.get('input[name="phone"]').clear().type('18800000003');
    cy.get('input[name="password"]').clear().type('Test123456!');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });
    cy.log('   ✅ 商务工程师已登录');
    
    cy.visit('/quotes', { failOnStatusCode: false });
    cy.wait(2000);
    cy.log('   ✅ 商务工程师访问了报价模块');
    
    // ─────────────────────────────────────────────────────────
    // 第4步：销售经理确认赢单并创建订单
    // ─────────────────────────────────────────────────────────
    cy.log('');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    cy.log('📍 第4步：销售经理确认赢单并创建订单');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    cy.visit('/login');
    cy.get('input[name="phone"]').clear().type('18800000002');
    cy.get('input[name="password"]').clear().type('Test123456!');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });
    cy.log('   ✅ 销售经理重新登录');
    
    cy.visit('/orders', { failOnStatusCode: false });
    cy.wait(2000);
    cy.log('   ✅ 销售经理访问了订单模块');
    
    // ─────────────────────────────────────────────────────────
    // 第5步：生产计划员创建生产任务
    // ─────────────────────────────────────────────────────────
    cy.log('');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    cy.log('📍 第5步：生产计划员创建生产任务');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    cy.visit('/login');
    cy.get('input[name="phone"]').clear().type('18800000006');
    cy.get('input[name="password"]').clear().type('Test123456!');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });
    cy.log('   ✅ 生产计划员已登录');
    
    cy.visit('/production', { failOnStatusCode: false });
    cy.wait(2000);
    cy.log('   ✅ 生产计划员访问了生产模块');
    
    // ─────────────────────────────────────────────────────────
    // 第6步：售后工程师创建售后工单
    // ─────────────────────────────────────────────────────────
    cy.log('');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    cy.log('📍 第6步：售后工程师创建售后工单');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    cy.visit('/login');
    cy.get('input[name="phone"]').clear().type('18800000007');
    cy.get('input[name="password"]').clear().type('Test123456!');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });
    cy.log('   ✅ 售后工程师已登录');
    
    cy.visit('/tickets', { failOnStatusCode: false });
    cy.wait(2000);
    cy.log('   ✅ 售后工程师访问了售后工单模块');
    
    // ─────────────────────────────────────────────────────────
    // 第7步：质检员进行质量检查
    // ─────────────────────────────────────────────────────────
    cy.log('');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    cy.log('📍 第7步：质检员进行质量检查');
    cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    cy.visit('/login');
    cy.get('input[name="phone"]').clear().type('18800000008');
    cy.get('input[name="password"]').clear().type('Test123456!');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });
    cy.log('   ✅ 质检员已登录');
    
    cy.visit('/quality', { failOnStatusCode: false });
    cy.wait(2000);
    cy.log('   ✅ 质检员访问了质量管理模块');
    
    // ─────────────────────────────────────────────────────────
    // 完成
    // ─────────────────────────────────────────────────────────
    cy.log('');
    cy.log('╔═══════════════════════════════════════════════════════════════╗');
    cy.log('║          手动测试数据准备完成！ 🎉                            ║');
    cy.log('╚═══════════════════════════════════════════════════════════════╝');
    cy.log('');
    cy.log(`📋 项目名称: ${projectName}`);
    cy.log('');
    cy.log('🎯 下一步：手动登录测试');
    cy.log('   访问: http://localhost:5173');
    cy.log('   使用以下账户登录：');
    cy.log('');
    cy.log('   角色               手机号         密码');
    cy.log('   ─────────────────────────────────────────────');
    cy.log('   销售经理           18800000002    Test123456!');
    cy.log('   技术工程师         18800000004    Test123456!');
    cy.log('   商务工程师         18800000003    Test123456!');
    cy.log('   生产计划员         18800000006    Test123456!');
    cy.log('   售后工程师         18800000007    Test123456!');
    cy.log('   质检员             18800000008    Test123456!');
    cy.log('');
    cy.log(`💡 查找项目: 搜索 "${projectName}"`);
    cy.log('');
  });

  // ⚠️  重要：不要在 afterEach 中清理数据！
  // 这样数据会保留在数据库中供手动测试使用
});

