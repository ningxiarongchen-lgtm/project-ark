import { useState, useEffect } from 'react';
import { Modal, Timeline, Tag, Alert, Descriptions, Button, Space, Spin, Divider, Typography, message } from 'antd';
import { HistoryOutlined, FileProtectOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { contractsAPI } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

/**
 * 🔒 合同版本历史展示组件
 * 显示所有合同版本、哈希值和校验记录
 */
const ContractVersionHistory = ({ visible, onClose, projectId }) => {
  const [loading, setLoading] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [hashVerifications, setHashVerifications] = useState([]);

  useEffect(() => {
    if (visible && projectId) {
      fetchVersionHistory();
    }
  }, [visible, projectId]);

  const fetchVersionHistory = async () => {
    setLoading(true);
    try {
      const response = await contractsAPI.getContractVersionHistory(projectId);
      if (response.data.success) {
        setVersionHistory(response.data.data.version_history || []);
        setHashVerifications(response.data.data.hash_verifications || []);
      }
    } catch (error) {
      console.error('获取合同版本历史失败:', error);
      message.error('获取合同版本历史失败');
    } finally {
      setLoading(false);
    }
  };

  // 格式化版本类型
  const formatVersionType = (type) => {
    const typeMap = {
      'draft_contract': '草签合同',
      'company_sealed_contract': '公司盖章合同',
      'final_contract': '最终签署合同'
    };
    return typeMap[type] || type;
  };

  // 格式化哈希值（显示前8位和后8位）
  const formatHash = (hash) => {
    if (!hash || hash.length < 16) {
      return hash || '-';
    }
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 获取版本类型的颜色
  const getVersionTypeColor = (type) => {
    const colorMap = {
      'draft_contract': 'blue',
      'company_sealed_contract': 'green',
      'final_contract': 'gold'
    };
    return colorMap[type] || 'default';
  };

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          <span style={{ fontSize: 16, fontWeight: 'bold' }}>合同文件版本历史与哈希校验</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={1000}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <Spin spinning={loading}>
        {/* 🔒 哈希校验记录（优先显示，如果有异常特别醒目） */}
        {hashVerifications.length > 0 && (
          <>
            <Title level={5} style={{ marginTop: 0 }}>
              <FileProtectOutlined /> 文件完整性校验记录
            </Title>
            
            {hashVerifications.map((verification, index) => (
              <Alert
                key={index}
                message={
                  <Space>
                    {verification.match ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <WarningOutlined style={{ color: '#ff4d4f' }} />
                    )}
                    <strong>
                      {verification.match ? '✅ 文件完整性验证通过' : '⚠️ 警告：文件内容可能已被修改'}
                    </strong>
                  </Space>
                }
                description={
                  <div>
                    <p><strong>校验时间：</strong>{dayjs(verification.verified_at).format('YYYY-MM-DD HH:mm:ss')}</p>
                    <p><strong>校验类型：</strong>{formatVersionType(verification.version_type)}</p>
                    <p><strong>文件哈希：</strong><code>{formatHash(verification.file_hash)}</code></p>
                    <p><strong>对比哈希：</strong><code>{formatHash(verification.comparison_hash)}</code></p>
                    <p><strong>说明：</strong>{verification.notes}</p>
                    {verification.verified_by && (
                      <p><strong>校验人：</strong>{verification.verified_by.full_name || verification.verified_by.phone}</p>
                    )}
                  </div>
                }
                type={verification.match ? 'success' : 'error'}
                showIcon
                style={{ marginBottom: 16 }}
              />
            ))}
            
            <Divider />
          </>
        )}
        
        {/* 版本历史时间线 */}
        <Title level={5}>
          <HistoryOutlined /> 文件版本历史
        </Title>
        
        {versionHistory.length === 0 ? (
          <Alert
            message="暂无版本历史"
            description="尚未上传任何合同文件"
            type="info"
            showIcon
          />
        ) : (
          <Timeline
            mode="left"
            items={versionHistory
              .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
              .map((version) => ({
                color: version.replaced ? 'gray' : getVersionTypeColor(version.version_type),
                dot: version.replaced ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
                label: dayjs(version.uploadedAt).format('YYYY-MM-DD HH:mm'),
                children: (
                  <div style={{ 
                    background: version.replaced ? '#f5f5f5' : '#fafafa',
                    padding: '12px',
                    borderRadius: '8px',
                    border: version.replaced ? '1px dashed #d9d9d9' : '1px solid #e8e8e8'
                  }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Tag color={getVersionTypeColor(version.version_type)}>
                          {formatVersionType(version.version_type)}
                        </Tag>
                        {version.replaced && (
                          <Tag color="red">已替换</Tag>
                        )}
                        {!version.replaced && (
                          <Tag color="green">当前版本</Tag>
                        )}
                      </Space>
                      
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="文件名">
                          {version.file_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="文件大小">
                          {formatFileSize(version.file_size)}
                        </Descriptions.Item>
                        <Descriptions.Item label="SHA-256 哈希">
                          <code style={{ fontSize: 11, color: '#1890ff' }}>
                            {version.file_hash || '未计算'}
                          </code>
                        </Descriptions.Item>
                        <Descriptions.Item label="上传人">
                          {version.uploadedBy?.full_name || version.uploadedBy?.phone || '-'}
                          {version.uploadedBy?.role && (
                            <Tag style={{ marginLeft: 8 }}>{version.uploadedBy.role}</Tag>
                          )}
                        </Descriptions.Item>
                        {version.notes && (
                          <Descriptions.Item label="说明">
                            {version.notes}
                          </Descriptions.Item>
                        )}
                        {version.replaced && version.replaced_at && (
                          <Descriptions.Item label="替换时间">
                            <Text type="secondary">
                              {dayjs(version.replaced_at).format('YYYY-MM-DD HH:mm:ss')}
                            </Text>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                      
                      <Button
                        type="link"
                        size="small"
                        onClick={() => window.open(version.file_url, '_blank')}
                        style={{ padding: 0 }}
                      >
                        下载文件
                      </Button>
                    </Space>
                  </div>
                )
              }))}
          />
        )}
        
        {/* 说明信息 */}
        <Divider />
        <Alert
          message="文件哈希校验说明"
          description={
            <div>
              <p>• 系统使用 SHA-256 算法计算每个合同文件的唯一哈希值（文件指纹）</p>
              <p>• 如果文件内容被修改（即使只改动一个字节），哈希值也会完全不同</p>
              <p>• 系统会自动比对最终签署合同与公司盖章合同的哈希值，确保内容一致</p>
              <p>• 所有历史版本都保留完整的哈希值记录，可追溯审计</p>
            </div>
          }
          type="info"
          showIcon
          style={{ fontSize: 12 }}
        />
      </Spin>
    </Modal>
  );
};

export default ContractVersionHistory;

