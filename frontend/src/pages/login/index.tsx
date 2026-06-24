import React from 'react';
import { Form, Input, Button, Checkbox } from 'antd';
import { message } from '@/utils/message';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { login } from '@/store/authSlice';
import type { LoginParams } from '@/api/auth';

const REMEMBER_KEY = 'eval_remember_login';

type LoginFormValues = LoginParams & {
  remember?: boolean;
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const [form] = Form.useForm<LoginFormValues>();

  React.useEffect(() => {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { phone?: string; password?: string };
      form.setFieldsValue({
        phone: saved.phone || '',
        password: saved.password || '',
        remember: true,
      });
    } catch {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }, [form]);

  const onFinish = async (values: LoginFormValues) => {
    try {
      await dispatch(
        login({
          phone: values.phone,
          password: values.password,
        })
      ).unwrap();

      if (values.remember) {
        localStorage.setItem(
          REMEMBER_KEY,
          JSON.stringify({
            phone: values.phone,
            password: values.password,
          })
        );
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      message.success('登录成功');
      navigate('/dashboard');
    } catch {
      // handled by interceptor
    }
  };

  return (
    <div className="login-page login-page-v2">
      <div className="login-v2__brand">
        <div className="login-v2__brand-inner">
          <div className="login-v2__chip">EVAL MANAGEMENT</div>
          <h1>活水预警平台</h1>
          <p>统一评价、统一标准、统一反馈，构建更透明的绩效协作流程。</p>

          <ul className="login-v2__points">
            <li>多角色评分分配与闭环追踪</li>
            <li>自动统计、排名与预警能力</li>
            <li>企业级权限控制与审计友好</li>
          </ul>
        </div>
      </div>

      <div className="login-v2__panel-wrap">
        <div className="login-v2__panel">
          <div className="login-v2__panel-head">
            <h2>欢迎登录</h2>
            <p>请输入手机号和密码</p>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            autoComplete="on"
            size="large"
            layout="vertical"
            initialValues={{ remember: false }}
          >
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1\d{10}$/, message: '请输入正确的11位手机号' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="login-input-icon" />}
                placeholder="请输入手机号"
                autoComplete="tel"
              />
            </Form.Item>

            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password
                prefix={<LockOutlined className="login-input-icon" />}
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 8 }}>
              <Checkbox>保存密码</Checkbox>
            </Form.Item>

            <Form.Item style={{ marginTop: 20, marginBottom: 10 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录系统
              </Button>
            </Form.Item>
          </Form>

          <div className="login-v2__copyright">内部系统 · 仅限授权人员访问</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

