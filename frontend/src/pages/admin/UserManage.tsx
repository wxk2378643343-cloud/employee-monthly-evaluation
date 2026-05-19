import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, Popconfirm, Tag } from 'antd';
import { message } from '@/utils/message';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import * as adminApi from '@/api/admin';
import { Department, Group, Role, RoleLabel, SystemRole, User } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/authSlice';
import { useNavigate } from 'react-router-dom';

const UserManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [filterDeptId, setFilterDeptId] = useState<number>();
  const [keyword, setKeyword] = useState('');
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm<{ newPassword: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user: loginUser } = useAppSelector((state) => state.auth);

  const loadInitialData = async () => {
    const [deptData, groupData, roleData] = await Promise.all([
      adminApi.getDeptList(),
      adminApi.getGroupList(),
      adminApi.getRoleList(),
    ]);
    setDepts(deptData);
    setGroups(groupData);
    setRoles(roleData.filter((r) => r.status === 1));
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUserList({
        ...(filterDeptId ? { deptId: filterDeptId } : {}),
        ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
      });
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => { loadUsers(); }, [filterDeptId, keyword]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await adminApi.saveUser(currentUser ? { ...values, id: currentUser.id } : values);
    message.success('保存成功');
    setModalVisible(false);
    loadUsers();
  };

  const selectedDeptId = Form.useWatch('deptId', form);
  const filteredGroups = groups.filter((g) => !selectedDeptId || g.deptId === selectedDeptId);
  const roleNameMap = roles.reduce<Record<string, string>>((acc, item) => {
    acc[item.roleCode] = item.roleName;
    return acc;
  }, {});

  const openResetModal = (target?: User) => {
    setResetTarget(target || null);
    resetForm.setFieldsValue({ newPassword: '123456' });
    setResetVisible(true);
  };

  const handleResetPassword = async () => {
    const values = await resetForm.validateFields();
    const targetIds = resetTarget ? [resetTarget.id] : users.map((u) => u.id);
    if (targetIds.length === 0) {
      message.warning('当前没有可重置的用户');
      return;
    }
    setResetting(true);
    try {
      if (resetTarget) {
        await adminApi.resetUserPassword(resetTarget.id, values.newPassword);
      } else {
        await adminApi.resetUserPasswords({ userIds: targetIds, newPassword: values.newPassword });
      }
      message.success('密码重置成功');
      setResetVisible(false);
      resetForm.resetFields();
      if (loginUser?.id && targetIds.includes(loginUser.id)) {
        await dispatch(logout());
        navigate('/login', { replace: true });
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <Card
      title="用户管理"
      extra={
        <Space>
          <Input.Search
            allowClear
            placeholder="姓名 / 工号 / 手机号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={(value) => setKeyword(value)}
            style={{ width: 240 }}
          />
          <Select value={filterDeptId} onChange={setFilterDeptId} allowClear placeholder="全部部门" style={{ width: 180 }}>
            {depts.map((d) => <Select.Option key={d.id} value={d.id}>{d.deptName}</Select.Option>)}
          </Select>
          <Button icon={<KeyOutlined />} disabled={users.length === 0} onClick={() => openResetModal()}>
            全部重置密码
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCurrentUser(null);
              form.resetFields();
              form.setFieldsValue({
                role: roles.find((r) => r.roleCode === Role.EMPLOYEE)?.roleCode || roles[0]?.roleCode || Role.EMPLOYEE,
                status: 1,
                password: '123456',
              });
              setModalVisible(true);
            }}
          >
            新增用户
          </Button>
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
          { title: '网格', dataIndex: 'groupId', key: 'groupId', render: (id: number) => groups.find((g) => g.id === id)?.groupName || '-' },
          { title: '角色', dataIndex: 'role', key: 'role', render: (role: string) => <Tag>{roleNameMap[role] || RoleLabel[role] || role}</Tag> },
          { title: '手机号', dataIndex: 'phone', key: 'phone' },
          { title: '状态', dataIndex: 'status', key: 'status', render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '启用' : '禁用'}</Tag> },
          {
            title: '操作',
            key: 'action',
            render: (_: unknown, r: User) => (
              <Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => { setCurrentUser(r); form.setFieldsValue(r); setModalVisible(true); }}>编辑</Button>
                <Button type="link" icon={<KeyOutlined />} onClick={() => openResetModal(r)}>重置密码</Button>
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
          <Form.Item name="groupId" label="网格"><Select allowClear>{filteredGroups.map((g) => <Select.Option key={g.id} value={g.id}>{g.groupName}</Select.Option>)}</Select></Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select>
              {roles.map((r) => (
                <Select.Option key={r.roleCode} value={r.roleCode}>
                  {r.roleName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}><Select><Select.Option value={1}>启用</Select.Option><Select.Option value={0}>禁用</Select.Option></Select></Form.Item>
        </Form>
      </Modal>
      <Modal
        title={resetTarget ? `重置 ${resetTarget.realName} 的密码` : `重置当前列表 ${users.length} 名用户密码`}
        open={resetVisible}
        onOk={handleResetPassword}
        confirmLoading={resetting}
        okText="确认重置"
        onCancel={() => setResetVisible(false)}
      >
        <Form form={resetForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="默认密码"
            rules={[
              { required: true, message: '请输入默认密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password placeholder="请输入默认密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManage;


