import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Select, Button, Tag, Space, Spin, Modal, Form, Radio, message } from 'antd';
import * as scoreApi from '@/api/score';
import * as adminApi from '@/api/admin';
import { EvalPeriod, VoteCandidate, VoteRecord } from '@/types';

const VotePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [candidates, setCandidates] = useState<VoteCandidate[]>([]);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<VoteCandidate | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      const data = await adminApi.getPeriodList();
      setPeriods(data);
      const active = data.find((p) => p.status === 1) || data[0];
      if (active) setCurrentPeriodId(active.id);
    })();
  }, []);

  useEffect(() => {
    if (!currentPeriodId) return;
    (async () => {
      setLoading(true);
      try {
        const [rankData, myVotes] = await Promise.all([
          scoreApi.getVoteCandidates(currentPeriodId),
          scoreApi.getMyVotes(currentPeriodId),
        ]);
        setCandidates(rankData);
        setVotes(myVotes);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPeriodId]);

  const merged = useMemo(() => {
    const voteMap = new Map<number, VoteRecord>();
    votes.forEach((v) => voteMap.set(v.candidateId, v));
    return candidates.map((c) => {
      const v = voteMap.get(c.targetId);
      return { ...c, voted: !!v, voteType: v?.voteType };
    });
  }, [candidates, votes]);

  const columns = [
    { title: '排名', dataIndex: 'deptRank', key: 'deptRank' },
    { title: '姓名', dataIndex: 'targetName', key: 'targetName' },
    { title: '小组', dataIndex: 'groupName', key: 'groupName' },
    {
      title: '综合分',
      dataIndex: 'weightedScore',
      key: 'weightedScore',
      render: (score: number) => score?.toFixed?.(2) ?? '-',
    },
    {
      title: '投票状态',
      key: 'voted',
      render: (_: unknown, record: VoteCandidate) =>
        record.voted ? <Tag color="success">已投票 ({record.voteType})</Tag> : <Tag>未投票</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: VoteCandidate) => (
        <Button
          type="link"
          disabled={record.voted}
          onClick={() => {
            setCurrentCandidate(record);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          {record.voted ? '已投票' : '投票'}
        </Button>
      ),
    },
  ];

  const handleSubmit = async () => {
    if (!currentPeriodId || !currentCandidate) return;
    const values = await form.validateFields();
    await scoreApi.submitVote({
      periodId: currentPeriodId,
      targetId: currentCandidate.targetId,
      voteType: values.voteType,
    });
    message.success('投票成功');
    setModalVisible(false);
    const myVotes = await scoreApi.getMyVotes(currentPeriodId);
    setVotes(myVotes);
  };

  return (
    <Card
      title="投票"
      extra={
        <Space>
          <Select value={currentPeriodId} onChange={setCurrentPeriodId} style={{ width: 220 }}>
            {periods.map((p) => (
              <Select.Option key={p.id} value={p.id}>{p.periodName}</Select.Option>
            ))}
          </Select>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table dataSource={merged} columns={columns} rowKey="targetId" pagination={{ pageSize: 10 }} />
      </Spin>

      <Modal title="投票" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="voteType" label="投票结果" rules={[{ required: true, message: '请选择' }]}>
            <Radio.Group>
              <Radio value="EXCELLENT">优秀</Radio>
              <Radio value="POOR">较差</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default VotePage;
