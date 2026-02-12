import request from '@/utils/request';
import { Remind } from '@/types';

// 获取未读提醒列表
export function getUnreadReminds(): Promise<Remind[]> {
  return request.get('/remind/unread');
}

// 获取未读数量
export function getUnreadCount(): Promise<number> {
  return request.get('/remind/unread-count');
}

// 标记已读
export function markRead(id: number): Promise<void> {
  return request.post(`/remind/read/${id}`);
}

// 全部标记已读
export function markAllRead(): Promise<void> {
  return request.post('/remind/read-all');
}

// 获取全部提醒（分页）
export function getRemindList(params: { pageNum: number; pageSize: number }): Promise<{
  total: number;
  list: Remind[];
}> {
  return request.get('/remind/list', { params });
}
