import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import * as adminApi from '@/api/admin';
import { Department, Group, User, RoleLabel } from '@/types';

const GroupManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupData, deptData, userData] = await Promise.all([
        adminApi.getGroupList(),
        adminApi.getDeptList(),
        adminApi.getUserList(),
      ]);
      setGroups(groupData);
      setDepts(deptData);
      setUsers(userData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await adminApi.saveGroup(currentGroup ? { ...values, id: currentGroup.id } : values);
    message.success('保存成功');
    setModalVisible(false);
    loadData();
  };

  return (
    <Card title="小组管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentGroup(null); form.resetFields(); form.setFieldsValue({ status: 1 }); setModalVisible(true); }}>新增小组</Button>}>
      <Table
        loading={loading}
        dataSource={groups}
        rowKey="id"
        columns={[
          { title: '小组名称', dataIndex: 'groupName', key: 'groupName' },
          { title: '部门', dataIndex: 'deptId', key: 'deptId', render: (id: number) => depts.find((d) => d.id === id)?.deptName || '-' },
          { title: '状态', dataIndex: 'status', key: 'status', render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '启用' : '禁用'}</Tag> },
          {
            title: '操作',
            key: 'action',
            render: (_: unknown, r: Group) => (
              <Space>
                <Button type="link" icon={<TeamOutlined />} onClick={async () => { setCurrentGroup(r); setGroupMembers(await adminApi.getGroupUsers(r.id)); setMemberModalVisible(true); }}>成员</Button>
                <Button type="link" icon={<EditOutlined />} onClick={() => { setCurrentGroup(r); form.setFieldsValue(r); setModalVisible(true); }}>编辑</Button>
                <Popconfirm title="确认删除?" onConfirm={() => adminApi.deleteGroup(r.id).then(() => loadData())}>
                  <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal title={currentGroup ? '编辑小组' : '新增小组'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="groupName" label="小组名称" rules={[{ required: true, message: '请输入小组名称' }]}><Input /></Form.Item>
          <Form.Item name="deptId" label="所属部门" rules={[{ required: true, message: '请选择部门' }]}>
            <Select>{depts.map((d) => <Select.Option key={d.id} value={d.id}>{d.deptName}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}><Select>
            <Select.Option value={1}>启用</Select.Option>
            <Select.Option value={0}>禁用</Select.Option>
          </Select></Form.Item>
        </Form>
      </Modal>

      <Modal title={`${currentGroup?.groupName || ''} 成员`} open={memberModalVisible} onCancel={() => setMemberModalVisible(false)} footer={null} width={700}>
        <Table
          dataSource={groupMembers}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '姓名', dataIndex: 'realName', key: 'realName' },
            { title: '用户名', dataIndex: 'username', key: 'username' },
            { title: '手机号', dataIndex: 'phone', key: 'phone' },
            { title: '角色', dataIndex: 'role', key: 'role', render: (role: keyof typeof RoleLabel) => RoleLabel[role] || role },
          ]}
        />
      </Modal>
    </Card>
  );
};

export default GroupManage;
