import { useState, useEffect } from 'react'
import { Button, Modal, Form, Select, Input, message, Spin, App } from 'antd'
import { UserAddOutlined } from '@ant-design/icons'
import { projectsAPI } from '../services/api'

const { TextArea } = Input
const { Option } = Select

/**
 * 指派技术工程师组件
 * 用于销售经理/销售工程师将项目指派给技术工程师进行选型
 */
const AssignTechnicalSupport = ({ project, onSuccess }) => {
  const { message: antdMessage } = App.useApp()
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [engineers, setEngineers] = useState([])
  const [loadingEngineers, setLoadingEngineers] = useState(false)
  const [form] = Form.useForm()

  // 获取技术工程师列表
  const fetchTechnicalEngineers = async () => {
    try {
      setLoadingEngineers(true)
      const response = await projectsAPI.getTechnicalEngineers()
      setEngineers(response.data.data || [])
    } catch (error) {
      console.error('获取技术工程师列表失败:', error)
      antdMessage.error('获取技术工程师列表失败')
    } finally {
      setLoadingEngineers(false)
    }
  }

  // 打开Modal时加载工程师列表
  const handleOpen = () => {
    setModalVisible(true)
    fetchTechnicalEngineers()
  }

  // 提交指派
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      await projectsAPI.assignTechnicalEngineer(project._id, {
        technicalEngineerId: values.engineerId,
        notes: values.notes || ''
      })

      antdMessage.success('技术工程师指派成功！项目状态已更新为"选型中"')
      setModalVisible(false)
      form.resetFields()
      
      // 刷新项目数据
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('指派失败:', error)
      antdMessage.error(error.response?.data?.message || '指派技术工程师失败')
    } finally {
      setLoading(false)
    }
  }

  // 取消
  const handleCancel = () => {
    setModalVisible(false)
    form.resetFields()
  }

  return (
    <>
      <Button
        type="primary"
        icon={<UserAddOutlined />}
        onClick={handleOpen}
      >
        指派技术工程师
      </Button>

      <Modal
        title="指派技术工程师"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={loading}
        width={600}
        okText="确认指派"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16, padding: '12px', background: '#f0f2f5', borderRadius: '8px' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>项目信息：</strong>
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            <div>项目编号: {project.projectNumber}</div>
            <div>项目名称: {project.projectName}</div>
            <div>客户名称: {project.client?.name}</div>
            <div>行业: {project.industry}</div>
            {project.technical_requirements && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 500, color: '#1890ff' }}>客户技术需求:</div>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  marginTop: 4,
                  padding: '8px',
                  background: '#fff',
                  borderRadius: '4px',
                  maxHeight: '150px',
                  overflow: 'auto'
                }}>
                  {project.technical_requirements}
                </pre>
              </div>
            )}
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
        >
          <Form.Item
            name="engineerId"
            label="选择技术工程师"
            rules={[{ required: true, message: '请选择技术工程师' }]}
          >
            <Select
              placeholder="请选择技术工程师"
              loading={loadingEngineers}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {engineers.map(engineer => (
                <Option key={engineer._id} value={engineer._id}>
                  {engineer.full_name || engineer.phone} 
                  {engineer.department && ` (${engineer.department})`}
                  {engineer.email && ` - ${engineer.email}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注说明（可选）"
            extra="您可以在此添加特殊要求或注意事项"
          >
            <TextArea
              rows={4}
              placeholder={`例如：\n• 项目优先级较高，请尽快完成选型\n• 客户对交期要求严格\n• 需要特别注意防爆要求`}
            />
          </Form.Item>
        </Form>

        {loadingEngineers && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin tip="加载技术工程师列表..." />
          </div>
        )}
      </Modal>
    </>
  )
}

export default AssignTechnicalSupport
