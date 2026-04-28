import { useOpenMeteoPollenGrid } from './useOpenMeteoPollenGrid';

export function usePollenMapData(
  enabled: boolean,
  cacheBucketHours: 3 | 6 = 6,
) {
  return useOpenMeteoPollenGrid(enabled, cacheBucketHours);
}
