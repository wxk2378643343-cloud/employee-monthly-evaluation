import React, { useEffect } from 'react';
import { Layout as AntLayout } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchUserInfo } from '@/store/authSlice';
import { fetchUnreadCount } from '@/store/remindSlice';
import { isAuthenticated } from '@/utils/auth';
import Header from './Header';
import Sidebar from './Sidebar';

const { Content } = AntLayout;

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!user && token) {
      dispatch(fetchUserInfo());
    }

    // 获取未读消息数量
    dispatch(fetchUnreadCount());

    // 每分钟刷新未读数量
    const timer = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 60000);

    return () => clearInterval(timer);
  }, [dispatch, navigate, user, token]);

  if (!user) {
    return null;
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header />
      <AntLayout>
        <Sidebar />
        <Content
          style={{
            padding: 24,
            background: '#f5f5f5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minHeight: 'calc(100vh - 112px)',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
