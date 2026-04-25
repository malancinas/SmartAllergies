import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type LayoutChangeEvent } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region, type MapPressEvent } from 'react-native-maps';
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

  // DEV-only toggle to preview free vs pro map without a real subscription
  const [devProOverride, setDevProOverride] = useState<boolean | null>(null);
  const effectiveIsPro = __DEV__ && devProOverride !== null ? devProOverride : isPro;

  const mapRef = useRef<MapView>(null);
  const centeredRef = useRef(false);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

  const defaultLayer = useMemo(() => highestLayer(today), [today]);
  const [selectedLayer, setSelectedLayer] = useState<LayerType>(defaultLayer);

  const [legendBottom, setLegendBottom] = useState(0);
  const [tappedCoord, setTappedCoord] = useState<Coordinates | null>(null);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  const { gridData } = usePollenMapData(true);

  const handleLegendLayout = useCallback((e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    setLegendBottom(y + height + 8);
  }, []);

  // Animate to user location once it resolves (it loads async after mount)
  useEffect(() => {
    if (!location || centeredRef.current || !mapRef.current) return;
    centeredRef.current = true;
    mapRef.current.animateToRegion(
      { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 2.5, longitudeDelta: 2.5 },
      800,
    );
  }, [location]);

  const initialRegion: Region = location
    ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 2.5, longitudeDelta: 2.5 }
    : DEFAULT_REGION;

  function handleMapPress(e: MapPressEvent) {
    const coord = e.nativeEvent.coordinate;
    if (effectiveIsPro) {
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

  function handleZoomIn() {
    if (!mapRef.current) return;
    const r = currentRegion ?? initialRegion;
    mapRef.current.animateToRegion(
      { ...r, latitudeDelta: Math.max(r.latitudeDelta / 2, 0.005), longitudeDelta: Math.max(r.longitudeDelta / 2, 0.005) },
      250,
    );
  }

  function handleZoomOut() {
    if (!mapRef.current) return;
    const r = currentRegion ?? initialRegion;
    mapRef.current.animateToRegion(
      { ...r, latitudeDelta: Math.min(r.latitudeDelta * 2, 60), longitudeDelta: Math.min(r.longitudeDelta * 2, 60) },
      250,
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
        provider={PROVIDER_GOOGLE}
        mapType="standard"
        initialRegion={initialRegion}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={false}
        pitchEnabled={false}
        onPress={handleMapPress}
        onRegionChangeComplete={(r) => setCurrentRegion(r)}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        <PollenPolygonLayer geojson={!effectiveIsPro ? gridData[selectedLayer] : null} />
        <PollenTileLayer layerType={selectedLayer} visible={effectiveIsPro} region={currentRegion ?? initialRegion} />
      </MapView>

      {/* Shared: colour legend */}
      <PollenLegend onLayout={handleLegendLayout} />

      {/* Free: Pro upgrade CTA (top-right, below the legend card) */}
      {!effectiveIsPro && (
        <TouchableOpacity
          onPress={() => showPaywall('Live Hyperlocal Map')}
          style={{
            position: 'absolute',
            top: legendBottom || 170,
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

      {/* Shared: zoom buttons */}
      <View style={{
        position: 'absolute',
        bottom: 230,
        right: 16,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      }}>
        <TouchableOpacity
          onPress={handleZoomIn}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}
        >
          <Text style={{ fontSize: 22, color: '#374151', lineHeight: 26 }}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleZoomOut}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 22, color: '#374151', lineHeight: 26 }}>−</Text>
        </TouchableOpacity>
      </View>

      {/* Pro: locate-me FAB */}
      {effectiveIsPro && (
        <TouchableOpacity
          onPress={handleLocateMe}
          style={{
            position: 'absolute',
            bottom: 170,
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

      {/* DEV: free/pro toggle — sits below the unlock CTA button */}
      {__DEV__ && (
        <TouchableOpacity
          onPress={() => setDevProOverride(devProOverride === true ? false : devProOverride === false ? null : true)}
          style={{
            position: 'absolute',
            top: (legendBottom || 170) + 44,
            right: 12,
            backgroundColor: effectiveIsPro ? '#6d28d9' : '#6b7280',
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 5,
            elevation: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
            {devProOverride === null ? `${effectiveIsPro ? 'PRO' : 'FREE'} (real)` : effectiveIsPro ? 'PRO (dev)' : 'FREE (dev)'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Shared: layer selector */}
      <LayerSelector selected={selectedLayer} onSelect={setSelectedLayer} levels={levels} />

      {/* Free: locked map banner */}
      {!effectiveIsPro && (
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
