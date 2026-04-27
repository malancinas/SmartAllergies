import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
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
  const aqActive = isAqLayer(selected);
  const aqTabColor = AQ_COLORS[aqiLevel ?? 'none'];

  function handleAqTabPress() {
    // If already on an AQ layer, no-op — sub-row handles selection within the group
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
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 24,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 5,
        maxWidth: '95%',
      }}
    >
      {/* Top row: pollen tabs + AQ tab */}
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {POLLEN_LAYERS.map(({ key, emoji, label }) => {
          const active = selected === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => onSelect(key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? '#6366f1' : 'transparent',
                borderWidth: 2,
                borderColor: active ? '#6366f1' : '#E5E7EB',
                alignItems: 'center',
              }}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : '#374151' }}>
                {emoji} {label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Air Quality tab */}
        <TouchableOpacity
          onPress={handleAqTabPress}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: aqActive ? aqTabColor : 'transparent',
            borderWidth: 2,
            borderColor: aqActive ? aqTabColor : '#E5E7EB',
            alignItems: 'center',
          }}
          activeOpacity={0.75}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: aqActive ? '#fff' : '#374151' }}>
            💨 Air Quality
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub-row: individual pollutant selector, visible when AQ tab is active */}
      {aqActive && (
        <>
          <View style={{ height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 4, marginTop: 4 }} />
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
                    backgroundColor: active ? AQ_COLORS['moderate'] : locked ? '#F3F4F6' : 'transparent',
                    borderWidth: 1.5,
                    borderColor: active ? AQ_COLORS['moderate'] : locked ? '#D1D5DB' : '#D1D5DB',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    opacity: locked ? 0.7 : 1,
                  }}
                  activeOpacity={0.75}
                >
                  {locked && (
                    <Text style={{ fontSize: 10 }}>🔒</Text>
                  )}
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: active ? '#fff' : locked ? '#9CA3AF' : '#374151',
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
