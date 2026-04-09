import { useAuthStore } from '@/stores/persistent/authStore';
import { logout as apiLogout } from '@/services/api/auth';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const isLoading = false;

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // Proceed with local logout even if the server call fails
    } finally {
      clearAuth();
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    accessToken,
    logout,
  };
}
