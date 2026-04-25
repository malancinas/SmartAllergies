import React from 'react';
import { Polygon } from 'react-native-maps';
import type { PollenGridGeoJson } from '../types';

interface Props {
  geojson: PollenGridGeoJson | null;
}

export function PollenPolygonLayer({ geojson }: Props) {
  if (!geojson) return null;

  return (
    <>
      {geojson.features.map((feature, i) => {
        // GeoJSON coords are [lng, lat]; react-native-maps needs { latitude, longitude }
        const ring = feature.geometry.coordinates[0];
        const coordinates = ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

        return (
          <Polygon
            key={i}
            coordinates={coordinates}
            fillColor={`${feature.properties.color}8C`}
            strokeColor={`${feature.properties.color}8C`}
            strokeWidth={1.5}
          />
        );
      })}
    </>
  );
}
