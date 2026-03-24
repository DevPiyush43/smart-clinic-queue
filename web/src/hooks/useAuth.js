import useAuthStore from '../store/authStore';
import api from '../api/axios';
import toast from 'react-hot-toast';

const useAuth = () => {
  const store = useAuthStore();

  // Send OTP — accepts email (preferred) or phone
  const sendOtp = async (contact) => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const payload = isEmail ? { email: contact } : { phone: contact };
    const res = await api.post('/auth/send-otp', payload);
    return res.data;
  };

  // Verify OTP — pass the same contact (email or phone) used for send
  const verifyOtp = async (contact, otp) => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const payload = isEmail ? { email: contact, otp } : { phone: contact, otp };
    const res = await api.post('/auth/verify-otp', payload);
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
