import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { type LayerType, type PollenLayerType, type AqLayerType, type AqLevel, isAqLayer, AQ_COLORS } from '../types';

interface PollenLayerInfo {
  key: PollenLayerType;
  emoji: string;
  label: string;
}

interface AqSubLayerInfo {
  key: AqLayerType;
  label: string;
  proOnly: boolean;
}

const POLLEN_LAYERS: PollenLayerInfo[] = [
  { key: 'tree',  emoji: '🌳', label: 'Trees' },
  { key: 'grass', emoji: '🌿', label: 'Grass' },
  { key: 'weed',  emoji: '🌾', label: 'Weeds' },
];

const AQ_SUB_LAYERS: AqSubLayerInfo[] = [
  { key: 'aqi',   label: 'AQI',   proOnly: false },
  { key: 'pm25',  label: 'PM2.5', proOnly: true },
  { key: 'pm10',  label: 'PM10',  proOnly: true },
  { key: 'no2',   label: 'NO₂',   proOnly: true },
  { key: 'ozone', label: 'Ozone', proOnly: true },
  { key: 'so2',   label: 'SO₂',   proOnly: true },
  { key: 'dust',  label: 'Dust',  proOnly: true },
];

interface Props {
  selected: LayerType;
  onSelect: (layer: LayerType) => void;
  aqiLevel?: AqLevel;
  isPro: boolean;
  onShowPaywall?: () => void;
}

export function LayerSelector({ selected, onSelect, aqiLevel, isPro, onShowPaywall }: Props) {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';

  const containerBg = dark ? 'rgba(20,20,20,0.97)' : 'rgba(255,255,255,0.97)';
  const tabInactiveBorder = dark ? '#374151' : '#e5e7eb';
  const tabInactiveText = dark ? '#d1d5db' : '#374151';
  const subLockedBg = dark ? '#1f2937' : '#f3f4f6';
  const subLockedBorder = dark ? '#374151' : '#d1d5db';
  const subLockedText = dark ? '#6b7280' : '#9ca3af';
  const subInactiveText = dark ? '#d1d5db' : '#374151';
  const dividerColor = dark ? '#374151' : '#e5e7eb';

  const aqActive = isAqLayer(selected);
  const aqTabColor = AQ_COLORS[aqiLevel ?? 'none'];

  function handleAqTabPress() {
    if (!aqActive) onSelect('aqi');
  }

  function handleAqSubPress(key: AqLayerType, proOnly: boolean) {
    if (proOnly && !isPro) {
      onShowPaywall?.();
      return;
    }
    onSelect(key);
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 90,
        left: 8,
        right: 8,
        backgroundColor: containerBg,
        borderRadius: 24,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: dark ? 0.4 : 0.18,
        shadowRadius: 6,
        elevation: 5,
      }}
    >
      {/* Top row: pollen tabs + AQ tab — flex so each tab gets equal width inside the bounding box */}
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {POLLEN_LAYERS.map(({ key, emoji, label }) => {
          const active = selected === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => onSelect(key)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? '#6366f1' : 'transparent',
                borderWidth: 2,
                borderColor: active ? '#6366f1' : tabInactiveBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : tabInactiveText }} numberOfLines={1}>
                {emoji} {label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Air Quality tab */}
        <TouchableOpacity
          onPress={handleAqTabPress}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: aqActive ? aqTabColor : 'transparent',
            borderWidth: 2,
            borderColor: aqActive ? aqTabColor : tabInactiveBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.75}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: aqActive ? '#fff' : tabInactiveText }} numberOfLines={1}>
            💨 Air Quality
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub-row: individual pollutant selector, visible when AQ tab is active */}
      {aqActive && (
        <>
          <View style={{ height: 1, backgroundColor: dividerColor, marginHorizontal: 4, marginTop: 4 }} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', gap: 4, paddingHorizontal: 4, paddingTop: 4 }}
          >
            {AQ_SUB_LAYERS.map(({ key, label, proOnly }) => {
              const active = selected === key;
              const locked = proOnly && !isPro;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleAqSubPress(key, proOnly)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: active ? AQ_COLORS['moderate'] : locked ? subLockedBg : 'transparent',
                    borderWidth: 1.5,
                    borderColor: active ? AQ_COLORS['moderate'] : subLockedBorder,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    opacity: locked ? 0.7 : 1,
                  }}
                  activeOpacity={0.75}
                >
                  {locked && <Text style={{ fontSize: 10 }}>🔒</Text>}
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: active ? '#fff' : locked ? subLockedText : subInactiveText,
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );
}
