import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: (userData, jwt) => {
    localStorage.setItem('scq_token', jwt);
    localStorage.setItem('scq_user', JSON.stringify(userData));
    set({
      user: userData,
      token: jwt,
      isAuthenticated: true,
      error: null,
    });
  },

  logout: () => {
    localStorage.removeItem('scq_token');
    localStorage.removeItem('scq_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('scq_token');
    const userStr = localStorage.getItem('scq_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
        return;
      } catch (e) {
        // Invalid JSON
      }
    }
    set({ isLoading: false });
  },

  updateUser: (fields) => {
    set((state) => {
      const updated = { ...state.user, ...fields };
      localStorage.setItem('scq_user', JSON.stringify(updated));
      return { user: updated };
    });
  },

  setError: (msg) => set({ error: msg }),
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
