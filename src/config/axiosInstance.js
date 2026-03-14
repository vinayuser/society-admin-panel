import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';

const axiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

export const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refreshToken');
      if (refresh) {
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken: refresh });
          if (data?.success && data?.data?.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
            setAuthToken(data.data.accessToken);
            original.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return axiosInstance(original);
          }
        } catch (e) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/#/auth/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
