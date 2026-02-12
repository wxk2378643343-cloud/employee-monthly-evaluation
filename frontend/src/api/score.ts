import request from '@/utils/request';
import { PendingUser, ScoreSubmit, VoteCandidate } from '@/types';

// 获取待评价人员列表
export function getPendingList(periodId: number): Promise<PendingUser[]> {
  return request.get('/score/pending-list', { params: { periodId } });
}

// 提交评分
export function submitScore(data: ScoreSubmit): Promise<void> {
  return request.post('/score/submit', data);
}

// 获取我已提交的评价
export function getMySubmitted(periodId: number): Promise<Array<{
  targetUserId: number;
  targetUserName: string;
  workRecordScore: number;
  keyIndicatorScore: number;
  keyWorkScore: number;
  comment?: string;
  createTime: string;
}>> {
  return request.get('/score/my-submitted', { params: { periodId } });
}

// 获取待投票人员（第二轮）
export function getVoteCandidates(periodId: number): Promise<VoteCandidate[]> {
  return request.get('/vote/candidates', { params: { periodId } });
}

// 提交投票
export function submitVote(data: { periodId: number; targetUserId: number; voteResult: number; voteReason?: string }): Promise<void> {
  return request.post('/vote/submit', data);
}
