import { useMutation } from '@tanstack/react-query';
import { upsertSignal } from '../api';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { useSubscriptionStore } from '@/stores/persistent/subscriptionStore';

interface SubmitSignalParams {
  userId: string;
  lat: number;
  lon: number;
  severity: number;
}

export function useSubmitSignal() {
  const communityShareEnabled = useSettingsStore((s) => s.communityShareEnabled);
  const tier = useSubscriptionStore((s) => s.tier);

  const mutation = useMutation({
    mutationFn: async (params: SubmitSignalParams) => {
      // Only Pro users who have opted in contribute data
      if (tier !== 'pro' || !communityShareEnabled) return;
      await upsertSignal(params);
    },
  });

  return {
    submit: mutation.mutate,
    isLoading: mutation.isPending,
  };
}
