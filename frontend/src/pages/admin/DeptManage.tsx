import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, Popconfirm, Tag } from 'antd';
import { message } from '@/utils/message';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as adminApi from '@/api/admin';
import { Department } from '@/types';

const DeptManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [depts, setDepts] = useState<Department[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDept, setCurrentDept] = useState<Department | null>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      setDepts(await adminApi.getDeptList());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await adminApi.saveDept(currentDept ? { ...values, id: currentDept.id } : values);
    message.success('保存成功');
    setModalVisible(false);
    loadData();
  };

  return (
    <Card title="部门管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentDept(null); form.resetFields(); form.setFieldsValue({ status: 1 }); setModalVisible(true); }}>新增部门</Button>}>
      <Table
        loading={loading}
        dataSource={depts}
        rowKey="id"
        columns={[
          { title: '部门名称', dataIndex: 'deptName', key: 'deptName' },
          { title: '状态', dataIndex: 'status', key: 'status', render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '启用' : '禁用'}</Tag> },
          {
            title: '操作',
            key: 'action',
            render: (_: unknown, r: Department) => (
              <Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => { setCurrentDept(r); form.setFieldsValue(r); setModalVisible(true); }}>编辑</Button>
                <Popconfirm title="确认删除?" onConfirm={() => adminApi.deleteDept(r.id).then(() => loadData())}>
                  <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal title={currentDept ? '编辑部门' : '新增部门'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="deptName" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}><Input /></Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}><Select>
            <Select.Option value={1}>启用</Select.Option>
            <Select.Option value={0}>禁用</Select.Option>
          </Select></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DeptManage;


