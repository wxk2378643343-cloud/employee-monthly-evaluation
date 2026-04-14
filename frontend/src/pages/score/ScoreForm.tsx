import React from 'react';
import { Form, InputNumber, Button, Space, Alert } from 'antd';
import { EvalType, EvalTypeLabel, ScoreSubmit } from '@/types';

interface ScoreFormProps {
  targetUser: {
    id: number;
    targetName: string;
    deptName?: string;
    groupName?: string;
    evalType: EvalType;
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
        targetId: targetUser.id,
        evalType: targetUser.evalType,
        score: values.score,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical">
      <Alert
        message={`${targetUser.targetName} (${targetUser.deptName || '-'} / ${targetUser.groupName || '-'})`}
        description={`评价类型：${EvalTypeLabel[targetUser.evalType]}`}
        type="info"
        style={{ marginBottom: 16 }}
      />

      <Form.Item
        name="score"
        label="评分"
        rules={[
          { required: true, message: '请输入评分' },
          { type: 'number', min: 1, max: 100, message: '范围 1-100' },
        ]}
      >
        <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="1-100" />
      </Form.Item>
      <Form.Item style={{ marginBottom: 0 }}>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            提交
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ScoreForm;
