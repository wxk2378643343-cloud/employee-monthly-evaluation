import React from 'react';
import { Form, InputNumber, Input, Button, Space, Alert } from 'antd';
import type { ScoreSubmit } from '@/types';

interface ScoreFormProps {
  targetUser: {
    id: number;
    realName: string;
    deptName: string;
    groupName: string;
  };
  periodId: number;
  onSubmit: (data: ScoreSubmit) => void;
  onCancel: () => void;
}

const ScoreForm: React.FC<ScoreFormProps> = ({ targetUser, periodId, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSubmit({
        periodId,
        targetUserId: targetUser.id,
        ...values,
      });
    } catch {
      // 验证失败
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical">
      <Alert
        message={`正在评价：${targetUser.realName}（${targetUser.deptName} - ${targetUser.groupName}）`}
        type="info"
        style={{ marginBottom: 24 }}
      />

      <Form.Item
        name="workRecordScore"
        label="工作记录（权重20%）"
        rules={[
          { required: true, message: '请输入工作记录分数' },
          { type: 'number', min: 1, max: 100, message: '分数范围1-100' },
        ]}
        extra="评价日常工作完成情况"
      >
        <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="请输入1-100分" />
      </Form.Item>

      <Form.Item
        name="keyIndicatorScore"
        label="重点指标（权重60%）"
        rules={[
          { required: true, message: '请输入重点指标分数' },
          { type: 'number', min: 1, max: 100, message: '分数范围1-100' },
        ]}
        extra="评价核心KPI指标完成度"
      >
        <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="请输入1-100分" />
      </Form.Item>

      <Form.Item
        name="keyWorkScore"
        label="重点工作（权重20%）"
        rules={[
          { required: true, message: '请输入重点工作分数' },
          { type: 'number', min: 1, max: 100, message: '分数范围1-100' },
        ]}
        extra="评价重点任务完成情况"
      >
        <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="请输入1-100分" />
      </Form.Item>

      <Form.Item name="comment" label="评语（选填）">
        <Input.TextArea rows={3} placeholder="请输入评价意见" maxLength={500} showCount />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            提交评分
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ScoreForm;
