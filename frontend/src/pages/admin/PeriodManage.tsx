import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as adminApi from '@/api/admin';
import type { EvalPeriod } from '@/types';
import { PeriodStatus, PeriodStatusLabel } from '@/types';

const PeriodManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<EvalPeriod | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPeriodList();
      setPeriods(data);
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setCurrentPeriod(null);
    form.resetFields();
    // 默认设置为下个月
    const nextMonth = dayjs().add(1, 'month');
    form.setFieldsValue({
      year: nextMonth.year(),
      month: nextMonth.month() + 1,
      periodName: `${nextMonth.year()}年${nextMonth.month() + 1}月`,
      startDate: nextMonth.startOf('month'),
      endDate: nextMonth.endOf('month'),
      status: PeriodStatus.NOT_STARTED,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: EvalPeriod) => {
    setCurrentPeriod(record);
    form.setFieldsValue({
      ...record,
      startDate: dayjs(record.startDate),
      endDate: dayjs(record.endDate),
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        id: currentPeriod?.id,
      };
      await adminApi.savePeriod(data);
      message.success(currentPeriod ? '编辑成功' : '新增成功');
      setModalVisible(false);
      loadData();
    } catch {
      // 忽略
    }
  };

  const handleStatusChange = async (id: number, status: number) => {
    try {
      await adminApi.updatePeriodStatus(id, status);
      message.success('状态更新成功');
      loadData();
    } catch {
      // 忽略
    }
  };

  const getStatusColor = (status: PeriodStatus) => {
    const colorMap: Record<PeriodStatus, string> = {
      [PeriodStatus.NOT_STARTED]: 'default',
      [PeriodStatus.ROUND_ONE]: 'processing',
      [PeriodStatus.ROUND_TWO]: 'warning',
      [PeriodStatus.ENDED]: 'success',
    };
    return colorMap[status];
  };

  const columns = [
    { title: '周期名称', dataIndex: 'periodName', key: 'periodName' },
    { title: '年份', dataIndex: 'year', key: 'year', width: 80 },
    { title: '月份', dataIndex: 'month', key: 'month', width: 80 },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate' },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: PeriodStatus) => (
        <Tag color={getStatusColor(status)}>{PeriodStatusLabel[status]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: EvalPeriod) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === PeriodStatus.NOT_STARTED && (
            <Button
              type="link"
              onClick={() => handleStatusChange(record.id, PeriodStatus.ROUND_ONE)}
            >
              开始第一轮
            </Button>
          )}
          {record.status === PeriodStatus.ROUND_ONE && (
            <Button
              type="link"
              onClick={() => handleStatusChange(record.id, PeriodStatus.ROUND_TWO)}
            >
              进入第二轮
            </Button>
          )}
          {record.status === PeriodStatus.ROUND_TWO && (
            <Button
              type="link"
              onClick={() => handleStatusChange(record.id, PeriodStatus.ENDED)}
            >
              结束
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="评价周期管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增周期
        </Button>
      }
    >
      <Table
        loading={loading}
        dataSource={periods}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={currentPeriod ? '编辑周期' : '新增周期'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="periodName"
            label="周期名称"
            rules={[{ required: true, message: '请输入周期名称' }]}
          >
            <Input placeholder="如：2024年1月" />
          </Form.Item>
          <Space>
            <Form.Item
              name="year"
              label="年份"
              rules={[{ required: true, message: '请输入年份' }]}
            >
              <Input type="number" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item
              name="month"
              label="月份"
              rules={[{ required: true, message: '请输入月份' }]}
            >
              <Input type="number" min={1} max={12} style={{ width: 120 }} />
            </Form.Item>
          </Space>
          <Space>
            <Form.Item
              name="startDate"
              label="开始日期"
              rules={[{ required: true, message: '请选择开始日期' }]}
            >
              <DatePicker />
            </Form.Item>
            <Form.Item
              name="endDate"
              label="结束日期"
              rules={[{ required: true, message: '请选择结束日期' }]}
            >
              <DatePicker />
            </Form.Item>
          </Space>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value={PeriodStatus.NOT_STARTED}>
                {PeriodStatusLabel[PeriodStatus.NOT_STARTED]}
              </Select.Option>
              <Select.Option value={PeriodStatus.ROUND_ONE}>
                {PeriodStatusLabel[PeriodStatus.ROUND_ONE]}
              </Select.Option>
              <Select.Option value={PeriodStatus.ROUND_TWO}>
                {PeriodStatusLabel[PeriodStatus.ROUND_TWO]}
              </Select.Option>
              <Select.Option value={PeriodStatus.ENDED}>
                {PeriodStatusLabel[PeriodStatus.ENDED]}
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PeriodManage;
