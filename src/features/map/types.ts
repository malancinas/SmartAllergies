export type LayerType = 'grass' | 'tree' | 'weed';

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

export const GOOGLE_LAYER_TYPE: Record<LayerType, string> = {
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
