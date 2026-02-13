import React, { useEffect, useState } from 'react';
import { Grid, Layout as AntLayout } from 'antd';
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
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (token && (!user || !Array.isArray(user.permissions))) {
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

  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  if (!user) {
    return null;
  }

  return (
    <AntLayout className="app-layout">
      <Header isMobile={isMobile} onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
      <AntLayout>
        <Sidebar
          isMobile={isMobile}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <Content className="app-content">
          <div className="app-content__inner">
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
