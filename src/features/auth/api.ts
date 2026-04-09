import { useMutation } from '@tanstack/react-query';
import {
  loginWithEmail,
  registerWithEmail,
  forgotPassword,
  loginWithGoogle,
  loginWithApple,
} from '@/services/api/auth';
import { useAuthStore } from '@/stores/persistent/authStore';
import { Platform } from 'react-native';

export function useLoginMutation() {
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginWithEmail(email, password),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
    },
  });
}

export function useRegisterMutation() {
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }) => registerWithEmail(name, email, password),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => forgotPassword(email),
  });
}

export function useGoogleSignInMutation() {
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('Google sign-in failed: no idToken returned');
      return loginWithGoogle(idToken);
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
    },
  });
}

export function useAppleSignInMutation() {
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (Platform.OS !== 'ios') throw new Error('Apple Sign-In is only available on iOS');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AppleAuth = require('expo-apple-authentication');
      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });
      const { identityToken } = credential;
      if (!identityToken) throw new Error('Apple sign-in failed: no identityToken');
      return loginWithApple(identityToken);
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
    },
  });
}
