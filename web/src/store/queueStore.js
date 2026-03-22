import { create } from 'zustand';

const useQueueStore = create((set) => ({
  session: null,
  myToken: null,
  currentToken: 0,
  currentTokenName: '',
  queue: [],
  queueLength: 0,
  doneCount: 0,
  skippedCount: 0,
  isAcceptingNew: true,
  estimatedWait: 0,
  isLoading: false,
  lastUpdated: null,

  setSession: (session) =>
    set({
      session,
      currentToken: session?.currentToken || 0,
      currentTokenName: session?.currentTokenName || '',
      queue: session?.queue || [],
      queueLength: session?.queue?.length || 0,
      doneCount: session?.doneCount || 0,
      isAcceptingNew: session?.isAcceptingNew ?? true,
    }),

  updateFromSocket: (payload) => {
    set({
      currentToken: payload.currentToken,
      currentTokenName: payload.currentTokenName,
      queue: payload.queue || [],
      queueLength: payload.queueLength,
      doneCount: payload.doneCount,
      skippedCount: payload.skippedCount,
      isAcceptingNew: payload.isAcceptingNew,
      estimatedWait: payload.estimatedWait,
      lastUpdated: payload.updatedAt,
    });
  },

  setMyToken: (token) => set({ myToken: token }),
  clearMyToken: () => set({ myToken: null }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export default useQueueStore;
