import request from '@/utils/request';
import { User } from '@/types';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

// 用户登录
export function login(data: LoginParams): Promise<LoginResult> {
  return request.post('/auth/login', data);
}

// 退出登录
export function logout(): Promise<void> {
  return request.post('/auth/logout');
}

// 获取当前用户信息
export function getUserInfo(): Promise<User> {
  return request.get('/auth/info');
}
