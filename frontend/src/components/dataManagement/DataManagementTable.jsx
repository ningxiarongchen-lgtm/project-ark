/**
 * 通用数据管理表格组件
 * 提供CRUD、搜索、分页、批量导入等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  message,
  Modal,
  Upload,
  Popconfirm,
  Tag,
  Row,
  Col,
  Statistic,
  Card,
  Dropdown
} from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import RoleBasedAccess from '../RoleBasedAccess';

const { Search } = Input;

const DataManagementTable = ({
  // API methods
  api,
  // Table configuration
  columns,
  title,
  // Form configuration
  FormComponent,
  // Statistics configuration
  renderStatistics,
  // Template types (for template download dropdown)
  templateTypes = null, // e.g. [{ key: 'SF', label: 'SF系列' }, { key: 'AT', label: 'AT系列' }]
  // Button text
  addButtonText = '新增',
  // Row key
  rowKey = '_id',
  // Default page size
  defaultPageSize = 20
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: defaultPageSize,
    total: 0
  });
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [importing, setImporting] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [importFileList, setImportFileList] = useState([]);
  
  // 加载数据
  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.getAll({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        ...params
      });
      
      // 安全地提取数据，支持多种返回格式
      const responseData = response.data?.data || response.data || [];
      const arrayData = Array.isArray(responseData) ? responseData : [];
      
      setData(arrayData);
      setPagination({
        ...pagination,
        total: response.data?.pagination?.total || arrayData.length
      });
    } catch (error) {
      message.error('加载数据失败: ' + (error.response?.data?.message || error.message));
      setData([]); // 出错时设置为空数组
    } finally {
      setLoading(false);
    }
  };
  
  // 加载统计信息
  const fetchStatistics = async () => {
    if (!api.getStatistics) return;
    
    try {
      const response = await api.getStatistics();
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };
  
  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, [pagination.current, pagination.pageSize, searchText]);
  
  // 处理表格变化
  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination(newPagination);
  };
  
  // 处理搜索
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };
  
  // 新增
  const handleAdd = () => {
    setEditingRecord(null);
    setFormVisible(true);
  };
  
  // 编辑
  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormVisible(true);
  };
  
  // 删除
  const handleDelete = async (id) => {
    try {
      await api.delete(id);
      message.success('删除成功');
      fetchData();
      fetchStatistics();
    } catch (error) {
      message.error('删除失败: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // 批量删除
  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的记录');
      return;
    }
    
    try {
      await api.bulkDelete(selectedRowKeys);
      message.success(`成功删除 ${selectedRowKeys.length} 条记录`);
      setSelectedRowKeys([]);
      fetchData();
      fetchStatistics();
    } catch (error) {
      message.error('批量删除失败: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // 下载模板
  const handleDownloadTemplate = async (type = null) => {
    try {
      const response = await api.downloadTemplate(type);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // 根据类型设置文件名
      const fileExtension = response.headers['content-type']?.includes('csv') ? 'csv' : 'xlsx';
      const fileName = type ? `${title}_${type}_template.${fileExtension}` : `${title}_template.${fileExtension}`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success(`模板下载成功${type ? `（${type}系列）` : ''}`);
    } catch (error) {
      message.error('下载模板失败: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // 批量导入 - 支持多文件
  const handleImportSubmit = async () => {
    if (importFileList.length === 0) {
      message.warning('请先选择要上传的文件');
      return;
    }
    
    setImporting(true);
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalRows = 0;
    const allErrors = [];
    
    try {
      // 逐个处理文件
      for (const file of importFileList) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('updateOnDuplicate', 'true');
        
        try {
          const response = await api.bulkImport(formData);
          
          if (response.data.success) {
            const summary = response.data.summary;
            totalSuccess += summary.imported || 0;
            totalFailed += summary.failed || 0;
            totalRows += summary.totalRows || 0;
            
            if (summary.failed > 0 && response.data.import?.failed) {
              allErrors.push({
                file: file.name,
                errors: response.data.import.failed
              });
            }
          }
        } catch (error) {
          totalFailed++;
          allErrors.push({
            file: file.name,
            errors: [{ error: error.response?.data?.message || error.message }]
          });
        }
      }
      
      // 显示汇总结果
      message.success(
        `导入完成！总计 ${totalRows} 行，成功 ${totalSuccess} 条，失败 ${totalFailed} 条`
      );
      
      // 如果有错误，显示详情
      if (allErrors.length > 0) {
        Modal.info({
          title: '导入结果详情',
          width: 800,
          content: (
            <div>
              <p>成功导入: {totalSuccess} 条</p>
              <p>失败: {totalFailed} 条</p>
              {allErrors.map((fileError, idx) => (
                <div key={idx}>
                  <p style={{ fontWeight: 'bold', marginTop: '10px' }}>文件: {fileError.file}</p>
                  <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {fileError.errors.slice(0, 5).map((item, index) => (
                      <li key={index}>
                        {item.data ? JSON.stringify(item.data) : ''} - {item.error}
                      </li>
                    ))}
                    {fileError.errors.length > 5 && (
                      <li>... 还有 {fileError.errors.length - 5} 条失败记录</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )
        });
      }
      
      fetchData();
      fetchStatistics();
      setImportFileList([]); // 清空文件列表
    } catch (error) {
      message.error('导入失败: ' + error.message);
    } finally {
      setImporting(false);
    }
  };
  
  // 表单提交
  const handleFormSubmit = async (values) => {
    try {
      if (editingRecord) {
        await api.update(editingRecord[rowKey], values);
        message.success('更新成功');
      } else {
        await api.create(values);
        message.success('创建成功');
      }
      
      setFormVisible(false);
      setEditingRecord(null);
      fetchData();
      fetchStatistics();
    } catch (error) {
      message.error(
        editingRecord ? '更新失败' : '创建失败' + ': ' + 
        (error.response?.data?.message || error.message)
      );
    }
  };
  
  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys
  };
  
  // 添加操作列
  const columnsWithActions = [
    ...columns,
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDelete(record[rowKey])}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];
  
  return (
    <div>
      {/* 统计信息 */}
      {statistics && renderStatistics && (
        <Card style={{ marginBottom: '16px' }}>
          {renderStatistics(statistics)}
        </Card>
      )}
      
      {/* 工具栏 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col flex="auto">
          <Search
            placeholder="搜索..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ maxWidth: '400px' }}
          />
        </Col>
        <Col>
          <Space>
            <RoleBasedAccess allowedRoles={['Administrator']}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                {addButtonText}
              </Button>
            </RoleBasedAccess>
            {/* 下载模板按钮：支持单模板和多模板类型 */}
            {templateTypes ? (
              <Dropdown
                menu={{
                  items: templateTypes.map(type => ({
                    key: type.key,
                    label: type.label,
                    onClick: () => handleDownloadTemplate(type.key)
                  }))
                }}
              >
                <Button icon={<DownloadOutlined />}>
                  下载模板
                </Button>
              </Dropdown>
            ) : (
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadTemplate()}
              >
                下载模板
              </Button>
            )}
            <Upload
              accept=".csv,.xlsx,.xls"
              multiple
              fileList={importFileList}
              beforeUpload={(file) => {
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
                  return Upload.LIST_IGNORE;
                }
                
                // 检查文件大小 (最大 10MB)
                const isLt10M = file.size / 1024 / 1024 < 10;
                if (!isLt10M) {
                  message.error('文件大小不能超过 10MB');
                  return Upload.LIST_IGNORE;
                }
                
                // 添加到文件列表
                setImportFileList(prevList => [...prevList, file]);
                return false; // 阻止自动上传
              }}
              onRemove={(file) => {
                setImportFileList(prevList => prevList.filter(f => f.uid !== file.uid));
              }}
              showUploadList={false}
            >
              <Button
                icon={<UploadOutlined />}
              >
                选择文件（可多选）
              </Button>
            </Upload>
            {importFileList.length > 0 && (
              <Button
                type="primary"
                onClick={handleImportSubmit}
                loading={importing}
              >
                开始导入 ({importFileList.length} 个文件)
              </Button>
            )}
            <Popconfirm
              title={`确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`}
              onConfirm={handleBulkDelete}
              disabled={selectedRowKeys.length === 0}
              okText="确定"
              cancelText="取消"
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={selectedRowKeys.length === 0}
              >
                批量删除 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchData()}
            >
              刷新
            </Button>
          </Space>
        </Col>
      </Row>
      
      {/* 数据表格 */}
      <Table
        rowKey={rowKey}
        columns={columnsWithActions}
        dataSource={Array.isArray(data) ? data : []}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowSelection={rowSelection}
        scroll={{ x: 1200 }}
      />
      
      {/* 编辑/新增表单 */}
      {FormComponent && (
        <FormComponent
          visible={formVisible}
          record={editingRecord}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setFormVisible(false);
            setEditingRecord(null);
          }}
        />
      )}
    </div>
  );
};

export default DataManagementTable;

