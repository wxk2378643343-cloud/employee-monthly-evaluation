import request from '@/utils/request';
import { EvalHistory, RankInfo, ScoreDetailItem } from '@/types';

export function getMyHistory(periodId?: number): Promise<EvalHistory[]> {
  return request.get('/query/my-history').then((res: any) => {
    const list = Array.isArray(res) ? (res as EvalHistory[]) : [];
    return periodId ? list.filter((item) => item.periodId === periodId) : list;
  }
  );
}

export function getHistoryByUser(userId: number): Promise<EvalHistory[]> {
  return request.get(`/query/history/${userId}`);
}

export function getScoreDetails(periodId: number, targetId: number): Promise<ScoreDetailItem[]> {
  return request.get('/query/details', { params: { periodId, targetId } });
}

export function getDeptRank(periodId: number, deptId?: number): Promise<RankInfo[]> {
  return request.get('/query/ranking', { params: { periodId, deptId } });
}

export function getStatistics(periodId: number): Promise<{
  totalEmployees: number;
  scoredCount: number;
  pendingCount: number;
  bottomCount: number;
  warningCount: number;
}> {
  return request.get('/query/statistics', { params: { periodId } });
}
