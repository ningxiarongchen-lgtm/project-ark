/**
 * 动态问候语组件
 * 根据时间和用户信息显示个性化问候
 */

import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import { SmileOutlined, ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { getFullGreeting } from '../../utils/greetings';

const { Title, Text, Paragraph } = Typography;

const GreetingWidget = () => {
  const { user } = useAuthStore();
  const [greetingData, setGreetingData] = useState(null);

  useEffect(() => {
    // 获取问候信息
    const updateGreeting = () => {
      const data = getFullGreeting(user?.full_name || user?.phone || '用户');
      setGreetingData(data);
    };

    updateGreeting();
    
    // 每分钟更新一次，确保时段问候语的准确性
    const interval = setInterval(updateGreeting, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  if (!greetingData) {
    return null;
  }

  return (
    <Card
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        marginBottom: 24,
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
      }}
      styles={{ body: { padding: '32px' } }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 主问候语 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={2} style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center' }}>
            <SmileOutlined style={{ marginRight: 12, fontSize: 32 }} />
            {greetingData.greeting}
          </Title>
          {greetingData.isWeekend && (
            <Tag color="gold" style={{ fontSize: 14, padding: '4px 12px' }}>
              周末时光
            </Tag>
          )}
        </div>

        {/* 动态语录 */}
        <Paragraph 
          style={{ 
            color: 'rgba(255, 255, 255, 0.95)', 
            fontSize: 16,
            fontStyle: 'italic',
            margin: 0,
            lineHeight: 1.6
          }}
        >
          "{greetingData.quote}"
        </Paragraph>

        {/* 日期和时间信息 */}
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <Space size="small">
            <CalendarOutlined style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14 }}>
              {greetingData.dayOfWeek}
            </Text>
          </Space>
          <Space size="small">
            <ClockCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14 }}>
              {greetingData.time.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit'
              })}
            </Text>
          </Space>
        </div>
      </Space>
    </Card>
  );
};

export default GreetingWidget;

