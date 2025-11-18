import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Institution Store
 * 현재 선택된 기관 정보 관리 (세션 유지)
 */
interface InstitutionState {
  currentInstitutionId: string | null;
  setCurrentInstitutionId: (id: string | null) => void;
  clearInstitution: () => void;
}

export const useInstitutionStore = create<InstitutionState>()(
  persist(
    (set) => ({
      currentInstitutionId: null,
      setCurrentInstitutionId: (id) => set({ currentInstitutionId: id }),
      clearInstitution: () => set({ currentInstitutionId: null }),
    }),
    {
      name: 'institution-storage',
    },
  ),
);
