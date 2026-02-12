import React, {useMemo, useState} from 'react';
import {Layout, Menu} from 'antd';
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
import {useNavigate, useLocation} from 'react-router-dom';
import {useAppSelector} from '@/store';
import {isAdminRole, isLeaderRole} from '@/types';
import {hasPermission, hasAnyPermission, PermissionCode} from '@/utils/permission';
import type {MenuProps} from 'antd';

const {Sider} = Layout;
type MenuItem = Required<MenuProps>['items'][number];

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {user} = useAppSelector((state) => state.auth);
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
    const canViewQueryRank = hasPermission(user, PermissionCode.QUERY_RANK_VIEW) || isAdmin || user?.role === 'DEPT_LEADER';

    const adminChildren: MenuItem[] = [
        ...(canManageDept ? [{key: '/admin/depts', icon: <ApartmentOutlined/>, label: '部门管理'}] : []),
        ...(canManageGroup ? [{key: '/admin/groups', icon: <TeamOutlined/>, label: '小组管理'}] : []),
        ...(canManageUser ? [{key: '/admin/users', icon: <UserOutlined/>, label: '用户管理'}] : []),
        ...(canManageRole ? [{key: '/admin/roles', icon: <UserOutlined/>, label: '角色管理'}] : []),
        ...(canManageAssign ? [{key: '/admin/assign', icon: <UserSwitchOutlined/>, label: '评分分配'}] : []),
        ...(canManageLinear ? [{key: '/admin/linear-score', icon: <OrderedListOutlined/>, label: '线性分'}] : []),
        ...(canManagePeriod ? [{key: '/admin/period', icon: <SettingOutlined/>, label: '周期管理'}] : []),
    ];

    const hasAdminEntry = hasAnyPermission(user, [
        PermissionCode.DEPT_MANAGE,
        PermissionCode.GROUP_MANAGE,
        PermissionCode.USER_MANAGE,
        PermissionCode.ROLE_MANAGE,
        PermissionCode.ASSIGN_MANAGE,
        PermissionCode.LINEAR_MANAGE,
        PermissionCode.PERIOD_MANAGE,
    ]) || isAdmin;

    const menuItems: MenuItem[] = [
        {key: '/dashboard', icon: <DashboardOutlined/>, label: '首页'},
        ...(hasAdminEntry
            ? [
                {
                    key: '/admin',
                    icon: <SettingOutlined/>,
                    label: '系统管理',
                    children: adminChildren,
                },
            ]
            : []),
        {
            key: '/score',
            icon: <EditOutlined/>,
            label: '评分管理',
            children: [
                {key: '/score/pending', label: '待评分'},
                {key: '/score/submitted', label: '已提交'},
                ...(canViewVote ? [{key: '/vote/list', icon: <CheckSquareOutlined/>, label: '投票'}] : []),
            ],
        },
        {
            key: '/query',
            icon: <FileSearchOutlined/>,
            label: '查询中心',
            children: [
                {key: '/query/history', label: '我的历史'},
                ...(canViewQueryDetail ? [{key: '/query/detail', label: '评分详情'}] : []),
                ...(canViewQueryRank ? [{key: '/query/rank', label: '部门排名'}] : []),
            ],
        },
        {
            key: '/remind',
            icon: <BellOutlined/>,
            label: '消息中心',
            children: [{key: '/remind/list', label: '全部消息'}],
        },
    ];

    const defaultOpenKeys = useMemo(() => {
        if (location.pathname.startsWith('/admin')) return ['/admin'];
        if (location.pathname.startsWith('/score') || location.pathname.startsWith('/vote')) return ['/score'];
        if (location.pathname.startsWith('/query')) return ['/query'];
        if (location.pathname.startsWith('/remind')) return ['/remind'];
        return [];
    }, [location.pathname]);

    return (
        <Sider width={252} className="app-sider">
            <div className="app-sider__brand">
                <div className="app-sider__brand-dot"/>
                <div>
                    <div className="app-sider__brand-title">红色绩效中台</div>
                    <div className="app-sider__brand-sub">EVAL MANAGEMENT</div>
                </div>
            </div>

            <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                openKeys={openKeys.length ? openKeys : defaultOpenKeys}
                onOpenChange={(keys) => setOpenKeys(keys as string[])}
                items={menuItems}
                onClick={({key}) => navigate(key)}
                style={{height: 'calc(100% - 88px)'}}
            />
        </Sider>
    );
};

export default Sidebar;
