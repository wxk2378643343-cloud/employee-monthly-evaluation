import request from '@/utils/request';
import { EvalHistory, EvalRecord, RankInfo } from '@/types';

// 员工查看互评历史
export function getMyHistory(periodId?: number): Promise<EvalHistory[]> {
  return request.get('/query/my-history', { params: { periodId } });
}

// 领导查看评分详情
export function getScoreDetail(userId: number, periodId: number): Promise<EvalRecord> {
  return request.get(`/query/score-detail/${userId}`, { params: { periodId } });
}

// 领导查看部门排名
export function getDeptRank(periodId: number, deptId?: number): Promise<RankInfo[]> {
  return request.get('/query/dept-rank', { params: { periodId, deptId } });
}

// 获取统计数据
export function getStatistics(periodId: number): Promise<{
  totalEmployees: number;
  scoredCount: number;
  pendingCount: number;
  bottomCount: number;
  warningCount: number;
}> {
  return request.get('/query/statistics', { params: { periodId } });
}
