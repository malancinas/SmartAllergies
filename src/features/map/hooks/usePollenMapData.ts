import { useOpenMeteoPollenGrid } from './useOpenMeteoPollenGrid';
import type { Region } from 'react-native-maps';

export function usePollenMapData(
  enabled: boolean,
  region: Region | null = null,
  cacheBucketHours: 3 | 6 = 6,
) {
  return useOpenMeteoPollenGrid(enabled, region, cacheBucketHours);
}
