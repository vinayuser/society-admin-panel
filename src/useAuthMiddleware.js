import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUserProfile, logoutUser } from './store/slices/authSlice';
import { setAuthToken } from './config/axiosInstance';

const useAuthMiddleware = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const verifyUser = async () => {
      if (user) {
        setLoading(false);
        return;
      }
      if (!token) {
        navigate('/auth/login');
        return setLoading(false);
      }
      setAuthToken(token);
      try {
        await dispatch(fetchCurrentUserProfile()).unwrap();
      } catch {
        logoutUser();
      } finally {
        setLoading(false);
      }
    };
    verifyUser();
  }, [user, token, dispatch, navigate]);

  return { loading };
};

export default useAuthMiddleware;
