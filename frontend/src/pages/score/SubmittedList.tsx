import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Spin, Tag } from 'antd';
import * as scoreApi from '@/api/score';
import * as adminApi from '@/api/admin';
import type { EvalPeriod } from '@/types';

interface SubmittedRecord {
  targetUserId: number;
  targetUserName: string;
  workRecordScore: number;
  keyIndicatorScore: number;
  keyWorkScore: number;
  comment?: string;
  createTime: string;
}

const SubmittedList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [records, setRecords] = useState<SubmittedRecord[]>([]);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (currentPeriodId) {
      loadRecords();
    }
  }, [currentPeriodId]);

  const loadPeriods = async () => {
    try {
      const data = await adminApi.getPeriodList();
      setPeriods(data);
      const activePeriod = data.find((p) => p.status === 1) || data[0];
      if (activePeriod) {
        setCurrentPeriodId(activePeriod.id);
      }
    } catch {
      // 忽略
    }
  };

  const loadRecords = async () => {
    if (!currentPeriodId) return;
    setLoading(true);
    try {
      const data = await scoreApi.getMySubmitted(currentPeriodId);
      setRecords(data);
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '被评价人', dataIndex: 'targetUserName', key: 'targetUserName' },
    {
      title: '工作记录分',
      dataIndex: 'workRecordScore',
      key: 'workRecordScore',
      render: (score: number) => <Tag color="blue">{score}</Tag>,
    },
    {
      title: '重点指标分',
      dataIndex: 'keyIndicatorScore',
      key: 'keyIndicatorScore',
      render: (score: number) => <Tag color="purple">{score}</Tag>,
    },
    {
      title: '重点工作分',
      dataIndex: 'keyWorkScore',
      key: 'keyWorkScore',
      render: (score: number) => <Tag color="cyan">{score}</Tag>,
    },
    {
      title: '评语',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    { title: '提交时间', dataIndex: 'createTime', key: 'createTime' },
  ];

  return (
    <Card
      title="已提交评价"
      extra={
        <Select
          value={currentPeriodId}
          onChange={setCurrentPeriodId}
          style={{ width: 200 }}
          placeholder="请选择评价周期"
        >
          {periods.map((p) => (
            <Select.Option key={p.id} value={p.id}>
              {p.periodName}
            </Select.Option>
          ))}
        </Select>
      }
    >
      <Spin spinning={loading}>
        <Table
          dataSource={records}
          columns={columns}
          rowKey="targetUserId"
          pagination={{ pageSize: 10 }}
        />
      </Spin>
    </Card>
  );
};

export default SubmittedList;
