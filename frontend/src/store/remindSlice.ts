import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Remind } from '@/types';
import * as remindApi from '@/api/remind';

interface RemindState {
  unreadCount: number;
  reminds: Remind[];
  loading: boolean;
}

const initialState: RemindState = {
  unreadCount: 0,
  reminds: [],
  loading: false,
};

// 获取未读数量
export const fetchUnreadCount = createAsyncThunk(
  'remind/fetchUnreadCount',
  async () => {
    const count = await remindApi.getUnreadCount();
    return count;
  }
);

// 获取未读提醒
export const fetchUnreadReminds = createAsyncThunk(
  'remind/fetchUnreadReminds',
  async () => {
    const reminds = await remindApi.getUnreadReminds();
    return reminds;
  }
);

// 标记已读
export const markRead = createAsyncThunk(
  'remind/markRead',
  async (id: number) => {
    await remindApi.markRead(id);
    return id;
  }
);

// 全部标记已读
export const markAllRead = createAsyncThunk('remind/markAllRead', async () => {
  await remindApi.markAllRead();
});

const remindSlice = createSlice({
  name: 'remind',
  initialState,
  reducers: {
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadReminds.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnreadReminds.fulfilled, (state, action) => {
        state.loading = false;
        state.reminds = action.payload;
      })
      .addCase(fetchUnreadReminds.rejected, (state) => {
        state.loading = false;
      })
      .addCase(markRead.fulfilled, (state, action) => {
        state.reminds = state.reminds.filter((r) => r.id !== action.payload);
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.reminds = [];
        state.unreadCount = 0;
      });
  },
});

export const { setUnreadCount } = remindSlice.actions;
export default remindSlice.reducer;
