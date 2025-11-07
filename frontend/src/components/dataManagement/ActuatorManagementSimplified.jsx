/**
 * 执行器管理组件 - 简化版
 * 使用统一的Excel模板进行批量导入
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Upload,
  message,
  Alert,
  Steps,
  Space,
  Modal,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Divider
} from 'antd';
import {
  DownloadOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { dataManagementAPI } from '../../services/api';

const { Step } = Steps;

const ActuatorManagementSimplified = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorReport, setErrorReport] = useState(null);

  // 加载统计信息
  const fetchStatistics = async () => {
    try {
      const response = await dataManagementAPI.actuators.getStatistics();
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  // 下载模板
  const handleDownloadTemplate = async () => {
    try {
      const response = await dataManagementAPI.actuators.downloadUnifiedTemplate();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'C-MAX_Actuator_Data_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('模板下载成功！请按照说明页填写数据');
      setCurrentStep(1);
    } catch (error) {
      message.error('模板下载失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 文件选择
  const uploadProps = {
    accept: '.xlsx,.xls',
    multiple: false,
    maxCount: 1,
    beforeUpload: (file) => {
      // 验证文件类型
      const isExcel = 
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls');
      
      if (!isExcel) {
        message.error('只支持 Excel 文件格式 (.xlsx, .xls)');
        return Upload.LIST_IGNORE;
      }
      
      // 检查文件大小 (最大 10MB)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB');
        return Upload.LIST_IGNORE;
      }
      
      setUploadFile(file);
      setCurrentStep(2);
      return false; // 阻止自动上传
    },
    onRemove: () => {
      setUploadFile(null);
      setCurrentStep(1);
    },
    fileList: uploadFile ? [uploadFile] : []
  };

  // 开始导入
  const handleStartImport = async () => {
    if (!uploadFile) {
      message.warning('请先选择要上传的文件');
      return;
    }

    setUploading(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await dataManagementAPI.actuators.bulkImportUnified(formData);

      if (response.data.success) {
        message.success(response.data.message);
        setImportResult(response.data.summary);
        setCurrentStep(3);
        
        // 刷新统计信息
        fetchStatistics();
        
        // 清空文件
        setUploadFile(null);
      }
    } catch (error) {
      console.error('导入失败:', error);
      
      const errorData = error.response?.data;
      
      if (errorData?.hasErrors && errorData.errorReport) {
        // 有错误报告
        setErrorReport(errorData.errorReport);
        setErrorModalVisible(true);
        
        message.error(`数据校验失败，发现 ${errorData.errorCount} 个错误`);
      } else {
        message.error('导入失败: ' + (errorData?.message || error.message));
      }
    } finally {
      setUploading(false);
    }
  };

  // 下载错误报告
  const handleDownloadErrorReport = () => {
    if (!errorReport) return;

    try {
      // 将base64转换为Blob
      const byteCharacters = atob(errorReport.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', errorReport.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('错误报告已下载，请查看文件中的"错误说明"列');
    } catch (error) {
      message.error('下载错误报告失败');
      console.error('下载错误:', error);
    }
  };

  // 重新开始
  const handleRestart = () => {
    setCurrentStep(0);
    setUploadFile(null);
    setImportResult(null);
    setErrorReport(null);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计信息卡片 */}
      {statistics && (
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic 
                title="总数量" 
                value={statistics.totalCount || 0}
                prefix={<FileExcelOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="SF系列" 
                value={statistics.bySeries?.find(s => s._id === 'SF')?.count || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="AT系列" 
                value={statistics.bySeries?.find(s => s._id === 'AT')?.count || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="GY系列" 
                value={statistics.bySeries?.find(s => s._id === 'GY')?.count || 0}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 主操作卡片 */}
      <Card 
        title={
          <span>
            <FileExcelOutlined style={{ marginRight: '8px' }} />
            执行器数据批量导入
          </span>
        }
      >
        {/* 重要提示 */}
        <Alert
          message="重要提示"
          description={
            <div>
              <p>• 此功能使用<strong>全量替换模式</strong>：上传数据将完全替换现有数据库中的所有执行器数据</p>
              <p>• 请确保上传的Excel文件包含所有需要保留的产品信息</p>
              <p>• 数据将在校验通过后一次性导入，过程中如发现错误会生成错误报告</p>
            </div>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: '24px' }}
        />

        {/* 步骤指示器 */}
        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          <Step title="下载模板" description="获取标准模板文件" />
          <Step title="填写数据" description="按要求填写产品信息" />
          <Step title="上传文件" description="上传填写好的文件" />
          <Step title="完成导入" description="数据已成功导入" />
        </Steps>

        {/* 步骤0: 下载模板 */}
        {currentStep === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              下载执行器数据模板
            </Button>
            <div style={{ marginTop: '16px', color: '#666' }}>
              模板包含SF、AT、GY三个系列的数据表和详细说明
            </div>
          </div>
        )}

        {/* 步骤1: 填写数据提示 */}
        {currentStep === 1 && (
          <div style={{ padding: '20px' }}>
            <Alert
              message="请按照以下步骤填写数据"
              description={
                <ol style={{ paddingLeft: '20px', marginTop: '10px' }}>
                  <li>打开下载的Excel文件</li>
                  <li>仔细阅读"Instructions"工作表中的说明</li>
                  <li>在SF_Data、AT_Data、GY_Data工作表中填写对应系列的数据</li>
                  <li>确保所有必填字段都已填写，数据格式正确</li>
                  <li>保存文件后，点击下方按钮上传</li>
                </ol>
              }
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />
            
            <Divider />
            
            <div style={{ textAlign: 'center' }}>
              <Upload {...uploadProps}>
                <Button
                  type="primary"
                  size="large"
                  icon={<UploadOutlined />}
                >
                  选择填写好的Excel文件
                </Button>
              </Upload>
            </div>
          </div>
        )}

        {/* 步骤2: 确认上传 */}
        {currentStep === 2 && uploadFile && (
          <div style={{ padding: '20px' }}>
            <Alert
              message="文件已选择"
              description={
                <div>
                  <p><strong>文件名：</strong>{uploadFile.name}</p>
                  <p><strong>文件大小：</strong>{(uploadFile.size / 1024).toFixed(2)} KB</p>
                  <p style={{ marginTop: '16px', color: '#ff4d4f' }}>
                    ⚠️ 警告：点击"开始导入"后，系统将删除所有现有执行器数据并导入新数据，此操作不可撤销！
                  </p>
                </div>
              }
              type="warning"
              showIcon
            />
            
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Space size="large">
                <Button onClick={handleRestart}>
                  取消
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<UploadOutlined />}
                  onClick={handleStartImport}
                  loading={uploading}
                  danger
                >
                  确认并开始导入
                </Button>
              </Space>
            </div>
          </div>
        )}

        {/* 步骤3: 导入完成 */}
        {currentStep === 3 && importResult && (
          <div style={{ padding: '20px' }}>
            <Alert
              message="导入成功！"
              description={
                <div>
                  <Row gutter={16} style={{ marginTop: '16px' }}>
                    <Col span={6}>
                      <Statistic 
                        title="总导入记录" 
                        value={importResult.totalImported}
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic 
                        title="SF系列" 
                        value={importResult.sfCount}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic 
                        title="AT系列" 
                        value={importResult.atCount}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic 
                        title="GY系列" 
                        value={importResult.gyCount}
                      />
                    </Col>
                  </Row>
                  <p style={{ marginTop: '16px' }}>
                    已清空旧数据 {importResult.oldDataDeleted} 条，导入新数据 {importResult.totalImported} 条
                  </p>
                </div>
              }
              type="success"
              showIcon
            />
            
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Button
                type="primary"
                onClick={handleRestart}
              >
                再次导入
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 错误详情Modal */}
      <Modal
        title={
          <span>
            <WarningOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
            数据校验失败
          </span>
        }
        open={errorModalVisible}
        onCancel={() => setErrorModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setErrorModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadErrorReport}
          >
            下载错误报告
          </Button>
        ]}
        width={600}
      >
        <Alert
          message="请下载错误报告查看详细信息"
          description='错误报告是您上传文件的副本，在每个有错误的行中添加了"错误说明"列，指出具体的问题。修复错误后可重新上传。'
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      </Modal>
    </div>
  );
};

export default ActuatorManagementSimplified;

