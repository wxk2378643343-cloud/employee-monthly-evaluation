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
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { RoleType } from '@/types';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const isAdmin = user?.roleType === RoleType.ADMIN;
  const isLeader = user?.roleType && user.roleType >= RoleType.TEAM_LEADER && user.roleType <= RoleType.UNIT_LEADER;

  const menuItems: MenuItem[] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '首页',
    },
    // 管理员菜单
    ...(isAdmin
      ? [
          {
            key: '/admin',
            icon: <SettingOutlined />,
            label: '系统管理',
            children: [
              { key: '/admin/groups', icon: <TeamOutlined />, label: '小组管理' },
              { key: '/admin/assign', icon: <UserSwitchOutlined />, label: '打分分配' },
              { key: '/admin/linear-score', icon: <OrderedListOutlined />, label: '线性排名分' },
              { key: '/admin/period', icon: <SettingOutlined />, label: '周期管理' },
            ],
          },
        ]
      : []),
    // 评价菜单
    {
      key: '/score',
      icon: <EditOutlined />,
      label: '评价管理',
      children: [
        { key: '/score/pending', label: '待评价列表' },
        { key: '/score/submitted', label: '已提交评价' },
        ...(isAdmin ? [{ key: '/vote/list', icon: <CheckSquareOutlined />, label: '投票表决' }] : []),
      ],
    },
    // 查分菜单
    {
      key: '/query',
      icon: <FileSearchOutlined />,
      label: '查分中心',
      children: [
        { key: '/query/history', label: '我的历史' },
        ...((isLeader || isAdmin)
          ? [
              { key: '/query/detail', label: '评分详情' },
              { key: '/query/rank', label: '部门排名' },
            ]
          : []),
      ],
    },
    // 消息菜单
    {
      key: '/remind',
      icon: <BellOutlined />,
      label: '消息中心',
      children: [{ key: '/remind/list', label: '全部消息' }],
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const getSelectedKeys = () => {
    return [location.pathname];
  };

  const getOpenKeys = () => {
    const pathname = location.pathname;
    const openKeys: string[] = [];
    menuItems.forEach((item) => {
      if (item && 'children' in item && item.children) {
        const hasChild = item.children.some(
          (child) => child && 'key' in child && pathname.startsWith(child.key as string)
        );
        if (hasChild && item.key) {
          openKeys.push(item.key as string);
        }
      }
    });
    return openKeys;
  };

  return (
    <Sider
      width={220}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar;
