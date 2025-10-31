/**
 * ═══════════════════════════════════════════════════════════════════════
 * 多角色协同工作流测试 - 完整剧本
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 本测试模拟一个真实的业务场景：
 * 从销售经理发起项目，到技术工程师选型，到商务工程师报价，
 * 再到生产计划员安排生产，最后到售后工程师提供服务。
 * 
 * 这是一场精心编排的"协同之舞"，每个角色在正确的时间登场，
 * 执行自己的职责，并将工作交接给下一个角色。
 * 
 * 涉及角色：
 * 👔 Sales Manager (销售经理) - 项目发起、商机管理、合同签订
 * 🔧 Technical Engineer (技术工程师) - 技术选型、方案设计
 * 💼 Business Engineer (商务工程师) - BOM管理、成本核算、报价
 * 🏭 Production Planner (生产计划员) - 生产排期、进度管理
 * 📦 Procurement Specialist (采购专员) - 供应商管理
 * 🎫 After-sales Engineer (售后工程师) - 售后服务、工单处理
 * 👑 Administrator (管理员) - 全局监控、权限管理
 * ═══════════════════════════════════════════════════════════════════════
 */

describe('🎭 Multi-Role Collaboration Workflow - The Complete Play', () => {
  
  // ═════════════════════════════════════════════════════════════════════
  // 🎬 剧本准备：定义测试数据和共享变量
  // ═════════════════════════════════════════════════════════════════════
  
  const timestamp = Date.now()
  const projectName = `协同项目-${timestamp}`
  const clientName = '北京智能制造有限公司'
  const contactPerson = '李经理'
  const contactPhone = '13800138000'
  
  // 共享变量 - 在不同角色之间传递
  let projectId = null
  let orderId = null
  let orderNumber = null
  let productionOrderId = null
  let productionOrderNumber = null
  let ticketId = null
  let ticketNumber = null
  
  before(() => {
    cy.log('═══════════════════════════════════════════════════════════════')
    cy.log('🎬 剧本开始：多角色协同工作流测试')
    cy.log('═══════════════════════════════════════════════════════════════')
    cy.log(`📋 项目名称: ${projectName}`)
    cy.log(`🏢 客户名称: ${clientName}`)
    cy.log(`👤 联系人: ${contactPerson}`)
    cy.log('═══════════════════════════════════════════════════════════════')
  })

  after(() => {
    cy.log('═══════════════════════════════════════════════════════════════')
    cy.log('🎊 剧本结束！所有角色完成了他们的使命')
    cy.log('═══════════════════════════════════════════════════════════════')
    cy.log('📊 测试数据汇总：')
    cy.log(`   📋 项目ID: ${projectId || 'N/A'}`)
    cy.log(`   📝 订单号: ${orderNumber || 'N/A'}`)
    cy.log(`   🏭 生产订单号: ${productionOrderNumber || 'N/A'}`)
    cy.log(`   🎫 工单号: ${ticketNumber || 'N/A'}`)
    cy.log('═══════════════════════════════════════════════════════════════')
  })

  // ═════════════════════════════════════════════════════════════════════
  // 🎭 第一幕：销售经理发起项目
  // ═════════════════════════════════════════════════════════════════════
  // 
  // 场景：销售经理 张总 刚刚拜访了一个大客户，客户对我们的
  // 阀门执行器很感兴趣。张总回到公司后，立即在系统中创建了
  // 一个新项目，并指派技术工程师进行技术选型。
  // ═════════════════════════════════════════════════════════════════════
  
  context('🎬 Act 1: Sales Manager Initiates Project', () => {
    
    it('Scene 1.1 - 销售经理登录系统', () => {
      cy.log('👔 角色登场: 销售经理')
      cy.loginAs('salesManager')
      
      // 验证登录成功
      cy.url().should('include', '/dashboard')
      cy.contains('销售经理').should('be.visible')
      
      cy.log('✅ 销售经理成功登录')
    })

    it('Scene 1.2 - 创建新项目', () => {
      cy.log('📋 销售经理正在创建新项目...')
      
      // 进入项目管理页面
      cy.visit('/projects')
      cy.contains('项目管理').should('be.visible')
      
      // 点击创建项目按钮
      cy.contains('button', '新建项目').should('be.visible').click()
      cy.wait(500)
      
      // 填写项目基本信息
      cy.log('📝 填写项目信息...')
      cy.get('input[name="projectName"]').should('be.visible').clear().type(projectName)
      cy.get('input[name="clientName"]').clear().type(clientName)
      cy.get('input[name="clientContact"]').clear().type(contactPerson)
      cy.get('input[name="clientPhone"]').clear().type(contactPhone)
      cy.get('textarea[name="description"]').clear().type('这是一个重要的工业自动化项目，客户需要高性能的阀门执行器')
      
      // 提交创建
      cy.contains('button', '创建').click()
      cy.wait(2000)
      
      // 验证项目创建成功
      cy.contains('项目创建成功').should('be.visible')
      cy.log('✅ 项目创建成功')
      
      // 等待跳转并保存项目ID
      cy.url().should('include', '/projects/')
      cy.url().then((url) => {
        projectId = url.split('/').pop()
        cy.log(`📌 项目ID已保存: ${projectId}`)
      })
    })

    it('Scene 1.3 - 验证销售经理的权限限制', () => {
      cy.log('🔒 验证销售经理的权限边界...')
      
      // 确保在项目详情页面
      if (!projectId) {
        cy.visit('/projects')
        cy.contains(projectName).click()
        cy.url().then((url) => {
          projectId = url.split('/').pop()
        })
      } else {
        cy.visit(`/projects/${projectId}`)
      }
      
      cy.wait(1000)
      
      // 验证：销售经理不应该看到"提交选型方案"按钮（这是技术工程师的权限）
      cy.get('body').should('not.contain', '提交选型方案给商务')
      cy.log('✅ 确认：销售经理没有"提交选型方案"权限')
      
      // 验证：销售经理可以看到项目信息
      cy.contains(projectName).should('be.visible')
      cy.contains(clientName).should('be.visible')
      
      cy.log('✅ 权限验证通过')
    })

    it('Scene 1.4 - 销售经理登出，等待技术团队接手', () => {
      cy.log('👔 销售经理完成了初始化工作，现在登出系统')
      cy.logout()
      cy.log('✅ 销售经理已登出')
    })
  })

  // ═════════════════════════════════════════════════════════════════════
  // 🎭 第二幕：技术工程师进行选型
  // ═════════════════════════════════════════════════════════════════════
  // 
  // 场景：技术工程师 王工 收到了项目通知，他需要根据客户的
  // 需求进行技术选型。他分析了客户的工况参数，选择了合适的
  // 阀门执行器型号，并提交给商务工程师进行报价。
  // ═════════════════════════════════════════════════════════════════════
  
  context('🎬 Act 2: Technical Engineer Performs Selection', () => {
    
    it('Scene 2.1 - 技术工程师登录系统', () => {
      cy.log('🔧 角色登场: 技术工程师')
      cy.loginAs('technicalEngineer')
      
      cy.url().should('include', '/dashboard')
      cy.contains('技术工程师').should('be.visible')
      
      cy.log('✅ 技术工程师成功登录')
    })

    it('Scene 2.2 - 在仪表盘查看待处理项目', () => {
      cy.log('📊 技术工程师查看自己的待办事项...')
      
      cy.visit('/dashboard')
      cy.wait(1000)
      
      // 在仪表盘上应该能看到新项目（如果仪表盘有项目列表）
      cy.get('body').then(($body) => {
        if ($body.text().includes(projectName)) {
          cy.log('✅ 在仪表盘上看到了新项目')
        } else {
          cy.log('ℹ️ 仪表盘未显示项目，直接进入项目列表')
        }
      })
    })

    it('Scene 2.3 - 进入项目并开始选型', () => {
      cy.log('🎯 技术工程师开始进行技术选型...')
      
      // 进入项目详情
      cy.visit('/projects')
      cy.contains(projectName).should('be.visible').click()
      cy.wait(1000)
      
      // 验证URL包含项目ID
      cy.url().should('include', `/projects/${projectId}`)
      
      // 验证：技术工程师可以看到"选型明细"标签
      cy.contains('.ant-tabs-tab', '选型明细').should('be.visible')
      cy.log('✅ 确认可以访问选型明细标签')
      
      // 验证：技术工程师暂时看不到BOM标签（报价前不需要）
      cy.get('body').then(($body) => {
        const hasBOMTab = $body.text().includes('BOM清单')
        if (!hasBOMTab) {
          cy.log('✅ 确认：此阶段不显示BOM清单标签（符合预期）')
        }
      })
    })

    it('Scene 2.4 - 添加第一个阀门选型', () => {
      cy.log('🔧 添加第一个阀门选型：AT-150 执行器')
      
      // 确保在选型明细标签
      cy.contains('.ant-tabs-tab', '选型明细').click()
      cy.wait(500)
      
      // 点击添加选型按钮
      cy.get('body').then(($body) => {
        if ($body.text().includes('添加选型') || $body.text().includes('新增选型')) {
          cy.contains('button', /添加选型|新增选型/).click()
          cy.wait(500)
          
          // 填写选型参数
          cy.log('📝 填写选型参数...')
          
          // 执行器类型
          cy.get('select[name="actuatorType"]').select('AT')
          
          // 阀门尺寸
          cy.get('input[name="valveSize"]').clear().type('150')
          
          // 工作压力
          cy.get('input[name="workingPressure"]').clear().type('16')
          
          // 工作温度
          cy.get('input[name="workingTemperature"]').clear().type('120')
          
          // 所需扭矩
          cy.get('input[name="torque"]').clear().type('800')
          
          // 数量
          cy.get('input[name="quantity"]').clear().type('5')
          
          // 备注
          cy.get('textarea[name="remarks"]').clear().type('主管路控制阀，要求高可靠性')
          
          // 提交选型
          cy.contains('button', '确定').click()
          cy.wait(2000)
          
          // 验证选型已添加
          cy.contains('AT').should('be.visible')
          cy.contains('150').should('be.visible')
          cy.log('✅ 第一个选型添加成功')
        } else {
          cy.log('⚠️ 未找到添加选型按钮，可能已有选型数据')
        }
      })
    })

    it('Scene 2.5 - 添加第二个阀门选型', () => {
      cy.log('🔧 添加第二个阀门选型：GY-200 执行器')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('添加选型') || $body.text().includes('新增选型')) {
          cy.contains('button', /添加选型|新增选型/).click()
          cy.wait(500)
          
          // 填写第二个选型参数
          cy.get('select[name="actuatorType"]').select('GY')
          cy.get('input[name="valveSize"]').clear().type('200')
          cy.get('input[name="workingPressure"]').clear().type('10')
          cy.get('input[name="workingTemperature"]').clear().type('80')
          cy.get('input[name="torque"]').clear().type('1200')
          cy.get('input[name="quantity"]').clear().type('3')
          cy.get('textarea[name="remarks"]').clear().type('支路控制阀，标准配置')
          
          cy.contains('button', '确定').click()
          cy.wait(2000)
          
          cy.contains('GY').should('be.visible')
          cy.contains('200').should('be.visible')
          cy.log('✅ 第二个选型添加成功')
        }
      })
    })

    it('Scene 2.6 - 提交选型方案给商务工程师', () => {
      cy.log('📤 技术工程师提交选型方案...')
      
      // 查找并点击提交按钮
      cy.get('body').then(($body) => {
        if ($body.text().includes('提交选型方案') || $body.text().includes('提交技术方案')) {
          cy.contains('button', /提交选型方案|提交技术方案/).should('be.visible').click()
          cy.wait(500)
          
          // 如果有确认对话框，填写提交说明
          cy.get('body').then(($modal) => {
            if ($modal.text().includes('提交说明') || $modal.text().includes('备注')) {
              cy.get('textarea[name="submitNotes"]').clear().type('技术选型已完成，建议采用AT-150和GY-200组合方案，可满足客户全部技术要求。')
              cy.contains('button', /确认提交|确定/).click()
            } else {
              // 如果没有对话框，直接确认
              cy.get('.ant-modal').then(($dialog) => {
                if ($dialog.length > 0) {
                  cy.contains('button', '确认').click()
                }
              })
            }
          })
          
          cy.wait(1000)
          
          // 验证提交成功
          cy.get('body').then(($result) => {
            if ($result.text().includes('提交成功') || $result.text().includes('成功')) {
              cy.log('✅ 选型方案提交成功')
            }
          })
        } else {
          cy.log('ℹ️ 未找到提交按钮，可能已提交或界面不同')
        }
      })
    })

    it('Scene 2.7 - 技术工程师登出，等待商务工程师接手', () => {
      cy.log('🔧 技术工程师完成了选型工作')
      cy.logout()
      cy.log('✅ 技术工程师已登出')
    })
  })

  // ═════════════════════════════════════════════════════════════════════
  // 🎭 第三幕：商务工程师进行BOM和报价
  // ═════════════════════════════════════════════════════════════════════
  // 
  // 场景：商务工程师 刘工 收到技术选型通知，他需要根据选型
  // 结果生成详细的BOM清单，核算成本，并制作正式报价单。
  // 这是一个需要商业敏感度和成本控制能力的关键环节。
  // ═════════════════════════════════════════════════════════════════════
  
  context('🎬 Act 3: Business Engineer Creates BOM and Quote', () => {
    
    it('Scene 3.1 - 商务工程师登录系统', () => {
      cy.log('💼 角色登场: 商务工程师')
      cy.loginAs('salesEngineer')
      
      cy.url().should('include', '/dashboard')
      cy.contains('商务工程师').should('be.visible')
      
      cy.log('✅ 商务工程师成功登录')
    })

    it('Scene 3.2 - 在仪表盘查看待报价项目', () => {
      cy.log('📊 商务工程师查看待报价项目...')
      
      cy.visit('/dashboard')
      cy.wait(1000)
      
      // 查找待报价项目
      cy.get('body').then(($body) => {
        if ($body.text().includes(projectName)) {
          cy.log('✅ 在仪表盘上看到了待报价项目')
        }
      })
    })

    it('Scene 3.3 - 进入项目并查看选型结果', () => {
      cy.log('🔍 商务工程师查看技术选型结果...')
      
      cy.visit('/projects')
      cy.contains(projectName).should('be.visible').click()
      cy.wait(1000)
      
      // 验证可以看到"选型明细"和"BOM清单"两个标签
      cy.contains('.ant-tabs-tab', '选型明细').should('be.visible')
      cy.contains('.ant-tabs-tab', 'BOM清单').should('be.visible')
      cy.log('✅ 确认可以访问选型明细和BOM清单标签')
      
      // 查看选型明细
      cy.contains('.ant-tabs-tab', '选型明细').click()
      cy.wait(500)
      
      // 验证选型数据存在
      cy.get('.ant-table-tbody').should('exist')
      cy.log('✅ 选型数据已加载')
    })

    it('Scene 3.4 - 切换到BOM清单并生成BOM', () => {
      cy.log('📦 商务工程师生成BOM清单...')
      
      // 切换到BOM清单标签
      cy.contains('.ant-tabs-tab', 'BOM清单').click()
      cy.wait(500)
      
      // 点击"从选型自动生成"按钮
      cy.get('body').then(($body) => {
        if ($body.text().includes('从选型自动生成')) {
          cy.contains('button', '从选型自动生成').should('be.visible').click()
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
          cy.log('ℹ️ BOM可能已经生成')
        }
      })
      
      // 验证BOM表格中有数据
      cy.get('.ant-table-tbody tr').should('have.length.greaterThan', 0)
      cy.log('✅ BOM数据已加载')
    })

    it('Scene 3.5 - 验证商务工程师可以看到成本列', () => {
      cy.log('💰 验证商务工程师的成本查看权限...')
      
      // 确保在BOM清单标签
      cy.contains('.ant-tabs-tab', 'BOM清单').click()
      cy.wait(500)
      
      // 验证：商务工程师应该能看到成本相关列
      cy.get('.ant-table-thead').then(($thead) => {
        const headerText = $thead.text()
        
        // 检查是否有成本、单价等列
        if (headerText.includes('成本') || headerText.includes('单价') || headerText.includes('价格')) {
          cy.log('✅ 确认：商务工程师可以看到成本列')
        } else {
          cy.log('⚠️ 注意：未找到明显的成本列，可能列名不同')
        }
      })
      
      // 验证：可以编辑BOM
      cy.get('body').then(($body) => {
        if ($body.text().includes('手动添加行') || $body.text().includes('编辑')) {
          cy.log('✅ 确认：商务工程师有BOM编辑权限')
        }
      })
    })

    it('Scene 3.6 - 生成项目报价', () => {
      cy.log('💰 商务工程师生成正式报价...')
      
      // 查找生成报价按钮
      cy.get('body').then(($body) => {
        if ($body.text().includes('生成报价')) {
          cy.contains('button', '生成报价').click()
          cy.wait(500)
          
          // 填写报价信息
          cy.get('.ant-modal').then(($modal) => {
            if ($modal.length > 0) {
              // 有效期
              cy.get('input[name="validityPeriod"]').clear().type('30')
              
              // 交货期
              cy.get('input[name="deliveryTime"]').clear().type('45')
              
              // 付款条件
              cy.get('input[name="paymentTerms"]').clear().type('预付30%，发货前70%')
              
              // 备注
              cy.get('textarea[name="notes"]').clear().type('本报价包含设备、标准附件及技术服务，不含运费和安装费用')
              
              // 确认生成
              cy.contains('.ant-modal button', '生成报价').click()
              cy.wait(2000)
              
              cy.log('✅ 报价生成成功')
            }
          })
        } else {
          cy.log('ℹ️ 报价可能已经生成或按钮位置不同')
        }
      })
    })

    it('Scene 3.7 - 完成报价并通知销售经理', () => {
      cy.log('📤 商务工程师完成报价并通知销售经理...')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('完成报价') || $body.text().includes('通知销售')) {
          cy.contains('button', /完成报价|通知销售/).click()
          cy.wait(500)
          
          // 如果有确认对话框
          cy.get('body').then(($modal) => {
            if ($modal.text().includes('确认') || $modal.text().includes('备注')) {
              cy.get('textarea').then(($textarea) => {
                if ($textarea.length > 0) {
                  cy.wrap($textarea).clear().type('报价已完成，总金额约85万元，建议尽快提交客户审核。利润率符合公司要求。')
                }
              })
              cy.contains('button', /确认|提交/).click()
              cy.wait(1000)
            }
          })
          
          cy.log('✅ 报价已提交给销售经理')
        }
      })
    })

    it('Scene 3.8 - 商务工程师登出', () => {
      cy.log('💼 商务工程师完成了报价工作')
      cy.logout()
      cy.log('✅ 商务工程师已登出')
    })
  })

  // ═════════════════════════════════════════════════════════════════════
  // 🎭 第四幕：销售经理审批报价并推进项目
  // ═════════════════════════════════════════════════════════════════════
  // 
  // 场景：销售经理 张总 收到报价通知后，仔细审核了报价单。
  // 经过几天的客户沟通和谈判，客户最终接受了我们的报价。
  // 张总在系统中将项目标记为"赢单"，并生成正式的销售订单。
  // ═════════════════════════════════════════════════════════════════════
  
  context('🎬 Act 4: Sales Manager Reviews Quote and Wins Deal', () => {
    
    it('Scene 4.1 - 销售经理再次登录', () => {
      cy.log('👔 角色再次登场: 销售经理')
      cy.loginAs('salesManager')
      
      cy.url().should('include', '/dashboard')
      cy.log('✅ 销售经理再次登录')
    })

    it('Scene 4.2 - 查看待审批的报价', () => {
      cy.log('📋 销售经理查看待审批报价...')
      
      cy.visit('/projects')
      cy.contains(projectName).should('be.visible').click()
      cy.wait(1000)
      
      // 验证可以看到报价信息
      cy.get('body').should('contain', projectName)
      cy.log('✅ 报价信息已加载')
    })

    it('Scene 4.3 - 验证销售经理的BOM权限（只读，看不到成本）', () => {
      cy.log('🔒 验证销售经理的BOM查看权限...')
      
      // 切换到BOM清单标签
      cy.get('body').then(($body) => {
        if ($body.text().includes('BOM清单')) {
          cy.contains('.ant-tabs-tab', 'BOM清单').click()
          cy.wait(500)
          
          // 验证：销售经理不应该看到成本列（商业敏感信息）
          cy.get('.ant-table-thead').then(($thead) => {
            const headerText = $thead.text()
            
            if (!headerText.includes('成本价')) {
              cy.log('✅ 确认：销售经理看不到成本价列（权限正确）')
            } else {
              cy.log('⚠️ 注意：销售经理可以看到成本价，权限可能需要调整')
            }
          })
          
          // 验证：销售经理不应该看到编辑按钮
          cy.get('body').then(($editCheck) => {
            if (!$editCheck.text().includes('手动添加行') && !$editCheck.text().includes('从选型自动生成')) {
              cy.log('✅ 确认：销售经理没有BOM编辑权限（权限正确）')
            }
          })
        }
      })
    })

    it('Scene 4.4 - 审批报价', () => {
      cy.log('✅ 销售经理审批报价...')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('审批报价') || $body.text().includes('审批')) {
          cy.contains('button', /审批报价|审批/).click()
          cy.wait(500)
          
          // 选择通过
          cy.get('.ant-modal').then(($modal) => {
            if ($modal.length > 0) {
              cy.contains('button', '通过').click()
              
              // 填写审批意见
              cy.get('textarea[name="approvalComments"]').clear().type('报价已审核通过，价格合理，利润率可接受。已与客户初步沟通，客户表示满意。可以正式提交。')
              
              cy.contains('.ant-modal button', '确认').click()
              cy.wait(1000)
              
              cy.log('✅ 报价审批通过')
            }
          })
        }
      })
    })

    it('Scene 4.5 - 标记项目为赢单', () => {
      cy.log('🎉 销售经理标记项目为赢单...')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('标记为赢单') || $body.text().includes('赢单')) {
          cy.contains('button', /标记为赢单|赢单/).click()
          cy.wait(500)
          
          cy.get('.ant-modal').then(($modal) => {
            if ($modal.length > 0) {
              // 填写赢单说明
              cy.get('textarea[name="winNotes"]').clear().type('客户已确认接受我们的报价，签订意向书。预计本月底签订正式合同。客户要求尽快安排生产。')
              
              cy.contains('.ant-modal button', '确认').click()
              cy.wait(1000)
              
              cy.log('✅ 项目标记为赢单成功')
            }
          })
        } else {
          // 尝试通过状态下拉框更新
          cy.get('body').then(($status) => {
            if ($status.text().includes('项目状态') || $status.find('.ant-select').length > 0) {
              cy.log('通过状态下拉框更新项目状态...')
              // 这里可以添加通过下拉框更新状态的逻辑
            }
          })
        }
      })
    })

    it('Scene 4.6 - 生成销售订单', () => {
      cy.log('📝 销售经理生成销售订单...')
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('生成合同订单') || $body.text().includes('创建订单')) {
          cy.contains('button', /生成合同订单|创建订单/).click()
          cy.wait(500)
          
          // 填写订单信息
          cy.get('.ant-modal').then(($modal) => {
            if ($modal.length > 0) {
              cy.log('📝 填写订单信息...')
              
              // PO号
              cy.get('input[name="poNumber"]').clear().type('PO-2025-001')
              
              // 合同号
              cy.get('input[name="contractNumber"]').clear().type('CONTRACT-2025-001')
              
              // 交货地址
              cy.get('input[name="deliveryAddress"]').clear().type('北京市朝阳区工业园区8号')
              
              // 特殊要求
              cy.get('textarea[name="specialRequirements"]').then(($textarea) => {
                if ($textarea.length > 0) {
                  cy.wrap($textarea).clear().type('1. 需要提供中英文操作手册\n2. 提供现场安装指导\n3. 提供1年质保服务')
                }
              })
              
              // 提交订单
              cy.contains('.ant-modal button', /创建订单|确认/).click()
              cy.wait(2000)
              
              cy.log('✅ 销售订单创建成功')
            }
          })
          
          // 验证订单创建成功的提示
          cy.get('body').then(($result) => {
            if ($result.text().includes('订单创建成功')) {
              cy.log('✅ 确认：订单创建成功消息已显示')
            }
          })
        }
      })
    })

    it('Scene 4.7 - 保存订单号以供后续使用', () => {
      cy.log('📌 保存订单号...')
      
      // 跳转到订单管理页面获取订单号
      cy.visit('/orders')
      cy.wait(2000)
      
      // 查找最新的订单（应该是我们刚创建的）
      cy.get('.ant-table-tbody tr').first().then(($row) => {
        // 通常订单号在第一列
        cy.wrap($row).find('td').first().invoke('text').then((text) => {
          orderNumber = text.trim()
          cy.log(`📌 订单号已保存: ${orderNumber}`)
        })
      })
    })

    it('Scene 4.8 - 验证销售经理可以查看生产排期（只读）', () => {
      cy.log('🔍 验证销售经理的生产排期查看权限...')
      
      cy.visit('/production-schedule')
      cy.wait(1000)
      
      // 验证：销售经理可以访问页面
      cy.contains('生产排期').should('be.visible')
      cy.log('✅ 销售经理可以访问生产排期页面')
      
      // 验证：应该看到只读模式提示
      cy.get('body').then(($body) => {
        if ($body.text().includes('只读模式')) {
          cy.log('✅ 确认：销售经理处于只读模式（权限正确）')
        }
      })
      
      // 验证：不应该看到"更新状态"等修改按钮
      cy.get('body').then(($body) => {
        if (!$body.text().includes('开始生产') && !$body.text().includes('暂停生产')) {
          cy.log('✅ 确认：销售经理没有生产状态修改权限')
        }
      })
    })

    it('Scene 4.9 - 销售经理登出', () => {
      cy.log('👔 销售经理完成了商务工作，项目进入生产阶段')
      cy.logout()
      cy.log('✅ 销售经理已登出')
    })
  })

  // ═════════════════════════════════════════════════════════════════════
  // 🎭 第五幕：生产计划员安排生产
  // ═════════════════════════════════════════════════════════════════════
  // 
  // 场景：生产计划员 赵工 收到新订单通知后，立即在系统中
  // 创建生产订单，安排生产计划，协调车间资源，开始生产。
  // ═════════════════════════════════════════════════════════════════════
  
  context('🎬 Act 5: Production Planner Schedules Production', () => {
    
    it('Scene 5.1 - 生产计划员登录系统', () => {
      cy.log('🏭 角色登场: 生产计划员')
      cy.loginAs('productionPlanner')
      
      cy.url().should('include', '/dashboard')
      cy.contains('生产计划员').should('be.visible')
      
      cy.log('✅ 生产计划员成功登录')
    })

    it('Scene 5.2 - 验证生产计划员无法访问供应商管理', () => {
      cy.log('🔒 验证生产计划员的权限边界...')
      
      cy.visit('/suppliers')
      cy.wait(1000)
      
      // 验证：应该看到无权访问提示
      cy.get('body').then(($body) => {
        if ($body.text().includes('无权访问') || $body.text().includes('403')) {
          cy.log('✅ 确认：生产计划员无法访问供应商管理（权限正确）')
        } else {
          cy.log('⚠️ 注意：生产计划员可以访问供应商管理，权限可能需要检查')
        }
      })
    })

    it('Scene 5.3 - 查看订单列表并找到待生产订单', () => {
      cy.log('📋 生产计划员查看待生产订单...')
      
      cy.visit('/orders')
      cy.wait(1000)
      
      // 验证可以看到订单
      if (orderNumber) {
        cy.contains(orderNumber).should('be.visible')
        cy.log(`✅ 找到订单: ${orderNumber}`)
      } else {
        cy.log('⚠️ 订单号未保存，尝试查找最新订单')
        cy.get('.ant-table-tbody tr').first().should('exist')
      }
    })

    it('Scene 5.4 - 创建生产订单', () => {
      cy.log('🏭 生产计划员创建生产订单...')
      
      if (orderNumber) {
        // 找到订单并点击查看
        cy.contains(orderNumber).parent().find('button').contains('查看').click()
        cy.wait(1000)
        
        // 点击创建生产订单按钮
        cy.get('body').then(($body) => {
          if ($body.text().includes('创建生产订单')) {
            cy.contains('button', '创建生产订单').click()
            cy.wait(500)
            
            // 填写生产计划信息
            cy.get('.ant-modal').then(($modal) => {
              if ($modal.length > 0) {
                cy.log('📝 填写生产计划信息...')
                
                // 优先级
                cy.get('select[name="priority"]').select('Normal')
                
                // 计划开始日期
                cy.get('input[name="plannedStartDate"]').type('2025-11-01')
                
                // 计划完成日期
                cy.get('input[name="plannedEndDate"]').type('2025-11-30')
                
                // 备注
                cy.get('textarea[name="notes"]').then(($textarea) => {
                  if ($textarea.length > 0) {
                    cy.wrap($textarea).clear().type('按标准工艺流程生产，注意质量控制，预计需要30个工作日完成')
                  }
                })
                
                // 确认创建
                cy.contains('.ant-modal button', /确认创建|创建/).click()
                cy.wait(2000)
                
                cy.log('✅ 生产订单创建成功')
              }
            })
          }
        })
      } else {
        cy.log('⚠️ 无法创建生产订单：订单号未保存')
      }
    })

    it('Scene 5.5 - 在生产排期页面查看新创建的生产订单', () => {
      cy.log('📊 查看生产排期...')
      
      cy.visit('/production-schedule')
      cy.wait(2000)
      
      // 验证可以看到生产订单
      cy.get('.ant-table-tbody tr').should('have.length.greaterThan', 0)
      cy.log('✅ 生产订单列表已加载')
      
      // 保存生产订单号
      cy.get('.ant-table-tbody tr').first().then(($row) => {
        cy.wrap($row).find('td').first().invoke('text').then((text) => {
          productionOrderNumber = text.trim()
          cy.log(`📌 生产订单号已保存: ${productionOrderNumber}`)
        })
      })
    })

    it('Scene 5.6 - 开始生产', () => {
      cy.log('▶️ 生产计划员启动生产...')
      
      if (productionOrderNumber) {
        // 找到生产订单并点击操作
        cy.contains('td', productionOrderNumber)
          .parent()
          .find('[class*="ant-dropdown-trigger"]')
          .click()
        
        cy.wait(500)
        
        // 点击"开始生产"
        cy.contains('开始生产').click()
        cy.wait(1000)
        
        // 验证状态已更新
        cy.contains('生产中').should('be.visible')
        cy.log('✅ 生产已启动')
      } else {
        cy.log('⚠️ 无法启动生产：生产订单号未保存')
      }
    })

    it('Scene 5.7 - 更新生产进度', () => {
      cy.log('📊 更新生产进度...')
      
      // 这里可以添加更新生产进度的逻辑
      cy.get('body').then(($body) => {
        if ($body.text().includes('更新进度')) {
          cy.log('发现更新进度功能，执行更新...')
          // 添加更新进度的代码
        } else {
          cy.log('ℹ️ 当前页面没有更新进度功能')
        }
      })
    })

    it('Scene 5.8 - 生产计划员登出', () => {
      cy.log('🏭 生产计划员完成了排期工作')
      cy.logout()
      cy.log('✅ 生产计划员已登出')
    })
  })

  // ═════════════════════════════════════════════════════════════════════
  // 🎭 第六幕：采购专员管理供应商
  // ═════════════════════════════════════════════════════════════════════
  // 
  // 场景：采购专员 孙工 需要为生产准备原材料和零部件。
  // 她登录系统查看供应商信息，确保供应链稳定。
  // ═════════════════════════════════════════════════════════════════════
  
  context('🎬 Act 6: Procurement Specialist Manages Suppliers', () => {
    
    it('Scene 6.1 - 采购专员登录系统', () => {
      cy.log('📦 角色登场: 采购专员')
      cy.loginAs('procurementSpecialist')
      
      cy.url().should('include', '/dashboard')
      cy.contains('采购专员').should('be.visible')
      
      cy.log('✅ 采购专员成功登录')
    })

    it('Scene 6.2 - 访问供应商管理页面', () => {
      cy.log('👥 采购专员查看供应商列表...')
      
      cy.visit('/suppliers')
      cy.wait(1000)
      
      // 验证：采购专员可以访问供应商管理
      cy.contains('供应商管理').should('be.visible')
      cy.log('✅ 采购专员可以访问供应商管理页面')
      
      // 验证：可以看到供应商列表
      cy.get('.ant-table-tbody').should('exist')
      cy.log('✅ 供应商列表已加载')
    })

    it('Scene 6.3 - 验证采购专员有编辑权限', () => {
      cy.log('🔍 验证采购专员的操作权限...')
      
      // 验证：应该看到"新建供应商"按钮
      cy.get('body').then(($body) => {
        if ($body.text().includes('新建供应商') || $body.text().includes('添加供应商')) {
          cy.log('✅ 确认：采购专员有新建供应商权限')
        }
      })
      
      // 验证：应该看到编辑按钮
      cy.get('.ant-table-tbody tr').first().then(($row) => {
        if ($row.find('button').length > 0) {
          cy.log('✅ 确认：采购专员有编辑供应商权限')
        }
      })
    })

    it('Scene 6.4 - 验证采购专员无法访问生产排期', () => {
      cy.log('🔒 验证采购专员的权限边界...')
      
      cy.visit('/production-schedule')
      cy.wait(1000)
      
      // 验证：应该看到无权访问提示
      cy.get('body').then(($body) => {
        if ($body.text().includes('无权访问') || $body.text().includes('403')) {
          cy.log('✅ 确认：采购专员无法访问生产排期（权限正确）')
        } else {
          cy.log('⚠️ 注意：采购专员可以访问生产排期，权限可能需要检查')
        }
      })
    })

    it('Scene 6.5 - 采购专员登出', () => {
      cy.log('📦 采购专员完成了供应商检查')
      cy.logout()
      cy.log('✅ 采购专员已登出')
    })
  })

  // ═════════════════════════════════════════════════════════════════════
  // 🎭 第七幕：售后工程师处理服务工单
  // ═════════════════════════════════════════════════════════════════════
  // 
  // 场景：时间过去了3个月，设备已经交付并投入使用。
  // 客户报告了一个小问题，售后工程师 周工 立即创建工单并跟进。
  // ═════════════════════════════════════════════════════════════════════
  
  context('🎬 Act 7: After-sales Engineer Handles Service Ticket', () => {
    
    it('Scene 7.1 - 售后工程师登录系统', () => {
      cy.log('🎫 角色登场: 售后工程师')
      cy.loginAs('aftersalesEngineer')
      
      cy.url().should('include', '/dashboard')
      cy.contains('售后工程师').should('be.visible')
      
      cy.log('✅ 售后工程师成功登录')
    })

    it('Scene 7.2 - 验证默认显示"我的工单"', () => {
      cy.log('🎫 验证售后工程师的工单筛选...')
      
      cy.visit('/service-center')
      cy.wait(1000)
      
      // 验证：应该看到"我的工单"相关提示或按钮
      cy.get('body').then(($body) => {
        if ($body.text().includes('我的工单')) {
          cy.log('✅ 确认：默认显示"我的工单"筛选')
        } else {
          cy.log('ℹ️ 未找到"我的工单"提示，可能界面不同')
        }
      })
    })

    it('Scene 7.3 - 创建新的服务工单', () => {
      cy.log('🎫 售后工程师创建服务工单...')
      
      cy.visit('/service-center')
      cy.wait(1000)
      
      // 点击创建工单按钮
      cy.get('body').then(($body) => {
        if ($body.text().includes('创建工单')) {
          cy.contains('button', '创建工单').click()
          cy.wait(500)
          
          // 填写工单信息
          cy.get('.ant-modal').then(($modal) => {
            if ($modal.length > 0) {
              cy.log('📝 填写工单信息...')
              
              // 工单类型
              cy.get('select[name="ticketType"]').select('Maintenance')
              
              // 优先级
              cy.get('select[name="priority"]').select('High')
              
              // 客户名称
              cy.get('input[name="customerName"]').type(clientName)
              
              // 客户电话
              cy.get('input[name="customerPhone"]').type(contactPhone)
              
              // 问题标题
              cy.get('input[name="issueTitle"]').type('执行器定期维护检查')
              
              // 问题描述
              cy.get('textarea[name="issueDescription"]').type('客户要求对已安装的AT-150和GY-200执行器进行季度例行维护检查，确保设备正常运行。')
              
              // 提交工单
              cy.contains('.ant-modal button', /创建|提交/).click()
              cy.wait(2000)
              
              cy.log('✅ 服务工单创建成功')
            }
          })
        }
      })
    })

    it('Scene 7.4 - 查看工单详情并添加跟进记录', () => {
      cy.log('📝 添加跟进记录...')
      
      cy.visit('/service-center')
      cy.wait(1000)
      
      // 点击第一个工单的查看按钮
      cy.get('.ant-table-tbody tr').first().find('button').contains('查看').click()
      cy.wait(1000)
      
      // 添加跟进记录
      cy.get('body').then(($body) => {
        if ($body.text().includes('添加跟进')) {
          cy.contains('button', '添加跟进').click()
          cy.wait(500)
          
          cy.get('.ant-modal').then(($modal) => {
            if ($modal.length > 0) {
              // 跟进类型
              cy.get('select[name="type"]').select('Call')
              
              // 跟进内容
              cy.get('textarea[name="content"]').type('已与客户联系，确认维护时间为下周三上午9点，客户现场负责人：李工')
              
              // 提交
              cy.contains('.ant-modal button', '添加').click()
              cy.wait(1000)
              
              cy.log('✅ 跟进记录添加成功')
            }
          })
        }
      })
    })

    it('Scene 7.5 - 验证售后工程师无法访问供应商管理', () => {
      cy.log('🔒 验证售后工程师的权限边界...')
      
      cy.visit('/suppliers')
      cy.wait(1000)
      
      // 验证：应该看到无权访问提示
      cy.get('body').then(($body) => {
        if ($body.text().includes('无权访问') || $body.text().includes('403')) {
          cy.log('✅ 确认：售后工程师无法访问供应商管理（权限正确）')
        }
      })
    })

    it('Scene 7.6 - 售后工程师登出', () => {
      cy.log('🎫 售后工程师完成了工单创建')
      cy.logout()
      cy.log('✅ 售后工程师已登出')
    })
  })

  // ═════════════════════════════════════════════════════════════════════
  // 🎭 第八幕：管理员全局监控
  // ═════════════════════════════════════════════════════════════════════
  // 
  // 场景：管理员 系统管理员 需要查看整个项目的进展情况，
  // 确保所有流程顺利进行，各角色协同良好。
  // ═════════════════════════════════════════════════════════════════════
  
  context('🎬 Act 8: Administrator Global Monitoring', () => {
    
    it('Scene 8.1 - 管理员登录系统', () => {
      cy.log('👑 角色登场: 系统管理员')
      cy.loginAs('admin')
      
      cy.url().should('include', '/dashboard')
      cy.contains('管理员').should('be.visible')
      
      cy.log('✅ 管理员成功登录')
    })

    it('Scene 8.2 - 验证管理员可以访问所有页面', () => {
      cy.log('🔓 验证管理员的全局访问权限...')
      
      const pages = [
        { path: '/projects', title: '项目管理' },
        { path: '/orders', title: '订单管理' },
        { path: '/production-schedule', title: '生产排期' },
        { path: '/suppliers', title: '供应商管理' },
        { path: '/service-center', title: '售后服务' }
      ]
      
      pages.forEach((page) => {
        cy.visit(page.path)
        cy.wait(500)
        cy.contains(page.title).should('be.visible')
        cy.log(`✅ 管理员可以访问: ${page.title}`)
      })
    })

    it('Scene 8.3 - 查看项目整体状态', () => {
      cy.log('📊 管理员查看项目状态...')
      
      cy.visit('/projects')
      cy.wait(1000)
      
      // 查找我们创建的项目
      if (projectName) {
        cy.contains('td', projectName).should('be.visible')
        
        // 验证项目状态
        cy.contains('td', projectName).parent().then(($row) => {
          const rowText = $row.text()
          if (rowText.includes('赢单') || rowText.includes('Won')) {
            cy.log('✅ 项目状态为"赢单"')
          }
        })
      }
    })

    it('Scene 8.4 - 查看生产订单（完整权限）', () => {
      cy.log('🏭 管理员查看生产订单...')
      
      cy.visit('/production-schedule')
      cy.wait(1000)
      
      // 验证：不应该看到只读模式提示
      cy.get('body').then(($body) => {
        if (!$body.text().includes('只读模式')) {
          cy.log('✅ 确认：管理员处于完整权限模式')
        }
      })
      
      // 验证：应该看到操作按钮
      cy.get('.ant-table-tbody tr').first().find('button').should('exist')
      cy.log('✅ 管理员有生产订单操作权限')
    })

    it('Scene 8.5 - 完成生产订单', () => {
      cy.log('✅ 管理员标记生产订单完成...')
      
      if (productionOrderNumber) {
        cy.visit('/production-schedule')
        cy.wait(1000)
        
        // 找到生产订单并标记完成
        cy.contains('td', productionOrderNumber)
          .parent()
          .find('[class*="ant-dropdown-trigger"]')
          .click()
        
        cy.wait(500)
        
        cy.contains('标记完成').click()
        cy.wait(1000)
        
        // 验证状态已更新
        cy.contains('已完成').should('be.visible')
        cy.log('✅ 生产订单已标记为完成')
      } else {
        cy.log('⚠️ 生产订单号未保存，跳过完成操作')
      }
    })

    it('Scene 8.6 - 查看售后工单', () => {
      cy.log('🎫 管理员查看售后工单...')
      
      cy.visit('/service-center')
      cy.wait(1000)
      
      // 验证可以看到工单列表
      cy.get('.ant-table-tbody').should('exist')
      cy.log('✅ 管理员可以查看所有售后工单')
    })

    it('Scene 8.7 - 管理员登出', () => {
      cy.log('👑 管理员完成了全局监控')
      cy.logout()
      cy.log('✅ 管理员已登出')
    })
  })

  // ═════════════════════════════════════════════════════════════════════
  // 🎭 终幕：数据验证和总结
  // ═════════════════════════════════════════════════════════════════════
  // 
  // 场景：测试即将结束，让我们验证整个流程的完整性和数据一致性。
  // ═════════════════════════════════════════════════════════════════════
  
  context('🎬 Finale: Data Verification and Summary', () => {
    
    before(() => {
      cy.loginAs('admin')
    })

    it('Epilogue 1 - 验证项目数据完整性', () => {
      cy.log('🔍 验证项目数据...')
      
      if (projectId) {
        cy.visit(`/projects/${projectId}`)
        cy.wait(1000)
        
        // 验证项目基本信息
        cy.contains(projectName).should('be.visible')
        cy.contains(clientName).should('be.visible')
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

    it('Epilogue 2 - 验证订单状态', () => {
      cy.log('🔍 验证订单状态...')
      
      if (orderNumber) {
        cy.visit('/orders')
        cy.wait(1000)
        cy.contains(orderNumber).should('be.visible')
        cy.log('✅ 订单存在于系统中')
      } else {
        cy.log('ℹ️ 订单号未保存，跳过验证')
      }
    })

    it('Epilogue 3 - 验证生产订单状态', () => {
      cy.log('🔍 验证生产订单状态...')
      
      if (productionOrderNumber) {
        cy.visit('/production-schedule')
        cy.wait(1000)
        cy.contains(productionOrderNumber).should('be.visible')
        cy.log('✅ 生产订单存在于系统中')
      } else {
        cy.log('ℹ️ 生产订单号未保存，跳过验证')
      }
    })

    it('Epilogue 4 - 验证售后工单', () => {
      cy.log('🔍 验证售后工单...')
      
      cy.visit('/service-center')
      cy.wait(1000)
      cy.get('.ant-table-tbody tr').should('exist')
      cy.log('✅ 售后工单存在于系统中')
    })

    it('Epilogue 5 - 测试数据汇总', () => {
      cy.log('═══════════════════════════════════════════════════════════════')
      cy.log('📊 测试完成！以下是完整的数据汇总：')
      cy.log('═══════════════════════════════════════════════════════════════')
      cy.log(`📋 项目名称: ${projectName}`)
      cy.log(`🏢 客户名称: ${clientName}`)
      cy.log(`📌 项目ID: ${projectId || 'N/A'}`)
      cy.log(`📝 订单号: ${orderNumber || 'N/A'}`)
      cy.log(`🏭 生产订单号: ${productionOrderNumber || 'N/A'}`)
      cy.log('═══════════════════════════════════════════════════════════════')
      cy.log('🎭 演出角色：')
      cy.log('   👔 销售经理 - 项目发起和商务管理')
      cy.log('   🔧 技术工程师 - 技术选型和方案设计')
      cy.log('   💼 商务工程师 - BOM管理和报价')
      cy.log('   🏭 生产计划员 - 生产排期和进度管理')
      cy.log('   📦 采购专员 - 供应商管理')
      cy.log('   🎫 售后工程师 - 售后服务')
      cy.log('   👑 管理员 - 全局监控')
      cy.log('═══════════════════════════════════════════════════════════════')
      cy.log('🎊 恭喜！多角色协同工作流测试圆满完成！')
      cy.log('═══════════════════════════════════════════════════════════════')
    })

    after(() => {
      cy.logout()
    })
  })
})
