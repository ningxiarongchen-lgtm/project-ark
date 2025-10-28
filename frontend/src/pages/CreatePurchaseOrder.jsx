import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  InputNumber,
  Space,
  message,
  Row,
  Col,
  Divider,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { purchaseOrdersAPI, suppliersAPI } from '../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const CreatePurchaseOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([
    {
      key: Date.now(),
      product_name: '',
      product_code: '',
      specification: '',
      quantity: 1,
      unit: '件',
      unit_price: 0,
      subtotal: 0,
      notes: ''
    }
  ]);
  const [totalAmount, setTotalAmount] = useState(0);

  const isEditMode = !!id;

  useEffect(() => {
    fetchSuppliers();
    if (isEditMode) {
      fetchOrderData();
    }
  }, [id]);

  useEffect(() => {
    calculateTotal();
  }, [items]);

  // 获取供应商列表
  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll({ status: 'active' });
      setSuppliers(response.data.data);
    } catch (error) {
      message.error('获取供应商列表失败');
      console.error(error);
    }
  };

  // 获取订单数据（编辑模式）
  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrdersAPI.getById(id);
      const orderData = response.data.data;

      // 设置表单数据
      form.setFieldsValue({
        supplier_id: orderData.supplier_id?._id,
        expected_delivery_date: orderData.expected_delivery_date
          ? dayjs(orderData.expected_delivery_date)
          : null,
        payment_terms: orderData.payment_terms,
        shipping_address: orderData.shipping_address,
        contact_person: orderData.contact_person,
        contact_phone: orderData.contact_phone,
        notes: orderData.notes,
        status: orderData.status
      });

      // 设置订单项
      const itemsWithKeys = orderData.items.map((item, index) => ({
        ...item,
        key: Date.now() + index
      }));
      setItems(itemsWithKeys);
    } catch (error) {
      message.error('获取订单数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 计算总金额
  const calculateTotal = () => {
    const total = items.reduce((sum, item) => {
      const subtotal = (item.quantity || 0) * (item.unit_price || 0);
      return sum + subtotal;
    }, 0);
    setTotalAmount(total);
  };

  // 添加订单项
  const handleAddItem = () => {
    const newItem = {
      key: Date.now(),
      product_name: '',
      product_code: '',
      specification: '',
      quantity: 1,
      unit: '件',
      unit_price: 0,
      subtotal: 0,
      notes: ''
    };
    setItems([...items, newItem]);
  };

  // 删除订单项
  const handleDeleteItem = (key) => {
    if (items.length === 1) {
      message.warning('至少保留一个采购项目');
      return;
    }
    setItems(items.filter((item) => item.key !== key));
  };

  // 更新订单项
  const handleItemChange = (key, field, value) => {
    const newItems = items.map((item) => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };
        // 自动计算小计
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.subtotal =
            (updatedItem.quantity || 0) * (updatedItem.unit_price || 0);
        }
        return updatedItem;
      }
      return item;
    });
    setItems(newItems);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    // 验证订单项
    const validItems = items.filter(
      (item) => item.product_name && item.quantity > 0 && item.unit_price >= 0
    );

    if (validItems.length === 0) {
      message.error('请至少添加一个有效的采购项目');
      return;
    }

    // 检查是否有未填写完整的项目
    const hasIncompleteItems = items.some(
      (item) => !item.product_name || item.quantity <= 0
    );

    if (hasIncompleteItems) {
      message.warning('请完善所有采购项目的信息或删除空项目');
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        ...values,
        items: validItems.map(({ key, subtotal, ...item }) => item), // 移除key和subtotal
        expected_delivery_date: values.expected_delivery_date
          ? values.expected_delivery_date.format('YYYY-MM-DD')
          : undefined
      };

      if (isEditMode) {
        await purchaseOrdersAPI.update(id, orderData);
        message.success('采购订单更新成功');
      } else {
        await purchaseOrdersAPI.create(orderData);
        message.success('采购订单创建成功');
      }

      navigate('/purchase-orders');
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          (isEditMode ? '更新失败' : '创建失败')
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 订单项表格列定义
  const itemColumns = [
    {
      title: <span style={{ color: '#f5222d' }}>* 产品名称</span>,
      dataIndex: 'product_name',
      key: 'product_name',
      width: 180,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) =>
            handleItemChange(record.key, 'product_name', e.target.value)
          }
          placeholder="请输入产品名称"
        />
      )
    },
    {
      title: '产品编码',
      dataIndex: 'product_code',
      key: 'product_code',
      width: 140,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) =>
            handleItemChange(record.key, 'product_code', e.target.value)
          }
          placeholder="产品编码"
        />
      )
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 140,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) =>
            handleItemChange(record.key, 'specification', e.target.value)
          }
          placeholder="规格说明"
        />
      )
    },
    {
      title: <span style={{ color: '#f5222d' }}>* 数量</span>,
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (text, record) => (
        <InputNumber
          value={text}
          onChange={(value) => handleItemChange(record.key, 'quantity', value)}
          min={1}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 100,
      render: (text, record) => (
        <Select
          value={text}
          onChange={(value) => handleItemChange(record.key, 'unit', value)}
          style={{ width: '100%' }}
        >
          <Select.Option value="件">件</Select.Option>
          <Select.Option value="套">套</Select.Option>
          <Select.Option value="个">个</Select.Option>
          <Select.Option value="台">台</Select.Option>
          <Select.Option value="米">米</Select.Option>
          <Select.Option value="千克">千克</Select.Option>
        </Select>
      )
    },
    {
      title: <span style={{ color: '#f5222d' }}>* 单价（¥）</span>,
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (text, record) => (
        <InputNumber
          value={text}
          onChange={(value) =>
            handleItemChange(record.key, 'unit_price', value)
          }
          min={0}
          precision={2}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '小计（¥）',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right',
      render: (text, record) => {
        const subtotal = (record.quantity || 0) * (record.unit_price || 0);
        return (
          <strong style={{ color: '#f5222d' }}>
            ¥{subtotal.toLocaleString()}
          </strong>
        );
      }
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) =>
            handleItemChange(record.key, 'notes', e.target.value)
          }
          placeholder="备注"
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm
          title="确定删除此项吗？"
          onConfirm={() => handleDeleteItem(record.key)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            disabled={items.length === 1}
          />
        </Popconfirm>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/purchase-orders')}
            style={{ marginBottom: 16 }}
          >
            返回列表
          </Button>

          <h2>
            <ShoppingCartOutlined style={{ marginRight: 8 }} />
            {isEditMode ? '编辑采购订单' : '创建采购订单'}
          </h2>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'draft',
            payment_terms: '货到付款'
          }}
        >
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="supplier_id"
                  label="供应商"
                  rules={[{ required: true, message: '请选择供应商' }]}
                >
                  <Select
                    placeholder="请选择供应商"
                    showSearch
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {suppliers.map((supplier) => (
                      <Select.Option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="expected_delivery_date" label="预计交货日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="payment_terms" label="付款条款">
                  <Select>
                    <Select.Option value="货到付款">货到付款</Select.Option>
                    <Select.Option value="预付30%">预付30%</Select.Option>
                    <Select.Option value="预付50%">预付50%</Select.Option>
                    <Select.Option value="月结30天">月结30天</Select.Option>
                    <Select.Option value="月结60天">月结60天</Select.Option>
                    <Select.Option value="其他">其他</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="订单状态">
                  <Select>
                    <Select.Option value="draft">草稿</Select.Option>
                    <Select.Option value="pending">待审核</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="收货信息" style={{ marginBottom: 16 }}>
            <Form.Item name="shipping_address" label="收货地址">
              <TextArea
                rows={2}
                placeholder="请输入收货地址"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="contact_person" label="联系人">
                  <Input placeholder="请输入联系人姓名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="contact_phone" label="联系电话">
                  <Input placeholder="请输入联系电话" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title="采购明细"
            extra={
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
              >
                添加物料
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={itemColumns}
              dataSource={items}
              pagination={false}
              scroll={{ x: 1200 }}
              rowKey="key"
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={6} align="right">
                      <strong style={{ fontSize: '16px' }}>订单总额：</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <strong style={{ color: '#f5222d', fontSize: '18px' }}>
                        ¥{totalAmount.toLocaleString()}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell colSpan={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          <Card title="其他信息">
            <Form.Item name="notes" label="订单备注">
              <TextArea
                rows={4}
                placeholder="订单备注信息..."
              />
            </Form.Item>
          </Card>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Space size="large">
              <Button onClick={() => navigate('/purchase-orders')}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                {isEditMode ? '保存修改' : '创建订单'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CreatePurchaseOrder;

