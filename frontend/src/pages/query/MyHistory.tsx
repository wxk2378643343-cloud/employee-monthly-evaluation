import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Spin } from 'antd';
import * as queryApi from '@/api/query';
import * as adminApi from '@/api/admin';
import { EvalHistory, EvalPeriod } from '@/types';

const MyHistory: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [history, setHistory] = useState<EvalHistory[]>([]);

  useEffect(() => {
    (async () => {
      const data = await adminApi.getPeriodList();
      setPeriods(data);
      if (data.length > 0) setCurrentPeriodId(data[0].id);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await queryApi.getMyHistory(currentPeriodId);
        setHistory(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPeriodId]);

  const columns = [
    { title: '周期', dataIndex: 'periodName', key: 'periodName' },
    { title: '自评', dataIndex: 'selfScore', key: 'selfScore' },
    { title: '同级', dataIndex: 'peerScore', key: 'peerScore' },
    { title: '组长', dataIndex: 'groupLeaderScore', key: 'groupLeaderScore' },
    { title: '部门负责人', dataIndex: 'deptLeaderScore', key: 'deptLeaderScore' },
    { title: '管理员', dataIndex: 'adminScore', key: 'adminScore' },
    { title: '综合分', dataIndex: 'weightedScore', key: 'weightedScore' },
    { title: '线性分', dataIndex: 'linearRankScore', key: 'linearRankScore' },
    { title: '部门排名', dataIndex: 'deptRank', key: 'deptRank' },
  ];

  return (
    <Card
      title="我的历史"
      extra={
        <Select value={currentPeriodId} onChange={setCurrentPeriodId} style={{ width: 220 }} allowClear>
          {periods.map((p) => (
            <Select.Option key={p.id} value={p.id}>{p.periodName}</Select.Option>
          ))}
        </Select>
      }
    >
      <Spin spinning={loading}>
        <Table dataSource={history} columns={columns} rowKey="recordId" pagination={{ pageSize: 10 }} />
      </Spin>
    </Card>
  );
};

export default MyHistory;
