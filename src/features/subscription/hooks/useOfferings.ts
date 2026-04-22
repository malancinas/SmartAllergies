import { useQuery } from '@tanstack/react-query';
import Purchases from 'react-native-purchases';
import { ENV } from '@/config/env';

export function useOfferings() {
  return useQuery({
    queryKey: ['rc-offerings'],
    queryFn: () => Purchases.getOfferings(),
    staleTime: 10 * 60 * 1000,
    enabled: !!(ENV.REVENUECAT_IOS_KEY || ENV.REVENUECAT_ANDROID_KEY),
    retry: 1,
  });
}
