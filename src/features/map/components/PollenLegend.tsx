import React from 'react';
import { View, Text, type LayoutChangeEvent } from 'react-native';
import { UPI_COLORS, UPI_LABELS, type UpiCategory } from '../types';

const CATEGORIES: UpiCategory[] = ['none', 'very_low', 'low', 'moderate', 'high', 'very_high'];

export function PollenLegend({ onLayout }: { onLayout?: (e: LayoutChangeEvent) => void }) {
  return (
    <View
      onLayout={onLayout}
      style={{
        position: 'absolute',
        top: 16,
        right: 12,
        backgroundColor: 'rgba(255,255,255,0.88)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
        minWidth: 130,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '600', color: '#374151', marginBottom: 5 }}>
        Pollen Index
      </Text>
      {CATEGORIES.map((cat) => (
        <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: UPI_COLORS[cat],
              marginRight: 6,
            }}
          />
          <Text style={{ fontSize: 11, color: '#4B5563' }}>{UPI_LABELS[cat]}</Text>
        </View>
      ))}
    </View>
  );
}
