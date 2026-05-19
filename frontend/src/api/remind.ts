import request from '@/utils/request';
import { Notice, Remind } from '@/types';

export function getUnreadReminds(): Promise<Remind[]> {
  return request.get('/reminds/unread');
}

export function getUnreadCount(): Promise<number> {
  return request.get('/reminds/unread-count');
}

export function markRead(id: number): Promise<void> {
  return request.post(`/reminds/${id}/read`);
}

export function markUnread(id: number): Promise<void> {
  return request.post(`/reminds/${id}/unread`);
}

export function markAllRead(): Promise<void> {
  return request.post('/reminds/read-all');
}

export function sendUserRemind(periodId: number, userId: number): Promise<void> {
  return request.post(`/reminds/send/${periodId}/user/${userId}`);
}

export function sendPeriodRemind(periodId: number): Promise<void> {
  return request.post(`/reminds/send/${periodId}`);
}

export function publishMessage(data: { userIds: number[]; periodId?: number; content: string }): Promise<void> {
  return request.post('/reminds/publish', data);
}

export function getNotices(periodId?: number): Promise<Notice[]> {
  return request.get('/reminds/notices', { params: { periodId } });
}

export function updateNotice(id: number, data: { content: string }): Promise<void> {
  return request.put(`/reminds/notices/${id}`, data);
}

export function recallNotice(id: number): Promise<void> {
  return request.post(`/reminds/notices/${id}/recall`);
}

export function getRemindList(params: { pageNum: number; pageSize: number; periodId?: number }): Promise<{
  total: number;
  list: Remind[];
}> {
  return request.get('/reminds/mine', { params: { periodId: params.periodId } }).then((res: any) => {
    const list = Array.isArray(res) ? (res as Remind[]) : [];
    const start = (params.pageNum - 1) * params.pageSize;
    const paged = list.slice(start, start + params.pageSize);
    return { total: list.length, list: paged };
  });
}

export function getMyReminds(periodId?: number): Promise<Remind[]> {
  return request.get('/reminds/mine', { params: { periodId } }).then((res: any) =>
    Array.isArray(res) ? (res as Remind[]) : []
  );
}
