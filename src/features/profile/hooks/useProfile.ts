import { useAuthStore } from '@/stores/persistent/authStore';
import { useGetMeQuery } from '../api';
import { UserProfile } from '@/types';

export function useProfile() {
  const storeUser = useAuthStore((s) => s.user);
  const { data, isLoading, error } = useGetMeQuery();

  const serverUser = data ?? null;

  const profile: UserProfile | null = serverUser
    ? {
        ...storeUser,
        ...serverUser,
        notificationsEnabled: true,
      }
    : storeUser
      ? { ...storeUser, notificationsEnabled: true }
      : null;

  return { profile, isLoading, error };
}
