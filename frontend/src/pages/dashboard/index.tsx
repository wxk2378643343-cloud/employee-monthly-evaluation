import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Spin } from 'antd';
import { UserOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store';
import { isAdminRole, isLeaderOrAdmin, EvalPeriod, RankInfo } from '@/types';
import * as queryApi from '@/api/query';
import * as adminApi from '@/api/admin';

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [statistics, setStatistics] = useState<{
    totalEmployees: number;
    scoredCount: number;
    pendingCount: number;
    bottomCount: number;
    warningCount: number;
  }>();
  const [rankList, setRankList] = useState<RankInfo[]>([]);

  const isAdmin = isAdminRole(user?.role);
  const isLeader = isLeaderOrAdmin(user?.role);

  useEffect(() => {
    (async () => {
      const data = await adminApi.getPeriodList();
      setPeriods(data);
      const active = data.find((p) => p.status === 1) || data[0];
      if (active) setCurrentPeriodId(active.id);
    })();
  }, []);

  useEffect(() => {
    if (!currentPeriodId || !isLeader) return;
    (async () => {
      setLoading(true);
      try {
        const [stats, ranks] = await Promise.all([
          isAdmin ? queryApi.getStatistics(currentPeriodId) : Promise.resolve(undefined),
          queryApi.getDeptRank(currentPeriodId),
        ]);
        if (stats) setStatistics(stats);
        setRankList(ranks.slice(0, 10));
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPeriodId, isLeader, isAdmin]);

  return (
    <Spin spinning={loading}>
      <div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>评价周期:</span>
          <Select value={currentPeriodId} onChange={setCurrentPeriodId} style={{ width: 220 }}>
            {periods.map((p) => (
              <Select.Option key={p.id} value={p.id}>{p.periodName}</Select.Option>
            ))}
          </Select>
        </div>

        {isAdmin && statistics && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}><Card><Statistic title="参评人数" value={statistics.totalEmployees} prefix={<UserOutlined />} /></Card></Col>
            <Col span={6}><Card><Statistic title="已完成" value={statistics.scoredCount} prefix={<CheckCircleOutlined />} /></Card></Col>
            <Col span={6}><Card><Statistic title="待完成" value={statistics.pendingCount} prefix={<ClockCircleOutlined />} /></Card></Col>
            <Col span={6}><Card><Statistic title="预警人数" value={statistics.warningCount} prefix={<WarningOutlined />} /></Card></Col>
          </Row>
        )}

        {isLeader && (
          <Card title="排名概览（前 10）">
            <Table
              dataSource={rankList}
              rowKey="targetId"
              pagination={false}
              columns={[
                { title: '排名', dataIndex: 'deptRank', key: 'deptRank', width: 80 },
                { title: '姓名', dataIndex: 'targetName', key: 'targetName' },
                { title: '小组', dataIndex: 'groupName', key: 'groupName' },
                { title: '综合分', dataIndex: 'weightedScore', key: 'weightedScore' },
              ]}
            />
          </Card>
        )}
      </div>
    </Spin>
  );
};

export default Dashboard;
