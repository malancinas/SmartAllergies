import React from 'react';
import { Overlay, type Region } from 'react-native-maps';
import { ENV } from '@/config/env';
import { GOOGLE_LAYER_TYPE, type LayerType } from '../types';

interface Props {
  layerType: LayerType;
  visible: boolean;
  region: Region | null;
}

function tileZoomForDelta(delta: number): number {
  if (delta > 6) return 6;
  if (delta > 3) return 7;
  if (delta > 1.5) return 8;
  return 9;
}

function tilesForRegion(region: Region, z: number): { x: number; y: number }[] {
  const n = Math.pow(2, z);
  const minLon = Math.max(region.longitude - region.longitudeDelta / 2, -180);
  const maxLon = Math.min(region.longitude + region.longitudeDelta / 2, 180);
  const minLat = region.latitude - region.latitudeDelta / 2;
  const maxLat = region.latitude + region.latitudeDelta / 2;

  const lonToX = (lon: number) => Math.floor(((lon + 180) / 360) * n);
  const latToY = (lat: number) => {
    const r = (Math.min(Math.max(lat, -85.051), 85.051) * Math.PI) / 180;
    return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  };

  const minX = lonToX(minLon);
  const maxX = lonToX(maxLon);
  const minY = latToY(maxLat); // Y-axis is inverted: north = smaller Y
  const maxY = latToY(minLat);

  const tiles: { x: number; y: number }[] = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      tiles.push({ x, y });
    }
  }
  return tiles;
}

function tileBounds(x: number, y: number, z: number) {
  const n = Math.pow(2, z);
  const lonMin = (x / n) * 360 - 180;
  const lonMax = ((x + 1) / n) * 360 - 180;
  const latMax = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const latMin = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;
  return { latMin, latMax, lonMin, lonMax };
}

export function PollenTileLayer({ layerType, visible, region }: Props) {
  const apiKey = ENV.GOOGLE_POLLEN_API_KEY;

  if (__DEV__) {
    console.log('[PollenTileLayer]', { visible, hasKey: !!apiKey, hasRegion: !!region, layerType });
  }

  if (!apiKey || !visible || !region) return null;

  const z = tileZoomForDelta(region.latitudeDelta);
  const type = GOOGLE_LAYER_TYPE[layerType];
  const tiles = tilesForRegion(region, z).slice(0, 25);

  if (__DEV__) {
    console.log(`[PollenTileLayer] rendering ${tiles.length} tiles at zoom ${z} type ${type}`);
    console.log('[PollenTileLayer] sample URL:', `https://pollen.googleapis.com/v1/mapTypes/${type}/heatmapTiles/${z}/${tiles[0]?.x}/${tiles[0]?.y}?key=${apiKey.slice(0, 8)}...`);
  }

  return (
    <>
      {tiles.map(({ x, y }) => {
        const { latMin, latMax, lonMin, lonMax } = tileBounds(x, y, z);
        const uri = `https://pollen.googleapis.com/v1/mapTypes/${type}/heatmapTiles/${z}/${x}/${y}?key=${apiKey}`;
        return (
          <Overlay
            key={`${z}-${x}-${y}-${type}`}
            bounds={[[latMin, lonMin], [latMax, lonMax]]}
            image={{ uri }}
            opacity={0.65}
          />
        );
      })}
    </>
  );
}
