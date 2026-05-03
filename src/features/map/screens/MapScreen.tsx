import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, type LayoutChangeEvent } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region, type MapPressEvent } from 'react-native-maps';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLocation } from '@/features/pollen/hooks/useLocation';
import { useCurrentPollen } from '@/features/pollen/hooks/useCurrentPollen';
import { useProGate } from '@/features/subscription/hooks/useProGate';
import { usePollenStore } from '@/features/pollen/store';
import { PaywallSheet } from '@/features/subscription/components/PaywallSheet';
import { ChangeLocationSheet } from '@/features/location/components/ChangeLocationSheet';
import { usePollenMapData } from '../hooks/usePollenMapData';
import { PollenLegend } from '../components/PollenLegend';
import { LayerSelector } from '../components/LayerSelector';
import { PollenTileLayer } from '../components/PollenTileLayer';
import { PollenPolygonLayer } from '../components/PollenPolygonLayer';
import { LocationInfoSheet } from '../components/LocationInfoSheet';
import { UpgradeMapSheet } from '../components/UpgradeMapSheet';
import { isAqLayer, pollenLevelToAqLevel, type LayerType, type PollenLayerType } from '../types';
import type { Coordinates } from '@/features/pollen/types';

// ~1500 km in latitude degrees (1° ≈ 111.32 km). Applies to all users.
const MAX_LATITUDE_DELTA = 13.5;

const DEFAULT_REGION: Region = {
  latitude: 53.5,
  longitude: -1.5,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

function highestPollenLayer(today: ReturnType<typeof useCurrentPollen>['today']): PollenLayerType {
  if (!today) return 'grass';
  const order = ['none', 'low', 'medium', 'high', 'very_high'];
  const rank = (l: string) => order.indexOf(l);
  const scores = {
    tree:  rank(today.tree.level),
    grass: rank(today.grass.level),
    weed:  rank(today.weed.level),
  };
  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as PollenLayerType);
}

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';

  // Adaptive surface colours for map overlays
  const pillBg = dark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)';
  const pillText = dark ? '#f3f4f6' : '#374151';
  const zoomBg = dark ? '#1f2937' : '#ffffff';
  const zoomText = dark ? '#f3f4f6' : '#374151';
  const zoomBorder = dark ? '#374151' : '#e5e7eb';
  const zoomDisabled = dark ? '#4b5563' : '#d1d5db';

  const { location } = useLocation();
  const { today } = useCurrentPollen();
  const { isPro, showPaywall, paywallProps } = useProGate();
  const locationLabel = usePollenStore((s) => s.locationLabel);

  // DEV-only toggle to preview free vs pro map without a real subscription
  const [devProOverride, setDevProOverride] = useState<boolean | null>(null);
  const effectiveIsPro = __DEV__ && devProOverride !== null ? devProOverride : isPro;

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaBannerCollapsed, setQuotaBannerCollapsed] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<'pro' | 'free'>('pro');

  const effectiveMapIsPro = effectiveIsPro && mapViewMode === 'pro';

  // Pro uses 3h cache buckets, Free uses 6h
  const cacheBucketHours: 3 | 6 = effectiveIsPro ? 3 : 6;

  function handleQuotaExceeded() {
    setQuotaExceeded(true);
  }

  async function handleChangeLocationPress() {
    if (!effectiveIsPro) {
      setAdPlaying(true);
      // TODO: swap for your real rewarded-ad call, e.g.:
      //   await AdMob.showRewardedAd({ adUnitId: AD_UNIT_ID });
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
      setAdPlaying(false);
    }
    setShowLocationPicker(true);
  }

  const mapRef = useRef<MapView>(null);
  const centeredRef = useRef(false);
  const regionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

  const defaultLayer = useMemo(() => highestPollenLayer(today), [today]);
  const [selectedLayer, setSelectedLayer] = useState<LayerType>(defaultLayer);

  const [legendBottom, setLegendBottom] = useState(0);
  const [tappedCoord, setTappedCoord] = useState<Coordinates | null>(null);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  const { gridData, loading: gridLoading, error: gridError } = usePollenMapData(true, cacheBucketHours);
  if (__DEV__) {
    console.log('[MapScreen] isPro:', effectiveIsPro, '| layer:', selectedLayer, '| gridLoading:', gridLoading, '| gridError:', gridError, '| features:', gridData[selectedLayer]?.features?.length ?? 'null');
  }

  const handleLegendLayout = useCallback((e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    setLegendBottom(y + height + 8);
  }, []);

  // Animate to location on first resolve, or to country-level when custom location is set
  useEffect(() => {
    if (!location || !mapRef.current) return;
    if (locationLabel) {
      centeredRef.current = true;
      mapRef.current.animateToRegion(
        { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 10, longitudeDelta: 10 },
        800,
      );
    } else if (!centeredRef.current) {
      centeredRef.current = true;
      mapRef.current.animateToRegion(
        { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 1.8, longitudeDelta: 1.8 },
        800,
      );
    }
  }, [location, locationLabel]);

  const initialRegion: Region = location
    ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 1.8, longitudeDelta: 1.8 }
    : DEFAULT_REGION;

  function handleMapPress(e: MapPressEvent) {
    const coord = e.nativeEvent.coordinate;
    if (effectiveMapIsPro) {
      setTappedCoord({ latitude: coord.latitude, longitude: coord.longitude });
      setShowLocationSheet(true);
    } else if (!effectiveIsPro) {
      setShowUpgradeSheet(true);
    }
  }

  function handleLocateMe() {
    if (!location || !mapRef.current) return;
    mapRef.current.animateToRegion(
      { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 1.8, longitudeDelta: 1.8 },
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
    const maxDelta = MAX_LATITUDE_DELTA;
    mapRef.current.animateToRegion(
      { ...r, latitudeDelta: Math.min(r.latitudeDelta * 2, maxDelta), longitudeDelta: Math.min(r.longitudeDelta * 2, maxDelta) },
      250,
    );
  }

  const aqiLevel = today?.airQuality
    ? pollenLevelToAqLevel(today.airQuality.overallLevel)
    : undefined;

  // AQ layers always render as polygons — there is no Google Pollen tile equivalent.
  // For pollen layers, Pro uses tile overlay; Free uses polygon overlay.
  const showingAq = isAqLayer(selectedLayer);
  const pollenLayerForTile: PollenLayerType = showingAq ? 'grass' : (selectedLayer as PollenLayerType);

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
        minZoomLevel={5}
        onPress={handleMapPress}
        onMapReady={() => console.log('[MapView] ✅ map ready — provider=GOOGLE')}
        onMapError={(e) => console.error('[MapView] ❌ map error', e.nativeEvent)}
        onRegionChangeComplete={(r) => {
          console.log('[MapView] region complete →', r.latitude.toFixed(4), r.longitude.toFixed(4), 'Δlat', r.latitudeDelta.toFixed(3));
          if (regionDebounceRef.current) clearTimeout(regionDebounceRef.current);
          regionDebounceRef.current = setTimeout(() => setCurrentRegion(r), 500);
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Polygon layer: always shown for AQ, always shown for Free pollen, hidden for Pro pollen */}
        <PollenPolygonLayer
          geojson={(!effectiveMapIsPro || showingAq) ? gridData[selectedLayer] : null}
        />
        {/* Tile layer: only for Pro + pollen layers */}
        <PollenTileLayer
          layerType={pollenLayerForTile}
          visible={effectiveMapIsPro && !showingAq}
          region={currentRegion ?? initialRegion}
          onQuotaExceeded={handleQuotaExceeded}
        />
      </MapView>

      {/* Shared: colour legend — switches between pollen and AQ scale */}
      <PollenLegend layerType={selectedLayer} onLayout={handleLegendLayout} />

      {/* Change location pill — bottom-left for easy thumb access */}
      <TouchableOpacity
        onPress={handleChangeLocationPress}
        activeOpacity={0.85}
        disabled={adPlaying}
        style={{
          position: 'absolute',
          bottom: 160,
          left: 12,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: dark ? 'rgba(30,30,30,0.95)' : 'rgba(30,30,30,0.88)',
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 7,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 4,
          gap: 6,
        }}
      >
        {adPlaying ? (
          <ActivityIndicator size="small" color="#6366f1" style={{ marginHorizontal: 6 }} />
        ) : (
          <>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#ef4444' }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#e5e7eb', maxWidth: 160 }} numberOfLines={1}>
              {locationLabel ?? 'My location'}
            </Text>
            <Text style={{ fontSize: 11, color: '#6b7280' }}>▾</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Free: upgrade CTA / Pro: view mode toggle — top-right below legend */}
      {!effectiveIsPro ? (
        <TouchableOpacity
          onPress={() => showPaywall('Live Hyperlocal Map')}
          style={{
            position: 'absolute',
            top: legendBottom || 170,
            right: 12,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: pillBg,
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 13, marginRight: 4 }}>🔒</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: pillText }}>
            Unlock live hyperlocal map
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => setMapViewMode(mapViewMode === 'pro' ? 'free' : 'pro')}
          style={{
            position: 'absolute',
            top: legendBottom || 170,
            right: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: mapViewMode === 'pro' ? 'rgba(99,102,241,0.92)' : pillBg,
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 12 }}>{mapViewMode === 'pro' ? '✨' : '🗺'}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: mapViewMode === 'pro' ? '#fff' : pillText }}>
            {mapViewMode === 'pro' ? 'Pro view' : 'Free view'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Shared: zoom buttons */}
      {(() => {
        const currentDelta = (currentRegion ?? initialRegion).latitudeDelta;
        const zoomOutDisabled = currentDelta >= MAX_LATITUDE_DELTA;
        return (
          <View style={{
            position: 'absolute',
            bottom: 230,
            right: 16,
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: zoomBg,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 4,
          }}>
            <TouchableOpacity
              onPress={handleZoomIn}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: zoomBorder }}
            >
              <Text style={{ fontSize: 22, color: zoomText, lineHeight: 26 }}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleZoomOut}
              disabled={zoomOutDisabled}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 22, color: zoomOutDisabled ? zoomDisabled : zoomText, lineHeight: 26 }}>−</Text>
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* Pro: locate-me FAB */}
      {effectiveMapIsPro && (
        <TouchableOpacity
          onPress={handleLocateMe}
          style={{
            position: 'absolute',
            bottom: 170,
            right: 16,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: zoomBg,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
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
      <LayerSelector
        selected={selectedLayer}
        onSelect={setSelectedLayer}
        aqiLevel={aqiLevel}
        isPro={effectiveIsPro}
        onShowPaywall={() => showPaywall('Individual Pollutant Maps')}
      />

      {/* Free view banner */}
      {!effectiveMapIsPro && (
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
          <Text style={{ color: '#fff', fontSize: 12 }}>
            {effectiveIsPro ? 'Regional forecast view' : 'Regional forecast — updated daily'}
          </Text>
        </View>
      )}

      {/* Quota callout — points at the Pro/Free toggle, dismissable */}
      {quotaExceeded && !quotaBannerCollapsed && effectiveIsPro && (
        <View
          style={{
            position: 'absolute',
            top: (legendBottom || 170) + 40,
            right: 12,
            width: 220,
            backgroundColor: '#1f2937',
            borderRadius: 12,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 7,
          }}
        >
          {/* Arrow pointing up toward the toggle button */}
          <View style={{
            position: 'absolute',
            top: -7,
            right: 28,
            width: 0,
            height: 0,
            borderLeftWidth: 7,
            borderRightWidth: 7,
            borderBottomWidth: 7,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#1f2937',
          }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff', flex: 1, marginRight: 8 }}>
              That's all for Pro today.
            </Text>
            <TouchableOpacity onPress={() => setQuotaBannerCollapsed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 16, color: '#9ca3af', lineHeight: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: '#d1d5db', lineHeight: 17 }}>
            You can switch to Free view, or stay in Pro and keep using the pollen maps you've viewed today. Resets at midnight.
          </Text>
        </View>
      )}

      {/* Pro: tap-to-explore sheet */}
      <LocationInfoSheet
        visible={showLocationSheet}
        onClose={() => setShowLocationSheet(false)}
        coordinate={tappedCoord}
        userLocation={location}
        onQuotaExceeded={handleQuotaExceeded}
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

      {/* Change location sheet */}
      <ChangeLocationSheet
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
      />

      {/* Paywall */}
      <PaywallSheet {...paywallProps} />
    </View>
  );
}
