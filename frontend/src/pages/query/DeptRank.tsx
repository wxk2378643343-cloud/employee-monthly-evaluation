import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Tag, Spin, Space } from 'antd';
import { TrophyOutlined, WarningOutlined } from '@ant-design/icons';
import * as queryApi from '@/api/query';
import * as adminApi from '@/api/admin';
import type { EvalPeriod, RankInfo, Department } from '@/types';

const DeptRank: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [currentDeptId, setCurrentDeptId] = useState<number>();
  const [rankList, setRankList] = useState<RankInfo[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentPeriodId) {
      loadRankList();
    }
  }, [currentPeriodId, currentDeptId]);

  const loadInitialData = async () => {
    try {
      const [periodData, deptData] = await Promise.all([
        adminApi.getPeriodList(),
        adminApi.getDeptList(),
      ]);
      setPeriods(periodData);
      setDepts(deptData);
      const activePeriod = periodData.find((p) => p.status === 1 || p.status === 3) || periodData[0];
      if (activePeriod) {
        setCurrentPeriodId(activePeriod.id);
      }
    } catch {
      // 忽略
    }
  };

  const loadRankList = async () => {
    if (!currentPeriodId) return;
    setLoading(true);
    try {
      const data = await queryApi.getDeptRank(currentPeriodId, currentDeptId);
      setRankList(data);
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TrophyOutlined style={{ color: '#ffd700' }} />;
    if (rank === 2) return <TrophyOutlined style={{ color: '#c0c0c0' }} />;
    if (rank === 3) return <TrophyOutlined style={{ color: '#cd7f32' }} />;
    return null;
  };

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 100,
      render: (rank: number) => (
        <Space>
          {getRankIcon(rank)}
          <span style={{ fontWeight: rank <= 3 ? 'bold' : 'normal' }}>{rank}</span>
        </Space>
      ),
    },
    { title: '姓名', dataIndex: 'userName', key: 'userName' },
    { title: '小组', dataIndex: 'groupName', key: 'groupName' },
    {
      title: '综合得分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      render: (score: number) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{score?.toFixed(2)}</span>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, record: RankInfo) => (
        <>
          {record.isWarning && (
            <Tag icon={<WarningOutlined />} color="red">
              预警
            </Tag>
          )}
          {record.isBottom && !record.isWarning && <Tag color="orange">后3%</Tag>}
          {!record.isBottom && !record.isWarning && <Tag color="green">正常</Tag>}
        </>
      ),
    },
  ];

  return (
    <Card
      title="部门排名"
      extra={
        <Space>
          <span>评价周期：</span>
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
          <span>部门：</span>
          <Select
            value={currentDeptId}
            onChange={setCurrentDeptId}
            style={{ width: 150 }}
            placeholder="全部部门"
            allowClear
          >
            {depts.map((d) => (
              <Select.Option key={d.id} value={d.id}>
                {d.deptName}
              </Select.Option>
            ))}
          </Select>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          dataSource={rankList}
          columns={columns}
          rowKey="userId"
          pagination={{ pageSize: 20 }}
          rowClassName={(record) => {
            if (record.isWarning) return 'row-warning';
            if (record.isBottom) return 'row-bottom';
            return '';
          }}
        />
      </Spin>
    </Card>
  );
};

export default DeptRank;
