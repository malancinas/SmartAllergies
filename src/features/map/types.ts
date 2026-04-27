import type { PollenLevel } from '@/features/pollen/types';

export type PollenLayerType = 'grass' | 'tree' | 'weed';
export type AqLayerType = 'aqi' | 'pm25' | 'pm10' | 'no2' | 'ozone' | 'so2' | 'dust';
export type LayerType = PollenLayerType | AqLayerType;

export const AQ_LAYER_TYPES: readonly AqLayerType[] = ['aqi', 'pm25', 'pm10', 'no2', 'ozone', 'so2', 'dust'];

export function isAqLayer(layer: LayerType): layer is AqLayerType {
  return (AQ_LAYER_TYPES as readonly string[]).includes(layer);
}

export type UpiCategory = 'none' | 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export const UPI_COLORS: Record<UpiCategory, string> = {
  none: '#A8D5A2',
  very_low: '#C8E6A0',
  low: '#F9E07A',
  moderate: '#F4A336',
  high: '#E05C2E',
  very_high: '#C0392B',
};

export const UPI_LABELS: Record<UpiCategory, string> = {
  none: 'None',
  very_low: 'Very Low',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
};

// Narrowed from LayerType — Google Pollen tiles only cover pollen layers
export const GOOGLE_LAYER_TYPE: Record<PollenLayerType, string> = {
  tree: 'TREE_UPI',
  grass: 'GRASS_UPI',
  weed: 'WEED_UPI',
};

export interface PollenGridFeature {
  type: 'Feature';
  geometry: { type: 'Polygon'; coordinates: number[][][] };
  properties: {
    category: UpiCategory;
    color: string;
    value: number;
  };
}

export interface PollenGridGeoJson {
  type: 'FeatureCollection';
  features: PollenGridFeature[];
}

// ─── Air Quality ─────────────────────────────────────────────────────────────

// Five-band scale matching PollenLevel but with WHO/DAQI-aligned labels.
// 'medium' from PollenLevel maps to 'moderate' here.
export type AqLevel = 'none' | 'low' | 'moderate' | 'high' | 'very_high';

export const AQ_COLORS: Record<AqLevel, string> = {
  none:      '#69C16A',
  low:       '#E8E840',
  moderate:  '#F5A623',
  high:      '#E05555',
  very_high: '#9B59B6',
};

export const AQ_LABELS: Record<AqLevel, string> = {
  none:      'Good',
  low:       'Fair',
  moderate:  'Moderate',
  high:      'Poor',
  very_high: 'Very Poor',
};

export function pollenLevelToAqLevel(level: PollenLevel): AqLevel {
  if (level === 'medium') return 'moderate';
  return level as AqLevel;
}
