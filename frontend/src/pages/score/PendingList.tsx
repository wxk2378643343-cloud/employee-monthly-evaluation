import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Button, Tag, Space, Spin, Modal, Grid } from 'antd';
import { message } from '@/utils/message';
import { EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import * as scoreApi from '@/api/score';
import * as adminApi from '@/api/admin';
import ScoreForm from './ScoreForm';
import { EvalPeriod, PendingUser, ScoreSubmit, EvalTypeLabel } from '@/types';

const PendingList: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [pendingList, setPendingList] = useState<PendingUser[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<PendingUser | null>(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (currentPeriodId) loadPendingList();
  }, [currentPeriodId]);

  const loadPeriods = async () => {
    const data = await adminApi.getPeriodList();
    setPeriods(data);
    const queryPeriodId = Number(searchParams.get('periodId') || 0);
    if (queryPeriodId && data.some((p) => p.id === queryPeriodId)) {
      setCurrentPeriodId(queryPeriodId);
      return;
    }
    const active = data.find((p) => p.status === 1) || data[0];
    if (active) setCurrentPeriodId(active.id);
  };

  const loadPendingList = async () => {
    if (!currentPeriodId) return;
    setLoading(true);
    try {
      const data = await scoreApi.getPendingList(currentPeriodId);
      setPendingList(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ScoreSubmit) => {
    await scoreApi.submitScore(data);
    message.success('提交成功');
    setModalVisible(false);
    loadPendingList();
  };

  const columns = [
    { title: '被评价人', dataIndex: 'targetName', key: 'targetName' },
    ...(!isMobile ? [{ title: '部门', dataIndex: 'deptName', key: 'deptName' }] : []),
    ...(!isMobile ? [{ title: '小组', dataIndex: 'groupName', key: 'groupName' }] : []),
    {
      title: '评价类型',
      dataIndex: 'evalType',
      key: 'evalType',
      render: (type: keyof typeof EvalTypeLabel) => EvalTypeLabel[type] || type,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) =>
        status === 1 ? (
          <Tag icon={<CheckCircleOutlined />} color="success">已评分</Tag>
        ) : (
          <Tag color="warning">待评分</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: PendingUser) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => {
            setCurrentTarget(record);
            setModalVisible(true);
          }}
          disabled={record.status === 1}
        >
          {record.status === 1 ? '已完成' : '去评分'}
        </Button>
      ),
    },
  ];

  const scoredCount = pendingList.filter((p) => p.status === 1).length;

  return (
    <Card
      title="待评分列表"
      extra={
        <Space wrap>
          <span>{scoredCount}/{pendingList.length}</span>
          <Select value={currentPeriodId} onChange={setCurrentPeriodId} style={{ width: 220 }}>
            {periods.map((p) => (
              <Select.Option key={p.id} value={p.id}>{p.periodName}</Select.Option>
            ))}
          </Select>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table dataSource={pendingList} columns={columns} rowKey="assignId" pagination={{ pageSize: 10, size: 'small' }} />
      </Spin>

      <Modal title="提交评分" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} destroyOnHidden>
        {currentTarget && currentPeriodId && (
          <ScoreForm
            targetUser={{
              id: currentTarget.targetId,
              targetName: currentTarget.targetName,
              deptName: currentTarget.deptName,
              groupName: currentTarget.groupName,
              evalType: currentTarget.evalType,
            }}
            periodId={currentPeriodId}
            onSubmit={handleSubmit}
            onCancel={() => setModalVisible(false)}
          />
        )}
      </Modal>
    </Card>
  );
};

export default PendingList;
