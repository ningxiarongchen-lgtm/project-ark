import { useState, useEffect } from 'react';
import { 
  Card, List, Tag, Button, Empty, message, Spin, Badge, Typography,
  Modal, Input, Space 
} from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  RightOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { projectsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 待确认尾款模块（商务工程师专用）
 * 用于展示质检已合格、等待确认尾款的项目列表
 */
const PendingFinalPaymentWidget = () => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingPaymentProjects();
  }, []);

  const fetchPendingPaymentProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getPendingFinalPayment();
      setProjects(response.data.data || []);
    } catch (error) {
      console.error('获取待确认尾款项目失败:', error);
      message.error('获取待确认尾款项目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = (project) => {
    setSelectedProject(project);
    setPaymentNotes('');
    setConfirmModalVisible(true);
  };

  const handleModalOk = async () => {
    if (!selectedProject) return;

    try {
      setConfirming(true);
      await projectsAPI.confirmFinalPayment(selectedProject._id, {
        notes: paymentNotes
      });
      message.success('尾款确认成功！已通知生产部门安排发货。');
      setConfirmModalVisible(false);
      setSelectedProject(null);
      setPaymentNotes('');
      // 刷新列表
      fetchPendingPaymentProjects();
    } catch (error) {
      console.error('确认尾款失败:', error);
      message.error(error.response?.data?.message || '确认尾款失败');
    } finally {
      setConfirming(false);
    }
  };

  const handleModalCancel = () => {
    setConfirmModalVisible(false);
    setSelectedProject(null);
    setPaymentNotes('');
  };

  if (loading) {
    return (
      <Card 
        title={
          <Space>
            <DollarOutlined style={{ color: '#52c41a' }} />
            <span>待确认尾款（质检已合格）</span>
          </Space>
        }
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card 
        title={
          <Space>
            <DollarOutlined style={{ color: '#52c41a' }} />
            <span>待确认尾款（质检已合格）</span>
            {projects.length > 0 && <Badge count={projects.length} />}
          </Space>
        }
        extra={
          <Button 
            type="link" 
            onClick={() => navigate('/projects')}
          >
            查看全部
          </Button>
        }
      >
        {projects.length === 0 ? (
          <Empty 
            description="暂无待确认尾款的项目" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={projects}
            renderItem={project => (
              <List.Item
                actions={[
                  <Button 
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleConfirmPayment(project)}
                  >
                    确认收款
                  </Button>,
                  <Button 
                    type="link" 
                    size="small"
                    icon={<RightOutlined />}
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    查看详情
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{project.projectName || project.project_name}</Text>
                      <Tag color="blue">{project.projectNumber || project.project_number}</Tag>
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        质检已合格
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">
                        客户：{project.client?.name || project.client_name || '未填写'}
                      </Text>
                      <Text type="secondary">
                        尾款金额：
                        <Text strong style={{ color: '#52c41a' }}>
                          ¥{project.contract?.finalPaymentAmount?.toLocaleString() || '未填写'}
                        </Text>
                      </Text>
                      <Text type="secondary">
                        创建时间：{dayjs(project.createdAt).format('YYYY-MM-DD')}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 确认收款弹窗 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>确认尾款已到账</span>
          </Space>
        }
        open={confirmModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={confirming}
        okText="确认收款"
        cancelText="取消"
        width={600}
      >
        {selectedProject && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Paragraph>
                <Text strong>项目名称：</Text>
                {selectedProject.projectName || selectedProject.project_name}
              </Paragraph>
              <Paragraph>
                <Text strong>项目编号：</Text>
                {selectedProject.projectNumber || selectedProject.project_number}
              </Paragraph>
              <Paragraph>
                <Text strong>客户名称：</Text>
                {selectedProject.client?.name || selectedProject.client_name || '未填写'}
              </Paragraph>
              <Paragraph>
                <Text strong>尾款金额：</Text>
                <Text style={{ color: '#52c41a', fontSize: 18, fontWeight: 'bold' }}>
                  ¥{selectedProject.contract?.finalPaymentAmount?.toLocaleString() || '0'}
                </Text>
              </Paragraph>
            </div>

            <div>
              <Text strong style={{ color: '#f5222d' }}>
                请确认客户尾款已经到账后再点击"确认收款"按钮。
              </Text>
              <br />
              <Text type="secondary">
                确认后，系统将自动通知生产部门安排发货。
              </Text>
            </div>

            <div>
              <Text>备注信息（选填）：</Text>
              <TextArea
                rows={3}
                placeholder="请输入收款相关备注，如：收款日期、收款账户等"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                maxLength={200}
                showCount
              />
            </div>
          </Space>
        )}
      </Modal>
    </>
  );
};

export default PendingFinalPaymentWidget;

