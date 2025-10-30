/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    终极验收测试 - Final Acceptance Test                      ║
 * ║                  Complete E2E Workflow - All 10 Roles                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * 本测试脚本模拟完整的业务流程，覆盖所有14个手动测试场景：
 * 
 * 场景1：售前流程（项目 → 选型 → 报价）
 *   1.1 销售经理创建新项目
 *   1.2 技术工程师接收任务并完成选型
 *   1.3 商务工程师创建BOM和报价
 *   1.4 销售经理查看和下载报价
 * 
 * 场景2：售中流程（赢单 → 合同 → 生产订单）
 *   2.1 销售经理标记赢单并生成合同
 *   2.2 商务工程师审核合同并确认收款
 * 
 * 场景3：生产与供应链（排产 → 采购 → 生产 → 质检 → 发货）
 *   3.1 生产计划员接收生产订单并展开BOM
 *   3.2 采购专员处理采购需求
 *   3.3 生产计划员查看物料状态更新
 *   3.4 车间工人查看和完成作业单
 *   3.5 质检员检验产品
 *   3.6 物流专员安排发货
 * 
 * 场景4：售后流程（工单创建 → 处理 → 关闭）
 *   4.1 销售经理创建售后工单
 *   4.2 售后工程师处理和关闭工单
 * 
 * 测试数据来源：npm run seed:final
 */

describe('🏆 终极验收测试套件 - Complete E2E Workflow', () => {
  
  // ═══════════════════════════════════════════════════════════════════════
  // 🔐 测试账户配置
  // ═══════════════════════════════════════════════════════════════════════
  const accounts = {
    admin: { phone: '13000000001', password: 'password', name: 'Admin User' },
    salesManager: { phone: '13000000002', password: 'password', name: 'Sales Manager User' },
    techEngineer: { phone: '13000000003', password: 'password', name: 'Tech Engineer User' },
    salesEngineer: { phone: '13000000004', password: 'password', name: 'Sales Engineer User' },
    procurement: { phone: '13000000005', password: 'password', name: 'Procurement User' },
    planner: { phone: '13000000006', password: 'password', name: 'Planner User' },
    qa: { phone: '13000000007', password: 'password', name: 'QA User' },
    logistics: { phone: '13000000008', password: 'password', name: 'Logistics User' },
    afterSales: { phone: '13000000009', password: 'password', name: 'After-Sales User' },
    worker: { phone: '13000000010', password: 'password', name: 'Worker User' }
  };

  // 共享变量存储测试过程中创建的ID
  let testData = {
    projectId: null,
    projectNumber: null,
    salesOrderId: null,
    productionOrderId: null,
    purchaseOrderId: null,
    workOrderId: null,
    serviceTicketId: null
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 🛠️ 辅助函数
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 登录指定账户
   */
  const loginAs = (account) => {
    cy.log(`🔐 登录账户: ${account.name}`);
    cy.visit('http://localhost:5173/login');
    cy.get('input[name="phone"]', { timeout: 10000 }).should('be.visible').clear().type(account.phone);
    cy.get('input[name="password"]').clear().type(account.password);
    cy.get('button[type="submit"]').click();
    
    // 等待登录成功并跳转到仪表盘
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.log(`✅ 登录成功: ${account.name}`);
  };

  /**
   * 登出当前账户
   */
  const logout = () => {
    cy.log('🚪 登出当前账户');
    // 直接清除localStorage和cookies来登出
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.wait(500);
  };

  /**
   * 等待API请求完成
   */
  const waitForAPI = (alias) => {
    cy.wait(alias, { timeout: 15000 });
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 🎬 场景1：售前流程（项目 → 选型 → 报价）
  // ═══════════════════════════════════════════════════════════════════════
  
  describe('场景1：售前流程 - Pre-Sales Workflow', () => {
    
    it('1.1 销售经理创建新项目', () => {
      cy.log('📝 测试 1.1：销售经理创建新项目');
      
      // 1. 登录销售经理账户
      loginAs(accounts.salesManager);
      
      // 2. 导航到项目管理
      cy.visit('http://localhost:5173/projects');
      cy.url().should('include', '/projects');
      
      // 3. 点击创建新项目
      cy.contains('button', /新建项目|创建项目|New Project/i, { timeout: 10000 }).click();
      
      // 4. 填写项目信息
      cy.get('input[name="projectName"]').type('【E2E测试】天津钢铁厂阀门自动化项目');
      cy.get('input[name="client.name"]').type('天津钢铁集团');
      cy.get('input[name="client.company"]').type('天津钢铁有限公司');
      cy.get('input[name="client.phone"]').type('022-12345678');
      
      // 5. 选择行业和优先级
      cy.get('select[name="industry"]').select('Manufacturing');
      cy.get('select[name="priority"]').select('High');
      
      // 6. 输入预算
      cy.get('input[name="budget"]').type('600000');
      
      // 7. 指派技术工程师
      cy.get('select[name="technical_support"]').select(accounts.techEngineer.name);
      
      // 8. 提交创建项目
      cy.contains('button', /创建|提交|Create/i).click();
      
      // 9. 验证项目创建成功
      cy.contains(/创建成功|success/i, { timeout: 10000 }).should('be.visible');
      
      // 10. 获取并保存项目编号
      cy.url().then((url) => {
        const matches = url.match(/projects\/([^/]+)/);
        if (matches) {
          testData.projectId = matches[1];
          cy.log(`✅ 项目ID: ${testData.projectId}`);
        }
      });
      
      // 11. 验证项目详情页显示
      cy.contains('天津钢铁厂阀门自动化项目').should('be.visible');
      
      logout();
    });

    it('1.2 技术工程师接收任务并完成选型', () => {
      cy.log('🔧 测试 1.2：技术工程师完成选型');
      
      // 1. 登录技术工程师账户
      loginAs(accounts.techEngineer);
      
      // 2. 检查仪表盘是否有新任务
      cy.visit('http://localhost:5173/dashboard');
      cy.contains(/我的任务|待处理|Pending/i, { timeout: 10000 }).should('be.visible');
      
      // 3. 导航到项目列表
      cy.visit('http://localhost:5173/projects');
      
      // 4. 找到并点击进入测试项目
      cy.contains('天津钢铁厂阀门自动化项目', { timeout: 10000 }).click();
      
      // 5. 切换到技术清单标签
      cy.contains(/技术清单|选型|Technical/i).click();
      
      // 6. 添加第一个技术需求
      cy.contains('button', /添加|Add/i).click();
      
      cy.get('input[name="tag"]').type('V-101');
      cy.get('input[name="model_name"]').type('AT-150-DA');
      cy.get('input[name="quantity"]').type('10');
      cy.get('input[name="description"]').type('主蒸汽管路球阀执行器');
      
      // 7. 保存第一个需求
      cy.contains('button', /保存|Save/i).click();
      cy.wait(1000);
      
      // 8. 添加第二个技术需求
      cy.contains('button', /添加|Add/i).click();
      
      cy.get('input[name="tag"]').type('V-102');
      cy.get('input[name="model_name"]').type('GY-200-DA');
      cy.get('input[name="quantity"]').type('5');
      cy.get('input[name="description"]').type('调节阀执行器');
      
      // 9. 保存第二个需求
      cy.contains('button', /保存|Save/i).click();
      cy.wait(1000);
      
      // 10. 提交技术方案
      cy.contains('button', /提交方案|请求报价|Submit/i).click();
      
      // 11. 确认提交
      cy.contains('button', /确认|Confirm/i).click();
      
      // 12. 验证提交成功
      cy.contains(/提交成功|已提交|submitted/i, { timeout: 10000 }).should('be.visible');
      
      // 13. 验证项目状态变更为"待商务报价"
      cy.contains(/待商务报价|待报价|Pending Quote/i).should('be.visible');
      
      logout();
    });

    it('1.3 商务工程师创建BOM和报价', () => {
      cy.log('💰 测试 1.3：商务工程师创建报价');
      
      // 1. 登录商务工程师账户
      loginAs(accounts.salesEngineer);
      
      // 2. 检查仪表盘待报价项目
      cy.visit('http://localhost:5173/dashboard');
      cy.contains(/待报价|Pending Quote/i, { timeout: 10000 }).should('be.visible');
      
      // 3. 导航到项目
      cy.visit('http://localhost:5173/projects');
      cy.contains('天津钢铁厂阀门自动化项目').click();
      
      // 4. 切换到报价工作台或BOM标签
      cy.contains(/报价|BOM|Quotation/i).click();
      
      // 5. 等待页面加载
      cy.wait(2000);
      
      // 6. 验证BOM中有产品
      cy.contains(/AT-150-DA|GY-200-DA/i, { timeout: 10000 }).should('be.visible');
      
      // 7. 完成报价
      cy.contains('button', /完成报价|提交报价|Submit Quote/i).click();
      
      // 8. 确认
      cy.contains('button', /确认|Confirm/i).click();
      
      // 9. 验证报价完成
      cy.contains(/报价完成|已报价|Quoted/i, { timeout: 10000 }).should('be.visible');
      
      logout();
    });

    it('1.4 销售经理查看报价', () => {
      cy.log('📊 测试 1.4：销售经理查看报价');
      
      // 1. 登录销售经理
      loginAs(accounts.salesManager);
      
      // 2. 导航到项目
      cy.visit('http://localhost:5173/projects');
      cy.contains('天津钢铁厂阀门自动化项目').click();
      
      // 3. 验证项目状态为"已报价"
      cy.contains(/已报价|Quoted/i, { timeout: 10000 }).should('be.visible');
      
      // 4. 查看BOM/报价单
      cy.contains(/报价|BOM|Quotation/i).click();
      
      // 5. 验证能看到报价信息
      cy.contains(/总价|Total|Amount/i).should('be.visible');
      cy.contains(/AT-150-DA|GY-200-DA/i).should('be.visible');
      
      // 6. 验证报价完成
      cy.log('✅ 报价单查看完成');
      
      logout();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 🎬 场景2：售中流程（赢单 → 合同 → 生产订单）
  // ═══════════════════════════════════════════════════════════════════════
  
  describe('场景2：售中流程 - In-Sales Workflow', () => {
    
    it('2.1 销售经理标记赢单并生成合同', () => {
      cy.log('🏆 测试 2.1：销售经理标记赢单');
      
      // 1. 登录销售经理
      loginAs(accounts.salesManager);
      
      // 2. 导航到项目
      cy.visit('http://localhost:5173/projects');
      cy.contains('天津钢铁厂阀门自动化项目').click();
      
      // 3. 标记为赢单
      cy.contains('button', /赢单|Won|标记赢单/i, { timeout: 10000 }).click();
      
      // 4. 确认
      cy.contains('button', /确认|Confirm/i).click();
      
      // 5. 验证状态变更
      cy.contains(/赢单|Won/i, { timeout: 10000 }).should('be.visible');
      
      // 6. 查找生成合同订单按钮
      cy.contains('button', /生成合同|创建合同|Contract/i, { timeout: 10000 }).should('be.visible').click();
      
      // 7. 填写合同信息（如果需要）
      cy.wait(1000);
      
      // 8. 提交合同创建
      cy.contains('button', /创建|提交|Submit/i).click();
      
      // 9. 验证合同创建成功
      cy.contains(/合同|Contract|创建成功/i, { timeout: 10000 }).should('be.visible');
      
      logout();
    });

    it('2.2 商务工程师审核合同并创建生产订单', () => {
      cy.log('📋 测试 2.2：商务工程师审核合同');
      
      // 1. 登录商务工程师
      loginAs(accounts.salesEngineer);
      
      // 2. 导航到合同管理或项目
      cy.visit('http://localhost:5173/projects');
      cy.contains('天津钢铁厂阀门自动化项目').click();
      
      // 3. 查看合同
      cy.contains(/合同|Contract/i).click();
      
      // 4. 等待页面加载
      cy.wait(2000);
      
      // 5. 查看合同信息
      cy.log('查看合同详情');
      
      // 6. 创建生产订单
      cy.contains('button', /创建生产订单|生产订单|Production/i, { timeout: 10000 }).click();
      
      // 7. 确认创建
      cy.contains('button', /确认|创建|Create/i).click();
      
      // 8. 验证生产订单创建成功
      cy.contains(/生产订单|Production Order|创建成功/i, { timeout: 10000 }).should('be.visible');
      
      // 9. 获取生产订单号
      cy.contains(/PO-\d{6}-\d{4}/i).invoke('text').then((text) => {
        testData.productionOrderId = text.trim();
        cy.log(`✅ 生产订单号: ${testData.productionOrderId}`);
      });
      
      logout();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 🎬 场景3：生产与供应链（排产 → 采购 → 生产 → 质检 → 发货）
  // ═══════════════════════════════════════════════════════════════════════
  
  describe('场景3：生产与供应链 - Production & Supply Chain', () => {
    
    it('3.1 生产计划员展开BOM并生成采购需求', () => {
      cy.log('📅 测试 3.1：生产计划员展开BOM');
      
      // 1. 登录生产计划员
      loginAs(accounts.planner);
      
      // 2. 导航到生产订单
      cy.visit('http://localhost:5173/production');
      
      // 3. 查看待排产订单
      cy.contains(/待排产|Pending/i, { timeout: 10000 }).should('be.visible');
      
      // 4. 点击进入生产订单详情
      cy.contains(/PO-|天津钢铁/i).first().click();
      
      // 5. 展开BOM
      cy.contains('button', /展开BOM|BOM|物料/i, { timeout: 10000 }).click();
      
      // 6. 验证BOM显示
      cy.contains(/AT-150-DA|GY-200-DA/i).should('be.visible');
      
      // 7. 生成采购需求
      cy.contains('button', /生成采购|采购需求|Purchase/i, { timeout: 10000 }).click();
      
      // 8. 选择需要采购的物料（全选）
      cy.get('input[type="checkbox"]').first().check({ force: true });
      
      // 9. 提交采购需求
      cy.contains('button', /提交|确认|Submit/i).click();
      
      // 10. 验证采购需求生成成功
      cy.contains(/采购需求|Purchase Request|生成成功/i, { timeout: 10000 }).should('be.visible');
      
      logout();
    });

    it('3.2 采购专员创建采购订单', () => {
      cy.log('🛒 测试 3.2：采购专员创建采购订单');
      
      // 1. 登录采购专员
      loginAs(accounts.procurement);
      
      // 2. 导航到采购管理
      cy.visit('http://localhost:5173/procurement');
      
      // 3. 查看采购需求
      cy.contains(/采购需求|Purchase Request/i, { timeout: 10000 }).should('be.visible');
      
      // 4. 创建采购订单
      cy.contains('button', /创建采购订单|新建|Create/i).click();
      
      // 5. 选择供应商
      cy.get('select[name="supplier"]').select('北京精密机械有限公司');
      
      // 6. 添加采购物料
      cy.contains('button', /添加物料|Add Item/i).click();
      
      // 7. 填写物料信息
      cy.get('input[name="product_name"]').type('AT-150-DA');
      cy.get('input[name="quantity"]').type('10');
      cy.get('input[name="unit_price"]').type('12500');
      
      // 8. 保存物料
      cy.contains('button', /保存|Save/i).click();
      
      // 9. 提交采购订单
      cy.contains('button', /提交|创建订单|Submit/i).click();
      
      // 10. 验证采购订单创建成功
      cy.contains(/采购订单|创建成功|success/i, { timeout: 10000 }).should('be.visible');
      
      logout();
    });

    it('3.3 生产计划员查看物料状态更新', () => {
      cy.log('🔍 测试 3.3：查看物料状态');
      
      // 1. 登录生产计划员
      loginAs(accounts.planner);
      
      // 2. 返回生产订单
      cy.visit('http://localhost:5173/production');
      cy.contains(/PO-|天津钢铁/i).first().click();
      
      // 3. 查看BOM
      cy.contains(/BOM|物料/i).click();
      
      // 4. 验证物料状态更新
      cy.contains(/采购中|Ordered|预计到货/i, { timeout: 10000 }).should('be.visible');
      
      logout();
    });

    it('3.4 车间工人查看和完成作业单', () => {
      cy.log('🔨 测试 3.4：车间工人完成作业');
      
      // 1. 登录车间工人
      loginAs(accounts.worker);
      
      // 2. 导航到生产作业
      cy.visit('http://localhost:5173/shop-floor');
      
      // 3. 查看工单
      cy.contains(/工单|Work Order|任务/i, { timeout: 10000 }).should('be.visible');
      
      // 4. 点击进入工单
      cy.contains(/AT-150-DA|开始|Start/i).first().click();
      
      // 5. 报告完成
      cy.contains('button', /报告完成|完成|Complete/i, { timeout: 10000 }).click();
      
      // 6. 填写完成数量
      cy.get('input[name="completed_quantity"]').type('10');
      cy.get('input[name="qualified_quantity"]').type('10');
      
      // 7. 提交
      cy.contains('button', /提交|Submit/i).click();
      
      // 8. 验证提交成功
      cy.contains(/提交成功|已完成|Completed/i, { timeout: 10000 }).should('be.visible');
      
      logout();
    });

    it('3.5 质检员检验产品', () => {
      cy.log('✅ 测试 3.5：质检员质量检验');
      
      // 1. 登录质检员
      loginAs(accounts.qa);
      
      // 2. 导航到质量管理
      cy.visit('http://localhost:5173/quality');
      
      // 3. 查看待质检任务
      cy.contains(/待质检|Pending|检验/i, { timeout: 10000 }).should('be.visible');
      
      // 4. 点击进入质检任务
      cy.contains(/AT-150-DA|检验/i).first().click();
      
      // 5. 录入检验结果
      cy.get('select[name="result"]').select('合格');
      cy.get('input[name="qualified_quantity"]').type('10');
      
      // 6. 提交检验报告
      cy.contains('button', /提交|合格|Pass/i).click();
      
      // 7. 验证提交成功
      cy.contains(/检验完成|质检合格|Passed/i, { timeout: 10000 }).should('be.visible');
      
      logout();
    });

    it('3.6 物流专员安排发货', () => {
      cy.log('🚚 测试 3.6：物流专员发货');
      
      // 1. 登录物流专员
      loginAs(accounts.logistics);
      
      // 2. 导航到物流管理
      cy.visit('http://localhost:5173/shipping');
      
      // 3. 查看待发货订单
      cy.contains(/待发货|Ready to Ship|发货/i, { timeout: 10000 }).should('be.visible');
      
      // 4. 点击进入订单
      cy.contains(/SO-|天津钢铁/i).first().click();
      
      // 5. 创建发货记录
      cy.contains('button', /发货|Ship|创建发货/i, { timeout: 10000 }).click();
      
      // 6. 填写发货信息
      cy.get('input[name="carrier"]').type('顺丰快递');
      cy.get('input[name="tracking_number"]').type('SF1234567890');
      
      // 7. 提交发货
      cy.contains('button', /确认发货|提交|Submit/i).click();
      
      // 8. 验证发货成功
      cy.contains(/发货成功|已发货|Shipped/i, { timeout: 10000 }).should('be.visible');
      
      logout();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 🎬 场景4：售后流程（工单创建 → 处理 → 关闭）
  // ═══════════════════════════════════════════════════════════════════════
  
  describe('场景4：售后流程 - After-Sales Service', () => {
    
    it('4.1 销售经理创建售后工单', () => {
      cy.log('🎫 测试 4.1：创建售后工单');
      
      // 1. 登录销售经理
      loginAs(accounts.salesManager);
      
      // 2. 导航到售后中心或订单
      cy.visit('http://localhost:5173/service');
      
      // 3. 创建新工单
      cy.contains('button', /创建工单|新建|Create Ticket/i, { timeout: 10000 }).click();
      
      // 4. 填写工单信息
      cy.get('input[name="client_name"]').type('天津钢铁集团');
      cy.get('select[name="service_type"]').select('维修');
      cy.get('input[name="title"]').type('执行器异常噪音');
      cy.get('textarea[name="description"]').type('客户反馈GY-150-DA执行器运行时有异常噪音');
      cy.get('select[name="severity"]').select('中等');
      cy.get('select[name="priority"]').select('高');
      
      // 5. 指派给售后工程师
      cy.get('select[name="assigned_to"]').select(accounts.afterSales.name);
      
      // 6. 提交工单
      cy.contains('button', /创建|提交|Submit/i).click();
      
      // 7. 验证工单创建成功
      cy.contains(/工单|Ticket|创建成功/i, { timeout: 10000 }).should('be.visible');
      
      // 8. 获取工单号
      cy.contains(/TK-\d{6}-\d{4}/i).invoke('text').then((text) => {
        testData.serviceTicketId = text.trim();
        cy.log(`✅ 工单号: ${testData.serviceTicketId}`);
      });
      
      logout();
    });

    it('4.2 售后工程师处理和关闭工单', () => {
      cy.log('🔧 测试 4.2：售后工程师处理工单');
      
      // 1. 登录售后工程师
      loginAs(accounts.afterSales);
      
      // 2. 导航到售后管理
      cy.visit('http://localhost:5173/service');
      
      // 3. 查看我的工单
      cy.contains(/我的工单|My Tickets|待处理/i, { timeout: 10000 }).should('be.visible');
      
      // 4. 点击进入工单详情
      cy.contains(/异常噪音|TK-/i).first().click();
      
      // 5. 接受工单
      cy.contains('button', /接受|开始处理|Accept/i, { timeout: 10000 }).click();
      
      // 6. 验证状态变更
      cy.contains(/处理中|In Progress/i).should('be.visible');
      
      // 7. 添加处理记录
      cy.contains('button', /添加备注|更新/i).click();
      cy.get('textarea[name="note"]').type('已联系客户，确认问题。将安排现场检查。');
      cy.contains('button', /保存|Submit/i).click();
      
      // 8. 标记为已解决
      cy.contains('button', /解决|完成|Resolve/i, { timeout: 10000 }).click();
      
      // 9. 填写解决报告
      cy.get('textarea[name="solution"]').type('更换轴承并重新润滑，问题已解决');
      
      // 10. 关闭工单
      cy.contains('button', /关闭工单|Close/i).click();
      
      // 11. 确认关闭
      cy.contains('button', /确认|Confirm/i).click();
      
      // 12. 验证工单关闭成功
      cy.contains(/已关闭|Closed|完成/i, { timeout: 10000 }).should('be.visible');
      
      logout();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 🏁 最终验证：完整流程回顾
  // ═══════════════════════════════════════════════════════════════════════
  
  describe('🏁 最终验证 - Final Verification', () => {
    
    it('应该完成整个业务流程并验证所有关键数据', () => {
      cy.log('🔍 最终验证：检查整个流程的数据完整性');
      
      // 1. 登录管理员查看整体状态
      loginAs(accounts.admin);
      
      // 2. 验证项目存在且状态正确
      cy.visit('http://localhost:5173/projects');
      cy.contains('天津钢铁厂阀门自动化项目').should('be.visible');
      
      // 3. 验证生产订单存在
      cy.visit('http://localhost:5173/production');
      cy.contains(/PO-\d{6}-\d{4}|天津钢铁/i).should('be.visible');
      
      // 4. 验证采购订单存在
      cy.visit('http://localhost:5173/procurement');
      cy.contains(/PO\d{8}-\d{4}|AT-150-DA/i).should('be.visible');
      
      // 5. 验证售后工单存在
      cy.visit('http://localhost:5173/service');
      cy.contains(/TK-\d{6}-\d{4}|异常噪音/i).should('be.visible');
      
      // 6. 输出测试总结
      cy.log('═══════════════════════════════════════════════════════════════');
      cy.log('🎉 终极验收测试完成！');
      cy.log('═══════════════════════════════════════════════════════════════');
      cy.log(`✅ 项目创建: 天津钢铁厂阀门自动化项目`);
      cy.log(`✅ 技术选型: 2个产品型号`);
      cy.log(`✅ 商务报价: BOM生成成功`);
      cy.log(`✅ 合同签订: 合同流程完成`);
      cy.log(`✅ 生产订单: 生产订单已创建`);
      cy.log(`✅ 采购订单: 采购订单已创建`);
      cy.log(`✅ 生产完工: 工单已完成`);
      cy.log(`✅ 质量检验: 产品质检合格`);
      cy.log(`✅ 物流发货: 发货记录已创建`);
      cy.log(`✅ 售后工单: 工单已关闭`);
      cy.log('═══════════════════════════════════════════════════════════════');
      cy.log('🏆 系统已达到可投入正式使用的标准！');
      cy.log('═══════════════════════════════════════════════════════════════');
      
      logout();
    });
  });
});

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 运行说明
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 1. 准备环境：
 *    - 启动后端: cd backend && npm start
 *    - 启动前端: cd frontend && npm run dev
 *    - 初始化数据: cd backend && npm run seed:final
 * 
 * 2. 运行测试：
 *    - GUI模式: npx cypress open
 *    - 无头模式: npx cypress run --spec "cypress/e2e/final_acceptance_test.cy.js"
 * 
 * 3. 查看结果：
 *    - 测试报告: cypress/reports/
 *    - 截图: cypress/screenshots/
 *    - 视频: cypress/videos/
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */
