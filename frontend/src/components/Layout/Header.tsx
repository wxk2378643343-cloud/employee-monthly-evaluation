import React from 'react';
import { Layout, Dropdown, Space, Badge, Popover, List, Button, Empty, Tag, Avatar, Drawer } from 'antd';
import { LogoutOutlined, BellOutlined, SettingOutlined, CaretDownFilled, MenuOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/authSlice';
import { fetchUnreadReminds, markRead, markAllRead } from '@/store/remindSlice';
import { RoleLabel } from '@/types';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;
const HEADER_REMIND_TYPE_LABEL: Record<string, string> = {
  SCORE: '评分提醒',
  VOTE: '投票提醒',
  NOTICE: '系统消息',
};

interface HeaderProps {
  isMobile?: boolean;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isMobile = false, onToggleSidebar }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { unreadCount, reminds, loading } = useAppSelector((state) => state.remind);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const jumpByRemind = (item: { id: number; remindType: string; periodId?: number }) => {
    dispatch(markRead(item.id));
    setPopoverOpen(false);
    setDrawerOpen(false);
    if (item.remindType === 'VOTE') {
      navigate(item.periodId ? `/vote/list?periodId=${item.periodId}` : '/vote/list');
      return;
    }
    if (item.remindType === 'NOTICE') {
      navigate('/remind/list');
      return;
    }
    navigate(item.periodId ? `/score/pending?periodId=${item.periodId}` : '/score/pending');
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: '个人设置',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const remindContent = (
    <div className={`remind-popover${isMobile ? ' remind-popover--mobile' : ''}`}>
      {reminds.length > 0 ? (
        <>
          <List
            loading={loading}
            dataSource={reminds}
            renderItem={(item) => (
              <List.Item
                className={`remind-item${!item.isRead ? ' remind-item--unread' : ''}`}
                onClick={() => jumpByRemind(item as { id: number; remindType: string; periodId?: number })}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<BellOutlined />} />}
                  title={
                    <Space size={8}>
                      {!item.isRead && <span className="remind-unread-dot" />}
                      <Tag>{HEADER_REMIND_TYPE_LABEL[item.remindType] || '消息提醒'}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div className={`remind-content${!item.isRead ? ' remind-content--unread' : ''}`}>
                        {item.remindContent}
                      </div>
                      <div className="remind-time">{item.createTime}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
          <div className="remind-footer">
            <Space>
              <Button
                type="link"
                onClick={() => {
                  dispatch(markAllRead());
                  setPopoverOpen(false);
                  setDrawerOpen(false);
                }}
              >
                全部已读
              </Button>
              <Button
                type="link"
                onClick={() => {
                  setPopoverOpen(false);
                  setDrawerOpen(false);
                  navigate('/remind/list');
                }}
              >
                查看全部
              </Button>
            </Space>
          </div>
        </>
      ) : (
        <Empty description="暂无新消息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );

  return (
    <AntHeader className="app-header">
      <div className="app-header__brand">
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            className="app-header__menu-trigger"
            onClick={onToggleSidebar}
          />
        )}
        <div className="app-header__brand-dot" />
        <div className="app-header__title-wrap">
          <div className="app-header__title">员工月度评价系统</div>
          <div className="app-header__subtitle">Performance Management</div>
        </div>
      </div>

      <Space size={16}>
        {isMobile ? (
          <>
            <Badge count={unreadCount} size="small">
              <BellOutlined
                className="app-header__bell"
                onClick={() => {
                  setDrawerOpen(true);
                  dispatch(fetchUnreadReminds());
                }}
              />
            </Badge>
            <Drawer
              title="消息"
              placement="right"
              width="92vw"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              className="remind-mobile-drawer"
            >
              {remindContent}
            </Drawer>
          </>
        ) : (
          <Popover
            content={remindContent}
            trigger="click"
            open={popoverOpen}
            onOpenChange={(open) => {
              setPopoverOpen(open);
              if (open) dispatch(fetchUnreadReminds());
            }}
            placement="bottomRight"
          >
            <Badge count={unreadCount} size="small">
              <BellOutlined className="app-header__bell" />
            </Badge>
          </Popover>
        )}

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space className="app-header__user" style={{ cursor: 'pointer' }}>
            <span className="app-header__name">{user?.realName}</span>
            {!isMobile && <Tag className="app-header__role" color="red">{user?.role ? RoleLabel[user.role] : ''}</Tag>}
            <CaretDownFilled className="app-header__caret" />
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
