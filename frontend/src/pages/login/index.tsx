import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { login } from '@/store/authSlice';
import type { LoginParams } from '@/api/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);

  const onFinish = async (values: LoginParams) => {
    try {
      await dispatch(login(values)).unwrap();
      message.success('登录成功');
      navigate('/dashboard');
    } catch {
      // 错误已在拦截器处理
    }
  };

  return (
    <div className="login-page">
      {/* 左侧品牌区 */}
      <div className="login-brand">
        <div className="login-brand__inner">
          <div className="login-brand__icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="rgba(255,255,255,0.2)" />
              <path d="M14 24L21 31L34 18" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="login-brand__title">员工月度评价系统</h1>
          <p className="login-brand__desc">
            公正透明的绩效评价平台，助力团队成长
          </p>
          <div className="login-brand__features">
            <div className="login-brand__feature">
              <span className="login-brand__dot" />
              多维度互评，全面客观
            </div>
            <div className="login-brand__feature">
              <span className="login-brand__dot" />
              实时数据统计，排名一目了然
            </div>
            <div className="login-brand__feature">
              <span className="login-brand__dot" />
              预警机制，及时反馈
            </div>
          </div>
        </div>
        {/* 装饰圆 */}
        <div className="login-brand__circle login-brand__circle--1" />
        <div className="login-brand__circle login-brand__circle--2" />
        <div className="login-brand__circle login-brand__circle--3" />
      </div>

      {/* 右侧表单区 */}
      <div className="login-form-wrapper">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>欢迎登录</h2>
            <p>请输入您的账号和密码</p>
          </div>
          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined className="login-input-icon" />}
                placeholder="请输入用户名"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="login-input-icon" />}
                placeholder="请输入密码"
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 32 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登 录
              </Button>
            </Form.Item>
          </Form>
          <div className="login-footer">
            <span>联通公司内部系统 · 仅限授权人员使用</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
