// --- C-MAX平台全生命周期验收测试剧本 (可重复执行版) ---
describe('C-MAX Platform Full Lifecycle Acceptance Test', () => {

  // --- 1. 定义动态测试数据 ---
  const testData = {
    projectName: `Test-Project-${Date.now()}`,
    supplierName: `Test-Supplier-${Date.now()}`,
    // 角色凭证 - 使用实际的测试用户
    admin: { username: 'admin', password: 'admin123' },
    salesManager: { username: 'sales_manager', password: 'manager123' },
    techEngineer: { username: 'tech_engineer', password: 'tech123' },
    salesEngineer: { username: 'sales_engineer', password: 'sales123' },
    procurement: { username: 'procurement', password: 'proc123' },
    planner: { username: 'production_planner', password: 'prod123' },
    afterSales: { username: 'aftersales', password: 'after123' }
  };

  // --- 2. 前置任务：清理和准备 ---
  before(() => {
    // 这个任务在所有测试开始前只运行一次
    // 使用自定义命令清理测试数据，这比通过UI操作快得多
    // 暂时禁用以调试登录问题
    // cy.cleanupTestData('Test-Project-');
    
    // 可选：查看清理后的环境状态
    // cy.getTestingStatus();
    
    // 并且预先创建一个用于测试的供应商（如果需要）
    // cy.loginAs('admin');
    // cy.request('POST', '/api/suppliers', { 
    //   name: testData.supplierName,
    //   contact: 'test@example.com',
    //   phone: '123-456-7890'
    // });
  });

  // --- 3. 完整的测试流程 ---
  it('should successfully complete a project from lead to after-sales', () => {
    
    // **第一幕：售前流程**
    // 销售经理发起项目
    cy.login(testData.salesManager.username, testData.salesManager.password);
    cy.visit('/projects');
    cy.contains('新建项目').click();
    cy.get('input[name="project_name"]').type(testData.projectName);
    cy.contains('确定').click();
    cy.contains(testData.projectName).click();
    cy.url().then(url => {
      const projectId = url.split('/').pop();
      cy.wrap(projectId).as('projectId'); // **使用别名保存项目ID**
    });
    cy.contains('指派技术支持').click();
    cy.get('.ant-select').click().get('.ant-select-item-option-content').contains('Test Tech Engineer').click();

    // 技术工程师进行选型
    cy.login(testData.techEngineer.username, testData.techEngineer.password);
    cy.get('@projectId').then(projectId => {
      cy.visit(`/projects/${projectId}`);
    });
    // ... (模拟选型操作) ...
    cy.contains('提交选型方案给商务').click();

    // 商务工程师进行报价
    cy.login(testData.salesEngineer.username, testData.salesEngineer.password);
    cy.get('@projectId').then(projectId => {
      cy.visit(`/projects/${projectId}`);
    });
    cy.get('.ant-tabs-tab-btn').contains('BOM清单').click();
    cy.contains('从选型自动生成').click();
    cy.contains('完成报价，通知销售').click();

    // **第二幕：售中流程**
    // 销售经理创建订单
    cy.login(testData.salesManager.username, testData.salesManager.password);
    cy.get('@projectId').then(projectId => {
      cy.visit(`/projects/${projectId}`);
    });
    cy.get('.project-status-select').click().get('.ant-select-item-option-content').contains('赢单 (Won)').click();
    cy.contains('生成合同订单').click();
    // ... 填写订单信息 ...
    cy.contains('确认生成').click();
    cy.url().should('include', '/orders/').then(url => {
        const orderId = url.split('/').pop();
        cy.wrap(orderId).as('orderId'); // **使用别名保存订单ID**
    });

    // 生产计划员创建生产任务
    cy.login(testData.planner.username, testData.planner.password);
    cy.get('@orderId').then(orderId => {
      cy.visit(`/orders/${orderId}`);
    });
    cy.contains('创建生产任务').click();
    // ... 填写生产任务信息 ...
    cy.contains('确认创建').click();

    // **第三幕：售后流程**
    // 售后工程师创建工单
    cy.login(testData.afterSales.username, testData.afterSales.password);
    cy.get('@orderId').then(orderId => {
      cy.visit(`/orders/${orderId}`);
    });
    cy.contains('为此订单创建售后工单').click();
    // ... 填写工单信息 ...
    cy.contains('确认创建').click();
    cy.url().should('include', '/service/').then(url => {
        const ticketId = url.split('/').pop();
        cy.wrap(ticketId).as('ticketId'); // **使用别名保存工单ID**
    });

    // 处理并关闭工单
    cy.get('@ticketId').then(ticketId => {
        cy.visit(`/service/${ticketId}`);
    });
    cy.get('textarea[name="comment"]').type('Test comment: Issue resolved via E2E test.');
    cy.contains('提交回复').click();
    cy.get('.ticket-status-select').click().get('.ant-select-item-option-content').contains('已解决 (Resolved)').click();
    cy.get('.ticket-status-tag').should('contain', '已解决');
  });
});

