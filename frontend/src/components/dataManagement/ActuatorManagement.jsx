/**
 * Actuator管理组件
 */

import React, { useMemo } from 'react';
import { Tag, Row, Col, Statistic } from 'antd';
import DataManagementTable from './DataManagementTable';
import ActuatorForm from './forms/ActuatorForm';
import { dataManagementAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const ActuatorManagement = () => {
  const { user } = useAuthStore();
  
  // 只有管理员和商务可以查看价格信息
  const canViewPrice = user?.role === 'Administrator' || user?.role === 'Sales Manager';
  
  // 表格列定义
  const allColumns = [
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
          {text === 'DA' ? '双作用' : '单作用'}
        </Tag>
      )
    },
    {
      title: '弹簧范围',
      dataIndex: 'spring_range',
      key: 'spring_range',
      width: 100,
      render: (text, record) => {
        // 只有SR类型才显示弹簧范围
        return record.action_type === 'SR' && text ? text : '-';
      }
    },
    {
      title: '常温价格',
      dataIndex: 'base_price_normal',
      key: 'base_price_normal',
      width: 120,
      render: (text) => text ? `¥${text.toFixed(2)}` : '-'
    },
    {
      title: '低温价格',
      dataIndex: 'base_price_low',
      key: 'base_price_low',
      width: 120,
      render: (text) => text ? `¥${text.toFixed(2)}` : '-'
    },
    {
      title: '高温价格',
      dataIndex: 'base_price_high',
      key: 'base_price_high',
      width: 120,
      render: (text) => text ? `¥${text.toFixed(2)}` : '-'
    },
    {
      title: '产品状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => {
        const colorMap = {
          '设计中': 'processing',
          '已发布': 'success',
          '已停产': 'default'
        };
        return text && <Tag color={colorMap[text] || 'default'}>{text}</Tag>;
      }
    },
    {
      title: '库存状态',
      key: 'stock_status',
      width: 100,
      render: (_, record) => {
        const available = record.stock_info?.available;
        const quantity = record.stock_info?.quantity || 0;
        
        if (!available) {
          return <Tag color="error">缺货</Tag>;
        } else if (quantity > 0) {
          return <Tag color="success">有货 ({quantity})</Tag>;
        } else {
          return <Tag color="warning">按需生产</Tag>;
        }
      }
    }
  ];
  
  // 根据用户角色过滤列 - 只有管理员和商务可以看到价格
  const columns = useMemo(() => {
    if (!canViewPrice) {
      return allColumns.filter(col => 
        col.key !== 'base_price_normal' && 
        col.key !== 'base_price_low' && 
        col.key !== 'base_price_high'
      );
    }
    return allColumns;
  }, [canViewPrice]);
  
  // 渲染统计信息
  const renderStatistics = (stats) => {
    // 只有管理员和商务显示价格相关统计
    if (!canViewPrice) {
      return (
        <Row gutter={16}>
          <Col span={8}>
            <Statistic title="总数量" value={stats.totalCount} />
          </Col>
          <Col span={8}>
            <Statistic 
              title="系列数" 
              value={stats.bySeries?.length || 0} 
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="作用类型数" 
              value={stats.byActionType?.length || 0} 
            />
          </Col>
        </Row>
      );
    }
    
    return (
      <Row gutter={16}>
        <Col span={6}>
          <Statistic title="总数量" value={stats.totalCount || 0} />
        </Col>
        <Col span={6}>
          <Statistic 
            title="有价格产品" 
            value={stats.withPrice || 0}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="无价格产品" 
            value={stats.withoutPrice || 0}
            valueStyle={{ color: '#fa8c16' }}
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
  };
  
  return (
    <DataManagementTable
      api={dataManagementAPI.actuators}
      columns={columns}
      title="执行器"
      FormComponent={ActuatorForm}
      renderStatistics={renderStatistics}
      addButtonText="新增执行器"
    />
  );
};

export default ActuatorManagement;

