import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import GroupManage from '@/pages/admin/GroupManage';
import AssignConfig from '@/pages/admin/AssignConfig';
import LinearScore from '@/pages/admin/LinearScore';
import PeriodManage from '@/pages/admin/PeriodManage';
import PendingList from '@/pages/score/PendingList';
import SubmittedList from '@/pages/score/SubmittedList';
import VotePage from '@/pages/score/VotePage';
import MyHistory from '@/pages/query/MyHistory';
import ScoreDetail from '@/pages/query/ScoreDetail';
import DeptRank from '@/pages/query/DeptRank';
import RemindList from '@/pages/remind/RemindList';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            {/* 管理员模块 */}
            <Route path="admin/groups" element={<GroupManage />} />
            <Route path="admin/assign" element={<AssignConfig />} />
            <Route path="admin/linear-score" element={<LinearScore />} />
            <Route path="admin/period" element={<PeriodManage />} />
            {/* 评价模块 */}
            <Route path="score/pending" element={<PendingList />} />
            <Route path="score/submitted" element={<SubmittedList />} />
            <Route path="vote/list" element={<VotePage />} />
            {/* 查分模块 */}
            <Route path="query/history" element={<MyHistory />} />
            <Route path="query/detail" element={<ScoreDetail />} />
            <Route path="query/rank" element={<DeptRank />} />
            {/* 提醒模块 */}
            <Route path="remind/list" element={<RemindList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
