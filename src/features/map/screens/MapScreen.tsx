import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { UrlTile, type Region, type MapEvent } from 'react-native-maps';
import { useLocation } from '@/features/pollen/hooks/useLocation';
import { useCurrentPollen } from '@/features/pollen/hooks/useCurrentPollen';
import { useProGate } from '@/features/subscription/hooks/useProGate';
import { PaywallSheet } from '@/features/subscription/components/PaywallSheet';
import { usePollenMapData } from '../hooks/usePollenMapData';
import { PollenLegend } from '../components/PollenLegend';
import { LayerSelector } from '../components/LayerSelector';
import { PollenTileLayer } from '../components/PollenTileLayer';
import { PollenPolygonLayer } from '../components/PollenPolygonLayer';
import { LocationInfoSheet } from '../components/LocationInfoSheet';
import { UpgradeMapSheet } from '../components/UpgradeMapSheet';
import type { LayerType } from '../types';
import type { Coordinates } from '@/features/pollen/types';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const DEFAULT_REGION: Region = {
  latitude: 53.5,
  longitude: -1.5,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

function highestLayer(today: ReturnType<typeof useCurrentPollen>['today']): LayerType {
  if (!today) return 'grass';
  const order = ['none', 'low', 'medium', 'high', 'very_high'];
  const rank = (l: string) => order.indexOf(l);
  const scores = {
    tree: rank(today.tree.level),
    grass: rank(today.grass.level),
    weed: rank(today.weed.level),
  };
  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as LayerType);
}

export default function MapScreen() {
  const { location } = useLocation();
  const { today } = useCurrentPollen();
  const { isPro, showPaywall, paywallProps } = useProGate();

  const mapRef = useRef<MapView>(null);
  const centeredRef = useRef(false);

  const defaultLayer = useMemo(() => highestLayer(today), [today]);
  const [selectedLayer, setSelectedLayer] = useState<LayerType>(defaultLayer);

  const [tappedCoord, setTappedCoord] = useState<Coordinates | null>(null);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  const { gridData } = usePollenMapData(!isPro);

  // Animate to user location once it resolves (it loads async after mount)
  useEffect(() => {
    if (!location || centeredRef.current || !mapRef.current) return;
    centeredRef.current = true;
    mapRef.current.animateToRegion(
      { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 2.5, longitudeDelta: 2.5 },
      800,
    );
  }, [location]);

  const initialRegion: Region = DEFAULT_REGION;

  function handleMapPress(e: MapEvent) {
    const coord = e.nativeEvent.coordinate;
    if (isPro) {
      setTappedCoord({ latitude: coord.latitude, longitude: coord.longitude });
      setShowLocationSheet(true);
    } else {
      setShowUpgradeSheet(true);
    }
  }

  function handleLocateMe() {
    if (!location || !mapRef.current) return;
    mapRef.current.animateToRegion(
      { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      500,
    );
  }

  const levels = today
    ? { tree: today.tree.level, grass: today.grass.level, weed: today.weed.level }
    : undefined;

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        // Free tier: blank base, OSM tiles on top. Pro: Google Maps / MapKit default.
        mapType={isPro ? 'standard' : 'none'}
        initialRegion={initialRegion}
        scrollEnabled={isPro}
        zoomEnabled={isPro}
        rotateEnabled={false}
        pitchEnabled={false}
        maxZoomLevel={isPro ? 8 : 7}
        minZoomLevel={isPro ? 5 : 7}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {!isPro && (
          <UrlTile
            urlTemplate={OSM_TILE_URL}
            maximumZ={18}
            shouldReplaceMapContent={true}
          />
        )}

        {!isPro && (
          <PollenPolygonLayer geojson={gridData[selectedLayer]} />
        )}

        {isPro && (
          <PollenTileLayer layerType={selectedLayer} />
        )}
      </MapView>

      {/* Shared: colour legend */}
      <PollenLegend />

      {/* Free: Pro upgrade CTA (top-right, below the legend card) */}
      {!isPro && (
        <TouchableOpacity
          onPress={() => showPaywall('Live Hyperlocal Map')}
          style={{
            position: 'absolute',
            top: 170,  // sits below the legend card (~154px tall)
            right: 12,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.92)',
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 13, marginRight: 4 }}>🔒</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>
            Unlock live hyperlocal map
          </Text>
        </TouchableOpacity>
      )}

      {/* Pro: locate-me FAB */}
      {isPro && (
        <TouchableOpacity
          onPress={handleLocateMe}
          style={{
            position: 'absolute',
            bottom: 150,
            right: 16,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Text style={{ fontSize: 20 }}>📍</Text>
        </TouchableOpacity>
      )}

      {/* Shared: layer selector */}
      <LayerSelector selected={selectedLayer} onSelect={setSelectedLayer} levels={levels} />

      {/* Free: locked map banner */}
      {!isPro && (
        <View
          style={{
            position: 'absolute',
            bottom: 140,
            alignSelf: 'center',
            backgroundColor: 'rgba(0,0,0,0.55)',
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12 }}>Regional forecast — updated daily</Text>
        </View>
      )}

      {/* Pro: tap-to-explore sheet */}
      <LocationInfoSheet
        visible={showLocationSheet}
        onClose={() => setShowLocationSheet(false)}
        coordinate={tappedCoord}
        userLocation={location}
      />

      {/* Free: upgrade prompt on tap */}
      <UpgradeMapSheet
        visible={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        onUpgrade={() => {
          setShowUpgradeSheet(false);
          showPaywall('Live Hyperlocal Map');
        }}
      />

      {/* Paywall */}
      <PaywallSheet {...paywallProps} />
    </View>
  );
}
