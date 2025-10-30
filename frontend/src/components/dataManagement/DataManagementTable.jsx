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
  Card
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
      
      setData(response.data.data);
      setPagination({
        ...pagination,
        total: response.data.pagination.total
      });
    } catch (error) {
      message.error('加载数据失败: ' + (error.response?.data?.message || error.message));
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
  const handleDownloadTemplate = async () => {
    try {
      const response = await api.downloadTemplate();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}_template.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('模板下载成功');
    } catch (error) {
      message.error('下载模板失败: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // 批量导入
  const handleImport = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('updateOnDuplicate', 'true');
    
    setImporting(true);
    try {
      const response = await api.bulkImport(formData);
      
      if (response.data.success) {
        const summary = response.data.summary;
        message.success(
          `导入完成！总计 ${summary.totalRows} 行，成功 ${summary.imported} 条，失败 ${summary.failed} 条`
        );
        
        if (summary.failed > 0 && response.data.import?.failed) {
          Modal.info({
            title: '导入结果详情',
            width: 800,
            content: (
              <div>
                <p>成功导入: {summary.imported} 条</p>
                <p>失败: {summary.failed} 条</p>
                {response.data.import.failed.length > 0 && (
                  <div>
                    <p style={{ fontWeight: 'bold', marginTop: '10px' }}>失败记录:</p>
                    <ul style={{ maxHeight: '300px', overflow: 'auto' }}>
                      {response.data.import.failed.slice(0, 10).map((item, index) => (
                        <li key={index}>
                          {JSON.stringify(item.data)} - {item.error}
                        </li>
                      ))}
                      {response.data.import.failed.length > 10 && (
                        <li>... 还有 {response.data.import.failed.length - 10} 条失败记录</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )
          });
        }
        
        fetchData();
        fetchStatistics();
      } else {
        message.error('导入失败: ' + response.data.error);
      }
    } catch (error) {
      message.error('导入失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setImporting(false);
    }
    
    return false; // 阻止自动上传
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
                新增用户
              </Button>
            </RoleBasedAccess>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              下载模板
            </Button>
            <Upload
              accept=".csv,.xlsx,.xls"
              showUploadList={false}
              beforeUpload={handleImport}
            >
              <Button
                icon={<UploadOutlined />}
                loading={importing}
              >
                批量导入
              </Button>
            </Upload>
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
        dataSource={data}
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

