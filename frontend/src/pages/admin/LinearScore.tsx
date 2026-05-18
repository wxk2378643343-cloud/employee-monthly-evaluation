import React, { useEffect, useState } from 'react';
import { Button, Card, InputNumber, Modal, Select, Space, Spin, Table, Upload } from 'antd';
import type { UploadProps } from 'antd/es/upload/interface';
import { DownloadOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { message } from '@/utils/message';
import * as adminApi from '@/api/admin';
import { Department, EvalPeriod, LinearScore as LinearScoreType } from '@/types';

const LinearScore: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [periods, setPeriods] = useState<EvalPeriod[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number>();
  const [currentDeptId, setCurrentDeptId] = useState<number>();
  const [scores, setScores] = useState<LinearScoreType[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<number>();
  const [editValue, setEditValue] = useState<number>(0);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [periodData, deptData] = await Promise.all([adminApi.getPeriodList(), adminApi.getDeptList()]);
      setPeriods(periodData);
      setDepts(deptData);
      const active = periodData.find((p) => p.status === 1) || periodData[0];
      if (active) {
        setCurrentPeriodId(active.id);
      }
    })();
  }, []);

  const reload = async (periodId?: number, deptId?: number) => {
    if (!periodId) {
      return;
    }
    setLoading(true);
    try {
      const data = await adminApi.getLinearScoreList(periodId, deptId);
      setScores(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload(currentPeriodId, currentDeptId);
  }, [currentPeriodId, currentDeptId]);

  const handleSave = async () => {
    if (!currentPeriodId) {
      return;
    }
    setSaving(true);
    try {
      await adminApi.saveLinearScores({
        periodId: currentPeriodId,
        scores: scores.map((s) => ({ targetId: s.targetId, linearRankScore: s.linearRankScore ?? 0 })),
      });
      message.success('保存成功');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!currentPeriodId) {
      return;
    }
    const blob = await adminApi.exportLinearScoreExcel(currentPeriodId, currentDeptId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `线性分名单-周期${currentPeriodId}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uploadProps: UploadProps = {
    showUploadList: false,
    accept: '.xlsx,.xls',
    beforeUpload: async (file) => {
      if (!currentPeriodId) {
        message.warning('请先选择周期');
        return Upload.LIST_IGNORE;
      }
      try {
        const result = await adminApi.importLinearScoreExcel(currentPeriodId, file as File);
        message.success(`导入成功：共导入 ${result.successCount} 条`);
        await reload(currentPeriodId, currentDeptId);
      } catch {
        // The request interceptor displays the backend validation message.
      }
      return Upload.LIST_IGNORE;
    },
  };

  const openEdit = (record: LinearScoreType) => {
    setEditTargetId(record.targetId);
    setEditValue(Number(record.linearRankScore ?? 0));
    setEditOpen(true);
  };

  const handleEditOk = async () => {
    if (!editTargetId || !currentPeriodId) {
      setEditOpen(false);
      return;
    }
    setEditSaving(true);
    try {
      await adminApi.setLinearScore({
        periodId: currentPeriodId,
        targetId: editTargetId,
        linearRankScore: editValue,
      });
      message.success('保存成功');
      setScores((prev) => prev.map((p) => (p.targetId === editTargetId ? { ...p, linearRankScore: editValue } : p)));
      setEditOpen(false);
      await reload(currentPeriodId, currentDeptId);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <Card
      title="线性分设置"
      extra={
        <Space>
          <Select value={currentPeriodId} onChange={setCurrentPeriodId} style={{ width: 220 }}>
            {periods.map((p) => (
              <Select.Option key={p.id} value={p.id}>
                {p.periodName}
              </Select.Option>
            ))}
          </Select>
          <Select
            value={currentDeptId}
            onChange={setCurrentDeptId}
            style={{ width: 180 }}
            allowClear
            placeholder="全部部门"
          >
            {depts.map((d) => (
              <Select.Option key={d.id} value={d.id}>
                {d.deptName}
              </Select.Option>
            ))}
          </Select>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出名单
          </Button>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>上传Excel</Button>
          </Upload>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          rowKey="targetId"
          dataSource={scores}
          pagination={{ pageSize: 20 }}
          columns={[
            { title: '姓名', dataIndex: 'targetName', key: 'targetName' },
            { title: '部门', dataIndex: 'deptName', key: 'deptName' },
            { title: '网格', dataIndex: 'groupName', key: 'groupName' },
            {
              title: '线性分',
              dataIndex: 'linearRankScore',
              key: 'linearRankScore',
              render: (value: number | undefined) => (value === undefined || value === null ? '-' : value),
            },
            {
              title: '操作',
              key: 'action',
              render: (_: unknown, record: LinearScoreType) => (
                <Button size="small" onClick={() => openEdit(record)}>
                  编辑
                </Button>
              ),
            },
          ]}
        />
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            保存
          </Button>
        </div>
      </Spin>
      <Modal
        title="编辑线性分"
        open={editOpen}
        onOk={handleEditOk}
        confirmLoading={editSaving}
        onCancel={() => setEditOpen(false)}
      >
        <InputNumber min={0} max={100} value={editValue} onChange={(v) => setEditValue(Number(v ?? 0))} />
      </Modal>
    </Card>
  );
};

export default LinearScore;
