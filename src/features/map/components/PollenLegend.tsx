import React from 'react';
import { View, Text, type LayoutChangeEvent } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UPI_COLORS, UPI_LABELS, AQ_COLORS, AQ_LABELS, isAqLayer, type UpiCategory, type AqLevel, type LayerType } from '../types';

const POLLEN_CATEGORIES: UpiCategory[] = ['none', 'very_low', 'low', 'moderate', 'high', 'very_high'];
const AQ_CATEGORIES: AqLevel[] = ['none', 'low', 'moderate', 'high', 'very_high'];

interface Props {
  layerType?: LayerType;
  onLayout?: (e: LayoutChangeEvent) => void;
}

export function PollenLegend({ layerType, onLayout }: Props) {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';

  const showAq = layerType !== undefined && isAqLayer(layerType);

  return (
    <View
      onLayout={onLayout}
      style={{
        position: 'absolute',
        top: 16,
        right: 12,
        backgroundColor: dark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: dark ? 0.4 : 0.15,
        shadowRadius: 4,
        elevation: 3,
        minWidth: 130,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '600', color: dark ? '#f3f4f6' : '#374151', marginBottom: 5 }}>
        {showAq ? 'Air Quality' : 'Pollen Index'}
      </Text>

      {showAq
        ? AQ_CATEGORIES.map((level) => (
            <View key={level} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: AQ_COLORS[level], marginRight: 6 }} />
              <Text style={{ fontSize: 11, color: dark ? '#d1d5db' : '#4b5563' }}>{AQ_LABELS[level]}</Text>
            </View>
          ))
        : POLLEN_CATEGORIES.map((cat) => (
            <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: UPI_COLORS[cat], marginRight: 6 }} />
              <Text style={{ fontSize: 11, color: dark ? '#d1d5db' : '#4b5563' }}>{UPI_LABELS[cat]}</Text>
            </View>
          ))
      }
    </View>
  );
}
