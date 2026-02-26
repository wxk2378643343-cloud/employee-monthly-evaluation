import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Grid, InputNumber, Modal, Select, Space, Switch, Table } from 'antd';
import { CopyOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { message } from '@/utils/message';
import * as adminApi from '@/api/admin';
import * as remindApi from '@/api/remind';
import { AssignRow, EvalPeriod, EvalType, EvalTypeLabel, Group, User } from '@/types';

interface GroupConfigRow {
  groupId: number;
  groupName: string;
  targetEmployeeIds: number[];
  groupLeaderIds: number[];
  deptLeaderIds: number[];
  enablePeer: boolean;
}

interface GlobalWeightConfig {
  groupWeight: number;
  deptWeight: number;
  peerWeight: number;
  linearWeight: number;
}

interface AssignMatrixRow {
  key: string;
  groupName: string;
  groupLeaderScorers: string;
  deptLeaderScorers: string;
  peerEnabled: string;
  weightSummary: string;
  peerProgress: string;
  totalProgress: string;
}

const ALL_EMPLOYEE_OPTION = '__ALL__';
const DEFAULT_WEIGHTS: GlobalWeightConfig = {
  groupWeight: 30,
  deptWeight: 30,
  peerWeight: 40,
  linearWeight: 0,
};

const readTypeWeight = (assigns: AssignRow[], evalType: EvalType): number | undefined => {
  const matched = assigns.find((a) => a.evalType === evalType && typeof a.weight === 'number');
  return matched ? Number(matched.weight ?? 0) : undefined;
};

const AssignConfig: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailGroupKey, setDetailGroupKey] = useState<string>();
  const [remindLoadingKey, setRemindLoadingKey] = useState<string>();

  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [assignments, setAssignments] = useState<AssignRow[]>([]);
  const [configRows, setConfigRows] = useState<GroupConfigRow[]>([]);

  const [globalWeights, setGlobalWeights] = useState<GlobalWeightConfig>(DEFAULT_WEIGHTS);
  const [historyPeriodId, setHistoryPeriodId] = useState<number>();
  const [historyWeights, setHistoryWeights] = useState<GlobalWeightConfig>();
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [periodData, userData, groupData] = await Promise.all([
        adminApi.getPeriodList(),
        adminApi.getUserList(),
        adminApi.getGroupList(),
      ]);
      setPeriods(periodData);
      setUsers(userData);
      setGroups(groupData);
      const active = periodData.find((p) => p.status === 0 || p.status === 1) || periodData[0];
      if (active) setCurrentPeriodId(active.id);
    })();
  }, []);

  useEffect(() => {
    if (!groups.length) return;
    setConfigRows(
      groups.map((g) => ({
        groupId: g.id,
        groupName: g.groupName,
        targetEmployeeIds: [],
        groupLeaderIds: [],
        deptLeaderIds: [],
        enablePeer: true,
      }))
    );
  }, [groups]);

  const employees = useMemo(() => users.filter((u) => u.role === 'EMPLOYEE'), [users]);
  const groupLeaders = useMemo(() => users.filter((u) => u.role === 'GROUP_LEADER'), [users]);
  const deptLeaders = useMemo(() => users.filter((u) => u.role === 'DEPT_LEADER'), [users]);

  const employeesByGroup = useMemo(() => {
    const map: Record<number, User[]> = {};
    employees.forEach((u) => {
      if (!u.groupId) return;
      if (!map[u.groupId]) map[u.groupId] = [];
      map[u.groupId].push(u);
    });
    return map;
  }, [employees]);

  useEffect(() => {
    if (!Object.keys(employeesByGroup).length) return;
    setConfigRows((prev) =>
      prev.map((row) => {
        const allIds = (employeesByGroup[row.groupId] || []).map((u) => u.id);
        if (!row.targetEmployeeIds.length) return { ...row, targetEmployeeIds: allIds };
        return row;
      })
    );
  }, [employeesByGroup]);

  const reloadAssigns = async (periodId?: number) => {
    if (!periodId) return;
    setLoading(true);
    try {
      const data = await adminApi.getAssignList(periodId);
      setAssignments(data);
      if (data.length) {
        const groupWeight = readTypeWeight(data, 'GROUP_LEADER');
        const deptWeight = readTypeWeight(data, 'DEPT_LEADER');
        const peerWeight = readTypeWeight(data, 'PEER');
        setGlobalWeights((prev) => ({
          ...prev,
          ...(typeof groupWeight === 'number' ? { groupWeight } : {}),
          ...(typeof deptWeight === 'number' ? { deptWeight } : {}),
          ...(typeof peerWeight === 'number' ? { peerWeight } : {}),
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadAssigns(currentPeriodId);
    setHistoryWeights(undefined);
    setHistoryPeriodId(undefined);
  }, [currentPeriodId]);

  const updateRow = (groupId: number, patch: Partial<GroupConfigRow>) => {
    setConfigRows((prev) => prev.map((r) => (r.groupId === groupId ? { ...r, ...patch } : r)));
  };

  const updateGlobalWeight = (key: keyof GlobalWeightConfig, value: number) => {
    setGlobalWeights((prev) => ({ ...prev, [key]: value }));
  };

  const handleTargetsChange = (groupId: number, values: Array<number | string>) => {
    const allIds = (employeesByGroup[groupId] || []).map((u) => u.id);
    const selectedIds = values.filter((v): v is number => typeof v === 'number');
    if (values.includes(ALL_EMPLOYEE_OPTION) && selectedIds.length === 0) {
      updateRow(groupId, { targetEmployeeIds: allIds });
      return;
    }
    if (selectedIds.length >= allIds.length) {
      updateRow(groupId, { targetEmployeeIds: allIds });
      return;
    }
    updateRow(groupId, { targetEmployeeIds: selectedIds });
  };

  const handleCopy = async () => {
    if (!currentPeriodId) return;
    const idx = periods.findIndex((p) => p.id === currentPeriodId);
    if (idx <= 0) {
      message.warning('没有可复制的上期配置');
      return;
    }
    await adminApi.copyAssign({ sourcePeriodId: periods[idx - 1].id, targetPeriodId: currentPeriodId });
    message.success('复制成功');
    await reloadAssigns(currentPeriodId);
  };

  const handleViewHistoryCriteria = async () => {
    if (!historyPeriodId) {
      message.warning('请先选择历史周期');
      return;
    }
    setHistoryLoading(true);
    try {
      const list = await adminApi.getAssignList(historyPeriodId);
      setHistoryWeights({
        groupWeight: readTypeWeight(list, 'GROUP_LEADER') ?? DEFAULT_WEIGHTS.groupWeight,
        deptWeight: readTypeWeight(list, 'DEPT_LEADER') ?? DEFAULT_WEIGHTS.deptWeight,
        peerWeight: readTypeWeight(list, 'PEER') ?? DEFAULT_WEIGHTS.peerWeight,
        linearWeight: globalWeights.linearWeight,
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleApplyHistoryCriteria = () => {
    if (!historyWeights) {
      message.warning('请先查看历史评分准则');
      return;
    }
    setGlobalWeights((prev) => ({ ...prev, ...historyWeights, linearWeight: prev.linearWeight }));
    message.success('已应用历史评分准则到本期');
  };

  const onSaveConfig = async (): Promise<boolean> => {
    if (!currentPeriodId) {
      message.warning('请先选择考核周期');
      return false;
    }

    const totalWeight = globalWeights.groupWeight + globalWeights.deptWeight + globalWeights.peerWeight + globalWeights.linearWeight;
    if (totalWeight !== 100) {
      message.warning(`统一权重总和需为100%，当前为 ${totalWeight}%`);
      return false;
    }

    const rows: AssignRow[] = [];
    const uniq = new Set<string>();
    const peerNeedMoreEmployeesGroups: string[] = [];

    const addRow = (row: AssignRow) => {
      const key = `${row.scorerId}_${row.targetId}_${row.evalType}`;
      if (uniq.has(key)) return;
      uniq.add(key);
      rows.push(row);
    };

    configRows.forEach((cfg) => {
      const allEmployees = employeesByGroup[cfg.groupId] || [];
      const targets = cfg.targetEmployeeIds.length
        ? allEmployees.filter((u) => cfg.targetEmployeeIds.includes(u.id))
        : allEmployees;
      if (!targets.length) return;

      cfg.groupLeaderIds.forEach((scorerId) => {
        targets.forEach((target) => {
          if (scorerId === target.id) return;
          addRow({
            periodId: currentPeriodId,
            scorerId,
            targetId: target.id,
            evalType: 'GROUP_LEADER',
            weight: globalWeights.groupWeight,
          });
        });
      });

      cfg.deptLeaderIds.forEach((scorerId) => {
        targets.forEach((target) => {
          if (scorerId === target.id) return;
          addRow({
            periodId: currentPeriodId,
            scorerId,
            targetId: target.id,
            evalType: 'DEPT_LEADER',
            weight: globalWeights.deptWeight,
          });
        });
      });

      if (cfg.enablePeer) {
        if (targets.length < 2) {
          peerNeedMoreEmployeesGroups.push(cfg.groupName);
        }
        targets.forEach((scorer) => {
          targets.forEach((target) => {
            if (scorer.id === target.id) return;
            addRow({
              periodId: currentPeriodId,
              scorerId: scorer.id,
              targetId: target.id,
              evalType: 'PEER',
              weight: globalWeights.peerWeight,
            });
          });
        });
      }
    });

    if (!rows.length) {
      if (peerNeedMoreEmployeesGroups.length) {
        message.warning(`以下小组开启了员工互评，但员工人数不足2人：${peerNeedMoreEmployeesGroups.join('、')}`);
        return false;
      }
      message.warning('没有可保存的数据，请先在网格行里选择员工和评分人');
      return false;
    }

    setSaving(true);
    try {
      await adminApi.clearAssignByPeriod(currentPeriodId);
      await adminApi.saveAssign({ periodId: currentPeriodId, assignments: rows });
      message.success(`保存成功，新增/更新 ${rows.length} 条`);
      await reloadAssigns(currentPeriodId);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const configColumns = [
    { title: '网格小组', dataIndex: 'groupName', key: 'groupName', width: 120 },
    {
      title: '网格内员工',
      key: 'targets',
      width: 220,
      render: (_: unknown, row: GroupConfigRow) => (
        <Select
          mode="multiple"
          allowClear
          placeholder="为空=网格全员"
          value={
            row.targetEmployeeIds.length === (employeesByGroup[row.groupId] || []).length
              ? [ALL_EMPLOYEE_OPTION]
              : row.targetEmployeeIds
          }
          onChange={(v) => handleTargetsChange(row.groupId, v)}
          options={[
            { value: ALL_EMPLOYEE_OPTION, label: '全部员工' },
            ...(employeesByGroup[row.groupId] || []).map((u) => ({ value: u.id, label: u.realName })),
          ]}
          style={{ width: 190 }}
          maxTagCount="responsive"
        />
      ),
    },
    {
      title: '网格评分领导',
      key: 'groupLeaders',
      width: 180,
      render: (_: unknown, row: GroupConfigRow) => (
        <Select
          mode="multiple"
          allowClear
          placeholder="选择网格领导"
          value={row.groupLeaderIds}
          onChange={(v) => updateRow(row.groupId, { groupLeaderIds: v })}
          options={groupLeaders.map((u) => ({ value: u.id, label: u.realName }))}
          style={{ width: 150 }}
          maxTagCount="responsive"
        />
      ),
    },
    {
      title: '部门评分领导',
      key: 'deptLeaders',
      width: 180,
      render: (_: unknown, row: GroupConfigRow) => (
        <Select
          mode="multiple"
          allowClear
          placeholder="选择部门领导"
          value={row.deptLeaderIds}
          onChange={(v) => updateRow(row.groupId, { deptLeaderIds: v })}
          options={deptLeaders.map((u) => ({ value: u.id, label: u.realName }))}
          style={{ width: 150 }}
          maxTagCount="responsive"
        />
      ),
    },
    {
      title: '员工互评',
      key: 'enablePeer',
      width: 100,
      render: (_: unknown, row: GroupConfigRow) => (
        <Switch checked={row.enablePeer} onChange={(v) => updateRow(row.groupId, { enablePeer: v })} />
      ),
    },
  ];

  const matrixRows = useMemo<AssignMatrixRow[]>(() => {
    const userById: Record<number, User> = {};
    users.forEach((u) => {
      userById[u.id] = u;
    });
    const byGroup: Record<number, AssignRow[]> = {};
    assignments.forEach((a) => {
      const target = userById[a.targetId];
      const groupId = target?.groupId ?? -1;
      if (!byGroup[groupId]) byGroup[groupId] = [];
      byGroup[groupId].push(a);
    });

    const joinNames = (rows: AssignRow[], evalType: EvalType) => {
      const names = Array.from(
        new Set(
          rows
            .filter((r) => r.evalType === evalType)
            .map((r) => r.scorerName)
            .filter((v): v is string => Boolean(v))
        )
      );
      return names.length ? names.join(' / ') : '-';
    };

    const readWeight = (rows: AssignRow[], evalType: EvalType): number => {
      const row = rows.find((r) => r.evalType === evalType && typeof r.weight === 'number');
      return row ? Number(row.weight ?? 0) : 0;
    };

    return Object.keys(byGroup).map((groupIdStr) => {
      const groupId = Number(groupIdStr);
      const rows = byGroup[groupId];
      const groupWeight = readWeight(rows, 'GROUP_LEADER');
      const deptWeight = readWeight(rows, 'DEPT_LEADER');
      const selfWeight = readWeight(rows, 'SELF');
      const peerWeight = readWeight(rows, 'PEER');
      const adminWeight = readWeight(rows, 'ADMIN');
      const hasPeer = rows.some((r) => r.evalType === 'PEER');
      const peerRows = rows.filter((r) => r.evalType === 'PEER');
      const peerDone = peerRows.filter((r) => r.status === 1).length;
      const done = rows.filter((r) => r.status === 1).length;
      const firstTarget = rows.length ? userById[rows[0].targetId] : undefined;
      const groupName = groups.find((g) => g.id === groupId)?.groupName || firstTarget?.groupName || '-';
      return {
        key: String(groupId),
        groupName,
        groupLeaderScorers: joinNames(rows, 'GROUP_LEADER'),
        deptLeaderScorers: joinNames(rows, 'DEPT_LEADER'),
        peerEnabled: hasPeer ? '是' : '否',
        weightSummary: `组长${groupWeight}% / 部门${deptWeight}% / 自评${selfWeight}% / 互评${peerWeight}% / 管理员${adminWeight}%`,
        peerProgress: `${peerDone}/${peerRows.length}`,
        totalProgress: `${done}/${rows.length}`,
      };
    });
  }, [assignments, users, groups]);

  const matrixColumns = [
    { title: '小组', dataIndex: 'groupName', key: 'groupName', width: 140 },
    { title: '组长评分人', dataIndex: 'groupLeaderScorers', key: 'groupLeaderScorers', width: 240 },
    { title: '部门评分人', dataIndex: 'deptLeaderScorers', key: 'deptLeaderScorers', width: 240 },
    { title: '是否互评', dataIndex: 'peerEnabled', key: 'peerEnabled', width: 100 },
    { title: '权重', dataIndex: 'weightSummary', key: 'weightSummary', width: 420 },
    { title: '互评进度', dataIndex: 'peerProgress', key: 'peerProgress', width: 110 },
    { title: '总评进度', dataIndex: 'totalProgress', key: 'totalProgress', width: 110 },
    {
      title: '操作',
      key: 'action',
      width: 110,
      render: (_: unknown, row: AssignMatrixRow) => (
        <Button
          type="link"
          onClick={() => {
            setDetailGroupKey(row.key);
            setDetailOpen(true);
          }}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const detailRows = useMemo(() => {
    if (!detailGroupKey) return [];
    const groupId = Number(detailGroupKey);
    const userById: Record<number, User> = {};
    users.forEach((u) => {
      userById[u.id] = u;
    });
    return assignments
      .filter((a) => (userById[a.targetId]?.groupId ?? -1) === groupId)
      .map((a, idx) => ({
        key: `${a.id ?? 'x'}-${idx}`,
        scorerId: a.scorerId,
        scorerName: a.scorerName || `#${a.scorerId}`,
        targetName: a.targetName || `#${a.targetId}`,
        evalType: EvalTypeLabel[a.evalType] || a.evalType,
        weight: typeof a.weight === 'number' ? `${a.weight}%` : '-',
        status: a.status === 1 ? '已评分' : '待评分',
      }));
  }, [detailGroupKey, assignments, users]);

  const handleRemindUser = async (scorerId: number, rowKey: string) => {
    if (!currentPeriodId) {
      message.warning('请先选择考核周期');
      return;
    }
    setRemindLoadingKey(rowKey);
    try {
      await remindApi.sendUserRemind(currentPeriodId, scorerId);
      message.success('已发送催促消息');
    } finally {
      setRemindLoadingKey(undefined);
    }
  };

  return (
    <Card
      title="评分分配"
      extra={
        <Space wrap>
          <Select value={currentPeriodId} onChange={setCurrentPeriodId} style={{ width: isMobile ? 170 : 220 }}>
            {periods.map((p) => (
              <Select.Option key={p.id} value={p.id}>
                {p.periodName}
              </Select.Option>
            ))}
          </Select>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>复制上期</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={() => setConfigOpen(true)}>新增配置</Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="最终评分准则"
        description={
          <div>
            <div>1. 综合分 = 各评价类型均分 × 对应权重%。</div>
            <div>2. 本页配置：网格评分、部门评分、员工互评。</div>
            <div>3. 线性分在“线性分”页面维护，建议最终分 = 综合分 + 线性分。</div>
            <Button type="link" style={{ paddingLeft: 0 }} onClick={() => navigate('/admin/linear-score')}>
              去维护线性分
            </Button>
          </div>
        }
      />

      <Table
        loading={loading}
        dataSource={matrixRows}
        rowKey="key"
        size="small"
        pagination={{ size: 'small' }}
        scroll={{ x: 1400 }}
        columns={matrixColumns}
      />

      <Modal
        title="新增配置（按网格）"
        open={configOpen}
        onCancel={() => setConfigOpen(false)}
        onOk={async () => {
          const ok = await onSaveConfig();
          if (ok) setConfigOpen(false);
        }}
        confirmLoading={saving}
        width={1280}
      >
        <Card size="small" style={{ marginBottom: 12 }} title="统一权重配置（本期）">
          <Space wrap size="large">
            <Space size={6}>
              <span>网格评分</span>
              <InputWeight value={globalWeights.groupWeight} onChange={(v) => updateGlobalWeight('groupWeight', v)} />
            </Space>
            <Space size={6}>
              <span>部门评分</span>
              <InputWeight value={globalWeights.deptWeight} onChange={(v) => updateGlobalWeight('deptWeight', v)} />
            </Space>
            <Space size={6}>
              <span>员工互评</span>
              <InputWeight value={globalWeights.peerWeight} onChange={(v) => updateGlobalWeight('peerWeight', v)} />
            </Space>
            <Space size={6}>
              <span>线性评分</span>
              <InputWeight value={globalWeights.linearWeight} onChange={(v) => updateGlobalWeight('linearWeight', v)} />
            </Space>
            <span>合计：{globalWeights.groupWeight + globalWeights.deptWeight + globalWeights.peerWeight + globalWeights.linearWeight}%</span>
          </Space>

          <Space wrap style={{ marginTop: 12 }}>
            <Select
              allowClear
              placeholder="选择历史周期查看评分准则"
              value={historyPeriodId}
              onChange={setHistoryPeriodId}
              style={{ width: 240 }}
              options={periods
                .filter((p) => p.id !== currentPeriodId)
                .map((p) => ({ value: p.id, label: p.periodName }))}
            />
            <Button loading={historyLoading} onClick={handleViewHistoryCriteria}>查看历史准则</Button>
            <Button disabled={!historyWeights} onClick={handleApplyHistoryCriteria}>应用到本期</Button>
            {historyWeights && (
              <span>
                历史准则：网格{historyWeights.groupWeight}% / 部门{historyWeights.deptWeight}% / 互评{historyWeights.peerWeight}%
              </span>
            )}
          </Space>
        </Card>

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="按网格逐行配置：默认全部员工，可按需改为部分员工。"
        />
        <Table rowKey="groupId" dataSource={configRows} columns={configColumns} pagination={false} size="small" />

      </Modal>

      <Modal
        title={`评分详情 - ${matrixRows.find((r) => r.key === detailGroupKey)?.groupName || '-'}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={980}
      >
        <Table
          rowKey="key"
          dataSource={detailRows}
          size="small"
          pagination={{ size: 'small' }}
          columns={[
            { title: '评分人', dataIndex: 'scorerName', key: 'scorerName' },
            { title: '被评分人', dataIndex: 'targetName', key: 'targetName' },
            { title: '评价类型', dataIndex: 'evalType', key: 'evalType' },
            { title: '权重', dataIndex: 'weight', key: 'weight', width: 100 },
            { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
            {
              title: '操作',
              key: 'action',
              width: 100,
              render: (_: unknown, row: { key: string; scorerId: number; status: string }) =>
                row.status === '待评分' ? (
                  <Button
                    type="link"
                    loading={remindLoadingKey === row.key}
                    onClick={() => handleRemindUser(row.scorerId, row.key)}
                  >
                    催促
                  </Button>
                ) : (
                  '-'
                ),
            },
          ]}
        />
      </Modal>
    </Card>
  );
};

const InputWeight: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <InputNumber min={0} max={100} value={value} onChange={(v) => onChange(Number(v ?? 0))} addonAfter="%" style={{ width: 90 }} />
);

export default AssignConfig;
