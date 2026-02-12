import request from '@/utils/request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  userId: number;
  username: string;
  realName: string;
  role: string;
}

export function login(data: LoginParams): Promise<LoginResult> {
  return request.post('/auth/login', data);
}

export function logout(): Promise<void> {
  return request.post('/auth/logout');
}

export function getUserInfo(): Promise<any> {
  return request.get('/auth/info');
}
