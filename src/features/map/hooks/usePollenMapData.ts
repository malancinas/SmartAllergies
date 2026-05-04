import { useOpenMeteoPollenGrid, type MapBounds } from './useOpenMeteoPollenGrid';

export type { MapBounds };

export function usePollenMapData(
  enabled: boolean,
  cacheBucketHours: 3 | 6 = 6,
  bounds?: MapBounds,
) {
  return useOpenMeteoPollenGrid(enabled, cacheBucketHours, bounds);
}
