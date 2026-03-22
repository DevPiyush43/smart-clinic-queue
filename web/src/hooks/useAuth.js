import useAuthStore from '../store/authStore';
import api from '../api/axios';
import toast from 'react-hot-toast';

const useAuth = () => {
  const store = useAuthStore();

  const sendOtp = async (phone) => {
    const res = await api.post('/auth/send-otp', { phone });
    return res.data;
  };

  const verifyOtp = async (phone, otp) => {
    const res = await api.post('/auth/verify-otp', { phone, otp });
    const { token, user } = res.data;
    store.login(user, token);
    return res.data;
  };

  const doctorLogin = async (phone, password) => {
    const res = await api.post('/auth/doctor-login', { phone, password });
    const { token, user } = res.data;
    store.login(user, token);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    store.logout();
    toast.success('Logged out successfully.');
  };

  const updateProfile = async (fields) => {
    const res = await api.put('/auth/profile', fields);
    store.updateUser(res.data.user);
    return res.data;
  };

  return {
    ...store,
    sendOtp,
    verifyOtp,
    doctorLogin,
    logout,
    updateProfile,
  };
};

export default useAuth;
