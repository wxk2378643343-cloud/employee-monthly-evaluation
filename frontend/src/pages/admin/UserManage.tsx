import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import * as adminApi from '@/api/admin';
import { Department, Group, Role, RoleLabel, User } from '@/types';

const UserManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filterDeptId, setFilterDeptId] = useState<number>();
  const [form] = Form.useForm();

  const loadInitialData = async () => {
    const [deptData, groupData] = await Promise.all([adminApi.getDeptList(), adminApi.getGroupList()]);
    setDepts(deptData);
    setGroups(groupData);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUserList(filterDeptId ? { deptId: filterDeptId } : undefined);
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => { loadUsers(); }, [filterDeptId]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await adminApi.saveUser(currentUser ? { ...values, id: currentUser.id } : values);
    message.success('保存成功');
    setModalVisible(false);
    loadUsers();
  };

  const selectedDeptId = Form.useWatch('deptId', form);
  const filteredGroups = groups.filter((g) => !selectedDeptId || g.deptId === selectedDeptId);

  return (
    <Card
      title="用户管理"
      extra={
        <Space>
          <Select value={filterDeptId} onChange={setFilterDeptId} allowClear placeholder="全部部门" style={{ width: 180 }}>
            {depts.map((d) => <Select.Option key={d.id} value={d.id}>{d.deptName}</Select.Option>)}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentUser(null); form.resetFields(); form.setFieldsValue({ role: Role.EMPLOYEE, status: 1, password: '123456' }); setModalVisible(true); }}>新增用户</Button>
        </Space>
      }
    >
      <Table
        loading={loading}
        dataSource={users}
        rowKey="id"
        scroll={{ x: 900 }}
        columns={[
          { title: '用户名', dataIndex: 'username', key: 'username', width: 110 },
          { title: '姓名', dataIndex: 'realName', key: 'realName', width: 110 },
          { title: '部门', dataIndex: 'deptId', key: 'deptId', render: (id: number) => depts.find((d) => d.id === id)?.deptName || '-' },
          { title: '小组', dataIndex: 'groupId', key: 'groupId', render: (id: number) => groups.find((g) => g.id === id)?.groupName || '-' },
          { title: '角色', dataIndex: 'role', key: 'role', render: (role: keyof typeof RoleLabel) => <Tag>{RoleLabel[role] || role}</Tag> },
          { title: '手机号', dataIndex: 'phone', key: 'phone' },
          { title: '状态', dataIndex: 'status', key: 'status', render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '启用' : '禁用'}</Tag> },
          {
            title: '操作',
            key: 'action',
            render: (_: unknown, r: User) => (
              <Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => { setCurrentUser(r); form.setFieldsValue(r); setModalVisible(true); }}>编辑</Button>
                <Popconfirm title="重置密码为 123456?" onConfirm={() => adminApi.resetUserPassword(r.id, '123456')}>
                  <Button type="link" icon={<KeyOutlined />}>重置密码</Button>
                </Popconfirm>
                <Popconfirm title="确认删除?" onConfirm={() => adminApi.deleteUser(r.id).then(() => loadUsers())}>
                  <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal title={currentUser ? '编辑用户' : '新增用户'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input disabled={!!currentUser} />
          </Form.Item>
          {!currentUser && <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}><Input.Password /></Form.Item>}
          <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}><Input /></Form.Item>
          <Form.Item name="deptId" label="部门"><Select allowClear>{depts.map((d) => <Select.Option key={d.id} value={d.id}>{d.deptName}</Select.Option>)}</Select></Form.Item>
          <Form.Item name="groupId" label="小组"><Select allowClear>{filteredGroups.map((g) => <Select.Option key={g.id} value={g.id}>{g.groupName}</Select.Option>)}</Select></Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}><Select>{Object.entries(RoleLabel).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}</Select></Form.Item>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}><Select><Select.Option value={1}>启用</Select.Option><Select.Option value={0}>禁用</Select.Option></Select></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManage;
