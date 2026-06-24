import React, { useMemo, useState } from 'react';
import { Drawer, Layout, Menu } from 'antd';
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
  InboxOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { isAdminRole, isLeaderRole } from '@/types';
import { hasPermission, hasAnyPermission, PermissionCode } from '@/utils/permission';
import type { MenuProps } from 'antd';

const { Sider } = Layout;
type MenuItem = Required<MenuProps>['items'][number];

interface SidebarProps {
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const isAdmin = isAdminRole(user?.role);
  const isLeader = isLeaderRole(user?.role);

  const canManageDept = hasPermission(user, PermissionCode.DEPT_MANAGE) || isAdmin;
  const canManageGroup = hasPermission(user, PermissionCode.GROUP_MANAGE) || isAdmin;
  const canManageUser = hasPermission(user, PermissionCode.USER_MANAGE) || isAdmin;
  const canManageRole = hasPermission(user, PermissionCode.ROLE_MANAGE) || isAdmin;
  const canManageAssign = hasPermission(user, PermissionCode.ASSIGN_MANAGE) || isAdmin;
  const canManageLinear = hasPermission(user, PermissionCode.LINEAR_MANAGE) || isAdmin;
  const canManagePeriod = hasPermission(user, PermissionCode.PERIOD_MANAGE) || isAdmin;
  const canViewVote = hasPermission(user, PermissionCode.VOTE_VIEW) || isLeader || isAdmin;
  const canViewQueryDetail = hasPermission(user, PermissionCode.QUERY_DETAIL_VIEW) || isLeader || isAdmin;

  const adminChildren: MenuItem[] = [
    ...(canManageUser ? [{ key: '/admin/user-import', icon: <InboxOutlined />, label: '用户导入' }] : []),
    ...(canManageRole ? [{ key: '/admin/roles', icon: <UserOutlined />, label: '角色管理' }] : []),
    ...(canManageDept ? [{ key: '/admin/depts', icon: <ApartmentOutlined />, label: '部门管理' }] : []),
    ...(canManageGroup ? [{ key: '/admin/groups', icon: <TeamOutlined />, label: '网格管理' }] : []),
    ...(canManageUser ? [{ key: '/admin/users', icon: <UserOutlined />, label: '用户管理' }] : []),
    ...(canManagePeriod ? [{ key: '/admin/period', icon: <SettingOutlined />, label: '周期管理' }] : []),
    ...(canManageAssign ? [{ key: '/admin/assign', icon: <UserSwitchOutlined />, label: '评分分配' }] : []),
    ...(canManageLinear ? [{ key: '/admin/linear-score', icon: <OrderedListOutlined />, label: '线性分' }] : []),
  ];

  const hasAdminEntry =
    hasAnyPermission(user, [
      PermissionCode.DEPT_MANAGE,
      PermissionCode.GROUP_MANAGE,
      PermissionCode.USER_MANAGE,
      PermissionCode.ROLE_MANAGE,
      PermissionCode.ASSIGN_MANAGE,
      PermissionCode.LINEAR_MANAGE,
      PermissionCode.PERIOD_MANAGE,
    ]) || isAdmin;

  const menuItems: MenuItem[] = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '首页' },
    ...(hasAdminEntry
      ? [
          {
            key: '/admin',
            icon: <SettingOutlined />,
            label: '系统管理',
            children: adminChildren,
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
        ...(canViewVote ? [{ key: '/vote/list', icon: <CheckSquareOutlined />, label: '投票' }] : []),
      ],
    },
    {
      key: '/query',
      icon: <FileSearchOutlined />,
      label: '查询中心',
      children: [
        { key: '/query/history', label: '我的历史' },
        ...(canViewQueryDetail ? [{ key: '/query/detail', label: '评分详情' }] : []),
      ],
    },
    {
      key: '/remind',
      icon: <BellOutlined />,
      label: '公告中心',
      children: [{ key: '/remind/list', label: '全部公告' }],
    },
  ];

  const defaultOpenKeys = useMemo(() => {
    if (location.pathname.startsWith('/admin')) return ['/admin'];
    if (location.pathname.startsWith('/score') || location.pathname.startsWith('/vote')) return ['/score'];
    if (location.pathname.startsWith('/query')) return ['/query'];
    if (location.pathname.startsWith('/remind')) return ['/remind'];
    return [];
  }, [location.pathname]);

  const menuNode = (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      openKeys={openKeys.length ? openKeys : defaultOpenKeys}
      onOpenChange={(keys) => setOpenKeys(keys as string[])}
      items={menuItems}
      onClick={({ key }) => {
        navigate(key);
        if (isMobile) onMobileClose?.();
      }}
      style={{ height: 'calc(100% - 88px)', overflowY: 'auto', overflowX: 'hidden' }}
    />
  );

  const content = (
    <>
      <div className="app-sider__brand">
        <div className="app-sider__brand-dot" />
        <div>
          <div className="app-sider__brand-title">活水预警平台</div>
          <div className="app-sider__brand-sub">EVAL MANAGEMENT</div>
        </div>
      </div>
      {menuNode}
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        open={mobileOpen}
        placement="left"
        onClose={onMobileClose}
        width={252}
        closable={false}
        className="app-sider-drawer"
        styles={{ body: { padding: 0 } }}
      >
        <div className="app-sider app-sider--mobile">{content}</div>
      </Drawer>
    );
  }

  return (
    <Sider width={252} className="app-sider">
      {content}
    </Sider>
  );
};

export default Sidebar;
