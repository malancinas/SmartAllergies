import { useOpenMeteoPollenGrid } from './useOpenMeteoPollenGrid';
import type { Region } from 'react-native-maps';

export function usePollenMapData(enabled: boolean, region: Region | null = null) {
  return useOpenMeteoPollenGrid(enabled, region);
}
