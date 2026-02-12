import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';
import * as authApi from '@/api/auth';
import { setToken, removeToken, getToken } from '@/utils/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: getToken(),
  loading: false,
};

// 登录
export const login = createAsyncThunk(
  'auth/login',
  async (params: authApi.LoginParams) => {
    const result = await authApi.login(params);
    setToken(result.token);
    return result;
  }
);

// 获取用户信息
export const fetchUserInfo = createAsyncThunk(
  'auth/fetchUserInfo',
  async () => {
    const user = await authApi.getUserInfo();
    return user;
  }
);

// 退出登录
export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
  removeToken();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
      removeToken();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export const { setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
