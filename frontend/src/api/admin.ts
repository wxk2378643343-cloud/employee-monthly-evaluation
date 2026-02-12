import request from '@/utils/request';
import { Group, AssignRow, LinearScore, EvalPeriod, User, Department, PeriodStatus } from '@/types';

export function getDeptList(): Promise<Department[]> {
  return request.get('/depts');
}

export function saveDept(data: Partial<Department>): Promise<void> {
  if (data.id) return request.put(`/depts/${data.id}`, data);
  return request.post('/depts', data);
}

export function deleteDept(id: number): Promise<void> {
  return request.delete(`/depts/${id}`);
}

export function getGroupList(deptId?: number): Promise<Group[]> {
  if (deptId) return request.get(`/groups/by-dept/${deptId}`);
  return request.get('/groups');
}

export function saveGroup(data: Partial<Group>): Promise<void> {
  if (data.id) return request.put(`/groups/${data.id}`, data);
  return request.post('/groups', data);
}

export function deleteGroup(id: number): Promise<void> {
  return request.delete(`/groups/${id}`);
}

export function getGroupUsers(groupId: number): Promise<User[]> {
  return request.get(`/users/by-group/${groupId}`);
}

export function getLeaderList(): Promise<User[]> {
  return getUserList().then((list) =>
    list.filter((u) => ['ADMIN', 'DEPT_LEADER', 'GROUP_LEADER'].includes(u.role))
  );
}

export function getUserList(params?: { deptId?: number; role?: string; keyword?: string }): Promise<User[]> {
  return request
    .get('/users', { params: { pageSize: 1000, ...params } })
    .then((res: any) => (Array.isArray(res?.records) ? res.records : []));
}

export function saveUser(data: Partial<User> & { password?: string }): Promise<void> {
  if (data.id) return request.put(`/users/${data.id}`, data);
  return request.post('/users', data);
}

export function resetUserPassword(id: number, newPassword: string): Promise<void> {
  return request.post(`/users/${id}/reset-password`, null, { params: { newPassword } });
}

export function deleteUser(id: number): Promise<void> {
  return request.delete(`/users/${id}`);
}

export function getAssignList(periodId: number): Promise<AssignRow[]> {
  return request.get('/admin/assigns', { params: { periodId } });
}

export function saveAssign(data: { periodId: number; assignments: AssignRow[] }): Promise<void> {
  return request.post(
    '/admin/assigns/batch',
    data.assignments.map((a) => ({
      periodId: data.periodId,
      scorerId: a.scorerId,
      targetId: a.targetId,
      evalType: a.evalType,
      weight: a.weight ?? 0,
    }))
  );
}

export function deleteAssign(id: number): Promise<void> {
  return request.delete(`/admin/assigns/${id}`);
}

export function copyAssign(data: { sourcePeriodId: number; targetPeriodId: number }): Promise<void> {
  return request.post('/admin/assigns/copy', null, { params: data });
}

export function getLinearScoreList(periodId: number, deptId?: number): Promise<LinearScore[]> {
  return request.get('/admin/linear-scores', { params: { periodId, deptId } });
}

export function saveLinearScores(data: {
  periodId: number;
  scores: { targetId: number; linearRankScore: number }[];
}): Promise<void> {
  return request.post(
    '/admin/linear-scores/batch',
    data.scores.map((s) => ({
      periodId: data.periodId,
      targetId: s.targetId,
      linearRankScore: s.linearRankScore,
    }))
  );
}

export function getPeriodList(): Promise<EvalPeriod[]> {
  return request.get('/periods');
}

export function savePeriod(data: Partial<EvalPeriod>): Promise<void> {
  if (data.id) return request.put(`/periods/${data.id}`, data);
  return request.post('/periods', data);
}

export function updatePeriodStatus(id: number, status: PeriodStatus): Promise<void> {
  if (status === PeriodStatus.IN_PROGRESS) return request.post(`/periods/${id}/start`);
  if (status === PeriodStatus.ENDED) return request.post(`/periods/${id}/end`);
  return request.put(`/periods/${id}`, { status });
}
