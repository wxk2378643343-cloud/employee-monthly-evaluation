import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Button, InputNumber, message, Space, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import * as adminApi from '@/api/admin';
import { Department, EvalPeriod, LinearScore as LinearScoreType } from '@/types';

const LinearScore: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [currentDeptId, setCurrentDeptId] = useState<number>();
  const [scores, setScores] = useState<LinearScoreType[]>([]);

  useEffect(() => {
    (async () => {
      const [periodData, deptData] = await Promise.all([adminApi.getPeriodList(), adminApi.getDeptList()]);
      setPeriods(periodData);
      setDepts(deptData);
      const active = periodData.find((p) => p.status === 1) || periodData[0];
      if (active) setCurrentPeriodId(active.id);
    })();
  }, []);

  useEffect(() => {
    if (!currentPeriodId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await adminApi.getLinearScoreList(currentPeriodId, currentDeptId);
        setScores(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPeriodId, currentDeptId]);

  const handleSave = async () => {
    if (!currentPeriodId) return;
    setSaving(true);
    try {
      await adminApi.saveLinearScores({
        periodId: currentPeriodId,
        scores: scores.map((s) => ({ targetId: s.targetId, linearRankScore: s.linearRankScore ?? 0 })),
      });
      message.success('保存成功');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="线性分设置"
      extra={
        <Space>
          <Select value={currentPeriodId} onChange={setCurrentPeriodId} style={{ width: 220 }}>
            {periods.map((p) => <Select.Option key={p.id} value={p.id}>{p.periodName}</Select.Option>)}
          </Select>
          <Select value={currentDeptId} onChange={setCurrentDeptId} style={{ width: 180 }} allowClear placeholder="全部部门">
            {depts.map((d) => <Select.Option key={d.id} value={d.id}>{d.deptName}</Select.Option>)}
          </Select>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          rowKey="recordId"
          dataSource={scores}
          pagination={{ pageSize: 20 }}
          columns={[
            { title: '姓名', dataIndex: 'targetName', key: 'targetName' },
            { title: '部门', dataIndex: 'deptName', key: 'deptName' },
            { title: '综合分', dataIndex: 'weightedScore', key: 'weightedScore' },
            {
              title: '线性分',
              key: 'linearRankScore',
              render: (_: unknown, record: LinearScoreType) => (
                <InputNumber
                  min={0}
                  max={100}
                  value={record.linearRankScore}
                  onChange={(value) => setScores((prev) => prev.map((p) => p.recordId === record.recordId ? { ...p, linearRankScore: value ?? 0 } : p))}
                />
              ),
            },
          ]}
        />
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存</Button>
        </div>
      </Spin>
    </Card>
  );
};

export default LinearScore;
