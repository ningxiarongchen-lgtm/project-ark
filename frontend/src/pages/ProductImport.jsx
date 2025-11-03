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
  Spin,
  Radio,
  Checkbox
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
  const [importType, setImportType] = useState('actuator'); // 'product' or 'actuator'
  const [updateOnDuplicate, setUpdateOnDuplicate] = useState(false);

  // 处理文件上传
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择要上传的文件');
      return;
    }

    const formData = new FormData();
    
    // 根据导入类型选择不同的API端点和字段名
    let apiEndpoint;
    
    if (importType === 'actuator') {
      apiEndpoint = '/actuator-management/import-csv';
      formData.append('file', fileList[0]);
      formData.append('updateOnDuplicate', updateOnDuplicate.toString());
    } else {
      apiEndpoint = '/products/import';
      // 支持多个文件上传
      fileList.forEach(file => {
        formData.append('productFiles', file);
      });
    }

    setUploading(true);
    try {
      const response = await api.post(apiEndpoint, formData, {
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
          const dataType = importType === 'actuator' ? '执行器' : '产品';
          message.success(`成功导入 ${formattedResult.successCount} 条${dataType}数据！`);
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
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
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
      message.error('模板下载失败：' + (error.response?.data?.message || error.message));
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

      // 产品导入支持多文件，执行器导入仅支持单文件
      if (importType === 'actuator') {
        setFileList([file]);
      } else {
        setFileList(prevList => [...prevList, file]);
      }
      return false; // 阻止自动上传
    },
    fileList,
    multiple: importType === 'product', // 产品导入允许多选
    maxCount: importType === 'actuator' ? 1 : 10, // 执行器限制1个，产品最多10个
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
            <Title level={2}>数据批量导入</Title>
            <Paragraph type="secondary">
              支持执行器和产品数据批量导入，支持 CSV 和 XLSX 格式
            </Paragraph>
          </div>

          <Divider />

          {/* 导入类型选择 */}
          <Card size="small" className="import-type-card" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>选择导入类型：</Text>
              <Radio.Group value={importType} onChange={(e) => setImportType(e.target.value)}>
                <Radio.Button value="actuator">执行器数据（AT/GY/SF系列）</Radio.Button>
                <Radio.Button value="product">产品数据</Radio.Button>
              </Radio.Group>
              
              {importType === 'actuator' && (
                <Alert
                  message="执行器CSV导入"
                  description={
                    <div>
                      <p>支持AT/GY系列和SF系列执行器CSV文件直接导入</p>
                      <p>• AT/GY格式：model_base, series, action_type, base_price_normal, torque_data, dimensions等</p>
                      <p>• SF格式：model_base, body_size, cylinder_size, torque_symmetric, torque_canted等</p>
                      <p>系统会自动识别系列类型并处理JSON字段</p>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </Space>
          </Card>

          {/* 使用说明 */}
          <Alert
            message="使用说明"
              description={
              importType === 'actuator' ? (
                <div>
                  <p>1. 准备好您的执行器CSV文件（AT/GY或SF格式）</p>
                  <p>2. 直接上传CSV文件，无需修改格式</p>
                  <p>3. 选择是否更新重复数据</p>
                  <p>4. 系统会自动解析JSON字段并导入数据库</p>
                </div>
              ) : (
                <div>
                  <p>1. 下载标准数据模板（可选）</p>
                  <p>2. 准备产品数据Excel/CSV文件（仅型号必填，其他字段可选）</p>
                  <p>3. 支持同时上传多个文件（最多10个）进行批量导入</p>
                  <p>4. 系统会自动验证数据并返回导入结果</p>
                </div>
              )
            }
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
          />

          {/* 模板下载区域 - 仅产品导入显示 */}
          {importType === 'product' && (
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
          )}

          {/* 文件上传区域 */}
          <Card 
            title={importType === 'actuator' ? "选择并上传CSV文件" : "步骤 2: 选择并上传文件（支持多个文件）"} 
            size="small" 
            className="step-card"
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} size="large">
                  {importType === 'actuator' ? '选择文件（CSV/Excel）' : '选择文件（可多选，CSV/Excel）'}
                </Button>
              </Upload>
              
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

              {/* 执行器导入的额外选项 */}
              {importType === 'actuator' && (
                <Checkbox
                  checked={updateOnDuplicate}
                  onChange={(e) => setUpdateOnDuplicate(e.target.checked)}
                >
                  <Space>
                    <Text>更新重复数据</Text>
                    <Text type="secondary">（勾选后将更新已存在的执行器，否则跳过）</Text>
                  </Space>
                </Checkbox>
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
              dataSource={
                importType === 'actuator' ? [
                  { label: 'model_base', required: true, desc: '执行器型号基础（如AT-SR52K8, SF10-150DA）' },
                  { label: 'series', required: true, desc: '系列名称（AT, GY, SF）' },
                  { label: 'action_type', required: true, desc: '作用类型（DA=双作用, SR=弹簧复位）' },
                  { label: 'base_price_normal/low/high', required: true, desc: '价格（至少一个）' },
                  { label: 'torque_data', required: false, desc: 'JSON格式扭矩数据，自动解析' },
                  { label: 'dimensions', required: false, desc: 'JSON格式尺寸数据，自动解析' },
                  { label: '其他字段', required: false, desc: '根据AT/GY或SF格式自动处理' },
                ] : [
                  { label: '型号 (modelNumber)', required: true, desc: '产品型号，必须唯一（唯一必填字段）' },
                  { label: '描述 (description)', required: false, desc: '产品描述信息（可选，默认自动生成）' },
                  { label: '扭矩值 (torqueValue)', required: false, desc: '额定扭矩 (Nm)（可选）' },
                  { label: '工作压力 (operatingPressure)', required: false, desc: '工作压力 (bar)（可选）' },
                  { label: '基础价格 (basePrice)', required: false, desc: '产品基础价格（可选）' },
                  { label: '其他字段', required: false, desc: '所有其他字段均为可选，详见模板' },
                ]
              }
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

