import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Spin, Empty } from 'antd';
import * as queryApi from '@/api/query';
import * as adminApi from '@/api/admin';
import type { EvalPeriod, EvalHistory } from '@/types';

const MyHistory: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [history, setHistory] = useState<EvalHistory[]>([]);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [currentPeriodId]);

  const loadPeriods = async () => {
    try {
      const data = await adminApi.getPeriodList();
      setPeriods(data);
    } catch {
      // 忽略
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await queryApi.getMyHistory(currentPeriodId);
      setHistory(data);
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '评价周期', dataIndex: 'periodName', key: 'periodName' },
    {
      title: '评价人',
      dataIndex: 'evaluatorName',
      key: 'evaluatorName',
      render: (name: string) => <span style={{ color: '#666' }}>{name}</span>,
    },
    {
      title: '评语',
      dataIndex: 'comment',
      key: 'comment',
      render: (text: string) => text || <span style={{ color: '#999' }}>无评语</span>,
    },
    { title: '评价时间', dataIndex: 'createTime', key: 'createTime' },
  ];

  return (
    <Card
      title="我的互评历史"
      extra={
        <Select
          value={currentPeriodId}
          onChange={setCurrentPeriodId}
          style={{ width: 200 }}
          placeholder="全部周期"
          allowClear
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
        <div style={{ marginBottom: 16, color: '#666' }}>
          以下是同事对您的互评记录，为保护隐私，评价人姓名已脱敏处理，分数不显示。
        </div>
        {history.length > 0 ? (
          <Table
            dataSource={history}
            columns={columns}
            rowKey={(record) => `${record.periodName}-${record.createTime}`}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty description="暂无评价记录" />
        )}
      </Spin>
    </Card>
  );
};

export default MyHistory;
