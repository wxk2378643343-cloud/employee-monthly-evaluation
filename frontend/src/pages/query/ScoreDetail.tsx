import React, { useEffect, useState } from 'react';
import { Card, Select, Spin, Descriptions, Tag, Empty, Table, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import * as queryApi from '@/api/query';
import * as adminApi from '@/api/admin';
import type { EvalPeriod, EvalRecord, User } from '@/types';

const ScoreDetail: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>();
  const [detail, setDetail] = useState<EvalRecord | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [periodData, userData] = await Promise.all([
        adminApi.getPeriodList(),
        adminApi.getUserList(),
      ]);
      setPeriods(periodData);
      setUsers(userData);
      const activePeriod = periodData.find((p) => p.status === 1 || p.status === 3) || periodData[0];
      if (activePeriod) {
        setCurrentPeriodId(activePeriod.id);
      }
    } catch {
      // 忽略
    }
  };

  const handleSearch = async () => {
    if (!currentPeriodId || !selectedUserId) return;
    setLoading(true);
    try {
      const data = await queryApi.getScoreDetail(selectedUserId, currentPeriodId);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const scoreItems = detail
    ? [
        { label: '互评得分', value: detail.peerScore, color: 'blue', weight: '30%' },
        { label: '小组长得分', value: detail.teamLeaderScore, color: 'cyan', weight: '20%' },
        { label: '分管领导得分', value: detail.supervisorScore, color: 'purple', weight: '20%' },
        { label: '单位领导得分', value: detail.unitLeaderScore, color: 'red', weight: '20%' },
        { label: '线性排名分', value: detail.linearRankScore, color: 'orange', weight: '10%' },
      ]
    : [];

  return (
    <Card title="评分详情">
      <div style={{ marginBottom: 24 }}>
        <span style={{ marginRight: 8 }}>评价周期：</span>
        <Select
          value={currentPeriodId}
          onChange={setCurrentPeriodId}
          style={{ width: 200, marginRight: 16 }}
          placeholder="请选择评价周期"
        >
          {periods.map((p) => (
            <Select.Option key={p.id} value={p.id}>
              {p.periodName}
            </Select.Option>
          ))}
        </Select>
        <span style={{ marginRight: 8 }}>员工：</span>
        <Select
          value={selectedUserId}
          onChange={setSelectedUserId}
          style={{ width: 200, marginRight: 16 }}
          placeholder="请选择员工"
          showSearch
          filterOption={(input, option) =>
            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {users.map((u) => (
            <Select.Option key={u.id} value={u.id}>
              {u.realName}
            </Select.Option>
          ))}
        </Select>
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          查询
        </Button>
      </div>

      <Spin spinning={loading}>
        {detail ? (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="姓名">{detail.userName}</Descriptions.Item>
              <Descriptions.Item label="部门">{detail.deptName}</Descriptions.Item>
              <Descriptions.Item label="小组">{detail.groupName}</Descriptions.Item>
              <Descriptions.Item label="部门排名">
                <Tag color="gold">第{detail.deptRank}名</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="综合得分">
                <span style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                  {detail.totalScore?.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {detail.isWarning && <Tag color="red">预警</Tag>}
                {detail.isBottom && !detail.isWarning && <Tag color="orange">后3%</Tag>}
                {!detail.isBottom && !detail.isWarning && <Tag color="green">正常</Tag>}
              </Descriptions.Item>
            </Descriptions>

            <Card title="评分明细" size="small">
              <Table
                dataSource={scoreItems}
                columns={[
                  { title: '评分项', dataIndex: 'label', key: 'label' },
                  { title: '权重', dataIndex: 'weight', key: 'weight' },
                  {
                    title: '得分',
                    dataIndex: 'value',
                    key: 'value',
                    render: (val: number, record: { color: string }) => (
                      <Tag color={record.color}>{val?.toFixed(2)}</Tag>
                    ),
                  },
                ]}
                rowKey="label"
                pagination={false}
                size="small"
              />
            </Card>
          </>
        ) : (
          <Empty description="请选择员工进行查询" />
        )}
      </Spin>
    </Card>
  );
};

export default ScoreDetail;
