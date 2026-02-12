import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Button, Space, message, Modal, Form, InputNumber } from 'antd';
import { CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import * as adminApi from '@/api/admin';
import { AssignRow, EvalPeriod, EvalType, EvalTypeLabel, User } from '@/types';

const evalTypeOptions: EvalType[] = ['SELF', 'PEER', 'GROUP_LEADER', 'DEPT_LEADER', 'ADMIN'];

const AssignConfig: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [assignments, setAssignments] = useState<AssignRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      const [periodData, userData] = await Promise.all([adminApi.getPeriodList(), adminApi.getUserList()]);
      setPeriods(periodData);
      setUsers(userData);
      const active = periodData.find((p) => p.status === 0 || p.status === 1) || periodData[0];
      if (active) setCurrentPeriodId(active.id);
    })();
  }, []);

  useEffect(() => {
    if (!currentPeriodId) return;
    (async () => {
      setLoading(true);
      try {
        setAssignments(await adminApi.getAssignList(currentPeriodId));
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPeriodId]);

  const handleAdd = async () => {
    if (!currentPeriodId) return;
    const values = await form.validateFields();
    await adminApi.saveAssign({
      periodId: currentPeriodId,
      assignments: [values],
    });
    message.success('已新增');
    setModalOpen(false);
    form.resetFields();
    setAssignments(await adminApi.getAssignList(currentPeriodId));
  };

  const handleCopy = async () => {
    if (!currentPeriodId) return;
    const idx = periods.findIndex((p) => p.id === currentPeriodId);
    if (idx <= 0) {
      message.warning('没有可复制的上期');
      return;
    }
    await adminApi.copyAssign({ sourcePeriodId: periods[idx - 1].id, targetPeriodId: currentPeriodId });
    message.success('复制成功');
    setAssignments(await adminApi.getAssignList(currentPeriodId));
  };

  const handleDelete = async (id?: number) => {
    if (!id || !currentPeriodId) return;
    await adminApi.deleteAssign(id);
    message.success('删除成功');
    setAssignments(await adminApi.getAssignList(currentPeriodId));
  };

  return (
    <Card
      title="评分分配"
      extra={
        <Space>
          <Select value={currentPeriodId} onChange={setCurrentPeriodId} style={{ width: 220 }}>
            {periods.map((p) => <Select.Option key={p.id} value={p.id}>{p.periodName}</Select.Option>)}
          </Select>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>复制上期</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新增</Button>
        </Space>
      }
    >
      <Table
        loading={loading}
        dataSource={assignments}
        rowKey="id"
        columns={[
          { title: '评分人', dataIndex: 'scorerName', key: 'scorerName' },
          { title: '被评人', dataIndex: 'targetName', key: 'targetName' },
          { title: '评价类型', dataIndex: 'evalType', key: 'evalType', render: (t: EvalType) => EvalTypeLabel[t] || t },
          { title: '权重', dataIndex: 'weight', key: 'weight' },
          { title: '状态', dataIndex: 'status', key: 'status', render: (s: number) => (s === 1 ? '已评分' : '待评分') },
          {
            title: '操作',
            key: 'action',
            render: (_: unknown, r: AssignRow) => (
              <Button type="link" icon={<DeleteOutlined />} danger onClick={() => handleDelete(r.id)}>删除</Button>
            ),
          },
        ]}
      />

      <Modal title="新增分配" open={modalOpen} onOk={handleAdd} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="scorerId" label="评分人" rules={[{ required: true, message: '请选择评分人' }]}>
            <Select>{users.map((u) => <Select.Option key={u.id} value={u.id}>{u.realName}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="targetId" label="被评人" rules={[{ required: true, message: '请选择被评人' }]}>
            <Select>{users.map((u) => <Select.Option key={u.id} value={u.id}>{u.realName}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="evalType" label="评价类型" rules={[{ required: true, message: '请选择评价类型' }]}>
            <Select>{evalTypeOptions.map((t) => <Select.Option key={t} value={t}>{EvalTypeLabel[t]}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="weight" label="权重" initialValue={0}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AssignConfig;
