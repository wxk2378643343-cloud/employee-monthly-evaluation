import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Button, Tag, Space, Spin, Modal, message } from 'antd';
import { EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import * as scoreApi from '@/api/score';
import * as adminApi from '@/api/admin';
import ScoreForm from './ScoreForm';
import type { EvalPeriod, PendingUser, ScoreSubmit } from '@/types';

const PendingList: React.FC = () => {
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
    if (currentPeriodId) {
      loadPendingList();
    }
  }, [currentPeriodId]);

  const loadPeriods = async () => {
    try {
      const data = await adminApi.getPeriodList();
      setPeriods(data);
      const activePeriod = data.find((p) => p.status === 1) || data[0];
      if (activePeriod) {
        setCurrentPeriodId(activePeriod.id);
      }
    } catch {
      // 忽略
    }
  };

  const loadPendingList = async () => {
    if (!currentPeriodId) return;
    setLoading(true);
    try {
      const data = await scoreApi.getPendingList(currentPeriodId);
      setPendingList(data);
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  };

  const handleScore = (record: PendingUser) => {
    setCurrentTarget(record);
    setModalVisible(true);
  };

  const handleSubmit = async (data: ScoreSubmit) => {
    try {
      await scoreApi.submitScore(data);
      message.success('评分提交成功');
      setModalVisible(false);
      loadPendingList();
    } catch {
      // 忽略
    }
  };

  const columns = [
    { title: '姓名', dataIndex: 'realName', key: 'realName' },
    { title: '部门', dataIndex: 'deptName', key: 'deptName' },
    { title: '小组', dataIndex: 'groupName', key: 'groupName' },
    {
      title: '评价类型',
      dataIndex: 'evalType',
      key: 'evalType',
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          互评: 'blue',
          小组长: 'cyan',
          分管领导: 'purple',
          单位领导: 'red',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'scored',
      key: 'scored',
      render: (scored: boolean) =>
        scored ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            已评价
          </Tag>
        ) : (
          <Tag color="warning">待评价</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: PendingUser) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleScore(record)}
          disabled={record.scored}
        >
          {record.scored ? '已评价' : '去评价'}
        </Button>
      ),
    },
  ];

  const scoredCount = pendingList.filter((p) => p.scored).length;
  const totalCount = pendingList.length;

  return (
    <Card
      title="待评价列表"
      extra={
        <Space>
          <span>
            进度：{scoredCount}/{totalCount}
          </span>
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
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          dataSource={pendingList}
          columns={columns}
          rowKey="userId"
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      <Modal
        title="提交评价"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        {currentTarget && currentPeriodId && (
          <ScoreForm
            targetUser={{
              id: currentTarget.userId,
              realName: currentTarget.realName,
              deptName: currentTarget.deptName,
              groupName: currentTarget.groupName,
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
