import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateProfile, uploadAvatar } from '@/services/api/users';
import { ProfileFormValues } from './types';

export function useGetMeQuery() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => getMe(),
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileFormValues) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uri: string) => uploadAvatar(uri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
