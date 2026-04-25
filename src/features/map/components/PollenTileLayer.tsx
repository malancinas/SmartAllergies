import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Overlay, type Region } from 'react-native-maps';
import { ENV } from '@/config/env';
import { getTileCache, setTileCache } from '@/services/database';
import { GOOGLE_LAYER_TYPE, type LayerType } from '../types';

interface TileCoord { x: number; y: number; z: number }

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

function tilesForRegion(region: Region, z: number): TileCoord[] {
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

  const tiles: TileCoord[] = [];
  for (let x = lonToX(minLon); x <= lonToX(maxLon); x++) {
    for (let y = latToY(maxLat); y <= latToY(minLat); y++) {
      tiles.push({ x, y, z });
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

async function fetchAsDataUri(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...(bytes.subarray(i, i + 8192) as unknown as number[]));
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

export function PollenTileLayer({ layerType, visible, region }: Props) {
  const apiKey = ENV.GOOGLE_POLLEN_API_KEY;
  const [uris, setUris] = useState<Map<string, string>>(new Map());
  const cancelledRef = useRef(false);

  // Tile coordinates depend only on region, not layerType
  const tileCoords = useMemo<TileCoord[]>(() => {
    if (!visible || !region || !apiKey) return [];
    const z = tileZoomForDelta(region.latitudeDelta);
    return tilesForRegion(region, z).slice(0, 25);
  }, [visible, apiKey, region?.latitude, region?.longitude, region?.latitudeDelta]);

  useEffect(() => {
    if (!visible || !apiKey || tileCoords.length === 0) {
      setUris(new Map());
      return;
    }

    cancelledRef.current = false;
    const type = GOOGLE_LAYER_TYPE[layerType];
    const today = new Date().toISOString().slice(0, 10);

    async function load() {
      const result = new Map<string, string>();

      await Promise.allSettled(
        tileCoords.map(async ({ x, y, z }) => {
          const tileKey = `${z}-${x}-${y}`;
          const cacheKey = `pollen_tile_${today}_${type}_${z}_${x}_${y}`;

          const cached = await getTileCache(cacheKey);
          if (cached) {
            result.set(tileKey, cached);
            return;
          }

          const url = `https://pollen.googleapis.com/v1/mapTypes/${type}/heatmapTiles/${z}/${x}/${y}?key=${apiKey}`;
          const dataUri = await fetchAsDataUri(url);
          await setTileCache(cacheKey, dataUri);
          result.set(tileKey, dataUri);
        }),
      );

      if (!cancelledRef.current) setUris(result);
    }

    load();
    return () => { cancelledRef.current = true; };
  }, [tileCoords, layerType, visible, apiKey]);

  if (!visible || !apiKey || !region) return null;

  return (
    <>
      {tileCoords.map(({ x, y, z }) => {
        const uri = uris.get(`${z}-${x}-${y}`);
        if (!uri) return null;
        const { latMin, latMax, lonMin, lonMax } = tileBounds(x, y, z);
        return (
          <Overlay
            key={`${z}-${x}-${y}-${GOOGLE_LAYER_TYPE[layerType]}`}
            bounds={[[latMin, lonMin], [latMax, lonMax]]}
            image={{ uri }}
            opacity={0.65}
          />
        );
      })}
    </>
  );
}
