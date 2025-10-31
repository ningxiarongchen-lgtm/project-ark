/**
 * 合同提醒组件 - 临时占位
 * 注意：此功能已被新的实时通知系统取代
 * 如需恢复，请使用 antd 组件重写
 */

import React from 'react';
import { Card, Alert } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const ContractReminders = () => {
  return (
    <Card style={{ marginBottom: 16 }}>
      <Alert
        message="合同提醒"
        description="此功能已集成到新的实时通知系统中，请查看页面右上角的通知铃铛 🔔"
        type="info"
        icon={<BellOutlined />}
        showIcon
      />
    </Card>
  );
};

export default ContractReminders;
