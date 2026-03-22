import { useCallback } from 'react';
import api from '../api/axios';
import useQueueStore from '../store/queueStore';
import toast from 'react-hot-toast';

const CLINIC_ID = import.meta.env.VITE_CLINIC_ID;

const useQueue = (clinicId) => {
  const store = useQueueStore();
  const cId = clinicId || CLINIC_ID;

  const fetchLive = useCallback(async () => {
    if (!cId) return;
    store.setLoading(true);
    try {
      const res = await api.get(`/queue/session/live?clinicId=${cId}`);
      store.updateFromSocket(res.data);
    } catch (err) {
      console.error('fetchLive error:', err);
    } finally {
      store.setLoading(false);
    }
  }, [cId]);

  const bookToken = useCallback(async (notes = '') => {
    const res = await api.post('/token/book', { clinicId: cId, notes });
    store.setMyToken(res.data.token);
    return res.data;
  }, [cId]);

  const fetchMyToken = useCallback(async () => {
    try {
      const res = await api.get(`/token/my-active?clinicId=${cId}`);
      store.setMyToken(res.data.token);
      return res.data.token;
    } catch (err) {
      return null;
    }
  }, [cId]);

  const cancelToken = useCallback(async (tokenId) => {
    await api.post('/queue/cancel', { tokenId });
    store.clearMyToken();
    toast.success('Token cancelled successfully.');
  }, []);

  const callNext = useCallback(async () => {
    const res = await api.post('/queue/call-next', { clinicId: cId });
    return res.data;
  }, [cId]);

  const skipPatient = useCallback(async (tokenId) => {
    const res = await api.post('/queue/skip', { clinicId: cId, tokenId });
    return res.data;
  }, [cId]);

  const completeToken = useCallback(async (tokenId) => {
    const res = await api.post('/queue/complete', { clinicId: cId, tokenId });
    return res.data;
  }, [cId]);

  const closeSession = useCallback(async () => {
    await api.post('/queue/close-session', { clinicId: cId });
    toast.success("Today's queue has been closed.");
  }, [cId]);

  const toggleAccepting = useCallback(async (isAcceptingNew) => {
    const res = await api.post('/queue/toggle-accepting', { clinicId: cId, isAcceptingNew });
    return res.data;
  }, [cId]);

  return {
    ...store,
    fetchLive,
    bookToken,
    fetchMyToken,
    cancelToken,
    callNext,
    skipPatient,
    completeToken,
    closeSession,
    toggleAccepting,
  };
};

export default useQueue;
