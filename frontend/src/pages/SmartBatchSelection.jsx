import { useState } from 'react'
import { 
  Card, Button, Upload, Table, Space, message, Alert, 
  Modal, Typography, Tag, Statistic, Row, Col, Steps,
  Spin, Progress, Divider, Tabs
} from 'antd'
import { 
  CloudUploadOutlined, FileTextOutlined, FilePdfOutlined,
  FileImageOutlined, CheckCircleOutlined, DownloadOutlined,
  EyeOutlined, ThunderboltOutlined
} from '@ant-design/icons'
import axios from 'axios'
import * as XLSX from 'xlsx'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps
const { TabPane } = Tabs

const SmartBatchSelection = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [extractedParams, setExtractedParams] = useState([])
  const [extractedText, setExtractedText] = useState('')
  const [extractMethod, setExtractMethod] = useState('')
  const [selectionResults, setSelectionResults] = useState([])
  const [errors, setErrors] = useState([])
  
  // 文件上传前的验证
  const beforeUpload = (file) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/bmp',
      'image/tiff'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      message.error('只支持 PDF 和图片文件（JPG, PNG, BMP, TIFF）')
      return false
    }
    
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('文件大小不能超过 10MB')
      return false
    }
    
    return true
  }
  
  // 处理文件上传
  const handleUpload = async ({ file }) => {
    setUploading(true)
    setParsing(true)
    
    const formData = new FormData()
    formData.append('document', file)
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        '/api/document/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      if (response.data.success) {
        setUploadedFile(file)
        setExtractedParams(response.data.data.params)
        setExtractedText(response.data.data.text)
        setExtractMethod(response.data.data.extractMethod)
        setCurrentStep(1)
        
        message.success(`成功提取 ${response.data.data.count} 条选型参数`)
      } else {
        message.error(response.data.message || '文件解析失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      message.error(error.response?.data?.message || '文件上传失败')
    } finally {
      setUploading(false)
      setParsing(false)
    }
  }
  
  // 执行批量选型
  const handleBatchSelection = async () => {
    if (extractedParams.length === 0) {
      message.warning('没有可选型的参数')
      return
    }
    
    setSelecting(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        '/api/document/batch-select',
        { params: extractedParams },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      if (response.data.success) {
        setSelectionResults(response.data.data.results)
        setErrors(response.data.data.errors)
        setCurrentStep(2)
        
        message.success(response.data.message)
      } else {
        message.error(response.data.message || '批量选型失败')
      }
    } catch (error) {
      console.error('批量选型失败:', error)
      message.error(error.response?.data?.message || '批量选型失败')
    } finally {
      setSelecting(false)
    }
  }
  
  // 导出结果
  const exportResults = () => {
    const ws = XLSX.utils.json_to_sheet(
      selectionResults.map(r => ({
        '位号': r.tag_number,
        '阀门扭矩': r.input.valve_torque,
        '阀门类型': r.input.valve_type,
        '工作压力': r.input.working_pressure,
        '安全系数': r.input.safety_factor,
        '推荐型号': r.output.model,
        '系列': r.output.series,
        '实际扭矩': r.output.actual_torque,
        '价格': r.output.price
      }))
    )
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '选型结果')
    XLSX.writeFile(wb, `智能选型结果_${new Date().toLocaleDateString()}.xlsx`)
    
    message.success('结果已导出')
  }
  
  // 提取参数表格列
  const paramsColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: '位号',
      dataIndex: 'tag_number',
      key: 'tag_number',
      width: 120
    },
    {
      title: '阀门类型',
      dataIndex: 'valve_type',
      key: 'valve_type',
      width: 120,
      render: (type) => (
        <Tag color={type === 'Ball Valve' ? 'blue' : 'green'}>
          {type === 'Ball Valve' ? '球阀' : '蝶阀'}
        </Tag>
      )
    },
    {
      title: '阀门扭矩',
      dataIndex: 'valve_torque',
      key: 'valve_torque',
      width: 100,
      render: (val) => `${val} N·m`
    },
    {
      title: '工作压力',
      dataIndex: 'working_pressure',
      key: 'working_pressure',
      width: 100,
      render: (val) => `${val} MPa`
    },
    {
      title: '安全系数',
      dataIndex: 'safety_factor',
      key: 'safety_factor',
      width: 100
    }
  ]
  
  // 选型结果表格列
  const resultsColumns = [
    {
      title: '位号',
      dataIndex: 'tag_number',
      key: 'tag_number',
      width: 120
    },
    {
      title: '输入参数',
      key: 'input',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text>扭矩: {record.input.valve_torque} N·m</Text>
          <Text>压力: {record.input.working_pressure} MPa</Text>
          <Text>类型: {record.input.valve_type}</Text>
        </Space>
      )
    },
    {
      title: '推荐型号',
      dataIndex: ['output', 'model'],
      key: 'model',
      render: (model, record) => (
        <Space direction="vertical">
          <Text strong style={{ fontSize: 16 }}>{model}</Text>
          <Tag color="blue">{record.output.series}系列</Tag>
        </Space>
      )
    },
    {
      title: '实际扭矩',
      dataIndex: ['output', 'actual_torque'],
      key: 'actual_torque',
      render: (val) => <Text strong>{val} N·m</Text>
    },
    {
      title: '价格',
      dataIndex: ['output', 'price'],
      key: 'price',
      render: (val) => <Text type="success">¥{val}</Text>
    }
  ]
  
  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>
          <ThunderboltOutlined /> 智能批量选型
        </Title>
        <Paragraph>
          上传PDF技术文档或图片，系统将自动提取选型参数并进行批量选型
        </Paragraph>
        
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="上传文档" icon={<CloudUploadOutlined />} />
          <Step title="确认参数" icon={<EyeOutlined />} />
          <Step title="选型结果" icon={<CheckCircleOutlined />} />
        </Steps>
        
        {/* 步骤1: 上传文档 */}
        {currentStep === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Upload.Dragger
              name="document"
              multiple={false}
              beforeUpload={beforeUpload}
              customRequest={handleUpload}
              showUploadList={false}
              disabled={uploading}
            >
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 PDF、JPG、PNG、BMP、TIFF 格式，文件大小不超过 10MB
              </p>
            </Upload.Dragger>
            
            {parsing && (
              <div style={{ marginTop: 24 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text>正在智能解析文档...</Text>
                </div>
              </div>
            )}
            
            <Alert
              message="支持的文档类型"
              description={
                <Space direction="vertical">
                  <div><FilePdfOutlined /> PDF技术文档</div>
                  <div><FileImageOutlined /> 图片扫描件（JPG, PNG等）</div>
                  <div><FileTextOutlined /> 技术说明书截图</div>
                </Space>
              }
              type="info"
              style={{ marginTop: 24, textAlign: 'left' }}
            />
          </div>
        )}
        
        {/* 步骤2: 确认参数 */}
        {currentStep === 1 && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic title="提取方法" value={extractMethod} />
              </Col>
              <Col span={8}>
                <Statistic title="提取参数数" value={extractedParams.length} suffix="条" />
              </Col>
              <Col span={8}>
                <Statistic title="文件名" value={uploadedFile?.name} />
              </Col>
            </Row>
            
            <Tabs defaultActiveKey="1">
              <TabPane tab="提取的参数" key="1">
                <Table
                  columns={paramsColumns}
                  dataSource={extractedParams}
                  rowKey={(_, index) => index}
                  pagination={false}
                  scroll={{ y: 400 }}
                />
              </TabPane>
              
              <TabPane tab="原始文本" key="2">
                <div style={{ 
                  maxHeight: 400, 
                  overflow: 'auto', 
                  background: '#f5f5f5', 
                  padding: 16,
                  whiteSpace: 'pre-wrap'
                }}>
                  {extractedText}
                </div>
              </TabPane>
            </Tabs>
            
            <Divider />
            
            <Space>
              <Button onClick={() => setCurrentStep(0)}>
                重新上传
              </Button>
              <Button 
                type="primary" 
                onClick={handleBatchSelection}
                loading={selecting}
                disabled={extractedParams.length === 0}
              >
                开始批量选型
              </Button>
            </Space>
          </div>
        )}
        
        {/* 步骤3: 选型结果 */}
        {currentStep === 2 && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic 
                  title="成功" 
                  value={selectionResults.length} 
                  valueStyle={{ color: '#3f8600' }}
                  suffix="个"
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="失败" 
                  value={errors.length} 
                  valueStyle={{ color: '#cf1322' }}
                  suffix="个"
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="总计" 
                  value={selectionResults.length + errors.length} 
                  suffix="个"
                />
              </Col>
            </Row>
            
            {selectionResults.length > 0 && (
              <>
                <Title level={4}>选型成功</Title>
                <Table
                  columns={resultsColumns}
                  dataSource={selectionResults}
                  rowKey="index"
                  pagination={false}
                  scroll={{ y: 400 }}
                />
              </>
            )}
            
            {errors.length > 0 && (
              <>
                <Divider />
                <Alert
                  message="选型失败项"
                  description={
                    <ul>
                      {errors.map((err, idx) => (
                        <li key={idx}>
                          {err.tag_number}: {err.error}
                        </li>
                      ))}
                    </ul>
                  }
                  type="warning"
                  showIcon
                />
              </>
            )}
            
            <Divider />
            
            <Space>
              <Button onClick={() => {
                setCurrentStep(0)
                setExtractedParams([])
                setSelectionResults([])
                setErrors([])
              }}>
                重新开始
              </Button>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={exportResults}
                disabled={selectionResults.length === 0}
              >
                导出结果
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  )
}

export default SmartBatchSelection
