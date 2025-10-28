import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Row, Col, Card, Form, Input, InputNumber, Radio, Button, 
  List, Progress, Tag, Divider, Space, message, Spin, Empty,
  Typography, Alert, Collapse, Modal, Select, Checkbox, Tabs, Badge
} from 'antd'
import { 
  SearchOutlined, CheckCircleOutlined, ThunderboltOutlined,
  FileTextOutlined, DollarOutlined, SettingOutlined,
  InfoCircleOutlined, AppstoreOutlined, ShoppingOutlined
} from '@ant-design/icons'
import { selectionAPI, manualOverridesAPI, projectsAPI, accessoriesAPI } from '../services/api'

const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse

const SelectionEngine = () => {
  const [form] = Form.useForm()
  const [searchParams] = useSearchParams()
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

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
    }
  }, [projectId])

  const fetchProject = async (id) => {
    try {
      const response = await projectsAPI.getById(id)
      setCurrentProject(response.data)
    } catch (error) {
      message.error('获取项目信息失败')
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
      
      // 调试日志
      console.log('选型请求参数:', {
        mechanism: requestPayload.mechanism,
        valve_type: requestPayload.valve_type,
        required_torque: requestPayload.required_torque,
        working_pressure: requestPayload.working_pressure,
      })
      
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

      // 调试日志：显示将要保存的数据
      console.log('保存选型记录:', {
        tag_number: selectionData.tag_number,
        valve_size: formValues.valve_size,
        flange_size: formValues.flange_size,
        mechanism: formValues.mechanism,
        valve_type: formValues.valve_type,
        accessories_count: selectedAccessories.length
      })

      await projectsAPI.autoSelect(currentProject._id, selectionData)
      message.success(`已保存到项目（包含 ${selectedAccessories.length} 个配件）`)
      setSaveToProjectModal(false)
      
      // 重置表单和结果
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

  return (
    <div>
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
                  <Text strong>{currentProject.project_name}</Text>
                </div>
                <div>
                  <Text type="secondary">客户名称：</Text>
                  <br />
                  <Text>{currentProject.client_name || '-'}</Text>
                </div>
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
                yoke_type: 'symmetric',
                needs_manual_override: false,
                max_rotation_angle: 90,
                temperature_type: 'normal',
                needs_handwheel: false,
                temperature_code: 'No code'
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

                  {/* 阀门类型 - 仅在选择 Scotch Yoke 时显示 */}
                  <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.mechanism !== currentValues.mechanism}>
                    {({ getFieldValue }) =>
                      getFieldValue('mechanism') === 'Scotch Yoke' ? (
                        <Form.Item
                          label="阀门类型"
                          name="valve_type"
                          rules={[{ required: true, message: '请选择阀门类型' }]}
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

                          {/* 是否需要手轮 */}
                          <Form.Item
                            label="是否需要手轮"
                            name="needs_handwheel"
                            valuePropName="checked"
                          >
                            <Checkbox>需要手轮</Checkbox>
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

                  <Form.Item
                    label="需求扭矩 (Nm)"
                    name="required_torque"
                    rules={[
                      { required: true, message: '请输入需求扭矩' },
                      { type: 'number', min: 1, message: '扭矩必须大于0' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="输入阀门所需扭矩"
                      min={1}
                      step={10}
                    />
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

                  <Form.Item
                    label="旋转角度 (度)"
                    name="max_rotation_angle"
                  >
                    <Select>
                      <Select.Option value={90}>90°</Select.Option>
                      <Select.Option value={0}>0° (双作用)</Select.Option>
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
    </div>
  )
}

export default SelectionEngine
