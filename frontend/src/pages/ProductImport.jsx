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
    
    // 产品数据导入 - 支持多个文件上传
    fileList.forEach(file => {
      formData.append('productFiles', file);
    });

    setUploading(true);
    try {
      const response = await api.post('/products/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 保存导入结果（处理不同的响应格式）
      if (response.data.success) {
        // 执行器导入结果格式：response.data.data
        // 产品导入结果格式：response.data.data
        const resultData = response.data.data || response.data;
        const summary = response.data.summary || {};
        
        // 格式化结果以统一显示
        const formattedResult = {
          successCount: resultData.successCount || summary.imported || 0,
          errorCount: resultData.errorCount || summary.failed || 0,
          skippedCount: resultData.skippedCount || summary.skipped || 0,
          errors: resultData.errors || [],
          skipped: resultData.skipped || []
        };
        
        setImportResult(formattedResult);
        setShowResult(true);
        
        // 如果完全成功（没有错误），显示简单成功消息
        if (formattedResult.errorCount === 0 && formattedResult.skippedCount === 0) {
          message.success(`成功导入 ${formattedResult.successCount} 条产品数据！`);
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
  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/products/template', {
        responseType: 'blob'
      });
      
      // 检查响应类型，确保是Excel文件而不是HTML
      const contentType = response.headers['content-type'];
      
      if (contentType && contentType.includes('text/html')) {
        // 如果返回的是HTML，说明可能是错误页面或需要登录
        const text = await response.data.text();
        console.error('Received HTML instead of Excel:', text.substring(0, 200));
        message.error('下载失败：服务器返回了错误页面，请确保已登录并有权限访问');
        return;
      }
      
      // 验证是否真的是Excel文件
      if (!contentType || !contentType.includes('spreadsheet')) {
        console.warn('Unexpected content type:', contentType);
      }
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'product_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('模板下载成功！');
    } catch (error) {
      console.error('Template download error:', error);
      
      // 如果是认证错误
      if (error.response?.status === 401) {
        message.error('请先登录后再下载模板');
      } else if (error.response?.status === 403) {
        message.error('没有权限下载模板，此功能仅限管理员和技术工程师');
      } else {
        message.error('模板下载失败：' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Upload 组件配置
  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      // 验证文件类型
      const isExcel = 
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'text/csv' ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls');
      
      if (!isExcel) {
        message.error('只支持 Excel 文件格式 (.xlsx, .xls, .csv)');
        return Upload.LIST_IGNORE; // 使用 Upload.LIST_IGNORE 而不是 false
      }

      // 验证文件大小 (最大 10MB)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB');
        return Upload.LIST_IGNORE;
      }

      // 产品导入：检查是否已达到最大文件数
      if (fileList.length >= 10) {
        message.warning('最多只能选择10个文件');
        return Upload.LIST_IGNORE;
      }
      setFileList(prevList => [...prevList, file]);
      return false; // 阻止自动上传
    },
    fileList,
    multiple: true, // 允许多选
    accept: '.csv,.xlsx,.xls', // 明确指定接受的文件类型
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
            <Title level={2}>产品批量导入</Title>
            <Paragraph type="secondary">
              支持产品数据批量导入，支持 CSV 和 XLSX 格式，可同时上传多个文件
            </Paragraph>
          </div>

          <Divider />

          {/* 使用说明 */}
          <Alert
            message="使用说明"
            description={
              <div>
                <p>1. 下载标准数据模板（可选）</p>
                <p>2. 准备产品数据Excel/CSV文件（仅型号必填，其他字段可选）</p>
                <p>3. 支持同时上传多个文件（最多10个）进行批量导入</p>
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
            title="步骤 2: 选择并上传文件（支持多个文件）" 
            size="small" 
            className="step-card"
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                message="💡 多文件上传提示"
                description={
                  <div>
                    <p><strong>方式1（推荐）：</strong>点击按钮后，按住 <kbd>Ctrl</kbd>（Windows）或 <kbd>⌘ Command</kbd>（Mac）键，同时点选多个文件</p>
                    <p><strong>方式2：</strong>点击按钮选择第一个文件，然后再次点击按钮添加更多文件（最多10个）</p>
                    <p><strong>方式3：</strong>直接将多个文件拖拽到上传区域</p>
                  </div>
                }
                type="info"
                showIcon
                closable
                style={{ marginBottom: 16 }}
              />
              
              <Upload.Dragger {...uploadProps} style={{ padding: '20px' }}>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 500 }}>
                  点击或拖拽多个文件到此区域上传
                </p>
                <p className="ant-upload-hint" style={{ fontSize: 14 }}>
                  💡 可同时选择多个文件（按住Ctrl/⌘键多选，或直接拖拽多个文件）
                </p>
              </Upload.Dragger>
              
              {fileList.length > 0 && (
                <Alert
                  message={
                    fileList.length === 1 
                      ? `已选择文件: ${fileList[0].name}` 
                      : `已选择 ${fileList.length} 个文件: ${fileList.map(f => f.name).join(', ')}`
                  }
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
            <Alert
              message="💡 灵活导入说明"
              description="产品导入只要求型号必填，其他字段都是可选的。列名支持中英文，系统会自动识别（如：modelNumber、Model Number、型号）"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <List
              size="small"
              dataSource={[
                { label: '型号 (modelNumber / Model Number / 型号)', required: true, desc: '产品型号，必须唯一 - 唯一必填字段！' },
                { label: '系列 (series / Series / 系列)', required: false, desc: '产品系列（可选，默认SF-Series）' },
                { label: '描述 (description / Description / 描述)', required: false, desc: '产品描述（可选，默认自动生成）' },
                { label: '扭矩值 (torqueValue / Torque (Nm) / 扭矩值)', required: false, desc: '额定扭矩 (Nm)（可选）' },
                { label: '工作压力 (operatingPressure / Pressure (bar) / 工作压力)', required: false, desc: '工作压力 (bar)（可选）' },
                { label: '基础价格 (basePrice / Base Price / Price / 价格)', required: false, desc: '产品价格（可选）' },
                { label: '其他字段', required: false, desc: '所有其他字段均可选，列名支持中英文，系统自动识别' },
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

