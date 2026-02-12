import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Button, InputNumber, message, Space, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import * as adminApi from '@/api/admin';
import type { EvalPeriod, LinearScore as LinearScoreType, Department } from '@/types';

const LinearScore: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [currentDeptId, setCurrentDeptId] = useState<number>();
  const [scores, setScores] = useState<LinearScoreType[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentPeriodId) {
      loadScores();
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

      if (periodData.length > 0) {
        const activePeriod = periodData.find((p) => p.status === 1) || periodData[0];
        setCurrentPeriodId(activePeriod.id);
      }
    } catch {
      // 忽略
    }
  };

  const loadScores = async () => {
    if (!currentPeriodId) return;
    setLoading(true);
    try {
      const data = await adminApi.getLinearScoreList(currentPeriodId, currentDeptId);
      setScores(data);
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (userId: number, value: number | null) => {
    if (value === null) return;
    setScores((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, linearRankScore: value } : s))
    );
  };

  const handleSave = async () => {
    if (!currentPeriodId) return;

    // 验证分数范围
    const invalidScores = scores.filter(
      (s) => s.linearRankScore < 1 || s.linearRankScore > 100
    );
    if (invalidScores.length > 0) {
      message.error('线性排名分必须在1-100之间');
      return;
    }

    setSaving(true);
    try {
      await adminApi.saveLinearScores({
        periodId: currentPeriodId,
        scores: scores.map((s) => ({
          userId: s.userId,
          linearRankScore: s.linearRankScore,
        })),
      });
      message.success('保存成功，已重新计算综合得分和排名');
    } catch {
      // 忽略
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: '姓名', dataIndex: 'userName', key: 'userName', width: 120 },
    { title: '小组', dataIndex: 'groupName', key: 'groupName', width: 120 },
    {
      title: '线性排名分（1-100）',
      key: 'linearRankScore',
      render: (_: unknown, record: LinearScoreType) => (
        <InputNumber
          min={1}
          max={100}
          value={record.linearRankScore}
          onChange={(value) => handleScoreChange(record.userId, value)}
          style={{ width: 120 }}
        />
      ),
    },
  ];

  return (
    <Card
      title="线性排名分设置"
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
        <div style={{ marginBottom: 16, color: '#666' }}>
          线性排名分由管理员手动设置，设置范围1-100分，保存后系统将自动重新计算综合得分和排名。
        </div>
        <Table
          dataSource={scores}
          columns={columns}
          rowKey="userId"
          pagination={{ pageSize: 20 }}
        />
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={scores.length === 0}
          >
            保存并计算
          </Button>
        </div>
      </Spin>
    </Card>
  );
};

export default LinearScore;
