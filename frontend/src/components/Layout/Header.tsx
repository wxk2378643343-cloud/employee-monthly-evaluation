import React from 'react';
import { Layout, Avatar, Dropdown, Space, Badge, Popover, List, Button, Empty, Tag } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/authSlice';
import { fetchUnreadReminds, markRead, markAllRead } from '@/store/remindSlice';
import { RoleLabel } from '@/types';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { unreadCount, reminds, loading } = useAppSelector((state) => state.remind);
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'info',
      label: (
        <div>
          <div>{user?.realName}</div>
          <div className="text-muted-sm">{user?.role ? RoleLabel[user.role] : ''}</div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  const remindContent = (
    <div className="remind-popover">
      {reminds.length > 0 ? (
        <>
          <List
            loading={loading}
            dataSource={reminds}
            renderItem={(item) => (
              <List.Item className="remind-item" onClick={() => dispatch(markRead(item.id))}>
                <List.Item.Meta
                  avatar={<Avatar icon={<BellOutlined />} />}
                  title={<Tag>{item.remindType}</Tag>}
                  description={<div><div>{item.remindContent}</div><div className="remind-time">{item.createTime}</div></div>}
                />
              </List.Item>
            )}
          />
          <div className="remind-footer">
            <Space>
              <Button type="link" onClick={() => { dispatch(markAllRead()); setPopoverOpen(false); }}>全部已读</Button>
              <Button type="link" onClick={() => { setPopoverOpen(false); navigate('/remind/list'); }}>查看全部</Button>
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
      <div className="app-header__title">员工月度评价系统</div>
      <Space size={24}>
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
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space className="app-header__user">
            <Avatar icon={<UserOutlined />} className="app-header__avatar" />
            <span>{user?.realName}</span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
