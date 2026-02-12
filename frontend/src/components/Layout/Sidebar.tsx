import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  SettingOutlined,
  EditOutlined,
  FileSearchOutlined,
  BellOutlined,
  OrderedListOutlined,
  UserSwitchOutlined,
  CheckSquareOutlined,
  ApartmentOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { isAdminRole, isLeaderRole } from '@/types';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const isAdmin = isAdminRole(user?.role);
  const isLeader = isLeaderRole(user?.role);

  const menuItems: MenuItem[] = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '首页' },
    ...(isAdmin
      ? [
          {
            key: '/admin',
            icon: <SettingOutlined />,
            label: '系统管理',
            children: [
              { key: '/admin/depts', icon: <ApartmentOutlined />, label: '部门管理' },
              { key: '/admin/users', icon: <UserOutlined />, label: '用户管理' },
              { key: '/admin/groups', icon: <TeamOutlined />, label: '小组管理' },
              { key: '/admin/assign', icon: <UserSwitchOutlined />, label: '评分分配' },
              { key: '/admin/linear-score', icon: <OrderedListOutlined />, label: '线性分' },
              { key: '/admin/period', icon: <SettingOutlined />, label: '周期管理' },
            ],
          },
        ]
      : []),
    {
      key: '/score',
      icon: <EditOutlined />,
      label: '评分管理',
      children: [
        { key: '/score/pending', label: '待评分' },
        { key: '/score/submitted', label: '已提交' },
        { key: '/vote/list', icon: <CheckSquareOutlined />, label: '投票' },
      ],
    },
    {
      key: '/query',
      icon: <FileSearchOutlined />,
      label: '查询中心',
      children: [
        { key: '/query/history', label: '我的历史' },
        ...(isLeader || isAdmin
          ? [
              { key: '/query/detail', label: '评分详情' },
              { key: '/query/rank', label: '部门排名' },
            ]
          : []),
      ],
    },
    { key: '/remind', icon: <BellOutlined />, label: '消息中心', children: [{ key: '/remind/list', label: '全部消息' }] },
  ];

  return (
    <Sider width={220}>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ height: '100%' }}
      />
    </Sider>
  );
};

export default Sidebar;
