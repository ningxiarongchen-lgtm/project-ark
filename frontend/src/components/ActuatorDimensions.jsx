/**
 * 执行器尺寸展示组件
 * 
 * 用于在产品详情页展示完整的尺寸数据
 * 包括：轮廓尺寸、法兰尺寸、顶部安装、气动连接
 */

import React from 'react';
import { Descriptions, Card, Row, Col, Tag, Divider } from 'antd';
import { 
  ColumnHeightOutlined, 
  ApiOutlined, 
  ToolOutlined, 
  ThunderboltOutlined 
} from '@ant-design/icons';

const ActuatorDimensions = ({ actuator }) => {
  // 条件渲染：只有当 dimensions 对象及其子对象存在时才渲染
  if (!actuator?.dimensions?.outline) {
    return null; // 如果没有尺寸数据，则不渲染任何内容
  }

  const { outline, flange, topMounting, pneumaticConnection } = actuator.dimensions;
  const actionType = actuator.action_type || actuator.actionType;

  return (
    <Card 
      title={
        <span>
          <ColumnHeightOutlined style={{ marginRight: 8 }} />
          技术尺寸参数
        </span>
      }
      style={{ marginTop: 24 }}
      bordered
    >
      {/* 轮廓尺寸 */}
      <div style={{ marginBottom: 24 }}>
        <Divider orientation="left">
          <Tag color="blue" style={{ fontSize: '14px' }}>
            📏 轮廓尺寸 (Outline Dimensions)
          </Tag>
        </Divider>
        
        <Descriptions bordered column={4} size="small">
          {outline.L1 && (
            <Descriptions.Item label="L1 (总长)">
              <strong>{outline.L1}</strong> mm
            </Descriptions.Item>
          )}
          <Descriptions.Item label="L2">
            <strong>{outline.L2}</strong> mm
            {actionType === 'SR' && (
              <Tag color="orange" size="small" style={{ marginLeft: 8 }}>
                气缸长度
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="m1">
            <strong>{outline.m1}</strong> mm
          </Descriptions.Item>
          <Descriptions.Item label="m2">
            <strong>{outline.m2}</strong> mm
          </Descriptions.Item>
          <Descriptions.Item label="A">
            <strong>{outline.A}</strong> mm
          </Descriptions.Item>
          <Descriptions.Item label="H1 (高度)">
            <strong>{outline.H1}</strong> mm
          </Descriptions.Item>
          <Descriptions.Item label="H2">
            <strong>{outline.H2}</strong> mm
          </Descriptions.Item>
          <Descriptions.Item label="D (直径)">
            <strong>{outline.D}</strong> mm
          </Descriptions.Item>
        </Descriptions>
      </div>

      {/* 法兰尺寸 */}
      {flange && (
        <div style={{ marginBottom: 24 }}>
          <Divider orientation="left">
            <Tag color="green" style={{ fontSize: '14px' }}>
              🔩 底部安装法兰 (Flange Mounting)
            </Tag>
          </Divider>
          
          <Descriptions bordered column={4} size="small">
            <Descriptions.Item label="标准" span={2}>
              <Tag color="cyan">{flange.standard}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="外径 (D)">
              <strong>{flange.D}</strong> mm
            </Descriptions.Item>
            <Descriptions.Item label="方口 (A)">
              <strong>{flange.A}</strong> mm
            </Descriptions.Item>
            <Descriptions.Item label="C">
              <strong>{flange.C}</strong> mm
            </Descriptions.Item>
            <Descriptions.Item label="F">
              <strong>{flange.F}</strong> mm
            </Descriptions.Item>
            <Descriptions.Item label="螺纹规格">
              <Tag color="blue">{flange.threadSpec}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="螺纹深度">
              <strong>{flange.threadDepth}</strong> mm
            </Descriptions.Item>
            <Descriptions.Item label="B">
              <strong>{flange.B}</strong> mm
            </Descriptions.Item>
            <Descriptions.Item label="T (厚度)">
              <strong>{flange.T}</strong> mm
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              适用于 ISO 5211 标准阀门连接
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}

      {/* 顶部安装 */}
      {topMounting && (
        <div style={{ marginBottom: 24 }}>
          <Divider orientation="left">
            <Tag color="purple" style={{ fontSize: '14px' }}>
              🔝 顶部安装 (Top Mounting)
            </Tag>
          </Divider>
          
          <Descriptions bordered column={3} size="small">
            <Descriptions.Item label="标准" span={3}>
              <Tag color="purple">{topMounting.standard}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="L">
              <strong>{topMounting.L}</strong> mm
            </Descriptions.Item>
            <Descriptions.Item label="h1">
              <strong>{topMounting.h1}</strong> mm
            </Descriptions.Item>
            <Descriptions.Item label="H">
              <strong>{topMounting.H}</strong> mm
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}

      {/* 气动连接 */}
      {pneumaticConnection && (
        <div>
          <Divider orientation="left">
            <Tag color="orange" style={{ fontSize: '14px' }}>
              🔌 气动连接 (Pneumatic Connection)
            </Tag>
          </Divider>
          
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="接口尺寸">
              <Tag color="red" style={{ fontSize: '14px' }}>
                {pneumaticConnection.size}
              </Tag>
            </Descriptions.Item>
            {pneumaticConnection.h2 && (
              <Descriptions.Item label="h2">
                <strong>{pneumaticConnection.h2}</strong> mm
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
      )}

      {/* 尺寸说明 */}
      <div style={{ marginTop: 24, padding: '12px', backgroundColor: '#f0f5ff', borderRadius: '4px' }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
              📌 尺寸说明：
            </span>
          </Col>
          <Col span={12}>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
              <li>所有尺寸单位为毫米 (mm)</li>
              <li>L1: 单作用执行器总长（包含弹簧腔）</li>
              <li>L2: 气缸长度（双作用）/ 气缸长度（单作用）</li>
            </ul>
          </Col>
          <Col span={12}>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
              <li>H1/H2: 执行器高度参数</li>
              <li>D: 执行器主体直径</li>
              <li>法兰标准符合 ISO 5211 规范</li>
            </ul>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default ActuatorDimensions;

