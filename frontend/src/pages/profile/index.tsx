import React from 'react';
import { Card, Descriptions, Alert, Divider, Form, Input, Button, Space } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchUserInfo, logout } from '@/store/authSlice';
import * as authApi from '@/api/auth';
import { useNavigate } from 'react-router-dom';
import { message } from '@/utils/message';

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);

  React.useEffect(() => {
    profileForm.setFieldsValue({
      realName: user?.realName,
      phone: user?.phone,
      dingtalkId: '',
    });
  }, [profileForm, user]);

  const handleSaveProfile = async () => {
    const values = await profileForm.validateFields();
    setSavingProfile(true);
    try {
      await authApi.updateProfile(values);
      await dispatch(fetchUserInfo());
      message.success('个人信息已更新');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const values = await passwordForm.validateFields();
    setSavingPassword(true);
    try {
      await authApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      passwordForm.resetFields();
      message.success('密码修改成功，请重新登录');
      await dispatch(logout());
      navigate('/login', { replace: true });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <Card title="个人设置">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="用户名">{user?.username || '-'}</Descriptions.Item>
          <Descriptions.Item label="角色">{user?.role || '-'}</Descriptions.Item>
          <Descriptions.Item label="部门">{user?.deptName || '-'}</Descriptions.Item>
          <Descriptions.Item label="网格">{user?.groupName || '-'}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <Form form={profileForm} layout="vertical">
          <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" autoComplete="name" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" autoComplete="tel" />
          </Form.Item>
          <Form.Item name="dingtalkId" label="钉钉ID">
            <Input placeholder="请输入钉钉ID（可选）" autoComplete="off" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" loading={savingProfile} onClick={handleSaveProfile}>
              保存个人信息
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <Alert type="info" showIcon message="修改密码后，建议立即重新登录。" style={{ marginBottom: 16 }} />

        <Form form={passwordForm} layout="vertical" autoComplete="on">
          <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
            <Input.Password placeholder="请输入旧密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '新密码至少 6 位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的新密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" autoComplete="new-password" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" loading={savingPassword} onClick={handleChangePassword}>
                修改密码
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProfilePage;
