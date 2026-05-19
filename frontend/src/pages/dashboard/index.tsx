import React, { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Spin, Button, Progress, Tag, Empty, Space, Grid, List } from 'antd';
import { UserOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAppSelector } from '@/store';
import { isAdminRole, isLeaderOrAdmin, EvalPeriod, RankInfo, PendingUser, EvalTypeLabel, EvalHistory, PeriodStatus } from '@/types';
import * as queryApi from '@/api/query';
import * as adminApi from '@/api/admin';
import * as scoreApi from '@/api/score';
import * as remindApi from '@/api/remind';

const Dashboard: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const navigate = useNavigate();
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
  const [pendingList, setPendingList] = useState<PendingUser[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myHistory, setMyHistory] = useState<EvalHistory[]>([]);
  const [noticeList, setNoticeList] = useState<{ id: number; remindContent: string; createTime?: string; isRead: boolean }[]>([]);

  const isAdmin = isAdminRole(user?.role);
  const isLeader = isLeaderOrAdmin(user?.role);
  const currentPeriod = useMemo(
    () => periods.find((p) => p.id === currentPeriodId),
    [periods, currentPeriodId]
  );
  const canScoreCurrentPeriod = useMemo(() => {
    if (!currentPeriod || currentPeriod.status !== PeriodStatus.IN_PROGRESS) {
      return false;
    }
    const now = dayjs();
    if (currentPeriod.startTime && now.isBefore(dayjs(currentPeriod.startTime))) {
      return false;
    }
    if (currentPeriod.endTime && now.isAfter(dayjs(currentPeriod.endTime))) {
      return false;
    }
    return true;
  }, [currentPeriod]);
  const visiblePendingList = canScoreCurrentPeriod ? pendingList : [];

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
        const [stats, ranks, reminds] = await Promise.all([
          isAdmin ? queryApi.getStatistics(currentPeriodId) : Promise.resolve(undefined),
          queryApi.getDeptRank(currentPeriodId),
          remindApi.getMyReminds(currentPeriodId),
        ]);
        if (stats) setStatistics(stats);
        setRankList(ranks.slice(0, 10));
        setNoticeList(
          reminds
            .filter((item) => item.remindType === 'NOTICE')
            .slice(0, 5)
            .map((item) => ({
              id: item.id,
              remindContent: item.remindContent,
              createTime: item.createTime,
              isRead: item.isRead,
            }))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPeriodId, isLeader, isAdmin]);

  useEffect(() => {
    if (!currentPeriodId || isLeader) return;
    (async () => {
      setLoading(true);
      try {
        const [pending, unread, history, reminds] = await Promise.all([
          scoreApi.getPendingList(currentPeriodId),
          remindApi.getUnreadCount(),
          queryApi.getMyHistory(currentPeriodId),
          remindApi.getMyReminds(currentPeriodId),
        ]);
        setPendingList(pending);
        setUnreadCount(unread);
        setMyHistory(history.slice(0, 5));
        setNoticeList(
          reminds
            .filter((item) => item.remindType === 'NOTICE')
            .slice(0, 5)
            .map((item) => ({
              id: item.id,
              remindContent: item.remindContent,
              createTime: item.createTime,
              isRead: item.isRead,
            }))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPeriodId, isLeader]);

  const pendingCount = useMemo(() => visiblePendingList.filter((item) => item.status !== 1).length, [visiblePendingList]);
  const submittedCount = useMemo(() => visiblePendingList.filter((item) => item.status === 1).length, [visiblePendingList]);
  const progressPercent = useMemo(() => {
    if (!visiblePendingList.length) return 0;
    return Math.round((submittedCount / visiblePendingList.length) * 100);
  }, [visiblePendingList.length, submittedCount]);

  return (
    <Spin spinning={loading}>
      <div className="dashboard-page">
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span>评价周期:</span>
          <Select value={currentPeriodId} onChange={setCurrentPeriodId} style={{ width: isMobile ? 180 : 220 }}>
            {periods.map((p) => (
              <Select.Option key={p.id} value={p.id}>{p.periodName}</Select.Option>
            ))}
          </Select>
        </div>

        {isAdmin && statistics && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}><Card><Statistic title="参评人数" value={statistics.totalEmployees} prefix={<UserOutlined />} /></Card></Col>
            <Col xs={24} sm={12} lg={6}><Card><Statistic title="已完成" value={statistics.scoredCount} prefix={<CheckCircleOutlined />} /></Card></Col>
            <Col xs={24} sm={12} lg={6}><Card><Statistic title="待完成" value={statistics.pendingCount} prefix={<ClockCircleOutlined />} /></Card></Col>
            <Col xs={24} sm={12} lg={6}><Card><Statistic title="预警人数" value={statistics.warningCount} prefix={<WarningOutlined />} /></Card></Col>
          </Row>
        )}

        {isLeader && (
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Card title="排名概览（前 10）">
                <Table
                  dataSource={rankList}
                  rowKey="targetId"
                  pagination={false}
                  columns={[
                    { title: '排名', dataIndex: 'deptRank', key: 'deptRank', width: 80 },
                    { title: '姓名', dataIndex: 'targetName', key: 'targetName' },
                    ...(!isMobile ? [{ title: '网格', dataIndex: 'groupName', key: 'groupName' }] : []),
                    { title: '综合分', dataIndex: 'weightedScore', key: 'weightedScore' },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="消息通知">
                {noticeList.length ? (
                  <List
                    dataSource={noticeList}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Button key="view-all" type="link" onClick={() => navigate('/remind/list')}>
                            查看全部
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space size={8}>
                              <Tag color="gold">公告</Tag>
                              {!item.isRead && <Tag color="green">未读</Tag>}
                            </Space>
                          }
                          description={
                            <div>
                              <div>{item.remindContent}</div>
                              <div className="text-muted-sm" style={{ marginTop: 6 }}>{item.createTime || '-'}</div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无消息通知" />
                )}
              </Card>
            </Col>
          </Row>
        )}

        {!isLeader && (
          <>
            <Card title="公告通知" style={{ marginBottom: 16 }}>
              {noticeList.length ? (
                <List
                  dataSource={noticeList}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button key="view-all" type="link" onClick={() => navigate('/remind/list')}>
                          查看全部
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space size={8}>
                            <Tag color="gold">公告</Tag>
                            {!item.isRead && <Tag color="green">未读</Tag>}
                          </Space>
                        }
                        description={
                          <div>
                            <div>{item.remindContent}</div>
                            <div className="text-muted-sm" style={{ marginTop: 6 }}>{item.createTime || '-'}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无公告通知" />
              )}
            </Card>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={24} md={12} lg={8}>
                <Card>
                  <Statistic title="待完成评价" value={pendingCount} prefix={<ClockCircleOutlined />} />
                </Card>
              </Col>
              <Col xs={24} md={12} lg={8}>
                <Card>
                  <Statistic title="已完成评价" value={submittedCount} prefix={<CheckCircleOutlined />} />
                </Card>
              </Col>
              <Col xs={24} md={24} lg={8}>
                <Card>
                  <Statistic title="未读消息" value={unreadCount} prefix={<BellOutlined />} />
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={24} lg={12}>
                <Card title="本周期进度" className="employee-progress-card">
                  {canScoreCurrentPeriod ? (
                    <>
                      <Progress percent={progressPercent} status={progressPercent === 100 ? 'success' : 'active'} />
                      <div className="text-muted-sm" style={{ marginTop: 8 }}>
                        本周期共 {visiblePendingList.length} 条评价任务，已完成 {submittedCount} 条
                      </div>
                      <Space style={{ marginTop: 14 }} wrap>
                        <Button type="primary" onClick={() => navigate('/score/pending')}>去评分</Button>
                        <Button onClick={() => navigate('/score/submitted')}>查看已提交</Button>
                      </Space>
                    </>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前周期暂无评分任务" />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="最近评价结果">
                  {myHistory.length ? (
                    <div className="employee-history-list">
                      {myHistory.map((item) => (
                        <div key={item.recordId} className="employee-history-item">
                          <div>{item.periodName || `周期 ${item.periodId}`}</div>
                          <Tag color="red">{item.weightedScore ?? '-'} 分</Tag>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无评分记录" />
                  )}
                </Card>
              </Col>
            </Row>

            <Card title="我的待办">
              <Table
                dataSource={visiblePendingList}
                rowKey="assignId"
                pagination={{ pageSize: 5 }}
                locale={{ emptyText: '当前周期暂无评价任务' }}
                columns={[
                  { title: '被评价人', dataIndex: 'targetName', key: 'targetName' },
                  ...(!isMobile
                    ? [{ title: '评价类型', dataIndex: 'evalType', key: 'evalType', render: (t: keyof typeof EvalTypeLabel) => EvalTypeLabel[t] || t }]
                    : []),
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: number) => (status === 1 ? <Tag color="success">已完成</Tag> : <Tag color="processing">待处理</Tag>),
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_: unknown, row: PendingUser) => (
                      <Button type="link" onClick={() => navigate('/score/pending')}>
                        {row.status === 1 ? '查看' : '去处理'}
                      </Button>
                    ),
                  },
                ]}
                size="small"
              />
            </Card>
          </>
        )}
      </div>
    </Spin>
  );
};

export default Dashboard;
