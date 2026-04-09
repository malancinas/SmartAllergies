import { create } from 'zustand';

interface UIState {
  isLoading: boolean;
  activeTabIndex: number;
}

interface UIActions {
  setLoading: (isLoading: boolean) => void;
  setActiveTab: (index: number) => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  isLoading: false,
  activeTabIndex: 0,

  setLoading: (isLoading) => set({ isLoading }),
  setActiveTab: (activeTabIndex) => set({ activeTabIndex }),
}));
