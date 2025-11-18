import { create } from 'zustand';

/**
 * UI Store
 * 전역 UI 상태 관리 (모달, 로딩, 토스트 등)
 */
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface UIState {
  isLoading: boolean;
  toasts: Toast[];
  setLoading: (loading: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  toasts: [],
  setLoading: (loading) => set({ isLoading: loading }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `toast-${Date.now()}-${Math.random()}` },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
