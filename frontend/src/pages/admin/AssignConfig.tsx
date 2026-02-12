import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Button, Space, message, Tag, Spin } from 'antd';
import { CopyOutlined, SaveOutlined } from '@ant-design/icons';
import * as adminApi from '@/api/admin';
import type { EvalPeriod, ScoreAssign, Group, User } from '@/types';
import { RoleType, RoleTypeLabel } from '@/types';

const AssignConfig: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [assignments, setAssignments] = useState<ScoreAssign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [leaders, setLeaders] = useState<User[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentPeriodId) {
      loadAssignments(currentPeriodId);
    }
  }, [currentPeriodId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [periodData, groupData, leaderData] = await Promise.all([
        adminApi.getPeriodList(),
        adminApi.getGroupList(),
        adminApi.getLeaderList(),
      ]);
      setPeriods(periodData);
      setGroups(groupData);
      setLeaders(leaderData);

      if (periodData.length > 0) {
        const activePeriod = periodData.find((p) => p.status === 0 || p.status === 1) || periodData[0];
        setCurrentPeriodId(activePeriod.id);
      }
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (periodId: number) => {
    try {
      const data = await adminApi.getAssignList(periodId);
      // 如果没有分配数据，初始化所有领导的空配置
      if (data.length === 0) {
        const initialAssignments: ScoreAssign[] = leaders
          .filter((l) => l.roleType >= RoleType.TEAM_LEADER && l.roleType <= RoleType.UNIT_LEADER)
          .map((l) => ({
            evaluatorId: l.id,
            evaluatorName: l.realName,
            evaluatorType: l.roleType,
            evaluatorTypeName: RoleTypeLabel[l.roleType],
            groupIds: [],
          }));
        setAssignments(initialAssignments);
      } else {
        // 补充领导信息
        const assignmentsWithInfo = data.map((a) => {
          const leader = leaders.find((l) => l.id === a.evaluatorId);
          return {
            ...a,
            evaluatorName: leader?.realName || '',
            evaluatorTypeName: RoleTypeLabel[a.evaluatorType],
          };
        });
        // 补充未配置的领导
        const existingIds = new Set(assignmentsWithInfo.map((a) => a.evaluatorId));
        const missingLeaders = leaders
          .filter(
            (l) =>
              l.roleType >= RoleType.TEAM_LEADER &&
              l.roleType <= RoleType.UNIT_LEADER &&
              !existingIds.has(l.id)
          )
          .map((l) => ({
            evaluatorId: l.id,
            evaluatorName: l.realName,
            evaluatorType: l.roleType,
            evaluatorTypeName: RoleTypeLabel[l.roleType],
            groupIds: [],
          }));
        setAssignments([...assignmentsWithInfo, ...missingLeaders]);
      }
    } catch {
      // 忽略
    }
  };

  const handleGroupChange = (evaluatorId: number, selectedGroupIds: number[]) => {
    setAssignments((prev) =>
      prev.map((item) =>
        item.evaluatorId === evaluatorId ? { ...item, groupIds: selectedGroupIds } : item
      )
    );
  };

  const handleCopyFromPrevious = async () => {
    if (!currentPeriodId) return;
    const currentIndex = periods.findIndex((p) => p.id === currentPeriodId);
    if (currentIndex <= 0) {
      message.warning('没有上期数据可复制');
      return;
    }
    const previousPeriodId = periods[currentIndex - 1].id;
    try {
      await adminApi.copyAssign({
        sourcePeriodId: previousPeriodId,
        targetPeriodId: currentPeriodId,
      });
      message.success('已从上期复制');
      loadAssignments(currentPeriodId);
    } catch {
      // 忽略
    }
  };

  const handleSave = async () => {
    if (!currentPeriodId) return;
    setSaving(true);
    try {
      await adminApi.saveAssign({
        periodId: currentPeriodId,
        assignments: assignments.filter((a) => a.groupIds.length > 0),
      });
      message.success('保存成功');
    } catch {
      // 忽略
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: '领导', dataIndex: 'evaluatorName', key: 'evaluatorName', width: 120 },
    {
      title: '角色',
      dataIndex: 'evaluatorType',
      key: 'evaluatorType',
      width: 100,
      render: (type: RoleType) => {
        const colorMap: Record<RoleType, string> = {
          [RoleType.EMPLOYEE]: 'default',
          [RoleType.TEAM_LEADER]: 'blue',
          [RoleType.SUPERVISOR]: 'purple',
          [RoleType.UNIT_LEADER]: 'red',
          [RoleType.ADMIN]: 'green',
        };
        return <Tag color={colorMap[type]}>{RoleTypeLabel[type]}</Tag>;
      },
    },
    {
      title: '负责打分的小组',
      key: 'groupIds',
      render: (_: unknown, record: ScoreAssign) => (
        <Select
          mode="multiple"
          value={record.groupIds}
          onChange={(vals) => handleGroupChange(record.evaluatorId, vals)}
          style={{ minWidth: 400 }}
          placeholder="请选择负责打分的小组"
        >
          {groups.map((g) => (
            <Select.Option key={g.id} value={g.id}>
              {g.groupName}
            </Select.Option>
          ))}
        </Select>
      ),
    },
  ];

  // 按角色类型分组显示
  const sortedAssignments = [...assignments].sort((a, b) => b.evaluatorType - a.evaluatorType);

  return (
    <Card
      title="打分分配配置"
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
          <Button icon={<CopyOutlined />} onClick={handleCopyFromPrevious}>
            从上期复制
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          dataSource={sortedAssignments}
          columns={columns}
          rowKey="evaluatorId"
          pagination={false}
        />
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            保存配置
          </Button>
        </div>
      </Spin>
    </Card>
  );
};

export default AssignConfig;
