import React from 'react';
import { Layout, Avatar, Dropdown, Space, Badge, Popover, List, Button, Empty, Tag } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/authSlice';
import { fetchUnreadReminds, markRead, markAllRead } from '@/store/remindSlice';
import { RoleTypeLabel, RemindType } from '@/types';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

const remindTypeConfig: Record<
  RemindType,
  { icon: React.ReactNode; color: string; label: string }
> = {
  [RemindType.PENDING]: { icon: <EditOutlined />, color: '#1890ff', label: '待评价' },
  [RemindType.DEADLINE]: { icon: <ClockCircleOutlined />, color: '#faad14', label: '即将截止' },
  [RemindType.VOTE]: { icon: <CheckSquareOutlined />, color: '#722ed1', label: '投票' },
  [RemindType.WARNING]: { icon: <WarningOutlined />, color: '#f5222d', label: '预警' },
};

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
          <div style={{ fontSize: 12, color: '#999' }}>
            {user?.roleType && RoleTypeLabel[user.roleType]}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const handlePopoverOpenChange = (open: boolean) => {
    setPopoverOpen(open);
    if (open) {
      dispatch(fetchUnreadReminds());
    }
  };

  const handleRemindClick = (id: number) => {
    dispatch(markRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllRead());
    setPopoverOpen(false);
  };

  const remindContent = (
    <div style={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
      {reminds.length > 0 ? (
        <>
          <List
            loading={loading}
            dataSource={reminds}
            renderItem={(item) => {
              const config = remindTypeConfig[item.remindType as RemindType];
              return (
                <List.Item
                  style={{ cursor: 'pointer', padding: '12px 0' }}
                  onClick={() => handleRemindClick(item.id)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={config?.icon}
                        style={{ backgroundColor: config?.color }}
                      />
                    }
                    title={<Tag color={config?.color}>{config?.label}</Tag>}
                    description={
                      <div>
                        <div>{item.remindContent}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                          {item.createTime}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
          <div style={{ textAlign: 'center', padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
            <Space>
              <Button type="link" onClick={handleMarkAllRead}>
                全部已读
              </Button>
              <Button
                type="link"
                onClick={() => {
                  setPopoverOpen(false);
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
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 600 }}>员工月度评价系统</div>
      <Space size={24}>
        <Popover
          content={remindContent}
          trigger="click"
          open={popoverOpen}
          onOpenChange={handlePopoverOpenChange}
          placement="bottomRight"
        >
          <Badge count={unreadCount} size="small">
            <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
          </Badge>
        </Popover>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <span>{user?.realName}</span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
