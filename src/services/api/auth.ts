import apiClient from './client';
import { AuthResponse, TokenPair } from '@/features/auth/types';

export async function loginWithEmail(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', { name, email, password });
  return data;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function refreshToken(token: string): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('/auth/refresh', { refreshToken: token });
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/google', { idToken });
  return data;
}

export async function loginWithApple(identityToken: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/apple', { identityToken });
  return data;
}
