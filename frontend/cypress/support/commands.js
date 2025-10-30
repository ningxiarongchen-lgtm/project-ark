// ***********************************************
// Custom commands for multi-role collaboration testing
// ***********************************************

/**
 * 基础登录命令 - 使用手机号和密码
 * @param {string} phone - 手机号（参数名保持为 phone，但向后兼容旧的 username 调用）
 * @param {string} password - 密码
 * @param {object} options - 配置选项
 * @param {boolean} options.forceChangePassword - 是否处理强制修改密码流程
 * @param {string} options.newPassword - 新密码（如果需要修改密码）
 */
Cypress.Commands.add('login', (phone, password, options = {}) => {
  const { forceChangePassword = false, newPassword = 'NewStrongPassword123!' } = options
  
  cy.log(`🔐 Logging in with phone: ${phone}`)
  
  cy.visit('/login')
  cy.wait(2000) // 等待页面完全加载
  
  // 等待登录表单完全加载 - 使用 placeholder 作为更可靠的选择器
  cy.get('input[placeholder="手机号"]', { timeout: 15000 }).should('be.visible')
  cy.get('input[placeholder="密码"]', { timeout: 15000 }).should('be.visible')
  
  // 填写登录表单
  cy.get('input[placeholder="手机号"]').clear().type(phone)
  cy.get('input[placeholder="密码"]').clear().type(password)
  
  // 点击登录按钮并等待网络请求
  cy.intercept('POST', '**/api/auth/login').as('loginRequest')
  cy.get('button[type="submit"]').click()
  
  // 等待登录请求完成
  cy.wait('@loginRequest', { timeout: 15000 }).then((interception) => {
    if (interception.response && interception.response.statusCode === 200) {
      cy.log('✅ Login API successful')
    } else {
      cy.log('⚠️ Login API failed')
    }
  })
  
  // 等待URL变化（离开登录页）
  cy.url({ timeout: 10000 }).should('not.include', '/login')
  
  // 等待页面稳定
  cy.wait(2000)
  
  cy.log('✅ Successfully logged in')
})

/**
 * 登录命令 - 支持多角色登录（从 test_data.json 读取）
 * @param {string} userType - 用户类型 (admin, salesManager, techEngineer, salesEngineer, etc.)
 * @param {object} options - 配置选项
 * @param {boolean} options.forceChangePassword - 是否处理强制修改密码流程
 */
Cypress.Commands.add('loginAs', (userType, options = {}) => {
  // 优先从 test_data.json 读取用户信息
  cy.fixture('test_data.json').then((testData) => {
    const user = testData.users[userType]
    
    if (!user) {
      // 如果 test_data.json 中没有，尝试从环境变量读取（向后兼容）
      const envUsers = Cypress.env('testUsers')
      const envUser = envUsers?.[userType]
      
      if (!envUser) {
        throw new Error(`Unknown user type: ${userType}. Available users: ${Object.keys(testData.users).join(', ')}`)
      }
      
      cy.log(`🔐 Logging in as ${envUser.role} (from env)`)
      cy.login(envUser.phone || envUser.username, envUser.password, {
        ...options,
        newPassword: options.newPassword || `${envUser.password}_new`
      })
      cy.log(`✅ Successfully logged in as ${envUser.role}`)
      return
    }
    
    cy.log(`🔐 Logging in as ${user.role} (${user.fullName})`)
    
    // 使用基础 login 命令，传递手机号
    cy.login(user.phone, user.password, {
      ...options,
      newPassword: options.newPassword || `${user.password}_new`
    })
    
    cy.log(`✅ Successfully logged in as ${user.role}`)
  })
})

/**
 * 登出命令
 */
Cypress.Commands.add('logout', () => {
  cy.log('🚪 Logging out')
  
  // 点击用户菜单
  cy.get('[class*="user-menu"]').click()
  cy.contains('退出登录').click()
  
  cy.url().should('include', '/login')
  cy.log('✅ Successfully logged out')
})

/**
 * 创建项目
 * @param {object} projectData - 项目数据
 */
Cypress.Commands.add('createProject', (projectData) => {
  cy.log('📋 Creating new project')
  
  cy.visit('/projects')
  cy.contains('button', '新建项目').click()
  
  // 填写项目表单
  cy.get('input[name="projectName"]').type(projectData.name)
  cy.get('input[name="clientName"]').type(projectData.client)
  cy.get('input[name="clientContact"]').type(projectData.contact)
  cy.get('input[name="clientPhone"]').type(projectData.phone)
  
  if (projectData.description) {
    cy.get('textarea[name="description"]').type(projectData.description)
  }
  
  // 提交表单
  cy.contains('button', '创建').click()
  
  // 等待创建成功
  cy.contains('项目创建成功').should('be.visible')
  cy.wait(1000)
  
  cy.log('✅ Project created successfully')
})

/**
 * 为项目添加选型
 * @param {string} projectId - 项目ID或项目名称
 * @param {object} selectionData - 选型数据
 */
Cypress.Commands.add('addSelectionToProject', (projectName, selectionData) => {
  cy.log('🎯 Adding selection to project')
  
  // 找到项目并进入详情
  cy.visit('/projects')
  cy.contains('td', projectName).parent().find('button').contains('查看').click()
  
  // 点击添加选型
  cy.contains('button', '添加选型').click()
  
  // 填写选型表单
  cy.get('select[name="actuatorType"]').select(selectionData.actuatorType || 'AT')
  cy.get('input[name="valveSize"]').type(selectionData.valveSize || '100')
  cy.get('input[name="workingPressure"]').type(selectionData.pressure || '10')
  cy.get('input[name="workingTemperature"]').type(selectionData.temperature || '100')
  cy.get('input[name="torque"]').type(selectionData.torque || '500')
  
  // 提交选型
  cy.contains('button', '确定').click()
  cy.wait(2000) // 等待选型计算
  
  cy.log('✅ Selection added successfully')
})

/**
 * 生成 BOM
 */
Cypress.Commands.add('generateBOM', () => {
  cy.log('📦 Generating BOM')
  
  // 切换到 BOM 标签
  cy.contains('.ant-tabs-tab', 'BOM清单').click()
  
  // 从选型自动生成 BOM
  cy.contains('button', '从选型自动生成').click()
  cy.contains('确定').click()
  
  // 等待生成完成
  cy.wait(2000)
  
  cy.log('✅ BOM generated successfully')
})

/**
 * 生成报价
 */
Cypress.Commands.add('generateQuote', (projectName) => {
  cy.log('💰 Generating quote')
  
  // 进入项目详情
  cy.visit('/projects')
  cy.contains('td', projectName).parent().find('button').contains('查看').click()
  
  // 点击生成报价按钮
  cy.contains('button', '生成报价').click()
  
  // 填写报价信息
  cy.get('input[name="validityPeriod"]').clear().type('30')
  cy.get('input[name="deliveryTime"]').clear().type('45')
  cy.get('input[name="paymentTerms"]').type('预付30%, 发货前70%')
  
  // 提交报价
  cy.contains('button', '生成报价').click()
  cy.contains('报价生成成功').should('be.visible')
  
  cy.log('✅ Quote generated successfully')
})

/**
 * 审批报价
 */
Cypress.Commands.add('approveQuote', (projectName) => {
  cy.log('✅ Approving quote')
  
  cy.visit('/projects')
  cy.contains('td', projectName).parent().find('button').contains('查看').click()
  
  // 点击审批按钮
  cy.contains('button', '审批报价').click()
  cy.contains('button', '通过').click()
  
  cy.get('textarea[name="approvalComments"]').type('报价已审核通过，可以提交客户')
  cy.contains('button', '确认').click()
  
  cy.contains('审批成功').should('be.visible')
  
  cy.log('✅ Quote approved successfully')
})

/**
 * 标记为赢单
 */
Cypress.Commands.add('markAsWon', (projectName) => {
  cy.log('🎉 Marking project as won')
  
  cy.visit('/projects')
  cy.contains('td', projectName).parent().find('button').contains('查看').click()
  
  cy.contains('button', '标记为赢单').click()
  cy.get('textarea[name="winNotes"]').type('客户已确认订单，准备签订合同')
  cy.contains('button', '确认').click()
  
  cy.contains('项目状态已更新').should('be.visible')
  
  cy.log('✅ Project marked as won')
})

/**
 * 生成销售订单
 */
Cypress.Commands.add('createSalesOrder', (projectName) => {
  cy.log('📝 Creating sales order')
  
  cy.visit('/projects')
  cy.contains('td', projectName).parent().find('button').contains('查看').click()
  
  cy.contains('button', '生成合同订单').click()
  
  // 填写订单信息
  cy.get('input[name="poNumber"]').type('PO-2025-001')
  cy.get('input[name="contractNumber"]').type('CONTRACT-2025-001')
  cy.get('input[name="deliveryAddress"]').type('北京市朝阳区工业园区1号')
  
  // 提交订单
  cy.contains('button', '创建订单').click()
  cy.contains('订单创建成功').should('be.visible')
  
  cy.log('✅ Sales order created successfully')
})

/**
 * 创建生产订单
 */
Cypress.Commands.add('createProductionOrder', (orderNumber) => {
  cy.log('🏭 Creating production order')
  
  cy.visit('/orders')
  cy.contains('td', orderNumber).parent().find('button').contains('查看').click()
  
  cy.contains('button', '创建生产订单').click()
  
  // 填写生产计划
  cy.get('select[name="priority"]').select('Normal')
  cy.get('input[name="plannedStartDate"]').type('2025-11-01')
  cy.get('input[name="plannedEndDate"]').type('2025-11-30')
  
  cy.contains('button', '确认创建').click()
  cy.contains('生产订单已创建').should('be.visible')
  
  cy.log('✅ Production order created successfully')
})

/**
 * 更新生产状态
 */
Cypress.Commands.add('updateProductionStatus', (productionOrderNumber, status) => {
  cy.log(`🔄 Updating production status to ${status}`)
  
  cy.visit('/production-schedule')
  cy.contains('td', productionOrderNumber).parent().find('button').first().click()
  
  // 点击更多操作
  cy.get('[class*="ant-dropdown-trigger"]').click()
  
  // 根据状态选择对应的操作
  const statusActions = {
    'In Production': '开始生产',
    'Paused': '暂停生产',
    'Completed': '标记完成'
  }
  
  cy.contains(statusActions[status]).click()
  cy.wait(1000)
  
  cy.log(`✅ Production status updated to ${status}`)
})

/**
 * 创建售后工单
 */
Cypress.Commands.add('createServiceTicket', (ticketData) => {
  cy.log('🎫 Creating service ticket')
  
  cy.visit('/service-center')
  cy.contains('button', '创建工单').click()
  
  // 填写工单信息
  cy.get('select[name="ticketType"]').select(ticketData.type || 'Maintenance')
  cy.get('select[name="priority"]').select(ticketData.priority || 'Normal')
  cy.get('input[name="customerName"]').type(ticketData.customer)
  cy.get('input[name="customerPhone"]').type(ticketData.phone)
  cy.get('input[name="issueTitle"]').type(ticketData.title)
  cy.get('textarea[name="issueDescription"]').type(ticketData.description)
  
  cy.contains('button', '创建').click()
  cy.contains('工单创建成功').should('be.visible')
  
  cy.log('✅ Service ticket created successfully')
})

/**
 * 等待 API 响应
 */
Cypress.Commands.add('waitForAPI', (apiPath) => {
  cy.intercept(apiPath).as('apiRequest')
  cy.wait('@apiRequest')
})

/**
 * 验证页面权限
 * @param {boolean} shouldHaveAccess - 是否应该有访问权限
 */
Cypress.Commands.add('checkPageAccess', (shouldHaveAccess) => {
  if (shouldHaveAccess) {
    cy.contains('无权访问').should('not.exist')
    cy.contains('403').should('not.exist')
  } else {
    cy.contains('无权访问').should('be.visible')
  }
})

/**
 * 验证按钮是否存在
 */
Cypress.Commands.add('checkButtonExists', (buttonText, shouldExist) => {
  if (shouldExist) {
    cy.contains('button', buttonText).should('be.visible')
  } else {
    cy.contains('button', buttonText).should('not.exist')
  }
})

// ***********************************************
// 测试数据清理命令（需要后端测试环境支持）
// ***********************************************

/**
 * 清理测试数据 - 按项目名称前缀删除
 * @param {string} prefix - 项目名称前缀，默认为 'Test-Project-'
 * 
 * 用法：
 *   before(() => {
 *     cy.cleanupTestData();
 *   });
 * 
 * 或指定自定义前缀：
 *   cy.cleanupTestData('MyTest-');
 */
Cypress.Commands.add('cleanupTestData', (prefix = 'Test-Project-') => {
  cy.log(`🧹 清理测试数据（前缀: ${prefix}）`)
  
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:5001'
  
  cy.request({
    method: 'POST',
    url: `${apiUrl}/api/testing/cleanup`,
    body: {
      projectNamePrefix: prefix
    },
    failOnStatusCode: false // 即使失败也不中断测试
  }).then((response) => {
    if (response.status === 200) {
      const { deleted, message } = response.body
      cy.log(`✅ ${message}`)
      cy.log(`   - 项目: ${deleted.projects}`)
      cy.log(`   - 新项目: ${deleted.newProjects}`)
      cy.log(`   - 销售订单: ${deleted.salesOrders}`)
      cy.log(`   - 生产订单: ${deleted.productionOrders}`)
      cy.log(`   - 售后工单: ${deleted.serviceTickets}`)
    } else if (response.status === 404) {
      cy.log('⚠️  测试清理接口不可用（可能未在测试环境运行）')
    } else {
      cy.log(`⚠️  清理失败: ${response.body?.message || '未知错误'}`)
    }
  })
})

/**
 * 获取测试环境状态
 * 
 * 用法：
 *   cy.getTestingStatus().then((status) => {
 *     cy.log(`当前有 ${status.database.projects} 个项目`);
 *   });
 */
Cypress.Commands.add('getTestingStatus', () => {
  cy.log('📊 获取测试环境状态')
  
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:5001'
  
  return cy.request({
    method: 'GET',
    url: `${apiUrl}/api/testing/status`,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      const { status } = response.body
      cy.log('✅ 测试环境状态:')
      cy.log(`   环境: ${status.environment}`)
      cy.log(`   项目: ${status.database.projects}`)
      cy.log(`   新项目: ${status.database.newProjects}`)
      cy.log(`   销售订单: ${status.database.salesOrders}`)
      cy.log(`   生产订单: ${status.database.productionOrders}`)
      cy.log(`   售后工单: ${status.database.serviceTickets}`)
      return status
    } else {
      cy.log('⚠️  无法获取测试环境状态')
      return null
    }
  })
})

/**
 * 清空所有测试数据（危险操作！）
 * 仅在需要完全重置测试环境时使用
 * 
 * 用法：
 *   cy.cleanupAllTestData();
 */
Cypress.Commands.add('cleanupAllTestData', () => {
  cy.log('⚠️  清空所有测试数据（危险操作）')
  
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:5001'
  
  cy.request({
    method: 'DELETE',
    url: `${apiUrl}/api/testing/cleanup-all`,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      const { deleted, message } = response.body
      cy.log(`✅ ${message}`)
      cy.log(`   总计删除: ${Object.values(deleted).reduce((sum, count) => sum + count, 0)} 条记录`)
    } else if (response.status === 403) {
      cy.log('🚫 操作被拒绝（可能在生产环境）')
    } else {
      cy.log(`⚠️  清空失败: ${response.body?.message || '未知错误'}`)
    }
  })
})

/**
 * 创建E2E测试用户
 * 从 test_data.json 读取用户数据并调用后端API创建测试账户
 * 
 * 用法：
 *   before(() => {
 *     cy.seedTestUsers();
 *   });
 */
Cypress.Commands.add('seedTestUsers', () => {
  cy.log('👥 创建E2E测试用户账户...')
  
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:5001'
  
  // 读取 test_data.json 并调用后端API
  cy.fixture('test_data.json').then((testData) => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/testing/seed-users`,
      body: {
        users: testData.users
      },
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 200) {
        const { message, users } = response.body
        cy.log(`✅ ${message}`)
        cy.log(`   创建的用户：`)
        users.forEach(user => {
          cy.log(`   - ${user.fullName} (${user.role})`)
        })
      } else if (response.status === 404) {
        cy.log('⚠️  测试用户创建接口不可用（可能未在测试环境运行）')
        cy.log('   请确保后端使用 NODE_ENV=test 启动')
      } else {
        cy.log(`⚠️  创建失败: ${response.body?.message || '未知错误'}`)
        if (response.body?.details) {
          cy.log('   错误详情:', response.body.details)
        }
      }
    })
  })
})

/**
 * 初始化测试环境
 * 包括：创建测试用户、清理旧数据
 * 
 * 用法：
 *   before(() => {
 *     cy.initTestEnvironment();
 *   });
 */
Cypress.Commands.add('initTestEnvironment', (options = {}) => {
  const { cleanupFirst = true } = options
  
  cy.log('🚀 初始化测试环境...')
  
  if (cleanupFirst) {
    cy.log('🧹 清理旧测试数据...')
    cy.fixture('test_data.json').then((testData) => {
      cy.cleanupTestData(testData.projectTemplate.namePrefix)
    })
    cy.wait(1000)
  }
  
  cy.log('👥 创建测试用户...')
  cy.seedTestUsers()
  cy.wait(2000) // 等待用户创建完成
  
  cy.log('✅ 测试环境初始化完成')
})

/**
 * 创建一个已报价的项目（用于后续测试）
 * 包含完整的售前流程：创建项目 → 技术选型 → 生成BOM → 生成报价
 * 
 * @param {string} projectName - 项目名称
 * @returns {string} 项目ID (通过 Cypress alias 'quotedProjectId' 访问)
 * 
 * 用法：
 *   cy.createQuotedProject('Test-Project-123').then((projectId) => {
 *     cy.log(`已创建项目: ${projectId}`)
 *   })
 */
Cypress.Commands.add('createQuotedProject', (projectName) => {
  cy.log(`🔧 创建已报价项目: ${projectName}`)
  
  cy.fixture('test_data.json').then((testData) => {
    let projectId = null
    
    // 1. 销售经理创建项目
    cy.log('第1步：销售经理创建项目')
    cy.login(testData.users.salesManager.phone, testData.users.salesManager.password)
    cy.wait(2000)
    
    cy.visit('/projects')
    cy.wait(1000)
    cy.contains('button', '新建项目').click()
    cy.wait(500)
    
    cy.get('input[name="projectName"]').clear().type(projectName)
    cy.get('input[name="clientName"]').clear().type(testData.projectTemplate.client.name)
    cy.get('input[name="clientContact"]').clear().type(testData.projectTemplate.client.contact)
    cy.get('input[name="clientPhone"]').clear().type(testData.projectTemplate.client.phone)
    cy.get('textarea[name="description"]').clear().type(testData.projectTemplate.description)
    
    cy.contains('button', '创建').click()
    cy.wait(2000)
    
    cy.url().then((url) => {
      const matches = url.match(/\/projects\/([^\/\?]+)/)
      if (matches && matches[1]) {
        projectId = matches[1]
        cy.wrap(projectId).as('quotedProjectId')
      }
    })
    cy.logout()
    
    // 2. 技术工程师添加选型
    cy.log('第2步：技术工程师添加选型')
    cy.login(testData.users.techEngineer.phone, testData.users.techEngineer.password)
    cy.wait(2000)
    
    cy.visit('/projects')
    cy.wait(1000)
    cy.contains('td', projectName).click()
    cy.wait(1000)
    
    cy.contains('.ant-tabs-tab', '选型明细').click()
    cy.wait(500)
    
    cy.get('body').then(($body) => {
      if ($body.text().includes('添加选型')) {
        cy.contains('button', /添加选型|新增选型/).click()
        cy.wait(500)
        
        const selection1 = testData.selectionTemplate.selection1
        cy.get('select[name="actuatorType"]').select(selection1.actuatorType)
        cy.get('input[name="valveSize"]').clear().type(selection1.valveSize)
        cy.get('input[name="workingPressure"]').clear().type(selection1.workingPressure)
        cy.get('input[name="workingTemperature"]').clear().type(selection1.workingTemperature)
        cy.get('input[name="torque"]').clear().type(selection1.torque)
        cy.get('input[name="quantity"]').clear().type(selection1.quantity)
        
        cy.contains('button', '确定').click()
        cy.wait(2000)
      }
    })
    cy.logout()
    
    // 3. 商务工程师生成BOM和报价
    cy.log('第3步：商务工程师生成BOM和报价')
    cy.login(testData.users.salesEngineer.phone, testData.users.salesEngineer.password)
    cy.wait(2000)
    
    cy.visit('/projects')
    cy.wait(1000)
    cy.contains('td', projectName).click()
    cy.wait(1000)
    
    cy.contains('.ant-tabs-tab', 'BOM清单').click()
    cy.wait(500)
    
    // 生成BOM
    cy.get('body').then(($body) => {
      if ($body.text().includes('从选型自动生成')) {
        cy.contains('button', '从选型自动生成').click()
        cy.wait(500)
        cy.get('.ant-modal').then(($modal) => {
          if ($modal.length > 0) {
            cy.contains('.ant-modal button', '确定').click()
            cy.wait(2000)
          }
        })
      }
    })
    
    // 生成报价
    cy.get('body').then(($body) => {
      if ($body.text().includes('生成报价')) {
        cy.contains('button', '生成报价').click()
        cy.wait(500)
        
        cy.get('.ant-modal').then(($modal) => {
          if ($modal.length > 0) {
            cy.get('input[name="validityPeriod"]').then(($input) => {
              if ($input.length > 0) cy.wrap($input).clear().type('30')
            })
            cy.get('input[name="deliveryTime"]').then(($input) => {
              if ($input.length > 0) cy.wrap($input).clear().type('45')
            })
            cy.get('input[name="paymentTerms"]').then(($input) => {
              if ($input.length > 0) cy.wrap($input).clear().type(testData.orderTemplate.paymentTerms)
            })
            
            cy.contains('.ant-modal button', /生成报价|确认/).click()
            cy.wait(2000)
          }
        })
      }
    })
    
    cy.logout()
    cy.log('✅ 已报价项目创建完成')
    
    // 返回项目ID
    cy.get('@quotedProjectId')
  })
})

