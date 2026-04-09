import { create } from 'zustand';

interface NotificationsState {
  unreadCount: number;
  hasPermission: boolean;
}

interface NotificationsActions {
  setUnreadCount: (n: number) => void;
  setHasPermission: (v: boolean) => void;
}

export const useNotificationsStore = create<NotificationsState & NotificationsActions>((set) => ({
  unreadCount: 0,
  hasPermission: false,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setHasPermission: (hasPermission) => set({ hasPermission }),
}));
