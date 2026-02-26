import request from '@/utils/request';
import { PendingUser, ScoreSubmit, VoteCandidate, VoteRecord } from '@/types';

export function getPendingList(periodId: number): Promise<PendingUser[]> {
  return request.get('/scores/pending', { params: { periodId } });
}

export function submitScore(data: ScoreSubmit): Promise<void> {
  return request.post('/scores/submit', data);
}

export function calculateScores(periodId: number): Promise<void> {
  return request.post(`/scores/calculate/${periodId}`);
}

export function getMySubmitted(periodId: number): Promise<PendingUser[]> {
  return getPendingList(periodId).then((list) => list.filter((item) => item.status === 1));
}

export function getVoteCandidates(periodId: number): Promise<VoteCandidate[]> {
  return request.get('/query/ranking', { params: { periodId } });
}

export function getMyVotes(periodId: number): Promise<VoteRecord[]> {
  return request.get('/votes/my', { params: { periodId } });
}

export function submitVote(data: {
  periodId: number;
  targetId: number;
  voteType: 'EXCELLENT' | 'POOR';
}): Promise<void> {
  return request.post('/votes', {
    periodId: data.periodId,
    candidateId: data.targetId,
    voteType: data.voteType,
  });
}
