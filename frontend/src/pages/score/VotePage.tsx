import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Button, Tag, Space, Spin, Modal, Form, Radio, Input, message } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import * as scoreApi from '@/api/score';
import * as adminApi from '@/api/admin';
import type { EvalPeriod, VoteCandidate } from '@/types';

const VotePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [candidates, setCandidates] = useState<VoteCandidate[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<VoteCandidate | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (currentPeriodId) {
      loadCandidates();
    }
  }, [currentPeriodId]);

  const loadPeriods = async () => {
    try {
      const data = await adminApi.getPeriodList();
      setPeriods(data);
      // 默认选择第二轮进行中的周期
      const activePeriod = data.find((p) => p.status === 2) || data[0];
      if (activePeriod) {
        setCurrentPeriodId(activePeriod.id);
      }
    } catch {
      // 忽略
    }
  };

  const loadCandidates = async () => {
    if (!currentPeriodId) return;
    setLoading(true);
    try {
      const data = await scoreApi.getVoteCandidates(currentPeriodId);
      setCandidates(data);
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (record: VoteCandidate) => {
    setCurrentCandidate(record);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!currentPeriodId || !currentCandidate) return;
    try {
      const values = await form.validateFields();
      await scoreApi.submitVote({
        periodId: currentPeriodId,
        targetUserId: currentCandidate.userId,
        voteResult: values.voteResult,
        voteReason: values.voteReason,
      });
      message.success('投票成功');
      setModalVisible(false);
      loadCandidates();
    } catch {
      // 忽略
    }
  };

  const columns = [
    {
      title: '排名',
      dataIndex: 'deptRank',
      key: 'deptRank',
      render: (rank: number) => <Tag color="orange">第{rank}名</Tag>,
    },
    { title: '姓名', dataIndex: 'userName', key: 'userName' },
    { title: '小组', dataIndex: 'groupName', key: 'groupName' },
    {
      title: '综合得分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      render: (score: number) => score?.toFixed(2),
    },
    {
      title: '投票状态',
      dataIndex: 'voted',
      key: 'voted',
      render: (voted: boolean, record: VoteCandidate) => {
        if (!voted) return <Tag>待投票</Tag>;
        return record.voteResult === 1 ? (
          <Tag icon={<ExclamationCircleOutlined />} color="error">
            同意预警
          </Tag>
        ) : (
          <Tag icon={<CheckCircleOutlined />} color="success">
            不同意
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: VoteCandidate) => (
        <Button type="link" onClick={() => handleVote(record)} disabled={record.voted}>
          {record.voted ? '已投票' : '投票'}
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="投票表决"
      extra={
        <Space>
          <span style={{ color: '#666' }}>对后3%人员进行投票表决，同意率超过50%将被预警</span>
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
          dataSource={candidates}
          columns={columns}
          rowKey="userId"
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      <Modal
        title="投票表决"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <div style={{ marginBottom: 16 }}>
          <p>
            被投票人：<strong>{currentCandidate?.userName}</strong>
          </p>
          <p>
            综合得分：<strong>{currentCandidate?.totalScore?.toFixed(2)}</strong>
          </p>
          <p>
            部门排名：<strong>第{currentCandidate?.deptRank}名</strong>
          </p>
        </div>
        <Form form={form} layout="vertical">
          <Form.Item
            name="voteResult"
            label="投票选择"
            rules={[{ required: true, message: '请选择投票结果' }]}
          >
            <Radio.Group>
              <Radio value={1}>同意预警</Radio>
              <Radio value={0}>不同意</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="voteReason" label="投票理由（选填）">
            <Input.TextArea rows={3} placeholder="请输入投票理由" maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default VotePage;
