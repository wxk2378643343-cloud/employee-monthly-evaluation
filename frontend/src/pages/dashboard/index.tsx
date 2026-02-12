import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Select, Spin } from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '@/store';
import { RoleType } from '@/types';
import * as queryApi from '@/api/query';
import * as adminApi from '@/api/admin';
import type { EvalPeriod, RankInfo } from '@/types';

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

  const isAdmin = user?.roleType === RoleType.ADMIN;
  const isLeader = user?.roleType && user.roleType >= RoleType.TEAM_LEADER;

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (currentPeriodId && (isAdmin || isLeader)) {
      loadData();
    }
  }, [currentPeriodId, isAdmin, isLeader]);

  const loadPeriods = async () => {
    try {
      const data = await adminApi.getPeriodList();
      setPeriods(data);
      if (data.length > 0) {
        // 默认选择进行中的周期，或最新周期
        const activePeriod = data.find((p) => p.status === 1 || p.status === 2) || data[0];
        setCurrentPeriodId(activePeriod.id);
      }
    } catch {
      // 忽略错误
    }
  };

  const loadData = async () => {
    if (!currentPeriodId) return;
    setLoading(true);
    try {
      const [stats, ranks] = await Promise.all([
        isAdmin ? queryApi.getStatistics(currentPeriodId) : Promise.resolve(undefined),
        isLeader || isAdmin ? queryApi.getDeptRank(currentPeriodId) : Promise.resolve([]),
      ]);
      if (stats) setStatistics(stats);
      setRankList(ranks.slice(0, 10)); // 只显示前10名
    } catch {
      // 忽略错误
    } finally {
      setLoading(false);
    }
  };

  const rankColumns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 80 },
    { title: '姓名', dataIndex: 'userName', key: 'userName' },
    { title: '小组', dataIndex: 'groupName', key: 'groupName' },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      render: (score: number) => score?.toFixed(2),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, record: RankInfo) => (
        <>
          {record.isWarning && <Tag color="red">预警</Tag>}
          {record.isBottom && !record.isWarning && <Tag color="orange">后3%</Tag>}
          {!record.isBottom && !record.isWarning && <Tag color="green">正常</Tag>}
        </>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>评价周期：</span>
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
        </div>

        {isAdmin && statistics && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="参评人数"
                  value={statistics.totalEmployees}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="已完成评价"
                  value={statistics.scoredCount}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="待评价"
                  value={statistics.pendingCount}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="预警人数"
                  value={statistics.warningCount}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {(isAdmin || isLeader) && (
          <Card title="排名概览（前10名）">
            <Table
              dataSource={rankList}
              columns={rankColumns}
              rowKey="userId"
              pagination={false}
            />
          </Card>
        )}

        {!isAdmin && !isLeader && (
          <Card>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <h2>欢迎使用员工月度评价系统</h2>
              <p style={{ color: '#666' }}>
                您可以在「评价管理」中查看待评价人员，在「查分中心」查看您的评价历史。
              </p>
            </div>
          </Card>
        )}
      </div>
    </Spin>
  );
};

export default Dashboard;
