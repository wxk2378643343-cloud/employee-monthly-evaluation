import request from '@/utils/request';

export interface LoginParams {
  phone: string;
  password: string;
}

export interface LoginResult {
  token: string;
  userId: number;
  username: string;
  realName: string;
  role: string;
  permissions?: string[];
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

export function updateProfile(data: {
  realName: string;
  phone?: string;
  dingtalkId?: string;
}): Promise<void> {
  return request.put('/auth/profile', data);
}

export function changePassword(data: {
  oldPassword: string;
  newPassword: string;
}): Promise<void> {
  return request.put('/auth/password', data);
}
