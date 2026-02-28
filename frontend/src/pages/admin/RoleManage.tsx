import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { message } from '@/utils/message';
import * as adminApi from '@/api/admin';
import { RoleLabel, SystemRole } from '@/types';

const RoleManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemRole | null>(null);
  const [form] = Form.useForm();

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getRoleList(true);
      setRoles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const onCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 1, sortOrder: 0 });
    setModalOpen(true);
  };

  const onEdit = (row: SystemRole) => {
    setEditing(row);
    form.setFieldsValue(row);
    setModalOpen(true);
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    await adminApi.saveRole(editing ? { ...values, id: editing.id, roleCode: editing.roleCode } : values);
    message.success('保存成功');
    setModalOpen(false);
    await loadRoles();
  };

  return (
    <Card
      title="角色管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          新增角色
        </Button>
      }
    >
      <Table<SystemRole>
        rowKey="id"
        loading={loading}
        dataSource={roles}
        pagination={false}
        columns={[
          { title: '编码', dataIndex: 'roleCode', key: 'roleCode', width: 180 },
          {
            title: '名称',
            dataIndex: 'roleName',
            key: 'roleName',
            render: (_: string, row: SystemRole) => row.roleName || RoleLabel[row.roleCode] || row.roleCode,
          },
          { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 120 },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (v: number) => <Tag color={v === 1 ? 'green' : 'red'}>{v === 1 ? '启用' : '禁用'}</Tag>,
          },
          {
            title: '操作',
            key: 'action',
            width: 180,
            render: (_: unknown, row: SystemRole) => (
              <Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(row)}>
                  编辑
                </Button>
                <Popconfirm
                  title={`确认删除角色 ${row.roleCode} ?`}
                  onConfirm={async () => {
                    await adminApi.deleteRole(row.id);
                    message.success('删除成功');
                    await loadRoles();
                  }}
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? '编辑角色' : '新增角色'}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="roleCode"
            label="角色编码"
            rules={[
              { required: true, message: '请输入角色编码' },
              { pattern: /^[A-Z_][A-Z0-9_]*$/, message: '仅支持大写字母、数字、下划线，且需字母开头' },
            ]}
          >
            <Input placeholder="例如 PROJECT_MANAGER" disabled={!!editing} />
          </Form.Item>
          <Form.Item name="roleName" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="例如 项目经理" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select
              options={[
                { value: 1, label: '启用' },
                { value: 0, label: '禁用' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default RoleManage;
