import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Descriptions, Table, Button, Tag, Space, message, 
  Modal, Form, Input, Select, Steps, Divider,
  Row, Col, Statistic, Timeline, Badge, Rate, InputNumber, Alert, Typography
} from 'antd'
import {
  ArrowLeftOutlined, EditOutlined, CheckCircleOutlined,
  UserAddOutlined, PlusOutlined, CustomerServiceOutlined,
  ClockCircleOutlined, ToolOutlined, StarOutlined,
  PhoneOutlined, MailOutlined, EnvironmentOutlined, LockOutlined,
  UploadOutlined, FileTextOutlined, EyeOutlined, DownloadOutlined,
  PaperClipOutlined, FilePdfOutlined, PrinterOutlined
} from '@ant-design/icons'
import { ticketsAPI } from '../services/api'
import CloudUpload from '../components/CloudUpload'
import axios from 'axios'
import dayjs from 'dayjs'
import { useAuth } from '../hooks/useAuth'
import RoleBasedAccess from '../components/RoleBasedAccess'

const { TextArea } = Input
const { Option } = Select

const TicketDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, hasAnyRole } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // 权限检查
  const canAssign = hasAnyRole(['Administrator', 'Technical Engineer', 'Sales Manager']) // 🔒 技术工程师和销售经理可以指派工程师
  const canUpdateStatus = hasAnyRole(['Administrator', 'Technical Engineer'])
  const canAddFollowUp = hasAnyRole(['Administrator', 'Technical Engineer', 'Sales Manager']) // 🔒 销售经理可以添加跟进记录（给客户回复）
  const canSubmitFeedback = hasAnyRole(['Administrator', 'Technical Engineer', 'Sales Manager']) // 🔒 销售经理可以提交反馈

  // Modal状态
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false)
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false)
  const [closeTicketModalVisible, setCloseTicketModalVisible] = useState(false)
  const [reopenTicketModalVisible, setReopenTicketModalVisible] = useState(false)
  const [addHistoryModalVisible, setAddHistoryModalVisible] = useState(false)
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [markResolvedModalVisible, setMarkResolvedModalVisible] = useState(false)
  
  const [statusForm] = Form.useForm()
  const [assignForm] = Form.useForm()
  const [followUpForm] = Form.useForm()
  const [feedbackForm] = Form.useForm()
  const [closeTicketForm] = Form.useForm()
  const [reopenTicketForm] = Form.useForm()
  const [addHistoryForm] = Form.useForm()
  const [reportForm] = Form.useForm()
  const [markResolvedForm] = Form.useForm()
  const [generatingReport, setGeneratingReport] = useState(false)
  const [processingAction, setProcessingAction] = useState(false)
  const [savingReport, setSavingReport] = useState(false)

  // 验证 MongoDB ObjectId 格式
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id)
  }

  useEffect(() => {
    if (id) {
      // 检查 ID 是否有效
      if (!isValidObjectId(id)) {
        message.error('无效的工单ID')
        navigate('/service-center')
        return
      }
      fetchTicket()
    }
  }, [id])

  const fetchTicket = async () => {
    try {
      const response = await ticketsAPI.getById(id)
      setTicket(response.data.data)
    } catch (error) {
      console.error('获取工单详情失败:', error)
      message.error('获取工单详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 更新工单状态
  const handleUpdateStatus = async (values) => {
    try {
      await ticketsAPI.updateStatus(id, values)
      message.success('工单状态已更新')
      setStatusModalVisible(false)
      statusForm.resetFields()
      fetchTicket()
    } catch (error) {
      console.error('更新状态失败:', error)
      message.error('更新状态失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 分配工程师
  const handleAssignEngineer = async (values) => {
    try {
      await ticketsAPI.assignEngineer(id, values)
      message.success('工程师分配成功')
      setAssignModalVisible(false)
      assignForm.resetFields()
      fetchTicket()
    } catch (error) {
      console.error('分配工程师失败:', error)
      message.error('分配失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 添加跟进记录
  const handleAddFollowUp = async (values) => {
    try {
      await ticketsAPI.addFollowUp(id, values)
      message.success('跟进记录已添加')
      setFollowUpModalVisible(false)
      followUpForm.resetFields()
      fetchTicket()
    } catch (error) {
      console.error('添加跟进记录失败:', error)
      message.error('添加失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 提交反馈
  const handleSubmitFeedback = async (values) => {
    try {
      await ticketsAPI.submitFeedback(id, values)
      message.success('反馈提交成功')
      setFeedbackModalVisible(false)
      feedbackForm.resetFields()
      fetchTicket()
    } catch (error) {
      console.error('提交反馈失败:', error)
      message.error('提交失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 关闭工单（销售经理确认问题已解决）
  const handleCloseTicket = async (values) => {
    setProcessingAction(true)
    try {
      await axios.patch(`/api/tickets/${id}/close`, {
        close_reason: '问题已解决',
        customer_feedback: values.customer_feedback
      })
      message.success('工单已成功关闭')
      setCloseTicketModalVisible(false)
      closeTicketForm.resetFields()
      fetchTicket()
    } catch (error) {
      console.error('关闭工单失败:', error)
      message.error('关闭工单失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setProcessingAction(false)
    }
  }

  // 重新打开工单（销售经理认为问题未解决）
  const handleReopenTicket = async (values) => {
    setProcessingAction(true)
    try {
      await axios.patch(`/api/tickets/${id}/reopen`, {
        reason: values.reason,
        comments: values.comments
      })
      message.success('工单已重新打开，已退回技术工程师处理')
      setReopenTicketModalVisible(false)
      reopenTicketForm.resetFields()
      fetchTicket()
    } catch (error) {
      console.error('重新打开工单失败:', error)
      message.error('重新打开工单失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setProcessingAction(false)
    }
  }

  // 打开编辑报告Modal
  const handleOpenReportModal = () => {
    // 如果已有报告内容，预填充到表单
    if (ticket.final_report?.content) {
      reportForm.setFieldsValue({
        content: ticket.final_report.content,
        root_cause: ticket.final_report.root_cause,
        actions_taken: ticket.final_report.actions_taken,
        preventive_measures: ticket.final_report.preventive_measures
      })
    }
    setReportModalVisible(true)
  }

  // 保存解决报告
  const handleSaveReport = async (values) => {
    setSavingReport(true)
    try {
      await axios.patch(`/api/tickets/${id}/save-report`, {
        final_report: {
          content: values.content,
          root_cause: values.root_cause,
          actions_taken: values.actions_taken,
          preventive_measures: values.preventive_measures
        }
      })
      message.success('解决报告已保存')
      setReportModalVisible(false)
      reportForm.resetFields()
      fetchTicket()
    } catch (error) {
      console.error('保存报告失败:', error)
      message.error('保存报告失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setSavingReport(false)
    }
  }

  // 标记为已解决（技术工程师完成工作）
  const handleMarkAsResolved = async (values) => {
    setProcessingAction(true)
    try {
      await axios.patch(`/api/tickets/${id}/mark-resolved`, {
        summary: values.summary
      })
      message.success('工单已标记为"问题已解决-待确认"，已通知销售经理确认')
      setMarkResolvedModalVisible(false)
      markResolvedForm.resetFields()
      fetchTicket()
    } catch (error) {
      console.error('标记已解决失败:', error)
      message.error('标记已解决失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setProcessingAction(false)
    }
  }

  // 生成售后解决报告（PDF）
  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    try {

      // 创建报告内容
      const reportContent = generateReportHTML(ticket)

      // 使用浏览器打印功能生成PDF
      const printWindow = window.open('', '_blank')
      printWindow.document.write(reportContent)
      printWindow.document.close()
      
      // 等待内容加载完成
      printWindow.onload = () => {
        printWindow.print()
      }

      message.success('报告已生成，请在打印对话框中选择"另存为PDF"')
      
    } catch (error) {
      console.error('❌ 生成报告失败:', error)
      message.error('生成报告失败: ' + (error.message || '未知错误'))
    } finally {
      setGeneratingReport(false)
    }
  }

  // 生成报告HTML内容
  const generateReportHTML = (ticket) => {
    const statusMap = {
      'Open': '待处理',
      'Assigned': '已分配',
      'In Progress': '处理中',
      'Pending Parts': '等待零件',
      'On Hold': '暂停',
      'Resolved': '已解决',
      'Closed': '已关闭',
      'Cancelled': '已取消'
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>售后服务工单报告 - ${ticket.ticketNumber}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { 
            font-family: "Microsoft YaHei", Arial, sans-serif; 
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #1890ff; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
          }
          .header h1 { 
            color: #1890ff; 
            margin: 0 0 10px 0; 
            font-size: 28px;
          }
          .header .ticket-number { 
            font-size: 18px; 
            color: #666; 
            font-weight: bold;
          }
          .section { 
            margin-bottom: 25px; 
            page-break-inside: avoid;
          }
          .section-title { 
            background: #f0f5ff; 
            padding: 10px 15px; 
            font-size: 16px; 
            font-weight: bold; 
            color: #1890ff;
            border-left: 4px solid #1890ff;
            margin-bottom: 15px;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px;
            margin-bottom: 15px;
          }
          .info-item { 
            padding: 10px; 
            background: #fafafa;
            border-radius: 4px;
          }
          .info-label { 
            font-weight: bold; 
            color: #666; 
            display: inline-block;
            width: 120px;
          }
          .info-value { 
            color: #333;
          }
          .full-width { 
            grid-column: 1 / -1; 
          }
          .description-box {
            padding: 15px;
            background: #f9f9f9;
            border: 1px solid #e8e8e8;
            border-radius: 4px;
            white-space: pre-wrap;
            margin-top: 10px;
          }
          .follow-up-item {
            padding: 12px;
            margin-bottom: 10px;
            background: #fafafa;
            border-left: 3px solid #52c41a;
            border-radius: 4px;
          }
          .follow-up-header {
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
          }
          .follow-up-time {
            color: #999;
            font-size: 12px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
          }
          .status-closed { background: #52c41a; color: white; }
          .status-resolved { background: #1890ff; color: white; }
          .status-in-progress { background: #faad14; color: white; }
          .status-open { background: #d9d9d9; color: #333; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e8e8e8;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #e8e8e8;
            padding: 10px;
            text-align: left;
          }
          th {
            background: #f0f5ff;
            font-weight: bold;
            color: #1890ff;
          }
          .rating {
            color: #faad14;
            font-size: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>售后服务工单解决报告</h1>
          <div class="ticket-number">工单号: ${ticket.ticketNumber}</div>
        </div>

        <!-- 工单基本信息 -->
        <div class="section">
          <div class="section-title">工单基本信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">工单状态:</span>
              <span class="info-value status-badge status-${ticket.status.toLowerCase().replace(' ', '-')}">${statusMap[ticket.status] || ticket.status}</span>
            </div>
            <div class="info-item">
              <span class="info-label">工单类型:</span>
              <span class="info-value">${ticket.ticketType}</span>
            </div>
            <div class="info-item">
              <span class="info-label">优先级:</span>
              <span class="info-value">${ticket.priority}</span>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间:</span>
              <span class="info-value">${dayjs(ticket.createdAt).format('YYYY-MM-DD HH:mm')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">创建人:</span>
              <span class="info-value">${ticket.createdBy?.name || '-'}</span>
            </div>
            ${ticket.closedDate ? `
              <div class="info-item">
                <span class="info-label">关闭时间:</span>
                <span class="info-value">${dayjs(ticket.closedDate).format('YYYY-MM-DD HH:mm')}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- 客户信息 -->
        <div class="section">
          <div class="section-title">客户信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">客户姓名:</span>
              <span class="info-value">${ticket.customer?.name || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">公司:</span>
              <span class="info-value">${ticket.customer?.company || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">联系电话:</span>
              <span class="info-value">${ticket.customer?.phone || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">电子邮箱:</span>
              <span class="info-value">${ticket.customer?.email || '-'}</span>
            </div>
            ${ticket.customer?.address ? `
              <div class="info-item full-width">
                <span class="info-label">地址:</span>
                <span class="info-value">${ticket.customer.address}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- 问题信息 -->
        <div class="section">
          <div class="section-title">问题信息</div>
          <div class="info-grid">
            <div class="info-item full-width">
              <span class="info-label">问题标题:</span>
              <span class="info-value" style="font-weight: bold;">${ticket.issue?.title || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">问题类别:</span>
              <span class="info-value">${ticket.issue?.category || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">严重程度:</span>
              <span class="info-value">${ticket.issue?.severity || '-'}</span>
            </div>
          </div>
          ${ticket.issue?.description ? `
            <div class="description-box">${ticket.issue.description}</div>
          ` : ''}
        </div>

        <!-- 服务信息 -->
        <div class="section">
          <div class="section-title">服务信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">分配工程师:</span>
              <span class="info-value">${ticket.service?.assignedEngineer?.name || '未分配'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">服务类型:</span>
              <span class="info-value">${ticket.service?.serviceType || '-'}</span>
            </div>
            ${ticket.service?.scheduledDate ? `
              <div class="info-item">
                <span class="info-label">计划服务日期:</span>
                <span class="info-value">${dayjs(ticket.service.scheduledDate).format('YYYY-MM-DD')}</span>
              </div>
            ` : ''}
            ${ticket.service?.actualServiceDate ? `
              <div class="info-item">
                <span class="info-label">实际服务日期:</span>
                <span class="info-value">${dayjs(ticket.service.actualServiceDate).format('YYYY-MM-DD')}</span>
              </div>
            ` : ''}
            ${ticket.service?.estimatedHours ? `
              <div class="info-item">
                <span class="info-label">预计工时:</span>
                <span class="info-value">${ticket.service.estimatedHours} 小时</span>
              </div>
            ` : ''}
            ${ticket.service?.actualHours ? `
              <div class="info-item">
                <span class="info-label">实际工时:</span>
                <span class="info-value">${ticket.service.actualHours} 小时</span>
              </div>
            ` : ''}
            ${ticket.service?.serviceAddress ? `
              <div class="info-item full-width">
                <span class="info-label">服务地址:</span>
                <span class="info-value">${ticket.service.serviceAddress}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- 解决方案 -->
        ${ticket.resolution?.description ? `
          <div class="section">
            <div class="section-title">解决方案</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">解决人:</span>
                <span class="info-value">${ticket.resolution.resolvedBy?.name || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">解决日期:</span>
                <span class="info-value">${ticket.resolution.resolvedDate ? dayjs(ticket.resolution.resolvedDate).format('YYYY-MM-DD HH:mm') : '-'}</span>
              </div>
              ${ticket.resolution.rootCause ? `
                <div class="info-item full-width">
                  <span class="info-label">根本原因:</span>
                  <span class="info-value">${ticket.resolution.rootCause}</span>
                </div>
              ` : ''}
            </div>
            <div class="description-box">
              <strong>解决方案描述:</strong><br/>
              ${ticket.resolution.description}
            </div>
            ${ticket.resolution.actionTaken ? `
              <div class="description-box" style="margin-top: 15px;">
                <strong>采取的行动:</strong><br/>
                ${ticket.resolution.actionTaken}
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- 跟进记录 -->
        ${ticket.followUps && ticket.followUps.length > 0 ? `
          <div class="section">
            <div class="section-title">处理跟进记录</div>
            ${ticket.followUps.map(followUp => `
              <div class="follow-up-item">
                <div class="follow-up-header">
                  <span style="color: #1890ff;">[${followUp.type}]</span>
                  ${followUp.user?.name || '未知'} 
                  <span class="follow-up-time">${dayjs(followUp.date).format('YYYY-MM-DD HH:mm')}</span>
                </div>
                <div>${followUp.content}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- 客户反馈 -->
        ${ticket.feedback?.rating ? `
          <div class="section">
            <div class="section-title">客户反馈</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">满意度评分:</span>
                <span class="info-value rating">${'★'.repeat(ticket.feedback.rating)}${'☆'.repeat(5 - ticket.feedback.rating)} (${ticket.feedback.rating}/5)</span>
              </div>
              <div class="info-item">
                <span class="info-label">反馈时间:</span>
                <span class="info-value">${dayjs(ticket.feedback.feedbackDate).format('YYYY-MM-DD HH:mm')}</span>
              </div>
              ${ticket.feedback.comments ? `
                <div class="info-item full-width">
                  <div class="description-box">
                    <strong>客户评论:</strong><br/>
                    ${ticket.feedback.comments}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- SLA信息 -->
        ${ticket.sla ? `
          <div class="section">
            <div class="section-title">SLA (服务级别协议)</div>
            <table>
              <tr>
                <th>指标</th>
                <th>目标值</th>
                <th>实际值</th>
                <th>状态</th>
              </tr>
              <tr>
                <td>响应时间</td>
                <td>${ticket.sla.responseTimeTarget || 0} 小时</td>
                <td>${ticket.sla.actualResponseTime || 0} 小时</td>
                <td style="color: ${(ticket.sla.actualResponseTime || 0) <= (ticket.sla.responseTimeTarget || 0) ? '#52c41a' : '#ff4d4f'}">
                  ${(ticket.sla.actualResponseTime || 0) <= (ticket.sla.responseTimeTarget || 0) ? '✓ 达标' : '✗ 超时'}
                </td>
              </tr>
              <tr>
                <td>解决时间</td>
                <td>${ticket.sla.resolutionTimeTarget || 0} 小时</td>
                <td>${ticket.sla.actualResolutionTime || 0} 小时</td>
                <td style="color: ${(ticket.sla.actualResolutionTime || 0) <= (ticket.sla.resolutionTimeTarget || 0) ? '#52c41a' : '#ff4d4f'}">
                  ${(ticket.sla.actualResolutionTime || 0) <= (ticket.sla.resolutionTimeTarget || 0) ? '✓ 达标' : '✗ 超时'}
                </td>
              </tr>
              <tr>
                <td colspan="4" style="background: ${ticket.sla.slaViolated ? '#fff1f0' : '#f6ffed'}; font-weight: bold; text-align: center;">
                  整体SLA状态: <span style="color: ${ticket.sla.slaViolated ? '#ff4d4f' : '#52c41a'}">${ticket.sla.slaViolated ? '违反SLA' : '符合SLA'}</span>
                </td>
              </tr>
            </table>
          </div>
        ` : ''}

        <div class="footer">
          <p>本报告由系统自动生成 | 生成时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
          <p>智能制造综合管理系统</p>
        </div>
      </body>
      </html>
    `
  }

  // 工单状态步骤
  const getStatusStep = (status) => {
    const steps = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed']
    return steps.indexOf(status)
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (!ticket) {
    return <div>工单不存在</div>
  }

  // 检查技术工程师是否是此工单的负责人
  const isAssignedEngineer = user?.role === 'Technical Engineer' && 
    ticket?.service?.assignedEngineer?._id === (user?._id || user?.id)

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: 24 }}>
        <Space align="center">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {ticket.ticket_number}
            </Typography.Title>
            <Typography.Text type="secondary">工单详情</Typography.Text>
          </div>
        </Space>
      </div>

      {/* 技术工程师权限提示 */}
      {user?.role === 'Technical Engineer' && !isAssignedEngineer && (
        <Alert
          message="只读模式"
          description="您只能操作分配给您的工单。此工单已分配给其他工程师或尚未分配。"
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Space style={{ marginBottom: 24 }} wrap>
        
        {/* 技术工程师的操作按钮 */}
        {hasAnyRole(['Technical Engineer', 'Administrator']) && 
         (ticket.status === '技术处理中' || ticket.status === 'In Progress' || 
          ticket.status === '等待客户反馈') && 
         (user?.role !== 'Technical Engineer' || isAssignedEngineer) && (
          <>
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={handleOpenReportModal}
              style={{
                background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                border: 'none'
              }}
            >
              {ticket.final_report?.content ? '编辑解决报告' : '生成解决报告'}
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setMarkResolvedModalVisible(true)}
              disabled={!ticket.final_report?.content}
              style={{
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none'
              }}
            >
              问题已解决，请销售确认
            </Button>
          </>
        )}
        
        {/* 销售经理的最终确认按钮 - 当工单状态为"问题已解决-待确认"时显示 */}
        {hasAnyRole(['Sales Manager', 'Administrator']) && 
         (ticket.status === '问题已解决-待确认' || ticket.status === 'Resolved') && (
          <>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setCloseTicketModalVisible(true)}
              style={{
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none'
              }}
            >
              确认问题已解决，关闭工单
            </Button>
            <Button
              danger
              icon={<EditOutlined />}
              onClick={() => setReopenTicketModalVisible(true)}
            >
              问题未解决，重新打开
            </Button>
          </>
        )}
        
        {/* 更新状态 - 技术工程师只能更新自己负责的工单 */}
        {canUpdateStatus && (user?.role !== 'Technical Engineer' || isAssignedEngineer) && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setStatusModalVisible(true)}
          >
            更新状态
          </Button>
        )}
        
        {/* 分配工程师 - 只有管理员和销售经理可以 */}
        <RoleBasedAccess allowedRoles={['Administrator', 'Sales Manager']}>
          <Button
            icon={<UserAddOutlined />}
            onClick={() => setAssignModalVisible(true)}
          >
            分配工程师
          </Button>
        </RoleBasedAccess>
        
        {/* 添加跟进 - 技术工程师只能为自己的工单添加跟进 */}
        {canAddFollowUp && (user?.role !== 'Technical Engineer' || isAssignedEngineer) && (
          <Button
            icon={<PlusOutlined />}
            onClick={() => setFollowUpModalVisible(true)}
          >
            添加跟进
          </Button>
        )}
        
        {/* 生成售后解决报告 */}
        {(ticket.status === 'Resolved' || ticket.status === 'Closed' || 
          ticket.status === '问题已解决-待确认' || ticket.status === '已关闭') && 
         (canAddFollowUp && (user?.role !== 'Technical Engineer' || isAssignedEngineer)) && (
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={handleGenerateReport}
            loading={generatingReport}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            生成解决报告 (PDF)
          </Button>
        )}
        
        {/* 提交反馈 */}
        {ticket.status === 'Resolved' && !ticket.feedback?.rating && canSubmitFeedback && (
          <Button
            type="primary"
            icon={<StarOutlined />}
            onClick={() => setFeedbackModalVisible(true)}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none'
            }}
          >
            提交反馈
          </Button>
        )}
      </Space>

      {/* 工单基本信息 */}
      <Card title="工单信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="工单编号">
            <strong style={{ fontSize: '16px' }}>{ticket.ticketNumber}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="工单状态">
            <Tag color="processing" style={{ fontSize: '14px' }}>
              {ticket.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="工单类型">
            {ticket.ticketType}
          </Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={
              ticket.priority === 'Critical' || ticket.priority === 'Urgent' ? 'red' :
              ticket.priority === 'High' ? 'orange' : 'blue'
            }>
              {ticket.priority}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(ticket.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="创建人">
            {ticket.createdBy?.name || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 工单进度 */}
      <Card title="工单进度" style={{ marginBottom: 16 }}>
        <Steps
          current={getStatusStep(ticket.status)}
          items={[
            { title: '待处理', description: 'Open' },
            { title: '已分配', description: 'Assigned' },
            { title: '处理中', description: 'In Progress' },
            { title: '已解决', description: 'Resolved' },
            { title: '已关闭', description: 'Closed' }
          ]}
        />
      </Card>

      {/* 客户信息 */}
      <Card title="客户信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="客户姓名">
            {ticket.customer?.name}
          </Descriptions.Item>
          <Descriptions.Item label="公司">
            {ticket.customer?.company || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={<Space><PhoneOutlined />联系电话</Space>}>
            {ticket.customer?.phone}
          </Descriptions.Item>
          <Descriptions.Item label={<Space><MailOutlined />电子邮箱</Space>}>
            {ticket.customer?.email || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={<Space><EnvironmentOutlined />地址</Space>} span={2}>
            {ticket.customer?.address || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 问题信息 */}
      <Card title="问题信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="问题标题">
            <strong>{ticket.issue?.title}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="问题描述">
            {ticket.issue?.description}
          </Descriptions.Item>
          <Descriptions.Item label="问题类别">
            <Tag>{ticket.issue?.category || '-'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="严重程度">
            <Tag color={
              ticket.issue?.severity === 'Critical' ? 'red' :
              ticket.issue?.severity === 'Major' ? 'orange' :
              ticket.issue?.severity === 'Moderate' ? 'blue' : 'default'
            }>
              {ticket.issue?.severity || '-'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 服务信息 */}
      <Card title="服务信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="服务类型">
            {ticket.service?.serviceType || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="分配工程师">
            {ticket.service?.assignedEngineer?.name || <Tag color="default">未分配</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="计划服务日期">
            {ticket.service?.scheduledDate ? dayjs(ticket.service.scheduledDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="实际服务日期">
            {ticket.service?.actualServiceDate ? dayjs(ticket.service.actualServiceDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="预计工时">
            {ticket.service?.estimatedHours ? `${ticket.service.estimatedHours} 小时` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="实际工时">
            {ticket.service?.actualHours ? `${ticket.service.actualHours} 小时` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="服务地址" span={2}>
            {ticket.service?.serviceAddress || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* SLA信息 */}
      <Card title="SLA (服务级别协议)" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="响应时间目标"
              value={ticket.sla?.responseTimeTarget || 0}
              suffix="小时"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际响应时间"
              value={ticket.sla?.actualResponseTime || 0}
              suffix="小时"
              valueStyle={{
                color: (ticket.sla?.actualResponseTime || 0) > (ticket.sla?.responseTimeTarget || 0) ? '#cf1322' : '#3f8600'
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="解决时间目标"
              value={ticket.sla?.resolutionTimeTarget || 0}
              suffix="小时"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际解决时间"
              value={ticket.sla?.actualResolutionTime || 0}
              suffix="小时"
              valueStyle={{
                color: (ticket.sla?.actualResolutionTime || 0) > (ticket.sla?.resolutionTimeTarget || 0) ? '#cf1322' : '#3f8600'
              }}
            />
          </Col>
        </Row>
        <Divider />
        <div>
          <strong>SLA状态: </strong>
          {ticket.sla?.slaViolated ? (
            <Badge status="error" text="违反SLA" />
          ) : (
            <Badge status="success" text="符合SLA" />
          )}
        </div>
      </Card>

      {/* 解决方案 */}
      {ticket.resolution?.description && (
        <Card title="解决方案" style={{ marginBottom: 16 }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="解决方案描述">
              {ticket.resolution.description}
            </Descriptions.Item>
            <Descriptions.Item label="根本原因">
              {ticket.resolution.rootCause || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="采取的行动">
              {ticket.resolution.actionTaken || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="解决日期">
              {ticket.resolution.resolvedDate ? dayjs(ticket.resolution.resolvedDate).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="解决人">
              {ticket.resolution.resolvedBy?.name || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 客户反馈 */}
      {ticket.feedback?.rating && (
        <Card title="客户反馈" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <strong>满意度评分: </strong>
            <Rate disabled value={ticket.feedback.rating} />
            <span style={{ marginLeft: 8 }}>({ticket.feedback.rating}/5)</span>
          </div>
          {ticket.feedback.comments && (
            <div>
              <strong>评论: </strong>
              <p>{ticket.feedback.comments}</p>
            </div>
          )}
          <div style={{ color: '#999', fontSize: '12px' }}>
            反馈时间: {dayjs(ticket.feedback.feedbackDate).format('YYYY-MM-DD HH:mm')}
          </div>
        </Card>
      )}

      {/* 跟进记录 */}
      {ticket.followUps && ticket.followUps.length > 0 && (
        <Card title="跟进记录" style={{ marginBottom: 16 }}>
          <Timeline
            items={ticket.followUps.map((followUp, index) => ({
              key: index,
              color: followUp.type === 'Call' ? 'blue' :
                     followUp.type === 'Email' ? 'green' :
                     followUp.type === 'Visit' ? 'orange' : 'default',
              children: (
                <div>
                  <div>
                    <Tag color="blue">{followUp.type}</Tag>
                    <strong>{followUp.user?.name || '未知'}</strong>
                    <span style={{ marginLeft: 8, color: '#666' }}>
                      {dayjs(followUp.date).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, color: '#666' }}>
                    {followUp.content}
                  </div>
                </div>
              )
            }))}
          />
        </Card>
      )}

      {/* 附件管理 */}
      <Card 
        title={
          <Space>
            <PaperClipOutlined />
            <span>附件</span>
            {ticket.attachments && ticket.attachments.length > 0 && (
              <Badge count={ticket.attachments.length} />
            )}
          </Space>
        } 
        style={{ marginBottom: 16 }}
      >
        <Alert
          message="附件管理"
          description="您可以上传工单相关的照片、文档、视频等附件，支持多文件上传。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        {(canAddFollowUp && (user?.role !== 'After-sales Engineer' || isAssignedEngineer)) && (
          <div style={{ marginBottom: 16 }}>
            <CloudUpload
              multiple
              onSuccess={async (fileData) => {
                try {
                  await axios.post(`/api/tickets/${id}/add-attachment`, {
                    file_name: fileData.name,
                    file_url: fileData.url,
                  });
                  message.success('附件已上传！');
                  fetchTicket();
                } catch (error) {
                  message.error('上传附件失败: ' + (error.response?.data?.message || error.message));
                }
              }}
            >
              <Button icon={<UploadOutlined />} type="primary">
                上传附件
              </Button>
            </CloudUpload>
          </div>
        )}
        
        {ticket.attachments && ticket.attachments.length > 0 ? (
          <Table
            dataSource={ticket.attachments}
            rowKey={(record, index) => `att_${index}`}
            pagination={false}
            columns={[
              {
                title: '文件名',
                dataIndex: 'file_name',
                key: 'file_name',
                render: (text) => (
                  <Space>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <strong>{text}</strong>
                  </Space>
                )
              },
              {
                title: '类型',
                dataIndex: 'file_type',
                key: 'file_type',
                width: 100,
                render: (type) => <Tag color="blue">{type || 'other'}</Tag>
              },
              {
                title: '上传时间',
                dataIndex: 'uploaded_at',
                key: 'uploaded_at',
                width: 180,
                render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
              },
              {
                title: '上传者',
                dataIndex: 'uploaded_by',
                key: 'uploaded_by',
                width: 120,
                render: (uploadedBy) => uploadedBy?.name || '-'
              },
              {
                title: '操作',
                key: 'actions',
                width: 150,
                render: (_, record) => (
                  <Space>
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => window.open(record.file_url, '_blank')}
                    >
                      查看
                    </Button>
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = record.file_url;
                        link.download = record.file_name;
                        link.click();
                      }}
                    >
                      下载
                    </Button>
                  </Space>
                )
              }
            ]}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <PaperClipOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>暂无附件</div>
            {(canAddFollowUp && (user?.role !== 'After-sales Engineer' || isAssignedEngineer)) && (
              <div style={{ marginTop: 8, fontSize: '12px' }}>
                点击上方"上传附件"按钮开始上传
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 更新状态Modal */}
      <Modal
        title="更新工单状态"
        open={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false)
          statusForm.resetFields()
        }}
        onOk={() => statusForm.submit()}
        okText="确认更新"
        cancelText="取消"
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleUpdateStatus}
          initialValues={{ status: ticket.status }}
        >
          <Form.Item
            name="status"
            label="新状态"
            rules={[{ required: true, message: '请选择工单状态' }]}
          >
            <Select>
              <Option value="Open">待处理</Option>
              <Option value="Assigned">已分配</Option>
              <Option value="In Progress">处理中</Option>
              <Option value="Pending Parts">等待零件</Option>
              <Option value="On Hold">暂停</Option>
              <Option value="Resolved">已解决</Option>
              <Option value="Closed">已关闭</Option>
              <Option value="Cancelled">已取消</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 分配工程师Modal */}
      <Modal
        title="分配工程师"
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false)
          assignForm.resetFields()
        }}
        onOk={() => assignForm.submit()}
        okText="确认分配"
        cancelText="取消"
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignEngineer}
        >
          <Form.Item
            name="engineerId"
            label="工程师"
            rules={[{ required: true, message: '请选择工程师' }]}
          >
            <Input placeholder="工程师ID（实际应该是下拉选择）" />
          </Form.Item>

          <Form.Item
            name="scheduledDate"
            label="计划服务日期"
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            name="serviceAddress"
            label="服务地址"
          >
            <TextArea rows={2} placeholder="服务地址" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加跟进Modal */}
      <Modal
        title="添加跟进记录"
        open={followUpModalVisible}
        onCancel={() => {
          setFollowUpModalVisible(false)
          followUpForm.resetFields()
        }}
        onOk={() => followUpForm.submit()}
        okText="添加"
        cancelText="取消"
      >
        <Form
          form={followUpForm}
          layout="vertical"
          onFinish={handleAddFollowUp}
        >
          <Form.Item
            name="type"
            label="跟进类型"
            rules={[{ required: true, message: '请选择跟进类型' }]}
          >
            <Select placeholder="选择类型">
              <Option value="Call">电话</Option>
              <Option value="Email">邮件</Option>
              <Option value="Visit">拜访</Option>
              <Option value="Note">备注</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="跟进内容"
            rules={[{ required: true, message: '请输入跟进内容' }]}
          >
            <TextArea rows={4} placeholder="请输入跟进内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 提交反馈Modal */}
      <Modal
        title="客户反馈"
        open={feedbackModalVisible}
        onCancel={() => {
          setFeedbackModalVisible(false)
          feedbackForm.resetFields()
        }}
        onOk={() => feedbackForm.submit()}
        okText="提交"
        cancelText="取消"
      >
        <Form
          form={feedbackForm}
          layout="vertical"
          onFinish={handleSubmitFeedback}
        >
          <Form.Item
            name="rating"
            label="满意度评分"
            rules={[{ required: true, message: '请给出评分' }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="comments"
            label="评论"
          >
            <TextArea rows={4} placeholder="请输入您的评论（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 关闭工单Modal（销售经理确认） */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>确认关闭工单</span>
          </Space>
        }
        open={closeTicketModalVisible}
        onCancel={() => {
          setCloseTicketModalVisible(false)
          closeTicketForm.resetFields()
        }}
        onOk={() => closeTicketForm.submit()}
        confirmLoading={processingAction}
        okText="确认关闭"
        cancelText="取消"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
            border: 'none'
          }
        }}
      >
        <Alert
          message="重要提示"
          description='确认关闭工单后，该工单将被标记为"已关闭"状态，表示售后服务已完成。您可以选择提供客户反馈信息。'
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={closeTicketForm}
          layout="vertical"
          onFinish={handleCloseTicket}
        >
          <Form.Item
            label="工单信息"
          >
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <div><strong>工单号:</strong> {ticket.ticket_number || ticket.ticketNumber}</div>
              <div><strong>问题:</strong> {ticket.title || ticket.issue?.title}</div>
              <div><strong>客户:</strong> {ticket.client_name || ticket.customer?.name}</div>
            </div>
          </Form.Item>

          <Form.Item
            name={['customer_feedback', 'rating']}
            label="客户满意度评分（可选）"
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name={['customer_feedback', 'comments']}
            label="客户反馈意见（可选）"
          >
            <TextArea 
              rows={4} 
              placeholder="请输入客户对本次售后服务的反馈意见..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重新打开工单Modal（销售经理认为问题未解决） */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>重新打开工单</span>
          </Space>
        }
        open={reopenTicketModalVisible}
        onCancel={() => {
          setReopenTicketModalVisible(false)
          reopenTicketForm.resetFields()
        }}
        onOk={() => reopenTicketForm.submit()}
        confirmLoading={processingAction}
        okText="重新打开"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="重要说明"
          description="重新打开工单将使工单状态退回到「技术处理中」，技术工程师将收到通知需要继续处理。请在下方说明问题未解决的原因。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={reopenTicketForm}
          layout="vertical"
          onFinish={handleReopenTicket}
        >
          <Form.Item
            label="工单信息"
          >
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <div><strong>工单号:</strong> {ticket.ticket_number || ticket.ticketNumber}</div>
              <div><strong>问题:</strong> {ticket.title || ticket.issue?.title}</div>
              <div><strong>技术工程师:</strong> {ticket.assigned_to?.name || ticket.service?.assignedEngineer?.name || '未分配'}</div>
            </div>
          </Form.Item>

          <Form.Item
            name="reason"
            label="重新打开原因"
            rules={[{ required: true, message: '请选择重新打开的原因' }]}
          >
            <Select placeholder="请选择原因">
              <Option value="问题未完全解决">问题未完全解决</Option>
              <Option value="解决方案不符合要求">解决方案不符合要求</Option>
              <Option value="客户反馈问题依然存在">客户反馈问题依然存在</Option>
              <Option value="需要进一步处理">需要进一步处理</Option>
              <Option value="其他原因">其他原因</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comments"
            label="详细说明"
            rules={[{ required: true, message: '请详细说明为何需要重新打开工单' }]}
          >
            <TextArea 
              rows={5} 
              placeholder="请详细描述问题未解决的具体情况，以便技术工程师了解并继续处理..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 生成/编辑解决报告Modal（技术工程师） */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#722ed1', fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>
              {ticket.final_report?.content ? '编辑解决报告' : '生成解决报告'}
            </span>
          </Space>
        }
        open={reportModalVisible}
        onCancel={() => {
          setReportModalVisible(false)
          reportForm.resetFields()
        }}
        onOk={() => reportForm.submit()}
        confirmLoading={savingReport}
        okText="保存报告"
        cancelText="取消"
        width={900}
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
            border: 'none'
          }
        }}
      >
        <Alert
          message="售后解决报告"
          description="请详细记录问题分析、解决方案、采取的措施等信息。此报告将作为工单的最终交付文档。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={reportForm}
          layout="vertical"
          onFinish={handleSaveReport}
        >
          <Form.Item
            label="工单信息"
          >
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <div><strong>工单号:</strong> {ticket.ticket_number || ticket.ticketNumber}</div>
              <div><strong>客户:</strong> {ticket.client_name || ticket.customer?.name}</div>
              <div><strong>问题:</strong> {ticket.title || ticket.issue?.title}</div>
            </div>
          </Form.Item>

          <Form.Item
            name="root_cause"
            label="根本原因分析"
            rules={[{ required: true, message: '请填写根本原因分析' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请分析并说明问题的根本原因..."
            />
          </Form.Item>

          <Form.Item
            name="actions_taken"
            label="采取的措施"
            rules={[{ required: true, message: '请填写采取的措施' }]}
          >
            <TextArea 
              rows={5} 
              placeholder="请详细描述为解决问题所采取的具体措施和步骤..."
            />
          </Form.Item>

          <Form.Item
            name="preventive_measures"
            label="预防措施建议"
          >
            <TextArea 
              rows={4} 
              placeholder="请提供预防类似问题再次发生的建议（可选）..."
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="完整解决报告"
            rules={[{ required: true, message: '请填写完整的解决报告' }]}
            extra="请详细记录整个问题解决过程，包括问题现象、分析过程、解决方案、测试结果等"
          >
            <TextArea 
              rows={10} 
              placeholder="请编写完整的售后解决报告...&#10;&#10;建议包含以下内容：&#10;1. 问题描述&#10;2. 问题分析&#10;3. 解决方案&#10;4. 实施过程&#10;5. 测试验证&#10;6. 结论与建议"
              maxLength={5000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 标记为已解决Modal（技术工程师完成工作） */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>标记问题已解决</span>
          </Space>
        }
        open={markResolvedModalVisible}
        onCancel={() => {
          setMarkResolvedModalVisible(false)
          markResolvedForm.resetFields()
        }}
        onOk={() => markResolvedForm.submit()}
        confirmLoading={processingAction}
        okText="确认提交"
        cancelText="取消"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
            border: 'none'
          }
        }}
      >
        <Alert
          message="流程交接"
          description="标记为已解决后，工单状态将更新为「问题已解决-待确认」，并通知销售经理进行最终确认。请确保您已完成所有必要的工作并生成了解决报告。"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={markResolvedForm}
          layout="vertical"
          onFinish={handleMarkAsResolved}
        >
          <Form.Item
            label="工单信息"
          >
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <div><strong>工单号:</strong> {ticket.ticket_number || ticket.ticketNumber}</div>
              <div><strong>客户:</strong> {ticket.client_name || ticket.customer?.name}</div>
              <div><strong>问题:</strong> {ticket.title || ticket.issue?.title}</div>
            </div>
          </Form.Item>

          {ticket.final_report?.content && (
            <Form.Item
              label="解决报告状态"
            >
              <Alert
                message="已生成解决报告"
                description={`报告内容: ${ticket.final_report.content.substring(0, 100)}...`}
                type="success"
                showIcon
              />
            </Form.Item>
          )}

          <Form.Item
            name="summary"
            label="解决总结"
            rules={[{ required: true, message: '请填写解决总结' }]}
            extra="简要总结问题解决情况，方便销售经理快速了解"
          >
            <TextArea 
              rows={4} 
              placeholder="请简要总结问题的解决情况，包括问题原因、解决方法、预期效果等..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TicketDetails


