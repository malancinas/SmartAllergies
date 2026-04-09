import apiClient from './client';
import { User } from '@/types';

export function getMe(): Promise<User> {
  return apiClient.get<User>('/users/me').then((r) => r.data);
}

export function updateProfile(data: Partial<Pick<User, 'name'>> & Record<string, unknown>): Promise<User> {
  return apiClient.patch<User>('/users/me', data).then((r) => r.data);
}

export function uploadAvatar(uri: string): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('avatar', {
    uri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  return apiClient
    .post<{ avatarUrl: string }>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}
