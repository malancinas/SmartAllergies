import { useEffect } from 'react';
import { requestPermission } from '@/services/notifications';
import { useNotificationsStore } from '../store';
import { useNotificationsQuery, useMarkReadMutation } from '../api';

export function useNotifications() {
  const setHasPermission = useNotificationsStore((s) => s.setHasPermission);
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const hasPermission = useNotificationsStore((s) => s.hasPermission);

  useEffect(() => {
    requestPermission().then((granted) => setHasPermission(granted));
  }, []);

  const { data, isLoading, refetch } = useNotificationsQuery();
  const markReadMutation = useMarkReadMutation();

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setUnreadCount(unreadCount);
  }, [unreadCount]);

  return {
    notifications,
    unreadCount,
    markRead: (id: string) => markReadMutation.mutate(id),
    hasPermission,
    isLoading,
    refetch,
  };
}
