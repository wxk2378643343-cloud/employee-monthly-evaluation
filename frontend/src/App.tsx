import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import GroupManage from '@/pages/admin/GroupManage';
import AssignConfig from '@/pages/admin/AssignConfig';
import LinearScore from '@/pages/admin/LinearScore';
import PeriodManage from '@/pages/admin/PeriodManage';
import DeptManage from '@/pages/admin/DeptManage';
import UserManage from '@/pages/admin/UserManage';
import RoleManage from '@/pages/admin/RoleManage';
import UserImport from '@/pages/admin/UserImport';
import PendingList from '@/pages/score/PendingList';
import SubmittedList from '@/pages/score/SubmittedList';
import VotePage from '@/pages/score/VotePage';
import MyHistory from '@/pages/query/MyHistory';
import ScoreDetail from '@/pages/query/ScoreDetail';
import RemindList from '@/pages/remind/RemindList';
import ProfilePage from '@/pages/profile';
import { useAppSelector } from '@/store';
import { isAdminRole, isLeaderRole } from '@/types';
import { hasPermission, PermissionCode } from '@/utils/permission';

interface RequirePermProps {
  allow: boolean;
  element: React.ReactElement;
}

const RequirePerm: React.FC<RequirePermProps> = ({ allow, element }) =>
  allow ? element : <Navigate to="/dashboard" replace />;

const App: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const canVote = hasPermission(user, PermissionCode.VOTE_VIEW) || isAdminRole(user?.role) || isLeaderRole(user?.role);
  const canQueryDetail =
    hasPermission(user, PermissionCode.QUERY_DETAIL_VIEW) || isAdminRole(user?.role) || isLeaderRole(user?.role);

  const canManageDept = hasPermission(user, PermissionCode.DEPT_MANAGE) || isAdminRole(user?.role);
  const canManageGroup = hasPermission(user, PermissionCode.GROUP_MANAGE) || isAdminRole(user?.role);
  const canManageUser = hasPermission(user, PermissionCode.USER_MANAGE) || isAdminRole(user?.role);
  const canManageRole = hasPermission(user, PermissionCode.ROLE_MANAGE) || isAdminRole(user?.role);
  const canManageAssign = hasPermission(user, PermissionCode.ASSIGN_MANAGE) || isAdminRole(user?.role);
  const canManageLinear = hasPermission(user, PermissionCode.LINEAR_MANAGE) || isAdminRole(user?.role);
  const canManagePeriod = hasPermission(user, PermissionCode.PERIOD_MANAGE) || isAdminRole(user?.role);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#D32F2F',
          colorInfo: '#D32F2F',
          borderRadius: 10,
          wireframe: false,
          colorBgLayout: '#f7f8fb',
          colorTextBase: '#1f1f23',
        },
        components: {
          Layout: {
            headerBg: '#8f1818',
          },
          Menu: {
            darkItemSelectedBg: '#D32F2F',
          },
          Card: {
            borderRadiusLG: 14,
          },
          Button: {
            borderRadius: 8,
          },
        },
      }}
    >
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="admin/depts" element={<RequirePerm allow={canManageDept} element={<DeptManage />} />} />
            <Route path="admin/groups" element={<RequirePerm allow={canManageGroup} element={<GroupManage />} />} />
            <Route path="admin/users" element={<RequirePerm allow={canManageUser} element={<UserManage />} />} />
            <Route path="admin/user-import" element={<RequirePerm allow={canManageUser} element={<UserImport />} />} />
            <Route path="admin/roles" element={<RequirePerm allow={canManageRole} element={<RoleManage />} />} />
            <Route path="admin/assign" element={<RequirePerm allow={canManageAssign} element={<AssignConfig />} />} />
            <Route
              path="admin/linear-score"
              element={<RequirePerm allow={canManageLinear} element={<LinearScore />} />}
            />
            <Route path="admin/period" element={<RequirePerm allow={canManagePeriod} element={<PeriodManage />} />} />

            <Route path="score/pending" element={<PendingList />} />
            <Route path="score/submitted" element={<SubmittedList />} />
            <Route path="vote/list" element={<RequirePerm allow={canVote} element={<VotePage />} />} />

            <Route path="query/history" element={<MyHistory />} />
            <Route path="query/detail" element={<RequirePerm allow={canQueryDetail} element={<ScoreDetail />} />} />

            <Route path="remind/list" element={<RemindList />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
