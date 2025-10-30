import React, { useState } from 'react';
import { 
  Upload, 
  Button, 
  message, 
  Modal, 
  Card, 
  Typography, 
  Space, 
  Alert,
  Divider,
  List,
  Tag,
  Spin
} from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined, 
  FileExcelOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import api from '../services/api';
import '../styles/ProductImport.css';

const { Title, Paragraph, Text } = Typography;

const ProductImport = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // 处理文件上传
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择要上传的文件');
      return;
    }

    const formData = new FormData();
    formData.append('productFile', fileList[0]);

    setUploading(true);
    try {
      const response = await api.post('/products/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 保存导入结果
      if (response.data.success) {
        setImportResult(response.data.data);
        setShowResult(true);
        
        // 如果完全成功（没有错误），显示简单成功消息
        if (response.data.data.errorCount === 0 && response.data.data.skippedCount === 0) {
          message.success(`成功导入 ${response.data.data.successCount} 条产品数据！`);
        }
        
        // 清空文件列表
        setFileList([]);
      }

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || '上传失败，请检查文件格式或联系管理员';
      message.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    // 创建下载链接
    const link = document.createElement('a');
    link.href = '/templates/product_import_template.csv';
    link.download = 'product_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('模板下载成功！');
  };

  // Upload 组件配置
  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      // 验证文件类型
      const isExcel = 
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'text/csv';
      
      if (!isExcel) {
        message.error('只支持 Excel 文件格式 (.xlsx, .xls, .csv)');
        return false;
      }

      // 验证文件大小 (最大 10MB)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB');
        return false;
      }

      setFileList([file]);
      return false; // 阻止自动上传
    },
    fileList,
    maxCount: 1,
  };

  // 关闭结果模态框
  const handleCloseResult = () => {
    setShowResult(false);
    setImportResult(null);
  };

  return (
    <div className="product-import-container">
      <Card className="import-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 标题 */}
          <div className="import-header">
            <FileExcelOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={2}>产品数据批量导入</Title>
            <Paragraph type="secondary">
              使用标准Excel模板批量导入产品数据，支持 CSV 和 XLSX 格式
            </Paragraph>
          </div>

          <Divider />

          {/* 使用说明 */}
          <Alert
            message="使用说明"
            description={
              <div>
                <p>1. 下载标准数据模板</p>
                <p>2. 按照模板格式填写产品数据（必填字段：型号、描述、扭矩、压力、价格）</p>
                <p>3. 上传填写好的文件进行批量导入</p>
                <p>4. 系统会自动验证数据并返回导入结果</p>
              </div>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
          />

          {/* 模板下载区域 */}
          <Card 
            title="步骤 1: 下载数据模板" 
            size="small" 
            className="step-card"
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Paragraph>
                请先下载标准数据模板，模板中包含所有必填字段和示例数据。
              </Paragraph>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
                size="large"
              >
                下载产品导入模板
              </Button>
              <Text type="secondary">
                支持的文件格式: .csv, .xlsx, .xls | 最大文件大小: 10MB
              </Text>
            </Space>
          </Card>

          {/* 文件上传区域 */}
          <Card 
            title="步骤 2: 选择并上传文件" 
            size="small" 
            className="step-card"
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} size="large">
                  选择 Excel 文件
                </Button>
              </Upload>
              
              {fileList.length > 0 && (
                <Alert
                  message={`已选择文件: ${fileList[0].name}`}
                  type="success"
                  showIcon
                />
              )}

              <Button
                type="primary"
                onClick={handleUpload}
                disabled={fileList.length === 0}
                loading={uploading}
                size="large"
                block
              >
                {uploading ? '正在导入中...' : '开始导入'}
              </Button>
            </Space>
          </Card>

          {/* 字段说明 */}
          <Card title="字段说明" size="small" className="info-card">
            <List
              size="small"
              dataSource={[
                { label: '型号 (modelNumber)', required: true, desc: '产品型号，必须唯一' },
                { label: '描述 (description)', required: true, desc: '产品描述信息' },
                { label: '扭矩值 (torqueValue)', required: true, desc: '额定扭矩 (Nm)' },
                { label: '工作压力 (operatingPressure)', required: true, desc: '工作压力 (bar)' },
                { label: '基础价格 (basePrice)', required: true, desc: '产品基础价格' },
                { label: '其他字段', required: false, desc: '详见模板文件和使用指南' },
              ]}
              renderItem={item => (
                <List.Item>
                  <Space>
                    {item.required ? (
                      <Tag color="red">必填</Tag>
                    ) : (
                      <Tag color="default">可选</Tag>
                    )}
                    <Text strong>{item.label}</Text>
                    <Text type="secondary">{item.desc}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          {/* 权限提示 */}
          <Alert
            message="权限要求"
            description="此功能仅限管理员和技术工程师使用"
            type="warning"
            showIcon
          />
        </Space>
      </Card>

      {/* 导入结果模态框 */}
      <Modal
        title="导入结果"
        open={showResult}
        onCancel={handleCloseResult}
        footer={[
          <Button key="close" type="primary" onClick={handleCloseResult}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {importResult && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 统计信息 */}
            <Card size="small">
              <Space size="large">
                <div>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />
                  <div>
                    <Text type="secondary">成功</Text>
                    <div>
                      <Text strong style={{ fontSize: 24, color: '#52c41a' }}>
                        {importResult.successCount}
                      </Text>
                      <Text type="secondary"> 条</Text>
                    </div>
                  </div>
                </div>

                <div>
                  <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />
                  <div>
                    <Text type="secondary">失败</Text>
                    <div>
                      <Text strong style={{ fontSize: 24, color: '#ff4d4f' }}>
                        {importResult.errorCount}
                      </Text>
                      <Text type="secondary"> 条</Text>
                    </div>
                  </div>
                </div>

                <div>
                  <InfoCircleOutlined style={{ color: '#faad14', fontSize: 24 }} />
                  <div>
                    <Text type="secondary">跳过</Text>
                    <div>
                      <Text strong style={{ fontSize: 24, color: '#faad14' }}>
                        {importResult.skippedCount}
                      </Text>
                      <Text type="secondary"> 条</Text>
                    </div>
                  </div>
                </div>
              </Space>
            </Card>

            {/* 错误详情 */}
            {importResult.errors && importResult.errors.length > 0 && (
              <Card 
                title={<Text type="danger">错误详情</Text>}
                size="small"
              >
                <List
                  size="small"
                  dataSource={importResult.errors}
                  renderItem={(error, index) => (
                    <List.Item>
                      <Text type="danger">{index + 1}. {error}</Text>
                    </List.Item>
                  )}
                  style={{ maxHeight: 200, overflow: 'auto' }}
                />
              </Card>
            )}

            {/* 跳过详情 */}
            {importResult.skipped && importResult.skipped.length > 0 && (
              <Card 
                title={<Text type="warning">跳过详情</Text>}
                size="small"
              >
                <List
                  size="small"
                  dataSource={importResult.skipped}
                  renderItem={(skip, index) => (
                    <List.Item>
                      <Text type="warning">{index + 1}. {skip}</Text>
                    </List.Item>
                  )}
                  style={{ maxHeight: 200, overflow: 'auto' }}
                />
              </Card>
            )}

            {/* 完全成功的提示 */}
            {importResult.successCount > 0 && 
             importResult.errorCount === 0 && 
             importResult.skippedCount === 0 && (
              <Alert
                message="导入成功！"
                description={`已成功导入 ${importResult.successCount} 条产品数据，没有错误或跳过记录。`}
                type="success"
                showIcon
              />
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ProductImport;

