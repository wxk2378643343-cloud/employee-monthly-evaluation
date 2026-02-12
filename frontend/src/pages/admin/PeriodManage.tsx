import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, DatePicker, Select, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as adminApi from '@/api/admin';
import { EvalPeriod, PeriodStatus, PeriodStatusLabel } from '@/types';

const PeriodManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<EvalPeriod | null>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      setPeriods(await adminApi.getPeriodList());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setCurrentPeriod(null);
    form.resetFields();
    const next = dayjs().add(1, 'month');
    form.setFieldsValue({
      year: next.year(),
      month: next.month() + 1,
      periodName: `${next.year()}-${next.month() + 1}`,
      startTime: next.startOf('month'),
      endTime: next.endOf('month'),
      status: PeriodStatus.NOT_STARTED,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: EvalPeriod) => {
    setCurrentPeriod(record);
    form.setFieldsValue({
      ...record,
      startTime: record.startTime ? dayjs(record.startTime) : undefined,
      endTime: record.endTime ? dayjs(record.endTime) : undefined,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await adminApi.savePeriod({
      ...values,
      id: currentPeriod?.id,
      startTime: values.startTime?.format('YYYY-MM-DD HH:mm:ss'),
      endTime: values.endTime?.format('YYYY-MM-DD HH:mm:ss'),
    });
    message.success('保存成功');
    setModalVisible(false);
    loadData();
  };

  const handleStart = async (id: number) => {
    await adminApi.updatePeriodStatus(id, PeriodStatus.IN_PROGRESS);
    message.success('已开始');
    loadData();
  };

  const handleEnd = async (id: number) => {
    await adminApi.updatePeriodStatus(id, PeriodStatus.ENDED);
    message.success('已结束');
    loadData();
  };

  const statusColor: Record<number, string> = {
    [PeriodStatus.NOT_STARTED]: 'default',
    [PeriodStatus.IN_PROGRESS]: 'processing',
    [PeriodStatus.ENDED]: 'success',
  };

  return (
    <Card title="评价周期管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增周期</Button>}>
      <Table
        loading={loading}
        dataSource={periods}
        rowKey="id"
        columns={[
          { title: '名称', dataIndex: 'periodName', key: 'periodName' },
          { title: '年份', dataIndex: 'year', key: 'year' },
          { title: '月份', dataIndex: 'month', key: 'month' },
          { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
          { title: '结束时间', dataIndex: 'endTime', key: 'endTime' },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (s: PeriodStatus) => <Tag color={statusColor[s]}>{PeriodStatusLabel[s]}</Tag>,
          },
          {
            title: '操作',
            key: 'action',
            render: (_: unknown, r: EvalPeriod) => (
              <Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
                {r.status === PeriodStatus.NOT_STARTED && <Button type="link" onClick={() => handleStart(r.id)}>开始</Button>}
                {r.status === PeriodStatus.IN_PROGRESS && <Button type="link" onClick={() => handleEnd(r.id)}>结束</Button>}
              </Space>
            ),
          },
        ]}
      />

      <Modal title={currentPeriod ? '编辑周期' : '新增周期'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="periodName" label="周期名称" rules={[{ required: true, message: '请输入名称' }]}><Input /></Form.Item>
          <Space>
            <Form.Item name="year" label="年份" rules={[{ required: true, message: '请输入年份' }]}><Input type="number" style={{ width: 120 }} /></Form.Item>
            <Form.Item name="month" label="月份" rules={[{ required: true, message: '请输入月份' }]}><Input type="number" min={1} max={12} style={{ width: 120 }} /></Form.Item>
          </Space>
          <Space>
            <Form.Item name="startTime" label="开始时间"><DatePicker showTime /></Form.Item>
            <Form.Item name="endTime" label="结束时间"><DatePicker showTime /></Form.Item>
          </Space>
          <Form.Item name="status" label="状态"><Select>
            <Select.Option value={PeriodStatus.NOT_STARTED}>{PeriodStatusLabel[PeriodStatus.NOT_STARTED]}</Select.Option>
            <Select.Option value={PeriodStatus.IN_PROGRESS}>{PeriodStatusLabel[PeriodStatus.IN_PROGRESS]}</Select.Option>
            <Select.Option value={PeriodStatus.ENDED}>{PeriodStatusLabel[PeriodStatus.ENDED]}</Select.Option>
          </Select></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PeriodManage;
