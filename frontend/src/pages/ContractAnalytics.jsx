/**
 * 合同分析页面 - 临时占位
 * 使用 antd 组件
 */

import React from 'react';
import { Card, Alert, Typography, Row, Col, Statistic } from 'antd';
import { FileTextOutlined, BarChartOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ContractAnalytics = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <BarChartOutlined /> 合同分析
      </Title>

      <Alert
        message="功能开发中"
        description="合同分析功能正在开发中，敬请期待！"
        type="info"
        showIcon
        icon={<FileTextOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="合同总数"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="合同总金额"
              value={0}
              prefix="¥"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="生效中合同"
              value={0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ContractAnalytics;
