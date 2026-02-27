import React, { useEffect, useRef, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, DatePicker, Select, Tag, Popconfirm } from 'antd';
import { message } from '@/utils/message';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as adminApi from '@/api/admin';
import * as remindApi from '@/api/remind';
import { EvalPeriod, PeriodStatus, PeriodStatusLabel } from '@/types';

const PeriodManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<EvalPeriod | null>(null);
  const [manualDateEdited, setManualDateEdited] = useState(false);
  const internalUpdatingRef = useRef(false);
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
    setManualDateEdited(false);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: EvalPeriod) => {
    setCurrentPeriod(record);
    setManualDateEdited(true);
    form.setFieldsValue({
      ...record,
      startTime: record.startTime ? dayjs(record.startTime) : undefined,
      endTime: record.endTime ? dayjs(record.endTime) : undefined,
    });
    setModalVisible(true);
  };

  const handleFormValuesChange = (changedValues: Record<string, unknown>, allValues: Record<string, unknown>) => {
    if (internalUpdatingRef.current || currentPeriod) return;

    if ('startTime' in changedValues || 'endTime' in changedValues) {
      setManualDateEdited(Boolean(allValues.startTime || allValues.endTime));
      return;
    }

    if (!('year' in changedValues || 'month' in changedValues)) return;

    const monthNum = Number(allValues.month);
    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) return;

    const yearNum = Number(allValues.year) || dayjs().year();
    const monthBase = dayjs(`${yearNum}-${String(monthNum).padStart(2, '0')}-01`);
    if (!monthBase.isValid()) return;

    const patch: Record<string, unknown> = {};
    if (!allValues.year) patch.year = yearNum;
    if (!allValues.periodName) patch.periodName = `${yearNum}-${monthNum}`;
    if (!manualDateEdited) {
      patch.startTime = monthBase.startOf('month');
      patch.endTime = monthBase.endOf('month');
    }

    if (!Object.keys(patch).length) return;
    internalUpdatingRef.current = true;
    form.setFieldsValue(patch);
    internalUpdatingRef.current = false;
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (values.startTime && values.endTime && values.startTime.isAfter(values.endTime)) {
      message.warning('开始时间不能晚于结束时间');
      return;
    }
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

  const handleDelete = async (id: number) => {
    await adminApi.deletePeriod(id);
    message.success('已删除');
    loadData();
  };

  const handleEnd = async (id: number) => {
    const doEnd = async () => {
      await adminApi.updatePeriodStatus(id, PeriodStatus.ENDED);
      message.success('已结束');
      loadData();
    };

    const assigns = await adminApi.getAssignList(id);
    const pendingCount = assigns.filter((a) => a.status !== 1).length;
    if (pendingCount <= 0) {
      await doEnd();
      return;
    }

    let remindLoading = false;
    const buildConfirmContent = () => (
      <div>
        <div>当前周期还有 {pendingCount} 条评分未完成，是否仍然结束该周期？</div>
        <Button
          type="primary"
          loading={remindLoading}
          style={{ marginTop: 10 }}
          onClick={async () => {
            remindLoading = true;
            modal.update({ content: buildConfirmContent() });
            try {
              await remindApi.sendPeriodRemind(id);
              message.success('已一键催促未评分人员');
            } catch {
              message.error('一键催促失败，请稍后重试');
            } finally {
              remindLoading = false;
              modal.update({ content: buildConfirmContent() });
            }
          }}
        >
          一键催促未评分人员
        </Button>
      </div>
    );

    const modal = Modal.confirm({
      title: '仍有评分未完成',
      content: buildConfirmContent(),
      okText: '仍然结束',
      cancelText: '取消',
      onOk: doEnd,
    });
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
                {r.status !== PeriodStatus.IN_PROGRESS && (
                  <Popconfirm
                    title="确认删除该周期？"
                    description="删除后不可恢复"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={() => handleDelete(r.id)}
                  >
                    <Button type="link" danger>删除</Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Modal title={currentPeriod ? '编辑周期' : '新增周期'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
          <Form.Item name="periodName" label="周期名称" rules={[{ required: true, message: '请输入名称' }]}><Input /></Form.Item>
          <Space>
            <Form.Item name="year" label="年份" rules={[{ required: true, message: '请输入年份' }]}><Input type="number" style={{ width: 120 }} /></Form.Item>
            <Form.Item name="month" label="月份" rules={[{ required: true, message: '请输入月份' }]}><Input type="number" min={1} max={12} style={{ width: 120 }} /></Form.Item>
          </Space>
          <Space>
            <Form.Item name="startTime" label="开始时间"><DatePicker showTime /></Form.Item>
            <Form.Item
              name="endTime"
              label="结束时间"
              dependencies={['startTime']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const start = getFieldValue('startTime');
                    if (!start || !value || !dayjs(start).isAfter(dayjs(value))) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('结束时间不能早于开始时间'));
                  },
                }),
              ]}
            >
              <DatePicker showTime />
            </Form.Item>
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
