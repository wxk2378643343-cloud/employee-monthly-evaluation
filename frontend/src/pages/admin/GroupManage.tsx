import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import * as adminApi from '@/api/admin';
import type { Group, Department, User } from '@/types';

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

  useEffect(() => {
    loadData();
  }, []);

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
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setCurrentGroup(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Group) => {
    setCurrentGroup(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteGroup(id);
      message.success('删除成功');
      loadData();
    } catch {
      // 忽略
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await adminApi.saveGroup(currentGroup ? { ...values, id: currentGroup.id } : values);
      message.success(currentGroup ? '编辑成功' : '新增成功');
      setModalVisible(false);
      loadData();
    } catch {
      // 忽略
    }
  };

  const handleViewMembers = async (group: Group) => {
    setCurrentGroup(group);
    try {
      const members = await adminApi.getGroupUsers(group.id);
      setGroupMembers(members);
      setMemberModalVisible(true);
    } catch {
      // 忽略
    }
  };

  const columns = [
    { title: '小组名称', dataIndex: 'groupName', key: 'groupName' },
    {
      title: '所属部门',
      dataIndex: 'deptId',
      key: 'deptId',
      render: (deptId: number) => depts.find((d) => d.id === deptId)?.deptName || '-',
    },
    {
      title: '小组长',
      dataIndex: 'leaderId',
      key: 'leaderId',
      render: (leaderId: number) => users.find((u) => u.id === leaderId)?.realName || '-',
    },
    {
      title: '成员数',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count: number) => <Tag color="blue">{count || 0}人</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>{status === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Group) => (
        <Space>
          <Button
            type="link"
            icon={<TeamOutlined />}
            onClick={() => handleViewMembers(record)}
          >
            成员
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该小组？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const memberColumns = [
    { title: '姓名', dataIndex: 'realName', key: 'realName' },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '角色',
      dataIndex: 'roleType',
      key: 'roleType',
      render: (roleType: number) => {
        const roleMap: Record<number, string> = {
          1: '普通员工',
          2: '小组长',
          3: '分管领导',
          4: '单位领导',
          5: '管理员',
        };
        return roleMap[roleType] || '-';
      },
    },
  ];

  return (
    <Card
      title="小组管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增小组
        </Button>
      }
    >
      <Table
        loading={loading}
        dataSource={groups}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={currentGroup ? '编辑小组' : '新增小组'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="groupName"
            label="小组名称"
            rules={[{ required: true, message: '请输入小组名称' }]}
          >
            <Input placeholder="请输入小组名称" />
          </Form.Item>
          <Form.Item
            name="deptId"
            label="所属部门"
            rules={[{ required: true, message: '请选择所属部门' }]}
          >
            <Select placeholder="请选择所属部门">
              {depts.map((d) => (
                <Select.Option key={d.id} value={d.id}>
                  {d.deptName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="leaderId" label="小组长">
            <Select placeholder="请选择小组长" allowClear>
              {users
                .filter((u) => u.roleType === 2)
                .map((u) => (
                  <Select.Option key={u.id} value={u.id}>
                    {u.realName}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Select.Option value={1}>启用</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${currentGroup?.groupName} - 成员列表`}
        open={memberModalVisible}
        onCancel={() => setMemberModalVisible(false)}
        footer={null}
        width={700}
      >
        <Table
          dataSource={groupMembers}
          columns={memberColumns}
          rowKey="id"
          pagination={false}
        />
      </Modal>
    </Card>
  );
};

export default GroupManage;
