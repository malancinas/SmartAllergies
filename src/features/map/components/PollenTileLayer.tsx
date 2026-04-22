import React from 'react';
import { UrlTile } from 'react-native-maps';
import { ENV } from '@/config/env';
import { GOOGLE_LAYER_TYPE, type LayerType } from '../types';

interface Props {
  layerType: LayerType;
}

export function PollenTileLayer({ layerType }: Props) {
  const apiKey = ENV.GOOGLE_POLLEN_API_KEY;
  if (!apiKey) return null;

  const type = GOOGLE_LAYER_TYPE[layerType];
  const urlTemplate =
    `https://pollen.googleapis.com/v1/mapTypes/${type}/heatmapTiles/{z}/{x}/{y}?key=${apiKey}`;

  return (
    <UrlTile
      urlTemplate={urlTemplate}
      opacity={0.65}
      maximumZ={8}
      minimumZ={5}
      // No flipY needed — Google tiles use standard XYZ scheme
    />
  );
}
