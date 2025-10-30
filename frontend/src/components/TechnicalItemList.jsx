/**
 * 技术清单组件
 * 用于技术工程师管理项目的技术需求清单
 */

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  message,
  Modal,
  Alert,
  Tag
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { projectsAPI } from '../services/api';

const { TextArea } = Input;

const TechnicalItemList = ({ project, onUpdate }) => {
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [dataSource, setDataSource] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();

  useEffect(() => {
    if (project?.technical_item_list) {
      // 为每个项目添加唯一key
      const dataWithKeys = project.technical_item_list.map((item, index) => ({
        ...item,
        key: item._id || `tech_${index}`,
        index: index
      }));
      setDataSource(dataWithKeys);
    }
  }, [project]);

  // 判断是否在编辑
  const isEditing = (record) => record.key === editingKey;

  // 开始编辑
  const edit = (record) => {
    form.setFieldsValue({
      tag: record.tag || '',
      model_name: record.model_name || '',
      quantity: record.quantity || 1,
      description: record.description || '',
      torque: record.technical_specs?.torque || '',
      pressure: record.technical_specs?.pressure || '',
      rotation: record.technical_specs?.rotation || '',
      valve_type: record.technical_specs?.valve_type || '',
      valve_size: record.technical_specs?.valve_size || '',
      notes: record.notes || ''
    });
    setEditingKey(record.key);
  };

  // 取消编辑
  const cancel = () => {
    setEditingKey('');
  };

  // 保存编辑
  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...dataSource];
      const index = newData.findIndex((item) => key === item.key);

      if (index > -1) {
        const item = newData[index];
        const updatedItem = {
          ...item,
          ...row,
          technical_specs: {
            torque: row.torque,
            pressure: row.pressure,
            rotation: row.rotation,
            valve_type: row.valve_type,
            valve_size: row.valve_size
          }
        };
        newData.splice(index, 1, updatedItem);
        setDataSource(newData);
        setEditingKey('');

        // 保存到服务器
        await saveTechnicalListToServer(newData);
        message.success('保存成功');
      }
    } catch (errInfo) {
      console.log('验证失败:', errInfo);
    }
  };

  // 删除行
  const handleDelete = async (key) => {
    const newData = dataSource.filter((item) => item.key !== key);
    setDataSource(newData);
    
    // 保存到服务器
    await saveTechnicalListToServer(newData);
    message.success('删除成功');
  };

  // 添加新项
  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields();
      const newItem = {
        ...values,
        key: `tech_${Date.now()}`,
        technical_specs: {
          torque: values.torque,
          pressure: values.pressure,
          rotation: values.rotation,
          valve_type: values.valve_type,
          valve_size: values.valve_size
        },
        added_at: new Date()
      };

      const newData = [...dataSource, newItem];
      setDataSource(newData);
      setAddModalVisible(false);
      addForm.resetFields();

      // 保存到服务器
      await saveTechnicalListToServer(newData);
      message.success('添加成功');
    } catch (error) {
      console.log('验证失败:', error);
    }
  };

  // 保存到服务器
  const saveTechnicalListToServer = async (data) => {
    try {
      // 清理数据，移除 key 和 index
      const cleanData = data.map(item => {
        const { key, index, ...rest } = item;
        return rest;
      });

      await projectsAPI.update(project._id, {
        technical_item_list: cleanData
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      message.error('保存失败: ' + (error.response?.data?.message || error.message));
      throw error;
    }
  };

  // 可编辑单元格组件
  const EditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }) => {
    const inputNode = inputType === 'number' ? (
      <InputNumber style={{ width: '100%' }} min={0} />
    ) : inputType === 'textarea' ? (
      <TextArea rows={2} />
    ) : (
      <Input />
    );

    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={
              dataIndex === 'model_name' || dataIndex === 'quantity'
                ? [{ required: true, message: `请输入${title}` }]
                : []
            }
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '位号/标签',
      dataIndex: 'tag',
      key: 'tag',
      width: 120,
      editable: true,
      render: (text) => <Tag color="blue">{text || '-'}</Tag>
    },
    {
      title: '型号名称',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 180,
      editable: true,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      editable: true,
      inputType: 'number'
    },
    {
      title: '描述/技术要求',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      editable: true,
      inputType: 'textarea'
    },
    {
      title: '扭矩(Nm)',
      dataIndex: ['technical_specs', 'torque'],
      key: 'torque',
      width: 100,
      editable: true,
      inputType: 'number',
      render: (text) => text || '-'
    },
    {
      title: '压力(bar)',
      dataIndex: ['technical_specs', 'pressure'],
      key: 'pressure',
      width: 100,
      editable: true,
      inputType: 'number',
      render: (text) => text || '-'
    },
    {
      title: '旋转角度(°)',
      dataIndex: ['technical_specs', 'rotation'],
      key: 'rotation',
      width: 100,
      editable: true,
      inputType: 'number',
      render: (text) => text || '-'
    },
    {
      title: '阀门类型',
      dataIndex: ['technical_specs', 'valve_type'],
      key: 'valve_type',
      width: 120,
      editable: true,
      render: (text) => text || '-'
    },
    {
      title: '阀门尺寸',
      dataIndex: ['technical_specs', 'valve_size'],
      key: 'valve_size',
      width: 100,
      editable: true,
      render: (text) => text || '-'
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      editable: true,
      inputType: 'textarea',
      render: (text) => text || '-'
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button
              type="link"
              icon={<SaveOutlined />}
              onClick={() => save(record.key)}
              size="small"
            >
              保存
            </Button>
            <Button
              type="link"
              icon={<CloseOutlined />}
              onClick={cancel}
              size="small"
            >
              取消
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              disabled={editingKey !== ''}
              onClick={() => edit(record)}
              size="small"
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除这条记录吗？"
              onConfirm={() => handleDelete(record.key)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                disabled={editingKey !== ''}
                size="small"
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.inputType || 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record)
      })
    };
  });

  return (
    <div>
      <Alert
        message="📋 技术需求清单"
        description="在此填写项目的技术需求清单，包括位号、型号需求、技术参数等。完成后可导出PDF并请求商务报价。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModalVisible(true)}
          disabled={editingKey !== ''}
        >
          添加技术项
        </Button>
      </div>

      <Form form={form} component={false}>
        <Table
          components={{
            body: {
              cell: EditableCell
            }
          }}
          bordered
          dataSource={dataSource}
          columns={mergedColumns}
          rowClassName="editable-row"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 项`
          }}
          scroll={{ x: 1600 }}
        />
      </Form>

      {/* 添加新项的模态框 */}
      <Modal
        title="添加技术项"
        open={addModalVisible}
        onOk={handleAdd}
        onCancel={() => {
          setAddModalVisible(false);
          addForm.resetFields();
        }}
        width={800}
        okText="添加"
        cancelText="取消"
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="tag"
            label="位号/标签"
            tooltip="例如：FV-001, PV-102"
          >
            <Input placeholder="位号或标签（可选）" />
          </Form.Item>

          <Form.Item
            name="model_name"
            label="型号名称"
            rules={[{ required: true, message: '请输入型号名称' }]}
          >
            <Input placeholder="例如：GT-100, AT-125DA" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
            initialValue={1}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述/技术要求"
          >
            <TextArea rows={3} placeholder="描述技术要求、应用场景等" />
          </Form.Item>

          <Form.Item label="技术参数">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="torque" noStyle>
                <InputNumber
                  placeholder="扭矩 (Nm)"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="pressure" noStyle>
                <InputNumber
                  placeholder="压力 (bar)"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="rotation" noStyle>
                <InputNumber
                  placeholder="旋转角度 (°)"
                  min={0}
                  max={360}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="valve_type" noStyle>
                <Input placeholder="阀门类型（如：球阀、蝶阀）" />
              </Form.Item>
              <Form.Item name="valve_size" noStyle>
                <Input placeholder="阀门尺寸（如：DN100, 4寸）" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="其他备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TechnicalItemList;

