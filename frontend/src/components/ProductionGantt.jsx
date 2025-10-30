import { useState, useEffect } from 'react'
import { Gantt, ViewMode } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import { 
  Card, 
  Space, 
  Button, 
  Select, 
  Tooltip, 
  Tag, 
  Drawer, 
  Descriptions, 
  Progress,
  Empty,
  message
} from 'antd'
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  FieldTimeOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select

/**
 * 生产排程甘特图组件
 * 显示所有工单的排程信息，支持交互式查看
 */
const ProductionGantt = ({ ganttData, loading, onRefresh }) => {
  const [viewMode, setViewMode] = useState(ViewMode.Day)
  const [selectedTask, setSelectedTask] = useState(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [tasks, setTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [workCenterFilter, setWorkCenterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (ganttData && ganttData.tasks) {
      const formattedTasks = ganttData.tasks.map(task => ({
        ...task,
        start: new Date(task.start),
        end: new Date(task.end),
        type: 'task',
        isDisabled: task.status === '已完成' || task.status === '已取消',
        styles: {
          backgroundColor: task.styles?.backgroundColor || '#1890ff',
          backgroundSelectedColor: task.styles?.backgroundColor || '#1890ff',
          progressColor: task.styles?.progressColor || '#096dd9',
          progressSelectedColor: task.styles?.progressSelectedColor || '#096dd9'
        }
      }))
      setTasks(formattedTasks)
      setFilteredTasks(formattedTasks)
    }
  }, [ganttData])

  // 应用过滤器
  useEffect(() => {
    let filtered = [...tasks]
    
    if (workCenterFilter !== 'all') {
      filtered = filtered.filter(task => task.workCenter?.code === workCenterFilter)
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }
    
    setFilteredTasks(filtered)
  }, [tasks, workCenterFilter, statusFilter])

  // 处理任务点击
  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setDrawerVisible(true)
  }

  // 处理任务修改（拖拽）
  const handleTaskChange = (task) => {
    message.info('甘特图编辑功能需要后端支持，当前为只读模式')
    // 在实际应用中，这里应该调用API更新工单时间
    // await workOrdersAPI.update(task.id, { 
    //   'plan.planned_start_time': task.start, 
    //   'plan.planned_end_time': task.end 
    // })
  }

  // 处理任务展开
  const handleExpanderClick = (task) => {
    setTasks(tasks.map(t => 
      t.id === task.id ? { ...t, hideChildren: !t.hideChildren } : t
    ))
  }

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colorMap = {
      '待发布': 'default',
      '已发布': 'cyan',
      '已接收': 'blue',
      '进行中': 'processing',
      '暂停': 'warning',
      '待质检': 'purple',
      '已完成': 'success',
      '已关闭': 'default',
      '已取消': 'error'
    }
    return colorMap[status] || 'default'
  }

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    const colorMap = {
      'Low': 'default',
      'Normal': 'blue',
      'High': 'orange',
      'Urgent': 'red'
    }
    return colorMap[priority] || 'default'
  }

  const priorityNameMap = {
    'Low': '低',
    'Normal': '正常',
    'High': '高',
    'Urgent': '紧急'
  }

  // 自定义工具提示
  const handleTooltipContent = (task) => {
    return (
      <div style={{ padding: '8px', minWidth: '250px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
          {task.workOrderNumber}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div>生产订单: {task.productionOrderNumber}</div>
          <div>产品型号: {task.productModel}</div>
          <div>工作中心: {task.workCenter?.name}</div>
          <div>工序: {task.operation?.name} (序号 {task.operation?.sequence})</div>
          <div>状态: {task.status}</div>
          <div>进度: {task.progress}%</div>
          <div>开始: {dayjs(task.start).format('YYYY-MM-DD HH:mm')}</div>
          <div>结束: {dayjs(task.end).format('YYYY-MM-DD HH:mm')}</div>
          <div>工时: {task.duration} 分钟</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff' }}>
      {/* 工具栏 */}
      <Card 
        variant="borderless"
        style={{ marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Space wrap>
          <span style={{ fontWeight: 500 }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            视图模式:
          </span>
          <Select
            value={viewMode}
            onChange={setViewMode}
            style={{ width: 120 }}
            size="small"
          >
            <Option value={ViewMode.Hour}>小时</Option>
            <Option value={ViewMode.QuarterDay}>6小时</Option>
            <Option value={ViewMode.HalfDay}>半天</Option>
            <Option value={ViewMode.Day}>天</Option>
            <Option value={ViewMode.Week}>周</Option>
            <Option value={ViewMode.Month}>月</Option>
          </Select>

          <span style={{ fontWeight: 500, marginLeft: 16 }}>工作中心:</span>
          <Select
            value={workCenterFilter}
            onChange={setWorkCenterFilter}
            style={{ width: 150 }}
            size="small"
            allowClear
          >
            <Option value="all">全部</Option>
            {ganttData?.workCenters?.map(wc => (
              <Option key={wc._id} value={wc.code}>
                {wc.name}
              </Option>
            ))}
          </Select>

          <span style={{ fontWeight: 500, marginLeft: 16 }}>工单状态:</span>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            size="small"
            allowClear
          >
            <Option value="all">全部</Option>
            <Option value="待发布">待发布</Option>
            <Option value="已发布">已发布</Option>
            <Option value="已接收">已接收</Option>
            <Option value="进行中">进行中</Option>
            <Option value="暂停">暂停</Option>
            <Option value="待质检">待质检</Option>
            <Option value="已完成">已完成</Option>
          </Select>

          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            size="small"
            style={{ marginLeft: 16 }}
          >
            刷新
          </Button>
        </Space>

        <div style={{ marginTop: 12, fontSize: '12px', color: '#666' }}>
          共 {filteredTasks.length} 个工单
          {ganttData?.summary?.dateRange && (
            <>
              {' | '}
              排程周期: {dayjs(ganttData.summary.dateRange.start).format('YYYY-MM-DD')} 
              {' 至 '}
              {dayjs(ganttData.summary.dateRange.end).format('YYYY-MM-DD')}
            </>
          )}
        </div>
      </Card>

      {/* 甘特图 */}
      {filteredTasks.length > 0 ? (
        <div style={{ 
          background: '#fff', 
          padding: '16px',
          overflow: 'auto',
          border: '1px solid #f0f0f0',
          borderRadius: '2px'
        }}>
          <Gantt
            tasks={filteredTasks}
            viewMode={viewMode}
            onDateChange={handleTaskChange}
            onProgressChange={handleTaskChange}
            onDoubleClick={handleTaskClick}
            onClick={handleTaskClick}
            onExpanderClick={handleExpanderClick}
            listCellWidth="200px"
            columnWidth={viewMode === ViewMode.Month ? 300 : 
                        viewMode === ViewMode.Week ? 250 : 
                        viewMode === ViewMode.Day ? 60 : 40}
            locale="zh-CN"
            TooltipContent={handleTooltipContent}
            barBackgroundColor="#1890ff"
            barBackgroundSelectedColor="#096dd9"
            barProgressColor="#40a9ff"
            barProgressSelectedColor="#40a9ff"
            handleWidth={8}
            timeStep={60}
            arrowColor="#bfbfbf"
            arrowIndent={20}
            todayColor="rgba(24, 144, 255, 0.1)"
            projectBackgroundColor="#fafafa"
            projectProgressColor="#52c41a"
            projectProgressSelectedColor="#389e0d"
          />
        </div>
      ) : (
        <Card>
          <Empty
            description={
              <span>
                {loading ? '加载中...' : '暂无工单排程数据'}
                <br />
                <span style={{ fontSize: '12px', color: '#999' }}>
                  请先为生产订单生成工单并执行APS排程
                </span>
              </span>
            }
          />
        </Card>
      )}

      {/* 任务详情抽屉 */}
      <Drawer
        title={
          <Space>
            <InfoCircleOutlined />
            工单详情
          </Space>
        }
        placement="right"
        width={500}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedTask && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="工单编号">
                <strong style={{ color: '#ff6a00' }}>{selectedTask.workOrderNumber}</strong>
              </Descriptions.Item>
              
              <Descriptions.Item label="生产订单">
                {selectedTask.productionOrderNumber}
              </Descriptions.Item>
              
              <Descriptions.Item label="产品型号">
                {selectedTask.productModel}
              </Descriptions.Item>
              
              <Descriptions.Item label="工作中心">
                <Tag color="blue">{selectedTask.workCenter?.code}</Tag>
                {selectedTask.workCenter?.name}
              </Descriptions.Item>
              
              <Descriptions.Item label="工序信息">
                <div>
                  <div>序号: {selectedTask.operation?.sequence}</div>
                  <div>名称: {selectedTask.operation?.name}</div>
                  <div>类型: {selectedTask.operation?.type}</div>
                </div>
              </Descriptions.Item>
              
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedTask.status)}>
                  {selectedTask.status}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="优先级">
                <Tag color={getPriorityColor(selectedTask.priority)}>
                  {priorityNameMap[selectedTask.priority] || selectedTask.priority}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="生产进度">
                <Progress 
                  percent={selectedTask.progress} 
                  size="small"
                  status={selectedTask.progress === 100 ? 'success' : 'active'}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  实际数量: {selectedTask.actualQuantity} / {selectedTask.plannedQuantity}
                </div>
              </Descriptions.Item>
              
              <Descriptions.Item label="计划开始时间">
                <Space>
                  <FieldTimeOutlined />
                  {dayjs(selectedTask.start).format('YYYY-MM-DD HH:mm')}
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label="计划结束时间">
                <Space>
                  <FieldTimeOutlined />
                  {dayjs(selectedTask.end).format('YYYY-MM-DD HH:mm')}
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label="计划工时">
                {selectedTask.duration} 分钟
                {' '}
                ({(selectedTask.duration / 60).toFixed(1)} 小时)
              </Descriptions.Item>
              
              <Descriptions.Item label="时长">
                {Math.ceil((selectedTask.end - selectedTask.start) / (1000 * 60 * 60 * 24))} 天
              </Descriptions.Item>
            </Descriptions>

            {selectedTask.constraints && (
              <Card 
                size="small" 
                title="排程约束"
                style={{ marginTop: 16 }}
                styles={{ body: { padding: '12px' } }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    物料准备: 
                    {selectedTask.constraints.materialReady ? (
                      <Tag color="success" style={{ marginLeft: 8 }}>已就绪</Tag>
                    ) : (
                      <Tag color="warning" style={{ marginLeft: 8 }}>待采购</Tag>
                    )}
                  </div>
                  <div>
                    产能可用: 
                    {selectedTask.constraints.capacityAvailable ? (
                      <Tag color="success" style={{ marginLeft: 8 }}>充足</Tag>
                    ) : (
                      <Tag color="error" style={{ marginLeft: 8 }}>产能紧张</Tag>
                    )}
                  </div>
                </Space>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default ProductionGantt

