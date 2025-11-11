import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Form, Input, InputNumber, Radio, Button, 
  List, Progress, Tag, Divider, Space, message, Spin, Empty,
  Typography, Alert, Collapse, Modal, Select, Checkbox, Tabs, Badge,
  Table, Upload
} from 'antd'
import { 
  SearchOutlined, CheckCircleOutlined, ThunderboltOutlined,
  FileTextOutlined, DollarOutlined, SettingOutlined,
  InfoCircleOutlined, AppstoreOutlined, ShoppingOutlined,
  UploadOutlined, PlusOutlined, DeleteOutlined, SendOutlined,
  RightOutlined
} from '@ant-design/icons'
import { selectionAPI, manualOverridesAPI, projectsAPI, accessoriesAPI } from '../services/api'

const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse
const { TabPane } = Tabs

const SelectionEngine = () => {
  const [form] = Form.useForm()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const projectId = searchParams.get('projectId')
  
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [selectedActuator, setSelectedActuator] = useState(null)
  const [manualOverrides, setManualOverrides] = useState([])
  const [selectedOverride, setSelectedOverride] = useState(null)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [currentProject, setCurrentProject] = useState(null)
  const [saveToProjectModal, setSaveToProjectModal] = useState(false)
  
  // 配件选择相关状态
  const [showAccessoriesModal, setShowAccessoriesModal] = useState(false)
  const [availableAccessories, setAvailableAccessories] = useState({})
  const [selectedAccessories, setSelectedAccessories] = useState([])
  const [loadingAccessories, setLoadingAccessories] = useState(false)
  const [recommendedAccessoryIds, setRecommendedAccessoryIds] = useState(new Set())
  
  // 批量选型相关状态
  const [activeTab, setActiveTab] = useState('single') // 'single' or 'batch'
  const [batchData, setBatchData] = useState([]) // 批量选型数据
  const [batchResults, setBatchResults] = useState([]) // 批量选型结果
  const [batchLoading, setBatchLoading] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
    }
  }, [projectId])

  const fetchProject = async (id) => {
    try {
      const response = await projectsAPI.getById(id)
      console.log('📋 获取到项目信息:', response.data)
      // 处理API返回格式：可能是 { success: true, data: project } 或直接是 project
      const projectData = response.data.data || response.data
      console.log('📋 处理后的项目数据:', projectData)
      setCurrentProject(projectData)
      // 不显示加载成功提示，避免打扰用户
    } catch (error) {
      console.error('获取项目信息失败:', error)
      message.error('获取项目信息失败: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleSearch = async () => {
    try {
      // 1. 获取所有表单值（包括 mechanism）
      const values = await form.validateFields()
      setLoading(true)
      
      // 2. 构建请求体 - 确保包含机构类型
      const requestPayload = {
        ...values,
        mechanism: values.mechanism || 'Scotch Yoke', // 确保 mechanism 参数存在
      }
      
      // 3. 调用选型计算API
      const response = await selectionAPI.calculate(requestPayload)
      
      if (response.data.success && response.data.data) {
        setResults(response.data.data)
        message.success(
          `找到 ${response.data.count} 个匹配的执行器 (${requestPayload.mechanism})`
        )
      } else {
        setResults([])
        message.warning(response.data.message || '未找到匹配的执行器')
      }
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        return
      }
      console.error('Selection error:', error)
      message.error(error.response?.data?.message || '选型失败，请检查输入参数')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectActuator = async (actuator) => {
    setSelectedActuator(actuator)
    
    // 如果需要手动操作装置
    if (form.getFieldValue('needs_manual_override')) {
      try {
        // 获取兼容的手动操作装置
        const response = await manualOverridesAPI.findCompatible(actuator.body_size)
        setManualOverrides(response.data || [])
        setShowOverrideModal(true)
      } catch (error) {
        message.error('获取手动操作装置失败')
      }
    } else {
      // 不需要手动操作装置，直接进入配件选择
      await loadAccessories()
    }
  }

  const handleConfirmOverride = async () => {
    setShowOverrideModal(false)
    // 进入配件选择步骤
    await loadAccessories()
  }
  
  // 加载兼容的配件
  const loadAccessories = async () => {
    if (!selectedActuator) return
    
    setLoadingAccessories(true)
    try {
      // 获取所有配件，按类别分组
      const response = await accessoriesAPI.getAll()
      const allAccessories = response.data.data || []
      
      // 按类别分组
      const grouped = {}
      allAccessories.forEach(acc => {
        if (!grouped[acc.category]) {
          grouped[acc.category] = []
        }
        grouped[acc.category].push(acc)
      })
      
      setAvailableAccessories(grouped)
      
      // 智能推荐：根据控制要求推荐配件
      const formValues = form.getFieldsValue()
      const recommended = new Set()
      
      // 如果是调节型，推荐定位器
      if (formValues.valve_type === 'Ball Valve' || formValues.valve_type === 'Butterfly Valve') {
        allAccessories.forEach(acc => {
          if (acc.category === '控制类' && acc.name.includes('定位器')) {
            recommended.add(acc._id)
          }
        })
      }
      
      // 如果需要防爆，推荐防爆电磁阀
      if (formValues.explosion_proof) {
        allAccessories.forEach(acc => {
          if (acc.name.includes('防爆')) {
            recommended.add(acc._id)
          }
        })
      }
      
      setRecommendedAccessoryIds(recommended)
      
      // 自动选中推荐的配件
      const recommendedAccessories = allAccessories.filter(acc => recommended.has(acc._id))
      setSelectedAccessories(recommendedAccessories)
      
      setShowAccessoriesModal(true)
    } catch (error) {
      message.error('获取配件列表失败')
    } finally {
      setLoadingAccessories(false)
    }
  }

  const handleSaveToProject = async () => {
    try {
      if (!currentProject) {
        message.warning('请先选择一个项目')
        return
      }

      // 获取所有表单值（包括阀门信息）
      const formValues = form.getFieldsValue()
      
      // 构建选型数据
      // input_params 将包含所有表单字段，包括：
      // - mechanism, valve_type
      // - valve_size, flange_size (阀门物理信息)
      // - required_torque, working_pressure, working_angle
      // - needs_manual_override, max_budget 等
      const selectionData = {
        tag_number: formValues.tag_number || `TAG-${Date.now()}`,
        input_params: formValues, // 包含所有表单字段
        selected_actuator: selectedActuator,
        selected_override: selectedOverride,
        selected_accessories: selectedAccessories // 添加配件数据
      }

      await projectsAPI.autoSelect(currentProject._id, selectionData)
      
      // 保存成功提示，并提供跳转选项
      Modal.success({
        title: '选型结果已保存',
        content: (
          <div>
            <p>已成功保存到项目 <strong>{currentProject.projectName}</strong></p>
            <p>• 执行器: {selectedActuator.model_base}</p>
            {selectedOverride && <p>• 手动操作装置: {selectedOverride.model}</p>}
            <p>• 配件: {selectedAccessories.length} 个</p>
          </div>
        ),
        okText: '返回项目详情',
        cancelText: '继续选型',
        okCancel: true,
        onOk: () => {
          navigate(`/projects/${currentProject._id}?tab=technical`)
        },
        onCancel: () => {
          // 重置表单继续选型
          form.resetFields()
          setResults([])
          setSelectedActuator(null)
          setSelectedOverride(null)
          setSelectedAccessories([])
        }
      })
      
      setSaveToProjectModal(false)
      
      // 重置表单和结果（如果用户选择继续选型）
      form.resetFields()
      setResults([])
      setSelectedActuator(null)
      setSelectedOverride(null)
      setSelectedAccessories([])
    } catch (error) {
      console.error('保存选型记录失败:', error)
      message.error('保存失败')
    }
  }
  
  // 处理配件选择
  const handleAccessoryToggle = (accessory, checked) => {
    if (checked) {
      setSelectedAccessories([...selectedAccessories, accessory])
    } else {
      setSelectedAccessories(selectedAccessories.filter(a => a._id !== accessory._id))
    }
  }
  
  // 确认配件选择
  const handleConfirmAccessories = () => {
    setShowAccessoriesModal(false)
    setSaveToProjectModal(true)
  }

  const getMarginColor = (margin) => {
    if (margin >= 30) return '#52c41a' // 绿色
    if (margin >= 20) return '#faad14' // 黄色
    return '#ff4d4f' // 红色
  }

  const getRecommendLevel = (margin) => {
    if (margin >= 30) return { text: '推荐', color: 'success' }
    if (margin >= 20) return { text: '可选', color: 'warning' }
    return { text: '不推荐', color: 'error' }
  }
  
  // 批量选型处理函数
  const handleAddBatchRow = () => {
    setBatchData([...batchData, {
      key: Date.now(),
      tag_number: '',
      required_torque: null,
      safetyFactor: 1.3, // 默认安全系数1.3
      working_pressure: 0.4,
      valve_type: 'Ball Valve',
      mechanism: 'Scotch Yoke'
    }])
  }
  
  const handleDeleteBatchRow = (key) => {
    setBatchData(batchData.filter(item => item.key !== key))
  }
  
  const handleBatchDataChange = (key, field, value) => {
    setBatchData(batchData.map(item => 
      item.key === key ? { ...item, [field]: value } : item
    ))
  }
  
  const handleBatchSelection = async () => {
    if (batchData.length === 0) {
      message.warning('请先添加选型数据')
      return
    }
    
    // 验证数据
    const invalidRows = batchData.filter(item => !item.required_torque || !item.working_pressure)
    if (invalidRows.length > 0) {
      message.error('请填写所有行的必需参数（扭矩和压力）')
      return
    }
    
    try {
      setBatchLoading(true)
      const response = await selectionAPI.batch({ selections: batchData })
      
      if (response.data.success) {
        setBatchResults(response.data.results || [])
        message.success(response.data.message || '批量选型完成')
      } else {
        message.error(response.data.message || '批量选型失败')
      }
    } catch (error) {
      console.error('Batch selection error:', error)
      message.error('批量选型失败')
    } finally {
      setBatchLoading(false)
    }
  }
  
  const handleSaveBatchToProject = async (andSubmit = false) => {
    if (!currentProject) {
      message.warning('请先选择一个项目')
      return
    }
    
    if (batchResults.length === 0) {
      message.warning('暂无选型结果可保存')
      return
    }
    
    try {
      const successCount = batchResults.filter(r => r.selected_actuator).length
      
      // 保存所有成功的选型结果到项目
      for (const result of batchResults) {
        if (result.selected_actuator) {
          const selectionData = {
            tag_number: result.tag_number || `TAG-${Date.now()}`,
            input_params: result.input_params,
            selected_actuator: result.selected_actuator
          }
          await projectsAPI.autoSelect(currentProject._id, selectionData)
        }
      }
      
      // 如果需要提交报价
      if (andSubmit) {
        // 更新项目状态为"技术方案完成"
        await projectsAPI.update(currentProject._id, {
          status: '技术方案完成'
        })
        
        message.success(
          <span>
            ✅ 成功保存 {successCount} 个选型结果并提交商务报价！<br/>
            商务工程师将收到通知并开始报价工作。
          </span>,
          5
        )
        
        // 清空数据
        setBatchData([])
        setBatchResults([])
        
        // 延迟跳转到项目详情页
        setTimeout(() => {
          navigate(`/projects/${currentProject._id}`)
        }, 2000)
      } else {
        message.success({
          content: (
            <div>
              <div>✅ 成功保存 {successCount} 个选型结果到项目</div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                💡 提示：您可以继续添加更多选型，或者点击「保存并提交报价」完成选型工作
              </div>
            </div>
          ),
          duration: 4
        })
        
        // 清空数据
        setBatchData([])
        setBatchResults([])
      }
    } catch (error) {
      console.error('保存批量选型结果失败:', error)
      message.error('保存失败')
    }
  }

  // 渲染单个选型Tab内容
  const renderSingleSelection = () => (
      <>
      <Row gutter={[16, 16]}>
        {/* 左栏：当前项目信息 */}
        {currentProject && (
          <Col xs={24} lg={6}>
            <Card 
              title="当前项目" 
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">项目名称：</Text>
                  <br />
                  <Text strong>{currentProject.projectName}</Text>
                </div>
                <div>
                  <Text type="secondary">项目编号：</Text>
                  <br />
                  <Text>{currentProject.projectNumber || '-'}</Text>
                </div>
                <div>
                  <Text type="secondary">客户名称：</Text>
                  <br />
                  <Text>{currentProject.client?.name || '-'}</Text>
                </div>
                {currentProject.client?.company && (
                  <div>
                    <Text type="secondary">公司：</Text>
                    <br />
                    <Text>{currentProject.client.company}</Text>
                  </div>
                )}
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Text type="secondary">已选型：</Text>
                  <Tag color="blue">{currentProject.selections?.length || 0} 个</Tag>
                </div>
              </Space>
            </Card>
          </Col>
        )}

        {/* 中栏：输入表单 */}
        <Col xs={24} lg={currentProject ? 9 : 12}>
          <Card 
            title={
              <Space>
                <SettingOutlined />
                <span>执行器选型参数</span>
              </Space>
            }
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                mechanism: 'Scotch Yoke',
                action_type_preference: 'DA',
                yoke_type: 'symmetric',
                needs_manual_override: false,
                max_rotation_angle: 90,
                temperature_type: 'normal',
                temperature_code: 'No code',
                safetyFactor: 1.3 // 默认安全系数1.3
              }}
            >
              <Collapse defaultActiveKey={['1', '2']} ghost>
                <Panel header="基本参数" key="1">
                  {/* 执行机构类型选择器 */}
                  <Form.Item
                    label="执行机构类型"
                    name="mechanism"
                    rules={[{ required: true, message: '请选择执行机构类型' }]}
                  >
                    <Radio.Group buttonStyle="solid">
                      <Radio.Button value="Scotch Yoke">拨叉式 (SF系列)</Radio.Button>
                      <Radio.Button value="Rack & Pinion">齿轮齿条式 (AT/GY系列)</Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  {/* 作用类型 */}
                  <Form.Item
                    label="作用类型"
                    name="action_type_preference"
                    rules={[{ required: true, message: '请选择作用类型' }]}
                    tooltip="单作用（SR）：弹簧复位，断气后自动回到初始位置；双作用（DA）：需要气源驱动两个方向"
                  >
                    <Radio.Group buttonStyle="solid">
                      <Radio.Button value="SR">单作用 (SR)</Radio.Button>
                      <Radio.Button value="DA">双作用 (DA)</Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  {/* 故障安全位置 - 仅在选择单作用时显示 */}
                  <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.action_type_preference !== currentValues.action_type_preference}>
                    {({ getFieldValue }) =>
                      getFieldValue('action_type_preference') === 'SR' ? (
                        <Form.Item
                          label="故障安全位置"
                          name="failSafePosition"
                          rules={[{ required: true, message: '请选择故障安全位置' }]}
                          tooltip="FC（故障关）：断气后阀门自动关闭；FO（故障开）：断气后阀门自动开启"
                        >
                          <Radio.Group buttonStyle="solid">
                            <Radio.Button value="Fail Close">FC 故障关闭</Radio.Button>
                            <Radio.Button value="Fail Open">FO 故障开启</Radio.Button>
                          </Radio.Group>
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>

                  {/* 阀门类型 - 根据执行机构类型显示不同选项 */}
                  <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.mechanism !== currentValues.mechanism}>
                    {({ getFieldValue }) =>
                      getFieldValue('mechanism') === 'Scotch Yoke' ? (
                        <Form.Item
                          label="阀门类型"
                          name="valve_type"
                          rules={[{ required: true, message: '请选择阀门类型' }]}
                          tooltip="球阀使用对称拨叉，蝶阀使用偏心拨叉（型号带C）"
                        >
                          <Select placeholder="选择阀门类型">
                            <Select.Option value="Ball Valve">球阀 (对称拨叉)</Select.Option>
                            <Select.Option value="Butterfly Valve">蝶阀 (偏心拨叉-C)</Select.Option>
                          </Select>
                        </Form.Item>
                      ) : getFieldValue('mechanism') === 'Rack & Pinion' ? (
                        <Form.Item
                          label="阀门类型"
                          name="valve_type"
                          rules={[{ required: true, message: '请选择阀门类型' }]}
                          tooltip="齿轮齿条式执行器适用于旋转型阀门（球阀、蝶阀）"
                        >
                          <Select placeholder="选择阀门类型">
                            <Select.Option value="Ball Valve">球阀 (Ball Valve)</Select.Option>
                            <Select.Option value="Butterfly Valve">蝶阀 (Butterfly Valve)</Select.Option>
                          </Select>
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>

                  {/* AT/GY系列特有参数 - 仅在选择 Rack & Pinion 时显示 */}
                  <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.mechanism !== currentValues.mechanism}>
                    {({ getFieldValue }) =>
                      getFieldValue('mechanism') === 'Rack & Pinion' ? (
                        <>
                          {/* 材质选择 - AT(铝合金) vs GY(不锈钢) */}
                          <Form.Item
                            label="执行器材质"
                            name="material_type"
                            rules={[{ required: true, message: '请选择执行器材质' }]}
                            tooltip="AT系列：铝合金，轻量化，成本较低；GY系列：不锈钢，耐腐蚀性更强，适用于化工等恶劣环境"
                          >
                            <Radio.Group buttonStyle="solid">
                              <Radio.Button value="Aluminum Alloy">铝合金 (AT系列) - 标准</Radio.Button>
                              <Radio.Button value="Stainless Steel">不锈钢 (GY系列) - 耐腐蚀</Radio.Button>
                            </Radio.Group>
                          </Form.Item>

                          {/* 使用温度 */}
                          <Form.Item
                            label="使用温度"
                            name="temperature_type"
                            rules={[{ required: true, message: '请选择使用温度' }]}
                          >
                            <Radio.Group buttonStyle="solid">
                              <Radio.Button value="normal">常温 (Normal)</Radio.Button>
                              <Radio.Button value="low">低温 (Low Temp)</Radio.Button>
                              <Radio.Button value="high">高温 (High Temp)</Radio.Button>
                            </Radio.Group>
                          </Form.Item>
                        </>
                      ) : null
                    }
                  </Form.Item>

                  {/* 阀门口径 */}
                  <Form.Item
                    label="阀门口径"
                    name="valve_size"
                    tooltip="例如：DN100, DN150, 4 inch, 6 inch 等"
                  >
                    <Input placeholder="请输入阀门口径，如 DN100" />
                  </Form.Item>

                  {/* 法兰连接尺寸 */}
                  <Form.Item
                    label="法兰连接尺寸"
                    name="flange_size"
                    tooltip="例如：F07/F10, F10/F12, F14/F16 等"
                  >
                    <Input placeholder="请输入法兰尺寸，如 F07/F10" />
                  </Form.Item>

                  <Form.Item
                    label="位号标识（可选）"
                    name="tag_number"
                  >
                    <Input placeholder="如: FV-101" />
                  </Form.Item>

                  {/* 扭矩输入 - 根据作用类型显示不同字段 */}
                  <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.action_type_preference !== currentValues.action_type_preference}>
                    {({ getFieldValue }) =>
                      getFieldValue('action_type_preference') === 'SR' ? (
                        <>
                          {/* 单作用：需要分别输入开启和关闭扭矩 */}
                          <Form.Item
                            label="开启扭矩 (Nm)"
                            name="requiredOpeningTorque"
                            rules={[
                              { required: true, message: '请输入开启扭矩' },
                              { type: 'number', min: 1, message: '扭矩必须大于0' }
                            ]}
                            tooltip="阀门从关闭到开启所需的扭矩"
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              placeholder="输入阀门开启扭矩"
                              min={1}
                              step={10}
                              addonAfter="Nm"
                            />
                          </Form.Item>
                          <Form.Item
                            label="关闭扭矩 (Nm)"
                            name="requiredClosingTorque"
                            rules={[
                              { required: true, message: '请输入关闭扭矩' },
                              { type: 'number', min: 1, message: '扭矩必须大于0' }
                            ]}
                            tooltip="阀门从开启到关闭所需的扭矩"
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              placeholder="输入阀门关闭扭矩"
                              min={1}
                              step={10}
                              addonAfter="Nm"
                            />
                          </Form.Item>
                        </>
                      ) : (
                        /* 双作用：只需要输入一个需求扭矩 */
                        <Form.Item
                          label="需求扭矩 (Nm)"
                          name="required_torque"
                          rules={[
                            { required: true, message: '请输入需求扭矩' },
                            { type: 'number', min: 1, message: '扭矩必须大于0' }
                          ]}
                          tooltip="阀门操作所需的扭矩"
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            placeholder="输入阀门所需扭矩"
                            min={1}
                            step={10}
                            addonAfter="Nm"
                          />
                        </Form.Item>
                      )
                    }
                  </Form.Item>

                  {/* 安全系数选择 */}
                  <Form.Item
                    label="安全系数"
                    name="safetyFactor"
                    rules={[{ required: true, message: '请选择安全系数' }]}
                    tooltip="安全系数用于计算执行器实际需求扭矩。默认1.3，特殊要求可调整。实际需求 = 阀门扭矩 × 安全系数"
                  >
                    <Select placeholder="选择安全系数">
                      <Select.Option value={1.0}>1.0 (无安全裕量)</Select.Option>
                      <Select.Option value={1.2}>1.2 (标准)</Select.Option>
                      <Select.Option value={1.3}>1.3 (推荐，默认)</Select.Option>
                      <Select.Option value={1.5}>1.5 (高安全要求)</Select.Option>
                      <Select.Option value={1.8}>1.8 (极高安全要求)</Select.Option>
                      <Select.Option value={2.0}>2.0 (最高安全要求)</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="工作压力 (MPa)"
                    name="working_pressure"
                    rules={[{ required: true, message: '请选择工作压力' }]}
                  >
                    <Select placeholder="选择工作压力">
                      <Select.Option value={0.3}>0.3 MPa</Select.Option>
                      <Select.Option value={0.4}>0.4 MPa</Select.Option>
                      <Select.Option value={0.5}>0.5 MPa</Select.Option>
                      <Select.Option value={0.6}>0.6 MPa</Select.Option>
                    </Select>
                  </Form.Item>

                  {/* 使用温度 (Temperature) */}
                  <Form.Item
                    label="使用温度 (Temperature)"
                    name="temperature_code"
                    tooltip="选择执行器的工作温度范围"
                  >
                    <Select placeholder="选择使用温度范围" defaultValue="No code">
                      <Select.Option value="No code">常温 Normal (-20~80°C)</Select.Option>
                      <Select.Option value="T1">低温 Low T1 (-40~80°C)</Select.Option>
                      <Select.Option value="T2">低温 Low T2 (-50~80°C)</Select.Option>
                      <Select.Option value="T3">低温 Low T3 (-60~80°C)</Select.Option>
                      <Select.Option value="M">高温 High Temp (-20~120°C)</Select.Option>
                    </Select>
                  </Form.Item>
                </Panel>

                <Panel header="轭架和附件" key="2">
                  <Form.Item
                    label="手动操作装置"
                    name="needs_manual_override"
                    valuePropName="checked"
                  >
                    <Radio.Group>
                      <Radio value={false}>不需要</Radio>
                      <Radio value={true}>需要</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="最大预算（可选，元）"
                    name="max_budget"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="输入预算上限"
                      min={0}
                      step={1000}
                      prefix="¥"
                    />
                  </Form.Item>
                </Panel>
              </Collapse>

              <Divider />

              <Button
                type="primary"
                size="large"
                block
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
                style={{ height: 50, fontSize: 16 }}
              >
                查找匹配执行器
              </Button>
            </Form>
          </Card>
        </Col>

        {/* 右栏：搜索结果 */}
        <Col xs={24} lg={currentProject ? 9 : 12}>
          <Card 
            title={
              <Space>
                <ThunderboltOutlined />
                <span>推荐结果</span>
                {results.length > 0 && (
                  <Tag color="blue">{results.length} 个</Tag>
                )}
              </Space>
            }
          >
            <Spin spinning={loading}>
              {results.length === 0 ? (
                <Empty
                  description="请填写参数并点击搜索"
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <List
                  dataSource={results}
                  renderItem={(item, index) => {
                    const recommend = getRecommendLevel(item.torque_margin)
                    return (
                      <Card
                        size="small"
                        style={{ 
                          marginBottom: 12,
                          border: selectedActuator?._id === item._id ? '2px solid #1890ff' : undefined
                        }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Space>
                              <Text strong style={{ fontSize: 16 }}>
                                {index + 1}. {item.model_base}
                              </Text>
                              <Tag color={recommend.color}>{recommend.text}</Tag>
                            </Space>
                            <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                              ¥{item.price?.toLocaleString() || '-'}
                            </Text>
                          </div>

                          <div>
                            <Text type="secondary">实际扭矩：</Text>
                            <Text strong>{item.actual_torque} Nm</Text>
                          </div>

                          <div>
                            <Space style={{ width: '100%' }} direction="vertical">
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">扭矩裕度：</Text>
                                <Text strong style={{ color: getMarginColor(item.torque_margin) }}>
                                  {item.torque_margin.toFixed(1)}%
                                </Text>
                              </div>
                              <Progress
                                percent={Math.min(item.torque_margin, 100)}
                                strokeColor={getMarginColor(item.torque_margin)}
                                size="small"
                                showInfo={false}
                              />
                            </Space>
                          </div>

                          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                            <Text type="secondary">
                              机身: {item.body_size} | 
                              类型: {item.action_type} | 
                              交期: {item.lead_time || '-'}
                            </Text>
                          </div>

                          {/* 备件维修包价格 */}
                          {item.spare_parts && (item.spare_parts.seal_kit_price || (item.spare_parts.other_parts && item.spare_parts.other_parts.length > 0)) && (
                            <div style={{ 
                              backgroundColor: '#f0f5ff', 
                              padding: '8px', 
                              borderRadius: '4px',
                              marginTop: '8px'
                            }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                💼 备件维修包：
                              </Text>
                              {item.spare_parts.seal_kit_price && (
                                <div style={{ marginTop: 4 }}>
                                  <Text style={{ fontSize: 12 }}>
                                    密封套件：<Text strong style={{ color: '#52c41a' }}>¥{item.spare_parts.seal_kit_price.toLocaleString()}</Text>
                                  </Text>
                                </div>
                              )}
                              {item.spare_parts.other_parts && item.spare_parts.other_parts.length > 0 && (
                                <div style={{ marginTop: 4 }}>
                                  {item.spare_parts.other_parts.slice(0, 2).map((part, idx) => (
                                    <div key={idx}>
                                      <Text style={{ fontSize: 12 }}>
                                        {part.part_name}：<Text strong style={{ color: '#52c41a' }}>¥{part.price?.toLocaleString() || '-'}</Text>
                                      </Text>
                                    </div>
                                  ))}
                                  {item.spare_parts.other_parts.length > 2 && (
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      ...及其他 {item.spare_parts.other_parts.length - 2} 个备件
                                    </Text>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <Button
                            type="primary"
                            block
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleSelectActuator(item)}
                          >
                            选择此型号
                          </Button>
                        </Space>
                      </Card>
                    )
                  }}
                />
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* 选择手动操作装置 Modal */}
      <Modal
        title="选择手动操作装置"
        open={showOverrideModal}
        onOk={handleConfirmOverride}
        onCancel={() => setShowOverrideModal(false)}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Alert
          message={`已选择执行器: ${selectedActuator?.model_base}`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {manualOverrides.length === 0 ? (
          <Empty description="没有找到兼容的手动操作装置" />
        ) : (
          <Radio.Group
            style={{ width: '100%' }}
            value={selectedOverride?._id}
            onChange={(e) => {
              const override = manualOverrides.find(o => o._id === e.target.value)
              setSelectedOverride(override)
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {manualOverrides.map(override => (
                <Card key={override._id} size="small">
                  <Radio value={override._id}>
                    <Space>
                      <Text strong>{override.model}</Text>
                      <Text type="secondary">-</Text>
                      <Text>¥{override.price}</Text>
                      <Tag>兼容: {override.compatible_body_sizes.join(', ')}</Tag>
                    </Space>
                  </Radio>
                </Card>
              ))}
              <Card size="small">
                <Radio value={null}>不需要手动操作装置</Radio>
              </Card>
            </Space>
          </Radio.Group>
        )}
      </Modal>

      {/* 配件选择 Modal */}
      <Modal
        title={
          <Space>
            <ShoppingOutlined />
            <span>步骤 3: 选择控制附件</span>
            {selectedAccessories.length > 0 && (
              <Badge count={selectedAccessories.length} />
            )}
          </Space>
        }
        open={showAccessoriesModal}
        onOk={handleConfirmAccessories}
        onCancel={() => setShowAccessoriesModal(false)}
        okText={`确认选择 (${selectedAccessories.length} 个)`}
        cancelText="返回"
        width={900}
        style={{ top: 20 }}
      >
        <Spin spinning={loadingAccessories}>
          <Alert
            message="智能推荐"
            description={`已根据您的控制要求自动推荐并勾选了 ${recommendedAccessoryIds.size} 个核心配件，您可以根据实际需求调整选择。`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Tabs defaultActiveKey="all" type="card">
            <Tabs.TabPane 
              tab={
                <span>
                  <AppstoreOutlined />
                  全部配件
                </span>
              }
              key="all"
            >
              {Object.keys(availableAccessories).map(category => (
                <Collapse
                  key={category}
                  defaultActiveKey={['控制类']}
                  style={{ marginBottom: 12 }}
                >
                  <Panel
                    header={
                      <Space>
                        <Text strong>{category}</Text>
                        <Badge 
                          count={availableAccessories[category]?.length || 0} 
                          style={{ backgroundColor: '#52c41a' }}
                        />
                      </Space>
                    }
                    key={category}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {(availableAccessories[category] || []).map(acc => {
                        const isSelected = selectedAccessories.some(a => a._id === acc._id)
                        const isRecommended = recommendedAccessoryIds.has(acc._id)
                        
                        return (
                          <Card
                            key={acc._id}
                            size="small"
                            style={{
                              border: isRecommended ? '2px solid #1890ff' : undefined,
                              backgroundColor: isRecommended ? '#f0f8ff' : undefined
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => handleAccessoryToggle(acc, e.target.checked)}
                            >
                              <Space direction="vertical" size="small">
                                <Space>
                                  <Text strong>{acc.name}</Text>
                                  {isRecommended && (
                                    <Tag color="blue">推荐</Tag>
                                  )}
                                  <Text type="secondary">¥{acc.price?.toLocaleString()}</Text>
                                </Space>
                                {acc.description && (
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {acc.description}
                                  </Text>
                                )}
                                {acc.manufacturer && (
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    制造商: {acc.manufacturer}
                                  </Text>
                                )}
                              </Space>
                            </Checkbox>
                          </Card>
                        )
                      })}
                    </Space>
                  </Panel>
                </Collapse>
              ))}
            </Tabs.TabPane>
            
            {Object.keys(availableAccessories).map(category => (
              <Tabs.TabPane tab={category} key={category}>
                <List
                  dataSource={availableAccessories[category] || []}
                  renderItem={acc => {
                    const isSelected = selectedAccessories.some(a => a._id === acc._id)
                    const isRecommended = recommendedAccessoryIds.has(acc._id)
                    
                    return (
                      <List.Item>
                        <Card
                          size="small"
                          style={{
                            width: '100%',
                            border: isRecommended ? '2px solid #1890ff' : undefined,
                            backgroundColor: isRecommended ? '#f0f8ff' : undefined
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleAccessoryToggle(acc, e.target.checked)}
                          >
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              <Space>
                                <Text strong>{acc.name}</Text>
                                {isRecommended && <Tag color="blue">智能推荐</Tag>}
                                <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
                                  ¥{acc.price?.toLocaleString()}
                                </Text>
                              </Space>
                              {acc.description && (
                                <Text type="secondary">{acc.description}</Text>
                              )}
                            </Space>
                          </Checkbox>
                        </Card>
                      </List.Item>
                    )
                  }}
                />
              </Tabs.TabPane>
            ))}
          </Tabs>
          
          <Divider />
          
          <Card size="small" style={{ backgroundColor: '#fafafa' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>已选配件：</Text>
                <Text type="secondary">{selectedAccessories.length} 个</Text>
              </div>
              {selectedAccessories.length > 0 && (
                <div>
                  <Text type="secondary">配件总价：</Text>
                  <Text strong style={{ color: '#1890ff', marginLeft: 8 }}>
                    ¥{selectedAccessories.reduce((sum, acc) => sum + (acc.price || 0), 0).toLocaleString()}
                  </Text>
                </div>
              )}
            </Space>
          </Card>
        </Spin>
      </Modal>

      {/* 保存到项目 Modal */}
      <Modal
        title="保存选型结果"
        open={saveToProjectModal}
        onOk={handleSaveToProject}
        onCancel={() => setSaveToProjectModal(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        {selectedActuator && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="选型配置汇总"
              type="success"
              showIcon
            />
            
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">执行器型号：</Text>
                  <Text strong>{selectedActuator.model_base}</Text>
                </div>
                <div>
                  <Text type="secondary">价格：</Text>
                  <Text strong>¥{selectedActuator.price?.toLocaleString()}</Text>
                </div>
                <div>
                  <Text type="secondary">扭矩：</Text>
                  <Text strong>{selectedActuator.actual_torque} Nm</Text>
                </div>
                
                {/* 备件维修包信息 */}
                {selectedActuator.spare_parts && (selectedActuator.spare_parts.seal_kit_price || (selectedActuator.spare_parts.other_parts && selectedActuator.spare_parts.other_parts.length > 0)) && (
                  <>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Text type="secondary">💼 备件维修包：</Text>
                    </div>
                    {selectedActuator.spare_parts.seal_kit_price && (
                      <div>
                        <Text style={{ fontSize: 13 }}>
                          • 密封套件：<Text strong style={{ color: '#52c41a' }}>¥{selectedActuator.spare_parts.seal_kit_price.toLocaleString()}</Text>
                        </Text>
                      </div>
                    )}
                    {selectedActuator.spare_parts.other_parts && selectedActuator.spare_parts.other_parts.length > 0 && (
                      <>
                        {selectedActuator.spare_parts.other_parts.map((part, idx) => (
                          <div key={idx}>
                            <Text style={{ fontSize: 13 }}>
                              • {part.part_name}：<Text strong style={{ color: '#52c41a' }}>¥{part.price?.toLocaleString() || '-'}</Text>
                            </Text>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
                
                {selectedOverride && (
                  <>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Text type="secondary">手动操作装置：</Text>
                      <Text strong>{selectedOverride.model}</Text>
                    </div>
                    <div>
                      <Text type="secondary">装置价格：</Text>
                      <Text strong>¥{selectedOverride.price?.toLocaleString()}</Text>
                    </div>
                  </>
                )}
                
                {selectedAccessories.length > 0 && (
                  <>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Text type="secondary">已选配件：</Text>
                      <Text strong>{selectedAccessories.length} 个</Text>
                    </div>
                    <div style={{ maxHeight: 150, overflow: 'auto', padding: '8px 0' }}>
                      {selectedAccessories.map((acc, index) => (
                        <div key={acc._id} style={{ marginBottom: 4 }}>
                          <Text style={{ fontSize: 12 }}>
                            {index + 1}. {acc.name} - ¥{acc.price?.toLocaleString()}
                          </Text>
                        </div>
                      ))}
                    </div>
                    <div>
                      <Text type="secondary">配件总价：</Text>
                      <Text strong>
                        ¥{selectedAccessories.reduce((sum, acc) => sum + (acc.price || 0), 0).toLocaleString()}
                      </Text>
                    </div>
                  </>
                )}
                
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Text type="secondary">总价：</Text>
                  <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                    ¥{(
                      (selectedActuator.price || 0) + 
                      (selectedOverride?.price || 0) +
                      selectedAccessories.reduce((sum, acc) => sum + (acc.price || 0), 0)
                    ).toLocaleString()}
                  </Text>
                </div>
              </Space>
            </Card>

            {!currentProject && (
              <Alert
                message="提示：您还没有选择项目，请先在项目管理中创建或选择项目"
                type="warning"
                showIcon
              />
            )}
          </Space>
        )}
      </Modal>
      </>
    )
  
  // 渲染批量选型Tab内容
  const renderBatchSelection = () => {
    const batchColumns = [
      {
        title: '位号',
        dataIndex: 'tag_number',
        key: 'tag_number',
        render: (text, record) => (
          <Input 
            value={text} 
            onChange={(e) => handleBatchDataChange(record.key, 'tag_number', e.target.value)}
            placeholder="如: FV-101"
          />
        )
      },
      {
        title: '需求扭矩 (Nm)',
        dataIndex: 'required_torque',
        key: 'required_torque',
        render: (text, record) => (
          <InputNumber 
            value={text} 
            onChange={(value) => handleBatchDataChange(record.key, 'required_torque', value)}
            placeholder="输入扭矩"
            min={1}
            style={{ width: '100%' }}
          />
        )
      },
      {
        title: '安全系数',
        dataIndex: 'safetyFactor',
        key: 'safetyFactor',
        width: 120,
        render: (text, record) => (
          <Select 
            value={text || 1.3} 
            onChange={(value) => handleBatchDataChange(record.key, 'safetyFactor', value)}
            style={{ width: '100%' }}
          >
            <Select.Option value={1.0}>1.0</Select.Option>
            <Select.Option value={1.2}>1.2</Select.Option>
            <Select.Option value={1.3}>1.3</Select.Option>
            <Select.Option value={1.5}>1.5</Select.Option>
            <Select.Option value={1.8}>1.8</Select.Option>
            <Select.Option value={2.0}>2.0</Select.Option>
          </Select>
        )
      },
      {
        title: '工作压力 (MPa)',
        dataIndex: 'working_pressure',
        key: 'working_pressure',
        render: (text, record) => (
          <Select 
            value={text} 
            onChange={(value) => handleBatchDataChange(record.key, 'working_pressure', value)}
            style={{ width: '100%' }}
          >
            <Select.Option value={0.3}>0.3 MPa</Select.Option>
            <Select.Option value={0.4}>0.4 MPa</Select.Option>
            <Select.Option value={0.5}>0.5 MPa</Select.Option>
            <Select.Option value={0.6}>0.6 MPa</Select.Option>
          </Select>
        )
      },
      {
        title: '执行器类型',
        dataIndex: 'mechanism',
        key: 'mechanism',
        render: (text, record) => (
          <Select 
            value={text} 
            onChange={(value) => {
              handleBatchDataChange(record.key, 'mechanism', value)
              // 切换执行器类型时，重置阀门类型为对应的默认值
              const defaultValveType = value === 'Scotch Yoke' ? 'Ball Valve' : 'Gate Valve'
              handleBatchDataChange(record.key, 'valve_type', defaultValveType)
            }}
            style={{ width: '140px' }}
          >
            <Select.Option value="Scotch Yoke">拨叉式(SF)</Select.Option>
            <Select.Option value="Rack & Pinion">齿轮齿条(AT/GY)</Select.Option>
          </Select>
        )
      },
      {
        title: '阀门类型',
        dataIndex: 'valve_type',
        key: 'valve_type',
        render: (text, record) => (
          <Select 
            value={text} 
            onChange={(value) => handleBatchDataChange(record.key, 'valve_type', value)}
            style={{ width: '140px' }}
          >
            {/* 所有执行器类型都只支持旋转型阀门 */}
            <Select.Option value="Ball Valve">球阀</Select.Option>
            <Select.Option value="Butterfly Valve">蝶阀</Select.Option>
          </Select>
        )
      },
      {
        title: '操作',
        key: 'action',
        width: 80,
        render: (text, record) => (
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBatchRow(record.key)}
          />
        )
      }
    ]
    
    const resultColumns = [
      {
        title: '位号',
        dataIndex: 'tag_number',
        key: 'tag_number'
      },
      {
        title: '推荐型号',
        dataIndex: 'selected_actuator',
        key: 'model',
        render: (actuator) => actuator?.model_base || '-'
      },
      {
        title: '实际扭矩 (Nm)',
        dataIndex: 'selected_actuator',
        key: 'torque',
        render: (actuator) => actuator?.actual_torque || '-'
      },
      {
        title: '扭矩裕度',
        dataIndex: 'selected_actuator',
        key: 'margin',
        render: (actuator) => actuator?.torque_margin ? `${actuator.torque_margin.toFixed(1)}%` : '-'
      },
      {
        title: '状态',
        dataIndex: 'selected_actuator',
        key: 'status',
        render: (actuator) => actuator ? 
          <Tag color="success">成功</Tag> : 
          <Tag color="error">失败</Tag>
      }
    ]
    
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          message="批量选型说明"
          description="您可以添加多个选型需求，系统将自动为每个需求推荐最佳执行器型号。完成后可一键保存到项目。"
          type="info"
          showIcon
          closable
        />
        
        {currentProject && (
          <Card size="small">
            <Space>
              <Text type="secondary">当前项目：</Text>
              <Text strong>{currentProject.projectName}</Text>
              <Text type="secondary">|</Text>
              <Text type="secondary">项目编号：</Text>
              <Text>{currentProject.projectNumber || '-'}</Text>
              <Text type="secondary">|</Text>
              <Text type="secondary">客户：</Text>
              <Text>{currentProject.client?.name || '-'}</Text>
            </Space>
          </Card>
        )}
        
        <Card 
          title="选型数据"
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddBatchRow}
            >
              添加行
            </Button>
          }
        >
          <Table 
            columns={batchColumns}
            dataSource={batchData}
            pagination={false}
            locale={{ emptyText: '暂无数据，请点击"添加行"按钮添加选型需求' }}
          />
          
          {batchData.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setBatchData([])}>
                  清空
                </Button>
                <Button 
                  type="primary" 
                  icon={<ThunderboltOutlined />}
                  onClick={handleBatchSelection}
                  loading={batchLoading}
                >
                  开始批量选型
                </Button>
              </Space>
            </div>
          )}
        </Card>
        
        {batchResults.length > 0 && (
          <Card 
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span>选型结果</span>
                <Tag color="blue">{batchResults.length} 条</Tag>
              </Space>
            }
            extra={
              currentProject && (
                <Space>
                  <Button 
                    onClick={() => handleSaveBatchToProject(false)}
                  >
                    仅保存到项目
                  </Button>
                  <Button 
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleSaveBatchToProject(true)}
                  >
                    保存并提交报价
                  </Button>
                </Space>
              )
            }
          >
            {currentProject && (
              <Alert
                message="💡 一键完成选型工作"
                description={
                  <div>
                    <div>• <strong>仅保存到项目</strong>：保存当前选型结果，可继续添加更多选型</div>
                    <div>• <strong>保存并提交报价</strong>：保存选型结果并立即提交给商务工程师报价（推荐）</div>
                  </div>
                }
                type="info"
                showIcon
                closable
                style={{ marginBottom: 16 }}
              />
            )}
            <Table 
              columns={resultColumns}
              dataSource={batchResults}
              pagination={false}
              summary={() => {
                const successCount = batchResults.filter(r => r.selected_actuator).length
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={5}>
                      <Text strong>
                        成功: {successCount} / 总计: {batchResults.length}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )
              }}
            />
          </Card>
        )}
      </Space>
    )
  }

  // 主渲染
  return (
    <div>
      {/* 项目信息卡片 - 当从项目页面跳转时显示 */}
      {currentProject && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong style={{ fontSize: 16 }}>
                📋 为项目进行选型: {currentProject.projectName}
              </Text>
              <Space split={<Text type="secondary">|</Text>}>
                <Text type="secondary">
                  项目编号: {currentProject.projectNumber}
                </Text>
                <Text type="secondary">
                  客户: {currentProject.client?.name || '-'}
                </Text>
                {currentProject.client?.company && (
                  <Text type="secondary">
                    公司: {currentProject.client.company}
                  </Text>
                )}
              </Space>
              {currentProject.technical_requirements && (
                <div style={{ 
                  marginTop: 8, 
                  padding: '8px 12px', 
                  background: '#f0f2f5', 
                  borderRadius: 4,
                  border: '1px solid #d9d9d9'
                }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    技术需求:
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 13 }}>
                      {currentProject.technical_requirements}
                    </Text>
                  </div>
                </div>
              )}
              <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                💡 提示: 选型完成后，配件会自动添加到此项目的技术清单中
              </Text>
            </Space>
          }
        />
      )}
      
      <Card 
        title={
          <Space>
            <ThunderboltOutlined />
            <span>智慧选型工具</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <SearchOutlined />
                单个选型
              </span>
            } 
            key="single"
          >
            {renderSingleSelection()}
          </TabPane>
          <TabPane 
            tab={
              <span>
                <AppstoreOutlined />
                批量选型
              </span>
            } 
            key="batch"
          >
            {renderBatchSelection()}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default SelectionEngine
