/**
 * 项目看板页面
 * 为销售经理提供项目管理视图
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Upload,
  Row,
  Col,
  Statistic,
  Skeleton
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  UploadOutlined,
  FolderOpenOutlined,
  DollarOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import { projectsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import CloudUpload from '../components/CloudUpload';
import { TableSkeleton } from '../components/LoadingSkeletons';

const { Search } = Input;
const { Option } = Select;

const ProjectDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [form] = Form.useForm();
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 加载项目列表
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      
      const response = await projectsAPI.getAll(params);
      const projectList = response.data.data || [];
      setProjects(projectList);
      
      // 更新分页信息
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      }
      
      // 计算统计信息
      setStatistics({
        total: response.data.pagination?.total || projectList.length,
        pending: projectList.filter(p => p.status === '待指派技术').length,
        inProgress: projectList.filter(p => ['选型中', '待商务报价', '已报价'].includes(p.status)).length,
        completed: projectList.filter(p => ['赢单', '合同已签订'].includes(p.status)).length
      });
    } catch (error) {
      message.error('加载项目失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [pagination.current, pagination.pageSize, statusFilter, priorityFilter]);

  // 处理文件上传成功
  const handleFileUploadSuccess = (fileInfo) => {
    setUploadedFiles(prev => [...prev, fileInfo]);
  };

  // 处理文件删除
  const handleFileRemove = (fileToRemove) => {
    setUploadedFiles(prev => prev.filter(f => f.uid !== fileToRemove.uid));
  };

  // 创建新项目
  const handleCreateProject = async () => {
    try {
      const values = await form.validateFields();
      
      const projectData = {
        projectName: values.projectName,
        client: {
          name: values.clientName,
          company: values.clientCompany || '',
          phone: values.clientPhone || '',
          address: values.clientAddress || ''
        },
        description: values.description || '',
        application: values.application || '',
        technical_requirements: values.technical_requirements || '', // 新增：客户技术需求
        industry: values.industry,
        budget: values.budget,
        priority: values.priority || 'Medium',
        estimatedValue: values.estimatedValue || 0,
        // 添加上传的文件
        project_files: uploadedFiles.map(file => ({
          file_name: file.file_name,
          file_url: file.file_url,
          objectId: file.objectId
        }))
      };

      const response = await projectsAPI.create(projectData);
      
      message.success('项目创建成功！');
      setCreateModalVisible(false);
      form.resetFields();
      setUploadedFiles([]);
      fetchProjects();
      
      // 可选：跳转到新创建的项目详情页
      if (response.data.data) {
        navigate(`/projects/${response.data.data._id}`);
      }
    } catch (error) {
      if (error.errorFields) {
        message.error('请填写所有必填字段');
        return;
      }
      message.error('创建项目失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 状态标签颜色映射
  const statusColorMap = {
    '待指派技术': 'orange',
    '选型中': 'blue',
    '待商务报价': 'purple',
    '已报价': 'cyan',
    '赢单': 'green',
    '失单': 'red',
    '待商务审核合同': 'gold',
    '待客户盖章': 'geekblue',
    '合同已签订': 'success'
  };

  // 优先级标签颜色映射
  const priorityColorMap = {
    'Low': 'default',
    'Medium': 'blue',
    'High': 'orange',
    'Urgent': 'red'
  };

  // 表格列定义
  const columns = [
    {
      title: '项目编号',
      dataIndex: 'projectNumber',
      key: 'projectNumber',
      fixed: 'left',
      width: 150,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => 
        record.projectName?.toLowerCase().includes(value.toLowerCase()) ||
        record.projectNumber?.toLowerCase().includes(value.toLowerCase()) ||
        record.client?.name?.toLowerCase().includes(value.toLowerCase())
    },
    {
      title: '客户名称',
      dataIndex: ['client', 'name'],
      key: 'clientName',
      width: 150
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => (
        <Tag color={statusColorMap[status] || 'default'}>
          {status}
        </Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => (
        <Tag color={priorityColorMap[priority] || 'default'}>
          {priority}
        </Tag>
      )
    },
    {
      title: '预算',
      dataIndex: 'budget',
      key: 'budget',
      width: 120,
      render: (budget) => budget ? `¥${budget.toLocaleString()}` : '-'
    },
    {
      title: '技术支持',
      dataIndex: 'technical_support',
      key: 'technical_support',
      width: 120,
      render: (tech) => tech ? tech.full_name : <Tag color="orange">待指派</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/projects/${record._id}`)}
          >
            查看
          </Button>
        </Space>
      )
    }
  ];

  // Render loading skeleton
  if (loading && projects.length === 0) {
    return <TableSkeleton rows={10} columns={8} />
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={statistics.total}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待指派技术"
              value={statistics.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<FolderOpenOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={statistics.inProgress}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={statistics.completed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主表格 */}
      <Card
        title={
          <span>
            <ProjectOutlined /> 项目列表
          </span>
        }
        extra={
          <Space>
            <Search
              placeholder="搜索项目名称、编号或客户"
              allowClear
              onSearch={setSearchText}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 150 }}
              onChange={setStatusFilter}
            >
              <Option value="待指派技术">待指派技术</Option>
              <Option value="选型中">选型中</Option>
              <Option value="待商务报价">待商务报价</Option>
              <Option value="已报价">已报价</Option>
              <Option value="赢单">赢单</Option>
              <Option value="失单">失单</Option>
            </Select>
            <Select
              placeholder="优先级筛选"
              allowClear
              style={{ width: 120 }}
              onChange={setPriorityFilter}
            >
              <Option value="Low">Low</Option>
              <Option value="Medium">Medium</Option>
              <Option value="High">High</Option>
              <Option value="Urgent">Urgent</Option>
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              新建项目
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize
              }));
            }
          }}
        />
      </Card>

      {/* 新建项目模态框 */}
      <Modal
        title="新建项目"
        open={createModalVisible}
        onOk={handleCreateProject}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
          setUploadedFiles([]);
        }}
        width={800}
        okText="创建项目"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="projectName"
                label="项目名称"
                rules={[{ required: true, message: '请输入项目名称' }]}
              >
                <Input placeholder="请输入项目名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="industry"
                label="行业"
                rules={[{ required: true, message: '请选择行业' }]}
              >
                <Select placeholder="请选择行业">
                  <Option value="Oil & Gas">油气</Option>
                  <Option value="Water Treatment">水处理</Option>
                  <Option value="Chemical">化工</Option>
                  <Option value="Power Generation">发电</Option>
                  <Option value="Manufacturing">制造业</Option>
                  <Option value="Food & Beverage">食品饮料</Option>
                  <Option value="Other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="clientName"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="clientCompany"
                label="客户公司"
              >
                <Input placeholder="请输入客户公司" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="clientPhone"
                label="客户电话"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                ]}
              >
                <Input placeholder="请输入客户电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="clientAddress"
                label="客户地址"
              >
                <Input placeholder="请输入客户地址" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="application"
            label="应用场景"
          >
            <Input.TextArea placeholder="请描述应用场景" rows={2} />
          </Form.Item>

          <Form.Item
            name="description"
            label="项目描述"
          >
            <Input.TextArea placeholder="请输入项目描述" rows={3} />
          </Form.Item>

          <Form.Item
            name="technical_requirements"
            label="客户技术需求（可选）"
            extra="💡 如果客户未提供技术文档，可在此粘贴客户提供的文字要求，例如：扭矩值、单/双作用、阀门类型、工作压力、温度等"
          >
            <Input.TextArea 
              placeholder={`请粘贴或输入客户的技术要求，例如：\n• 所需扭矩：500 Nm\n• 作用方式：双作用（DA）\n• 阀门类型：球阀\n• 工作压力：6 bar\n• 温度范围：-20~80°C\n• 数量：10台`}
              rows={6}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="budget"
                label="项目预算（元）"
                rules={[{ required: true, message: '请输入项目预算' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="请输入预算"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="estimatedValue"
                label="预估金额（元）"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="预估金额"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="优先级"
                initialValue="Medium"
              >
                <Select>
                  <Option value="Low">低</Option>
                  <Option value="Medium">中</Option>
                  <Option value="High">高</Option>
                  <Option value="Urgent">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="项目文件（技术规范、需求文档等）">
            <CloudUpload
              onUploadSuccess={handleFileUploadSuccess}
              onFileRemove={handleFileRemove}
              uploadedFiles={uploadedFiles}
              maxFiles={10}
            />
            <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
              💡 支持上传技术规范、需求文档、图纸等文件，最多10个
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectDashboard;

