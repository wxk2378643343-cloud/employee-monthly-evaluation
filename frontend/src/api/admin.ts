import request from '@/utils/request';
import { Group, ScoreAssign, LinearScore, EvalPeriod, User, Department } from '@/types';

// 获取部门列表
export function getDeptList(): Promise<Department[]> {
  return request.get('/admin/dept/list');
}

// 获取小组列表
export function getGroupList(deptId?: number): Promise<Group[]> {
  return request.get('/admin/group/list', { params: { deptId } });
}

// 新增/编辑小组
export function saveGroup(data: Partial<Group>): Promise<void> {
  return request.post('/admin/group', data);
}

// 删除小组
export function deleteGroup(id: number): Promise<void> {
  return request.delete(`/admin/group/${id}`);
}

// 获取小组下的员工
export function getGroupUsers(groupId: number): Promise<User[]> {
  return request.get(`/admin/group/${groupId}/users`);
}

// 获取所有领导列表（用于分配配置）
export function getLeaderList(): Promise<User[]> {
  return request.get('/admin/leaders');
}

// 获取某周期的打分分配
export function getAssignList(periodId: number): Promise<ScoreAssign[]> {
  return request.get('/admin/assign/list', { params: { periodId } });
}

// 保存打分分配
export function saveAssign(data: { periodId: number; assignments: ScoreAssign[] }): Promise<void> {
  return request.post('/admin/assign/save', data);
}

// 从上期复制分配方案
export function copyAssign(data: { sourcePeriodId: number; targetPeriodId: number }): Promise<void> {
  return request.post('/admin/assign/copy', data);
}

// 获取线性排名分列表
export function getLinearScoreList(periodId: number, deptId?: number): Promise<LinearScore[]> {
  return request.get('/admin/linear-score/list', { params: { periodId, deptId } });
}

// 批量设置线性排名分
export function saveLinearScores(data: { periodId: number; scores: { userId: number; linearRankScore: number }[] }): Promise<void> {
  return request.post('/admin/linear-score/save', data);
}

// 获取评价周期列表
export function getPeriodList(): Promise<EvalPeriod[]> {
  return request.get('/admin/period/list');
}

// 新增/编辑评价周期
export function savePeriod(data: Partial<EvalPeriod>): Promise<void> {
  return request.post('/admin/period', data);
}

// 更新周期状态
export function updatePeriodStatus(id: number, status: number): Promise<void> {
  return request.put(`/admin/period/${id}/status`, { status });
}

// 获取用户列表
export function getUserList(params?: { deptId?: number; groupId?: number; roleType?: number }): Promise<User[]> {
  return request.get('/admin/user/list', { params });
}

// 新增/编辑用户
export function saveUser(data: Partial<User>): Promise<void> {
  return request.post('/admin/user', data);
}
