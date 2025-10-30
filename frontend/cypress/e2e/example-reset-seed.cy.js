/**
 * E2E 测试示例 - 使用 reset-and-seed 接口
 * 
 * 此测试展示了如何使用测试辅助函数来创建可重复的 E2E 测试
 */

describe('示例：使用 Reset-and-Seed 的 E2E 测试', () => {
  
  // ==================== 每个测试前重置数据库 ====================
  beforeEach(() => {
    // 重置数据库并填充测试数据
    cy.resetDatabase();
  });

  // ==================== 测试套件 1：用户登录 ====================
  describe('用户登录流程', () => {
    
    it('管理员应该能够成功登录', () => {
      cy.loginAsRole('Administrator');
      
      // 验证登录成功后的页面
      cy.url().should('include', '/dashboard');
      cy.contains('Admin User').should('be.visible');
    });

    it('销售经理应该能够成功登录', () => {
      cy.loginAsRole('Sales Manager');
      
      cy.url().should('include', '/dashboard');
      cy.contains('Sales Manager User').should('be.visible');
    });

    it('技术工程师应该能够成功登录', () => {
      cy.loginAsRole('Technical Engineer');
      
      cy.url().should('include', '/dashboard');
      cy.contains('Tech Engineer User').should('be.visible');
    });

    it('错误的密码应该登录失败', () => {
      cy.visit('/login');
      cy.get('input[name="phone"]').type('18800000001');
      cy.get('input[name="password"]').type('WrongPassword123!');
      cy.get('button[type="submit"]').click();
      
      // 应该显示错误消息
      cy.contains('密码错误').should('be.visible');
      cy.url().should('include', '/login');
    });
  });

  // ==================== 测试套件 2：权限控制 ====================
  describe('角色权限控制', () => {
    
    it('管理员应该能访问用户管理页面', () => {
      cy.loginAsRole('Administrator');
      
      cy.visit('/admin/users');
      cy.url().should('include', '/admin/users');
      cy.contains('用户管理').should('be.visible');
    });

    it('销售工程师不应该能访问用户管理页面', () => {
      cy.loginAsRole('Sales Engineer');
      
      cy.visit('/admin/users');
      
      // 应该被重定向或显示权限不足
      cy.url().should('not.include', '/admin/users');
      cy.contains('权限不足').should('be.visible');
    });
  });

  // ==================== 测试套件 3：业务流程 ====================
  describe('项目创建流程', () => {
    
    it('销售经理应该能创建新项目', () => {
      cy.loginAsRole('Sales Manager');
      
      // 访问项目创建页面
      cy.visit('/projects/new');
      
      // 填写项目信息
      cy.get('input[name="projectName"]').type('E2E-Test-Project-001');
      cy.get('input[name="customerName"]').type('E2E测试客户');
      cy.get('input[name="budget"]').type('100000');
      
      // 选择执行器产品（使用测试数据中的产品）
      cy.get('[data-testid="product-select"]').click();
      cy.contains('SF10-DA').click();
      
      // 提交表单
      cy.get('button[type="submit"]').click();
      
      // 验证创建成功
      cy.contains('项目创建成功').should('be.visible');
      cy.url().should('include', '/projects/');
      cy.contains('E2E-Test-Project-001').should('be.visible');
    });

    it('创建的项目应该出现在项目列表中', () => {
      cy.loginAsRole('Sales Manager');
      
      // 先创建一个项目
      cy.visit('/projects/new');
      cy.get('input[name="projectName"]').type('E2E-List-Test-001');
      cy.get('input[name="customerName"]').type('列表测试客户');
      cy.get('button[type="submit"]').click();
      
      // 访问项目列表
      cy.visit('/projects');
      
      // 验证项目出现在列表中
      cy.contains('E2E-List-Test-001').should('be.visible');
      cy.contains('列表测试客户').should('be.visible');
    });
  });

  // ==================== 测试套件 4：数据一致性 ====================
  describe('数据一致性验证', () => {
    
    it('每次测试都应该从相同的初始状态开始', () => {
      cy.loginAsRole('Administrator');
      
      // 访问用户列表页面
      cy.visit('/admin/users');
      
      // 验证用户数量（应该始终是10个测试用户）
      cy.get('[data-testid="user-row"]').should('have.length', 10);
      
      // 验证第一个用户是管理员
      cy.get('[data-testid="user-row"]').first()
        .should('contain', 'Admin User')
        .and('contain', 'Administrator');
    });

    it('产品库存应该包含测试数据中的所有产品', () => {
      cy.loginAsRole('Technical Engineer');
      
      cy.visit('/products');
      
      // 验证代表性产品存在
      cy.contains('SF10-DA').should('be.visible');
      cy.contains('SF16-DA').should('be.visible');
      cy.contains('SF10-SR-K8').should('be.visible');
      cy.contains('AT100-DA').should('be.visible');
    });
  });

  // ==================== 清理特定测试数据 ====================
  afterEach(() => {
    // 清理本测试创建的项目（可选）
    cy.cleanupTestData('E2E-Test-Project-');
    cy.cleanupTestData('E2E-List-Test-');
  });
});

// ==================== 高级测试示例 ====================
describe('高级示例：使用自定义测试数据', () => {
  
  it('应该能使用自定义数据重置数据库', () => {
    // 使用自定义数据重置数据库
    cy.request({
      method: 'POST',
      url: '/api/testing/reset-and-seed',
      body: {
        clearAll: true,
        seedData: {
          users: [
            {
              full_name: 'Custom Test User',
              phone: '19900000001',
              password: 'CustomPassword123!',
              role: 'Administrator',
              department: '自定义部门',
              isActive: true,
              passwordChangeRequired: false
            }
          ]
        }
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      
      // 使用自定义用户登录
      cy.login('19900000001', 'CustomPassword123!');
      
      cy.url().should('include', '/dashboard');
      cy.contains('Custom Test User').should('be.visible');
    });
  });
});

// ==================== 性能测试示例 ====================
describe('性能测试：数据库重置速度', () => {
  
  it('数据库重置应该在合理时间内完成', () => {
    const startTime = Date.now();
    
    cy.request({
      method: 'POST',
      url: '/api/testing/reset-and-seed',
      body: { clearAll: true }
    }).then((response) => {
      const duration = Date.now() - startTime;
      
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      
      // 验证操作在5秒内完成
      expect(duration).to.be.lessThan(5000);
      
      cy.log(`✅ 数据库重置耗时: ${duration}ms`);
    });
  });
});

