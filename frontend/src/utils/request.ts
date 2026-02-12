import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';
import { getToken, removeToken } from './auth';
import { message } from '@/utils/message';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

function redirectToLoginIfNeeded() {
  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

function handleUnauthorized(defaultMessage = '登录已过期，请重新登录') {
  removeToken();
  message.error(defaultMessage);
  redirectToLoginIfNeeded();
}

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

request.interceptors.response.use(
  (response): any => {
    const res = response.data as ApiResponse;
    if (res.code !== 200) {
      if (res.code === 401) {
        handleUnauthorized(res.message || '登录已过期，请重新登录');
      } else {
        message.error(res.message || '请求失败');
      }
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res.data;
  },
  (error: AxiosError<ApiResponse>) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        handleUnauthorized(data?.message || '登录已过期，请重新登录');
      } else if (status === 403) {
        message.error('没有权限访问');
      } else {
        message.error(data?.message || '服务器错误');
      }
    } else {
      message.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

export default request;
