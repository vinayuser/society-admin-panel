import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ENDPOINTS from '../../config/apiUrls';
import axiosInstance, { setAuthToken } from '../../config/axiosInstance';
import { getUserRoleInfo } from '../../helpers/roleUtils';

const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('accessToken') || null,
  loading: false,
  error: null,
  userRoleInfo: { isSuperAdmin: false, isSocietyAdmin: false, role: null },
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(ENDPOINTS.AUTH.LOGIN, { email, password });
      if (!data?.success || !data?.data?.accessToken) {
        return rejectWithValue(data?.message || 'Invalid credentials');
      }
      const { accessToken, refreshToken, user } = data.data;
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user?.role || '');
      if (user?.societyId) localStorage.setItem('societyId', String(user.societyId));
      if (user?.societyAlias) localStorage.setItem('societyAlias', user.societyAlias);
      setAuthToken(accessToken);
      return { user, accessToken };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const fetchCurrentUserProfile = createAsyncThunk(
  'auth/fetchCurrentUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(ENDPOINTS.AUTH.ME);
      if (data?.success && data?.data) {
        return data.data;
      }
      return rejectWithValue('Failed to fetch profile');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Session expired');
    }
  }
);

export const logoutUser = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
  localStorage.removeItem('societyId');
  localStorage.removeItem('societyAlias');
  setAuthToken(null);
  window.location.href = '/#/auth/login';
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.userRoleInfo = getUserRoleInfo(action.payload.user);
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCurrentUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.userRoleInfo = getUserRoleInfo(action.payload);
        state.error = null;
      })
      .addCase(fetchCurrentUserProfile.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
