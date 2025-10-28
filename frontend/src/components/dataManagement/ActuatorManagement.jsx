/**
 * Actuator管理组件
 */

import React from 'react';
import { Tag, Row, Col, Statistic } from 'antd';
import DataManagementTable from './DataManagementTable';
import ActuatorForm from './forms/ActuatorForm';
import { dataManagementAPI } from '../../services/api';

const ActuatorManagement = () => {
  // 表格列定义
  const columns = [
    {
      title: '型号',
      dataIndex: 'model_base',
      key: 'model_base',
      fixed: 'left',
      width: 120
    },
    {
      title: '系列',
      dataIndex: 'series',
      key: 'series',
      width: 80,
      render: (text) => text && <Tag color="blue">{text}</Tag>
    },
    {
      title: '本体尺寸',
      dataIndex: 'body_size',
      key: 'body_size',
      width: 100
    },
    {
      title: '作用类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 100,
      render: (text) => (
        <Tag color={text === 'DA' ? 'green' : 'orange'}>
          {text === 'DA' ? '双作用' : '弹簧复位'}
        </Tag>
      )
    },
    {
      title: '定价模式',
      dataIndex: 'pricing_model',
      key: 'pricing_model',
      width: 100,
      render: (text) => (
        <Tag color={text === 'fixed' ? 'cyan' : 'purple'}>
          {text === 'fixed' ? '固定价格' : '阶梯价格'}
        </Tag>
      )
    },
    {
      title: '基础价格',
      dataIndex: 'base_price',
      key: 'base_price',
      width: 120,
      render: (text) => text ? `¥${text.toFixed(2)}` : '-'
    },
    {
      title: '可用状态',
      dataIndex: 'availability',
      key: 'availability',
      width: 100,
      render: (text) => {
        const colorMap = {
          'In Stock': 'success',
          'Out of Stock': 'error',
          'Discontinued': 'default'
        };
        return text && <Tag color={colorMap[text] || 'default'}>{text}</Tag>;
      }
    }
  ];
  
  // 渲染统计信息
  const renderStatistics = (stats) => (
    <Row gutter={16}>
      <Col span={6}>
        <Statistic title="总数量" value={stats.totalCount} />
      </Col>
      <Col span={6}>
        <Statistic 
          title="固定定价" 
          value={stats.byPricingModel?.find(item => item._id === 'fixed')?.count || 0} 
        />
      </Col>
      <Col span={6}>
        <Statistic 
          title="阶梯定价" 
          value={stats.byPricingModel?.find(item => item._id === 'tiered')?.count || 0} 
        />
      </Col>
      <Col span={6}>
        <Statistic 
          title="系列数" 
          value={stats.bySeries?.length || 0} 
        />
      </Col>
    </Row>
  );
  
  return (
    <DataManagementTable
      api={dataManagementAPI.actuators}
      columns={columns}
      title="执行器"
      FormComponent={ActuatorForm}
      renderStatistics={renderStatistics}
    />
  );
};

export default ActuatorManagement;

