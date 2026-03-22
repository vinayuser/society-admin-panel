import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';

const axiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * List endpoints return { Collection: { data }, Pagination: { current_page, per_page, total_records }, ...extras }.
 * Map to the legacy shape the admin UI already uses: { data, pagination: { page, limit, total }, total, ...extras }.
 */
function normalizeListEnvelope(payload) {
  if (!payload || typeof payload !== 'object' || payload.Collection == null || payload.Pagination == null) {
    return payload;
  }
  const { Collection, Pagination, ...rest } = payload;
  const list = Array.isArray(Collection.data) ? Collection.data : [];
  const page = Pagination.current_page ?? 1;
  const limit = Pagination.per_page ?? 20;
  const total = Number(Pagination.total_records) || 0;
  return {
    ...rest,
    data: list,
    pagination: { page, limit, total },
    total,
  };
}

export const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

axiosInstance.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object') {
      res.data = normalizeListEnvelope(res.data);
    }
    return res;
  },
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
