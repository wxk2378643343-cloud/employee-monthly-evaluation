import React, { useEffect, useMemo, useState } from 'react';
import { Card, Select, Spin, Empty, Table, Space, Tag, Button, Grid } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import * as queryApi from '@/api/query';
import * as adminApi from '@/api/admin';
import { EvalHistory, EvalPeriod, EvalTypeLabel, ScoreDetailItem, User } from '@/types';

const ScoreDetail: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>();
  const [history, setHistory] = useState<EvalHistory | null>(null);
  const [details, setDetails] = useState<ScoreDetailItem[]>([]);

  useEffect(() => {
    (async () => {
      const [periodData, userData] = await Promise.all([adminApi.getPeriodList(), adminApi.getUserList()]);
      setPeriods(periodData);
      setUsers(userData);
      const active = periodData.find((p) => p.status === 1) || periodData[0];
      if (active) setCurrentPeriodId(active.id);
    })();
  }, []);

  const handleSearch = async () => {
    if (!currentPeriodId || !selectedUserId) return;
    setLoading(true);
    try {
      const [historyList, detailList] = await Promise.all([
        queryApi.getHistoryByUser(selectedUserId),
        queryApi.getScoreDetails(currentPeriodId, selectedUserId),
      ]);
      setHistory(historyList.find((item) => item.periodId === currentPeriodId) || null);
      setDetails(detailList);
    } finally {
      setLoading(false);
    }
  };

  const scoreRows = useMemo(
    () => [
      { label: '自评', value: history?.selfScore },
      { label: '同级', value: history?.peerScore },
      { label: '组长', value: history?.groupLeaderScore },
      { label: '部门负责人', value: history?.deptLeaderScore },
      { label: '管理员', value: history?.adminScore },
      { label: '综合分', value: history?.weightedScore },
      { label: '线性分', value: history?.linearRankScore },
    ],
    [history]
  );

  return (
    <Card title="评分详情">
      <Space style={{ marginBottom: 16 }} wrap>
        <Select value={currentPeriodId} onChange={setCurrentPeriodId} style={{ width: isMobile ? 180 : 220 }} placeholder="周期">
          {periods.map((p) => (
            <Select.Option key={p.id} value={p.id}>{p.periodName}</Select.Option>
          ))}
        </Select>
        <Select
          value={selectedUserId}
          onChange={setSelectedUserId}
          style={{ width: isMobile ? 180 : 220 }}
          showSearch
          optionFilterProp="children"
          placeholder="员工"
        >
          {users.map((u) => (
            <Select.Option key={u.id} value={u.id}>{u.realName}</Select.Option>
          ))}
        </Select>
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
      </Space>

      <Spin spinning={loading}>
        {selectedUserId ? (
          <>
            <Table
              size="small"
              pagination={false}
              dataSource={scoreRows}
              rowKey="label"
              columns={[
                { title: '维度', dataIndex: 'label', key: 'label' },
                { title: '分数', dataIndex: 'value', key: 'value' },
              ]}
              style={{ marginBottom: 16 }}
            />

            <Table
              dataSource={details}
              rowKey="detailId"
              columns={[
                {
                  title: '评价类型',
                  dataIndex: 'evalType',
                  key: 'evalType',
                  render: (t: keyof typeof EvalTypeLabel) => EvalTypeLabel[t] || t,
                },
                { title: '评分人', dataIndex: 'scorerName', key: 'scorerName' },
                { title: '分数', dataIndex: 'score', key: 'score', render: (s: number) => <Tag>{s}</Tag> },
                ...(!isMobile ? [{ title: '评语', dataIndex: 'comment', key: 'comment' }] : []),
                ...(!isMobile ? [{ title: '时间', dataIndex: 'createTime', key: 'createTime' }] : []),
              ]}
              pagination={{ size: 'small' }}
            />
          </>
        ) : (
          <Empty description="请选择员工并查询" />
        )}
      </Spin>
    </Card>
  );
};

export default ScoreDetail;
