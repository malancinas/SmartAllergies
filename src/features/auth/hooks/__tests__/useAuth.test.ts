import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '@/stores/persistent/authStore';
import { useAuth } from '../useAuth';

// Reset the Zustand store between tests
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  });
});

jest.mock('@/services/api/auth', () => ({
  logout: jest.fn().mockResolvedValue(undefined),
}));

describe('useAuth', () => {
  it('returns isAuthenticated false when no token', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('returns isAuthenticated true when tokens are set', () => {
    act(() => {
      useAuthStore.getState().setTokens('access-token', 'refresh-token');
      useAuthStore.getState().setUser({ id: '1', name: 'John', email: 'john@example.com', createdAt: '' });
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe('John');
  });

  it('logout clears the auth store', async () => {
    act(() => {
      useAuthStore.getState().setTokens('access-token', 'refresh-token');
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
