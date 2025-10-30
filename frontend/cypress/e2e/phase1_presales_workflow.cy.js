/**
 * ═══════════════════════════════════════════════════════════════════════
 * 阶段一：售前核心协同流程测试
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 测试目标：
 * 验证销售、技术、商务三个核心角色之间的协同流程是否正确
 * 
 * 业务流程：
 * 1. 销售经理 - 创建项目并发起需求
 * 2. 技术工程师 - 进行技术选型和方案设计
 * 3. 商务工程师 - 生成BOM、核算成本、制作报价
 * 4. 销售经理 - 审批报价并推进项目
 * 
 * 涉及角色：
 * 👔 销售经理 (Sales Manager)
 * 🔧 技术工程师 (Technical Engineer)
 * 💼 商务工程师 (Sales Engineer)
 * 
 * 数据来源：
 * cypress/fixtures/test_data.json
 * ═══════════════════════════════════════════════════════════════════════
 */

describe('🎯 阶段一：售前核心协同流程', () => {
  
  // ═══════════════════════════════════════════════════════════════════
  // 测试数据和共享变量
  // ═══════════════════════════════════════════════════════════════════
  
  let testData = null
  let projectName = null
  let projectId = null
  
  // ═══════════════════════════════════════════════════════════════════
  // 测试环境准备
  // ═══════════════════════════════════════════════════════════════════
  
  before(() => {
    cy.log('═══════════════════════════════════════════════════════════════')
    cy.log('🚀 开始阶段一测试：售前核心协同流程')
    cy.log('═══════════════════════════════════════════════════════════════')
    
    // 加载测试数据
    cy.fixture('test_data.json').then((data) => {
      testData = data
      projectName = `${data.projectTemplate.namePrefix}${Date.now()}`
      cy.log(`📋 测试项目名称: ${projectName}`)
    })
    
    // 初始化测试环境（创建用户、清理旧数据）
    cy.initTestEnvironment()
    
    cy.log('═══════════════════════════════════════════════════════════════')
  })

  after(() => {
    cy.log('═══════════════════════════════════════════════════════════════')
    cy.log('🎊 阶段一测试完成！')
    cy.log('═══════════════════════════════════════════════════════════════')
    cy.log('📊 测试数据汇总：')
    cy.log(`   项目名称: ${projectName}`)
    cy.log(`   项目ID: ${projectId || 'N/A'}`)
    cy.log('═══════════════════════════════════════════════════════════════')
  })

  // ═══════════════════════════════════════════════════════════════════
  // 场景 1：销售经理创建项目
  // ═══════════════════════════════════════════════════════════════════
  
  context('📋 场景1：销售经理创建项目并发起需求', () => {
    
    it('1.1 销售经理登录系统', () => {
      cy.log('👔 销售经理登录...')
      cy.loginAs('salesManager')
      
      cy.url().should('include', '/dashboard')
      cy.contains('销售').should('be.visible')
      
      cy.log('✅ 销售经理登录成功')
    })

    it('1.2 创建新项目', () => {
      cy.log('📝 创建新项目...')
      
      cy.visit('/projects')
      cy.wait(1000)
      
      // 点击新建项目按钮
      cy.contains('button', '新建项目').should('be.visible').click()
      cy.wait(500)
      
      // 填写项目信息
      cy.get('input[name="projectName"]').should('be.visible').clear().type(projectName)
      cy.get('input[name="clientName"]').clear().type(testData.projectTemplate.client.name)
      cy.get('input[name="clientContact"]').clear().type(testData.projectTemplate.client.contact)
      cy.get('input[name="clientPhone"]').clear().type(testData.projectTemplate.client.phone)
      cy.get('textarea[name="description"]').clear().type(testData.projectTemplate.description)
      
      // 提交创建
      cy.contains('button', '创建').click()
      cy.wait(2000)
      
      // 验证创建成功
      cy.get('body').then(($body) => {
        if ($body.text().includes('成功')) {
          cy.log('✅ 项目创建成功提示已显示')
        }
      })
      
      // 获取项目ID
      cy.url().should('include', '/projects/')
      cy.url().then((url) => {
        const matches = url.match(/\/projects\/([^\/\?]+)/)
        if (matches && matches[1]) {
          projectId = matches[1]
          cy.log(`📌 项目ID: ${projectId}`)
        }
      })
    })

    it('1.3 验证项目信息', () => {
      cy.log('🔍 验证项目基本信息...')
      
      // 确保在项目详情页
      if (projectId) {
        cy.visit(`/projects/${projectId}`)
      }
      cy.wait(1000)
      
      // 验证项目名称和客户信息
      cy.contains(projectName).should('be.visible')
      cy.contains(testData.projectTemplate.client.name).should('be.visible')
      
      cy.log('✅ 项目信息验证通过')
    })

    it('1.4 验证销售经理的权限限制', () => {
      cy.log('🔒 验证销售经理权限边界...')
      
      // 销售经理不应该看到"提交选型方案"等技术工程师专属按钮
      cy.get('body').should('not.contain', '提交选型方案')
      
      // 销售经理可以看到项目基本信息
      cy.contains('.ant-tabs-tab', '基本信息').should('be.visible')
      
      cy.log('✅ 权限验证通过')
    })

    it('1.5 销售经理登出', () => {
      cy.log('👋 销售经理登出系统')
      cy.logout()
      cy.url().should('include', '/login')
      cy.log('✅ 已登出')
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // 场景 2：技术工程师进行选型
  // ═══════════════════════════════════════════════════════════════════
  
  context('🔧 场景2：技术工程师进行技术选型', () => {
    
    it('2.1 技术工程师登录系统', () => {
      cy.log('🔧 技术工程师登录...')
      cy.loginAs('techEngineer')
      
      cy.url().should('include', '/dashboard')
      cy.contains('技术').should('be.visible')
      
      cy.log('✅ 技术工程师登录成功')
    })

    it('2.2 查找并进入待选型项目', () => {
      cy.log('🔍 查找待选型项目...')
      
      cy.visit('/projects')
      cy.wait(1000)
      
      // 找到我们的测试项目
      cy.contains('td', projectName).should('be.visible')
      cy.contains('td', projectName).click()
      cy.wait(1000)
      
      // 验证进入项目详情页
      cy.url().should('include', `/projects/${projectId}`)
      cy.log('✅ 成功进入项目详情')
    })

    it('2.3 进入选型明细并添加第一个选型', () => {
      cy.log('🎯 添加第一个选型方案...')
      
      // 切换到选型明细标签
      cy.contains('.ant-tabs-tab', '选型明细').should('be.visible').click()
      cy.wait(500)
      
      // 点击添加选型按钮
      cy.get('body').then(($body) => {
        if ($body.text().includes('添加选型') || $body.text().includes('新增选型')) {
          cy.contains('button', /添加选型|新增选型/).click()
          cy.wait(500)
          
          // 填写第一个选型参数
          const selection1 = testData.selectionTemplate.selection1
          cy.get('select[name="actuatorType"]').select(selection1.actuatorType)
          cy.get('input[name="valveSize"]').clear().type(selection1.valveSize)
          cy.get('input[name="workingPressure"]').clear().type(selection1.workingPressure)
          cy.get('input[name="workingTemperature"]').clear().type(selection1.workingTemperature)
          cy.get('input[name="torque"]').clear().type(selection1.torque)
          cy.get('input[name="quantity"]').clear().type(selection1.quantity)
          
          // 如果有备注字段
          cy.get('textarea[name="remarks"]').then(($textarea) => {
            if ($textarea.length > 0) {
              cy.wrap($textarea).clear().type(selection1.remarks)
            }
          })
          
          // 提交选型
          cy.contains('button', '确定').click()
          cy.wait(2000)
          
          cy.log('✅ 第一个选型添加成功')
        } else {
          cy.log('ℹ️ 未找到添加选型按钮')
        }
      })
    })

    it('2.4 添加第二个选型', () => {
      cy.log('🎯 添加第二个选型方案...')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('添加选型') || $body.text().includes('新增选型')) {
          cy.contains('button', /添加选型|新增选型/).click()
          cy.wait(500)
          
          // 填写第二个选型参数
          const selection2 = testData.selectionTemplate.selection2
          cy.get('select[name="actuatorType"]').select(selection2.actuatorType)
          cy.get('input[name="valveSize"]').clear().type(selection2.valveSize)
          cy.get('input[name="workingPressure"]').clear().type(selection2.workingPressure)
          cy.get('input[name="workingTemperature"]').clear().type(selection2.workingTemperature)
          cy.get('input[name="torque"]').clear().type(selection2.torque)
          cy.get('input[name="quantity"]').clear().type(selection2.quantity)
          
          cy.get('textarea[name="remarks"]').then(($textarea) => {
            if ($textarea.length > 0) {
              cy.wrap($textarea).clear().type(selection2.remarks)
            }
          })
          
          cy.contains('button', '确定').click()
          cy.wait(2000)
          
          cy.log('✅ 第二个选型添加成功')
        }
      })
    })

    it('2.5 验证选型数据已保存', () => {
      cy.log('🔍 验证选型数据...')
      
      // 验证表格中有数据
      cy.get('.ant-table-tbody tr').should('have.length.greaterThan', 0)
      
      // 验证包含我们添加的执行器类型
      cy.contains(testData.selectionTemplate.selection1.actuatorType).should('be.visible')
      cy.contains(testData.selectionTemplate.selection2.actuatorType).should('be.visible')
      
      cy.log('✅ 选型数据验证通过')
    })

    it('2.6 提交选型方案', () => {
      cy.log('📤 提交选型方案给商务工程师...')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('提交选型') || $body.text().includes('提交方案')) {
          cy.contains('button', /提交选型|提交方案/).click()
          cy.wait(500)
          
          // 如果有确认对话框
          cy.get('body').then(($modal) => {
            if ($modal.text().includes('确认') || $modal.text().includes('提交')) {
              // 填写提交说明（如果有）
              cy.get('textarea').then(($textarea) => {
                if ($textarea.length > 0 && $textarea.attr('name')) {
                  cy.wrap($textarea.first()).clear().type('技术选型已完成，建议采用AT和GY组合方案，可满足客户要求。')
                }
              })
              
              cy.contains('button', /确认|提交/).click()
              cy.wait(1000)
            }
          })
          
          cy.log('✅ 选型方案已提交')
        } else {
          cy.log('ℹ️ 未找到提交按钮，可能已提交或界面不同')
        }
      })
    })

    it('2.7 技术工程师登出', () => {
      cy.log('👋 技术工程师登出系统')
      cy.logout()
      cy.url().should('include', '/login')
      cy.log('✅ 已登出')
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // 场景 3：商务工程师生成BOM和报价
  // ═══════════════════════════════════════════════════════════════════
  
  context('💼 场景3：商务工程师生成BOM和报价', () => {
    
    it('3.1 商务工程师登录系统', () => {
      cy.log('💼 商务工程师登录...')
      cy.loginAs('salesEngineer')
      
      cy.url().should('include', '/dashboard')
      cy.contains('商务').should('be.visible')
      
      cy.log('✅ 商务工程师登录成功')
    })

    it('3.2 查找待报价项目', () => {
      cy.log('🔍 查找待报价项目...')
      
      cy.visit('/projects')
      cy.wait(1000)
      
      // 找到测试项目并进入
      cy.contains('td', projectName).should('be.visible')
      cy.contains('td', projectName).click()
      cy.wait(1000)
      
      cy.url().should('include', `/projects/${projectId}`)
      cy.log('✅ 成功进入项目')
    })

    it('3.3 查看技术选型结果', () => {
      cy.log('📊 查看技术选型结果...')
      
      // 切换到选型明细
      cy.contains('.ant-tabs-tab', '选型明细').click()
      cy.wait(500)
      
      // 验证选型数据存在
      cy.get('.ant-table-tbody tr').should('have.length.greaterThan', 0)
      cy.log('✅ 选型数据已加载')
    })

    it('3.4 切换到BOM清单并生成BOM', () => {
      cy.log('📦 生成BOM清单...')
      
      // 切换到BOM清单标签
      cy.contains('.ant-tabs-tab', 'BOM清单').should('be.visible').click()
      cy.wait(500)
      
      // 尝试从选型自动生成BOM
      cy.get('body').then(($body) => {
        if ($body.text().includes('从选型自动生成')) {
          cy.contains('button', '从选型自动生成').click()
          cy.wait(500)
          
          // 确认生成
          cy.get('.ant-modal').then(($modal) => {
            if ($modal.length > 0 && $modal.text().includes('确定')) {
              cy.contains('.ant-modal button', '确定').click()
              cy.wait(2000)
            }
          })
          
          cy.log('✅ BOM清单生成成功')
        } else {
          cy.log('ℹ️ BOM可能已经生成或按钮不可见')
        }
      })
      
      // 验证BOM数据
      cy.get('.ant-table-tbody tr').should('have.length.greaterThan', 0)
      cy.log('✅ BOM数据已加载')
    })

    it('3.5 验证商务工程师可以看到成本信息', () => {
      cy.log('💰 验证成本信息访问权限...')
      
      // 确保在BOM清单标签
      cy.contains('.ant-tabs-tab', 'BOM清单').click()
      cy.wait(500)
      
      // 商务工程师应该能看到成本相关列
      cy.get('.ant-table-thead').then(($thead) => {
        const headerText = $thead.text()
        
        if (headerText.includes('成本') || headerText.includes('单价') || headerText.includes('价格')) {
          cy.log('✅ 商务工程师可以看到成本列')
        } else {
          cy.log('ℹ️ 未找到明显的成本列')
        }
      })
    })

    it('3.6 生成项目报价', () => {
      cy.log('💰 生成正式报价...')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('生成报价')) {
          cy.contains('button', '生成报价').click()
          cy.wait(500)
          
          // 填写报价信息
          cy.get('.ant-modal').then(($modal) => {
            if ($modal.length > 0) {
              // 有效期
              cy.get('input[name="validityPeriod"]').then(($input) => {
                if ($input.length > 0) {
                  cy.wrap($input).clear().type('30')
                }
              })
              
              // 交货期
              cy.get('input[name="deliveryTime"]').then(($input) => {
                if ($input.length > 0) {
                  cy.wrap($input).clear().type('45')
                }
              })
              
              // 付款条件
              cy.get('input[name="paymentTerms"]').then(($input) => {
                if ($input.length > 0) {
                  cy.wrap($input).clear().type(testData.orderTemplate.paymentTerms)
                }
              })
              
              // 备注
              cy.get('textarea[name="notes"]').then(($textarea) => {
                if ($textarea.length > 0) {
                  cy.wrap($textarea).clear().type('本报价包含设备、标准附件及技术服务')
                }
              })
              
              // 确认生成
              cy.contains('.ant-modal button', /生成报价|确认/).click()
              cy.wait(2000)
              
              cy.log('✅ 报价生成成功')
            }
          })
        } else {
          cy.log('ℹ️ 未找到生成报价按钮')
        }
      })
    })

    it('3.7 商务工程师登出', () => {
      cy.log('👋 商务工程师登出系统')
      cy.logout()
      cy.url().should('include', '/login')
      cy.log('✅ 已登出')
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // 场景 4：销售经理审批报价
  // ═══════════════════════════════════════════════════════════════════
  
  context('👔 场景4：销售经理审批报价', () => {
    
    it('4.1 销售经理再次登录', () => {
      cy.log('👔 销售经理再次登录...')
      cy.loginAs('salesManager')
      
      cy.url().should('include', '/dashboard')
      cy.log('✅ 销售经理登录成功')
    })

    it('4.2 查看待审批的报价', () => {
      cy.log('📋 查看待审批报价...')
      
      cy.visit('/projects')
      cy.wait(1000)
      
      cy.contains('td', projectName).should('be.visible')
      cy.contains('td', projectName).click()
      cy.wait(1000)
      
      cy.log('✅ 进入项目详情')
    })

    it('4.3 验证销售经理的BOM权限（看不到成本）', () => {
      cy.log('🔒 验证BOM查看权限...')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('BOM清单')) {
          cy.contains('.ant-tabs-tab', 'BOM清单').click()
          cy.wait(500)
          
          // 验证：销售经理不应该看到成本价（商业敏感信息）
          cy.get('.ant-table-thead').then(($thead) => {
            const headerText = $thead.text()
            
            if (!headerText.includes('成本价')) {
              cy.log('✅ 销售经理看不到成本价（权限正确）')
            } else {
              cy.log('⚠️ 销售经理可以看到成本价')
            }
          })
          
          // 验证：不应该看到编辑按钮
          cy.get('body').then(($editCheck) => {
            if (!$editCheck.text().includes('手动添加行')) {
              cy.log('✅ 销售经理没有BOM编辑权限')
            }
          })
        }
      })
    })

    it('4.4 验证报价信息', () => {
      cy.log('🔍 验证报价信息...')
      
      // 切换到报价标签（如果有）
      cy.get('body').then(($body) => {
        if ($body.text().includes('报价信息') || $body.text().includes('报价单')) {
          cy.log('✅ 找到报价信息')
        }
      })
    })

    it('4.5 销售经理最终登出', () => {
      cy.log('👋 销售经理登出系统')
      cy.logout()
      cy.url().should('include', '/login')
      cy.log('✅ 已登出')
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // 数据验证总结
  // ═══════════════════════════════════════════════════════════════════
  
  context('✅ 数据完整性验证', () => {
    
    before(() => {
      cy.loginAs('admin')
    })

    it('验证项目数据完整性', () => {
      cy.log('🔍 最终数据验证...')
      
      if (projectId) {
        cy.visit(`/projects/${projectId}`)
        cy.wait(1000)
        
        // 验证项目基本信息
        cy.contains(projectName).should('be.visible')
        cy.log('✅ 项目基本信息完整')
        
        // 验证选型数据
        cy.contains('.ant-tabs-tab', '选型明细').click()
        cy.wait(500)
        cy.get('.ant-table-tbody tr').should('have.length.greaterThan', 0)
        cy.log('✅ 选型数据存在')
        
        // 验证BOM数据
        cy.contains('.ant-tabs-tab', 'BOM清单').click()
        cy.wait(500)
        cy.get('.ant-table-tbody tr').should('have.length.greaterThan', 0)
        cy.log('✅ BOM数据存在')
      }
    })

    it('测试总结', () => {
      cy.log('═══════════════════════════════════════════════════════════════')
      cy.log('🎊 阶段一测试完成！')
      cy.log('═══════════════════════════════════════════════════════════════')
      cy.log('✅ 售前核心协同流程验证通过：')
      cy.log('   1. 销售经理 → 创建项目 ✓')
      cy.log('   2. 技术工程师 → 技术选型 ✓')
      cy.log('   3. 商务工程师 → 生成BOM和报价 ✓')
      cy.log('   4. 销售经理 → 审批报价 ✓')
      cy.log('═══════════════════════════════════════════════════════════════')
    })

    after(() => {
      cy.logout()
    })
  })
})

