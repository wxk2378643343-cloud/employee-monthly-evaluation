import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Spin, Tag, Grid } from 'antd';
import * as scoreApi from '@/api/score';
import * as adminApi from '@/api/admin';
import { EvalPeriod, PendingUser, EvalTypeLabel } from '@/types';

const SubmittedList: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [records, setRecords] = useState<PendingUser[]>([]);

  useEffect(() => {
    (async () => {
      const data = await adminApi.getPeriodList();
      setPeriods(data);
      const active = data.find((p) => p.status === 1) || data[0];
      if (active) setCurrentPeriodId(active.id);
    })();
  }, []);

  useEffect(() => {
    if (!currentPeriodId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await scoreApi.getMySubmitted(currentPeriodId);
        setRecords(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPeriodId]);

  const columns = [
    { title: '被评价人', dataIndex: 'targetName', key: 'targetName' },
    ...(!isMobile ? [{ title: '部门', dataIndex: 'deptName', key: 'deptName' }] : []),
    ...(!isMobile ? [{ title: '网格', dataIndex: 'groupName', key: 'groupName' }] : []),
    {
      title: '评价类型',
      dataIndex: 'evalType',
      key: 'evalType',
      render: (type: keyof typeof EvalTypeLabel) => <Tag>{EvalTypeLabel[type] || type}</Tag>,
    },
    { title: '状态', key: 'status', render: () => <Tag color="success">已提交</Tag> },
  ];

  return (
    <Card
      title="已提交评价"
      extra={
        <Select value={currentPeriodId} onChange={setCurrentPeriodId} style={{ width: isMobile ? 180 : 220 }}>
          {periods.map((p) => (
            <Select.Option key={p.id} value={p.id}>{p.periodName}</Select.Option>
          ))}
        </Select>
      }
    >
      <Spin spinning={loading}>
        <Table dataSource={records} columns={columns} rowKey="assignId" pagination={{ pageSize: 10, size: 'small' }} />
      </Spin>
    </Card>
  );
};

export default SubmittedList;
