import request from '@/utils/request';
import { Remind } from '@/types';

export function getUnreadReminds(): Promise<Remind[]> {
  return request.get('/reminds/unread');
}

export function getUnreadCount(): Promise<number> {
  return request.get('/reminds/unread-count');
}

export function markRead(id: number): Promise<void> {
  return request.post(`/reminds/${id}/read`);
}

export function markAllRead(): Promise<void> {
  return request.post('/reminds/read-all');
}

export function sendUserRemind(periodId: number, userId: number): Promise<void> {
  return request.post(`/reminds/send/${periodId}/user/${userId}`);
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
