import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Select, Spin, Empty, Table, Space, Button, Grid, Modal, Tag, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import * as queryApi from '@/api/query';
import * as adminApi from '@/api/admin';
import * as authApi from '@/api/auth';
import { useAppSelector } from '@/store';
import { EvalPeriod, EvalTypeLabel, ScoreDetailItem, User } from '@/types';

interface ScoreSummaryRow {
  key: string;
  userId: number;
  employeeName: string;
  periodId: number;
  periodName: string;
  peerScore?: number;
  groupLeaderScore?: number;
  deptLeaderScore?: number;
  linearRankScore?: number;
  weightedScore?: number;
  hasRecord: boolean;
}

interface DisplayRow extends ScoreSummaryRow {
  rankNo: number;
}

const avgByType = (details: ScoreDetailItem[], evalType: string): number | undefined => {
  const list = details.filter((d) => d.evalType === evalType && d.score !== null && d.score !== undefined);
  if (!list.length) return undefined;
  const sum = list.reduce((acc, cur) => acc + Number(cur.score || 0), 0);
  return Math.round((sum / list.length) * 100) / 100;
};

const ScoreDetail: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [periodId, setPeriodId] = useState<number>();
  const [scopeUsers, setScopeUsers] = useState<User[]>([]);
  const [summaryRows, setSummaryRows] = useState<ScoreSummaryRow[]>([]);

  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchAtRef = useRef(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRows, setDetailRows] = useState<ScoreDetailItem[]>([]);
  const [detailTitle, setDetailTitle] = useState<string>('');

  useEffect(() => {
    if (!currentUser?.id) return;
    (async () => {
      setLoading(true);
      try {
        const periodData = await adminApi.getPeriodList();
        setPeriods(periodData);
        if (periodData.length) {
          const latest = [...periodData].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            if (a.month !== b.month) return b.month - a.month;
            return b.id - a.id;
          })[0];
          setPeriodId(latest.id);
        }

        if (currentUser.role === 'GROUP_LEADER') {
          let groupId = currentUser.groupId;
          if (!groupId) {
            const info = await authApi.getUserInfo();
            groupId = info?.groupId;
          }
          if (groupId) {
            const users = await adminApi.getGroupUsers(groupId);
            setScopeUsers(users.filter((u) => u.role === 'EMPLOYEE' && u.id !== currentUser.id));
            return;
          }
          setScopeUsers([]);
          return;
        }

        if (currentUser.role === 'DEPT_LEADER') {
          let deptId = currentUser.deptId;
          if (!deptId) {
            const info = await authApi.getUserInfo();
            deptId = info?.deptId;
          }
          if (deptId) {
            const users = await adminApi.getDeptUsers(deptId);
            setScopeUsers(users.filter((u) => u.role === 'EMPLOYEE' && u.id !== currentUser.id));
            return;
          }
          setScopeUsers([]);
          return;
        }

        if (currentUser.role === 'ADMIN') {
          const users = await adminApi.getUserList();
          setScopeUsers(users.filter((u) => u.role === 'EMPLOYEE' && u.id !== currentUser.id));
          return;
        }

        setScopeUsers([
          {
            id: currentUser.id,
            username: currentUser.username || '',
            realName: currentUser.realName || '我',
            role: currentUser.role,
            deptId: currentUser.deptId,
            groupId: currentUser.groupId,
          },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.id, currentUser?.role, currentUser?.groupId, currentUser?.deptId]);

  useEffect(() => {
    if (!periodId || !scopeUsers.length) {
      setSummaryRows([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const [historyList, detailsList] = await Promise.all([
          Promise.all(scopeUsers.map((u) => queryApi.getHistoryByUser(u.id))),
          Promise.all(scopeUsers.map((u) => queryApi.getScoreDetails(periodId, u.id))),
        ]);
        const periodName = periods.find((p) => p.id === periodId)?.periodName || String(periodId);
        const rows: ScoreSummaryRow[] = scopeUsers.map((u, idx) => {
          const rec = historyList[idx].find((h) => h.periodId === periodId);
          const details = detailsList[idx] || [];
          return {
            key: `${u.id}-${periodId}`,
            userId: u.id,
            employeeName: u.realName,
            periodId,
            periodName,
            peerScore: avgByType(details, 'PEER'),
            groupLeaderScore: avgByType(details, 'GROUP_LEADER'),
            deptLeaderScore: avgByType(details, 'DEPT_LEADER'),
            linearRankScore: rec?.linearRankScore,
            weightedScore: rec?.weightedScore,
            hasRecord: Boolean(rec) || details.length > 0,
          };
        });
        setSummaryRows(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, [periodId, scopeUsers, periods]);

  const displayRows = useMemo<DisplayRow[]>(() => {
    const q = keyword.trim().toLowerCase();
    const filtered = q
      ? summaryRows.filter((r) => (r.employeeName || '').toLowerCase().includes(q))
      : summaryRows;

    const sorted = [...filtered].sort((a, b) => {
      const av = a.weightedScore;
      const bv = b.weightedScore;
      if (av === null || av === undefined) return bv === null || bv === undefined ? 0 : 1;
      if (bv === null || bv === undefined) return -1;
      return sortOrder === 'asc' ? av - bv : bv - av;
    });

    return sorted.map((row, idx) => ({ ...row, rankNo: idx + 1 }));
  }, [summaryRows, keyword, sortOrder]);

  const renderScore = (value?: number) => (value === null || value === undefined ? '暂未评价' : value);

  const handleSearchKeyword = () => {
    const now = Date.now();
    // Throttle: ignore if triggered too frequently.
    if (now - lastSearchAtRef.current < 500) {
      return;
    }
    lastSearchAtRef.current = now;
    // Debounce: only apply the last trigger.
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setKeyword(keywordInput.trim());
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const handleViewDetail = async (row: ScoreSummaryRow) => {
    if (!row.hasRecord) return;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailTitle(`${row.employeeName} - ${row.periodName}`);
    try {
      const list = await queryApi.getScoreDetails(row.periodId, row.userId);
      setDetailRows(list);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <Card title="员工分数">
      <Space style={{ marginBottom: 16 }} wrap>
        <Select value={periodId} onChange={setPeriodId} style={{ width: isMobile ? 180 : 220 }} placeholder="周期">
          {periods.map((p) => (
            <Select.Option key={p.id} value={p.id}>{p.periodName}</Select.Option>
          ))}
        </Select>
        <Space.Compact>
          <Input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onPressEnter={handleSearchKeyword}
            placeholder="搜索员工姓名"
            style={{ width: isMobile ? 180 : 220 }}
            allowClear
          />
          <Button icon={<SearchOutlined />} onClick={handleSearchKeyword}>搜索</Button>
        </Space.Compact>
        <Button type={sortOrder === 'asc' ? 'primary' : 'default'} onClick={() => setSortOrder('asc')}>
          分数正序
        </Button>
        <Button type={sortOrder === 'desc' ? 'primary' : 'default'} onClick={() => setSortOrder('desc')}>
          分数倒序
        </Button>
      </Space>

      <Spin spinning={loading}>
        {scopeUsers.length ? (
          <Table
            dataSource={displayRows}
            rowKey="key"
            pagination={{ size: 'small' }}
            columns={[
              { title: '排名', dataIndex: 'rankNo', key: 'rankNo', width: 80 },
              { title: '员工', dataIndex: 'employeeName', key: 'employeeName', width: 140 },
              { title: '周期', dataIndex: 'periodName', key: 'periodName', width: 160 },
              { title: '互评', dataIndex: 'peerScore', key: 'peerScore', width: 100, render: renderScore },
              { title: '组长', dataIndex: 'groupLeaderScore', key: 'groupLeaderScore', width: 100, render: renderScore },
              { title: '部门负责人', dataIndex: 'deptLeaderScore', key: 'deptLeaderScore', width: 120, render: renderScore },
              { title: '线性分', dataIndex: 'linearRankScore', key: 'linearRankScore', width: 100, render: renderScore },
              { title: '综合分', dataIndex: 'weightedScore', key: 'weightedScore', width: 100, render: renderScore },
              {
                title: '操作',
                key: 'action',
                width: 110,
                render: (_: unknown, row: ScoreSummaryRow) => (
                  <Button type="link" disabled={!row.hasRecord} onClick={() => handleViewDetail(row)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
          />
        ) : (
          <Empty description="暂无可查看员工" />
        )}
      </Spin>

      <Modal
        title={`评分明细 - ${detailTitle}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={900}
      >
        <Spin spinning={detailLoading}>
          <Table
            dataSource={detailRows}
            rowKey="detailId"
            pagination={{ size: 'small' }}
            columns={[
              {
                title: '评价类型',
                dataIndex: 'evalType',
                key: 'evalType',
                render: (t: keyof typeof EvalTypeLabel) => EvalTypeLabel[t] || t,
              },
              { title: '评分人', dataIndex: 'scorerName', key: 'scorerName' },
              { title: '分数', dataIndex: 'score', key: 'score', render: (s: number) => <Tag>{s}</Tag> },
              ...(!isMobile ? [{ title: '时间', dataIndex: 'createTime', key: 'createTime' }] : []),
            ]}
          />
        </Spin>
      </Modal>
    </Card>
  );
};

export default ScoreDetail;
