import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Tag, Spin, Space } from 'antd';
import * as queryApi from '@/api/query';
import * as adminApi from '@/api/admin';
import { Department, EvalPeriod, RankInfo } from '@/types';

const DeptRank: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [currentDeptId, setCurrentDeptId] = useState<number>();
  const [rankList, setRankList] = useState<RankInfo[]>([]);

  useEffect(() => {
    (async () => {
      const [periodData, deptData] = await Promise.all([adminApi.getPeriodList(), adminApi.getDeptList()]);
      setPeriods(periodData);
      setDepts(deptData);
      const active = periodData.find((p) => p.status === 1 || p.status === 2) || periodData[0];
      if (active) setCurrentPeriodId(active.id);
    })();
  }, []);

  useEffect(() => {
    if (!currentPeriodId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await queryApi.getDeptRank(currentPeriodId, currentDeptId);
        setRankList(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPeriodId, currentDeptId]);

  return (
    <Card
      title="部门排名"
      extra={
        <Space>
          <Select value={currentPeriodId} onChange={setCurrentPeriodId} style={{ width: 220 }}>
            {periods.map((p) => (
              <Select.Option key={p.id} value={p.id}>{p.periodName}</Select.Option>
            ))}
          </Select>
          <Select value={currentDeptId} onChange={setCurrentDeptId} style={{ width: 180 }} allowClear placeholder="全部部门">
            {depts.map((d) => (
              <Select.Option key={d.id} value={d.id}>{d.deptName}</Select.Option>
            ))}
          </Select>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          dataSource={rankList}
          rowKey="targetId"
          columns={[
            { title: '排名', dataIndex: 'deptRank', key: 'deptRank' },
            { title: '姓名', dataIndex: 'targetName', key: 'targetName' },
            { title: '部门', dataIndex: 'deptName', key: 'deptName' },
            { title: '小组', dataIndex: 'groupName', key: 'groupName' },
            { title: '综合分', dataIndex: 'weightedScore', key: 'weightedScore' },
            {
              title: '状态',
              key: 'status',
              render: (_: unknown, r: RankInfo) =>
                r.isBottom3pct === 1 ? <Tag color="orange">后 3%</Tag> : <Tag color="green">正常</Tag>,
            },
          ]}
        />
      </Spin>
    </Card>
  );
};

export default DeptRank;
