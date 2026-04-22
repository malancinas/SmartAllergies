import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { PollenLevel } from '@/features/pollen/types';
import type { LayerType } from '../types';

interface LayerInfo {
  key: LayerType;
  emoji: string;
  label: string;
}

const LAYERS: LayerInfo[] = [
  { key: 'tree', emoji: '🌳', label: 'Trees' },
  { key: 'grass', emoji: '🌿', label: 'Grass' },
  { key: 'weed', emoji: '🌾', label: 'Weeds' },
];

function levelColor(level: PollenLevel | undefined): string {
  switch (level) {
    case 'low': return '#F9E07A';
    case 'medium': return '#F4A336';
    case 'high': return '#E05C2E';
    case 'very_high': return '#C0392B';
    default: return '#A8D5A2';
  }
}

function levelLabel(level: PollenLevel | undefined): string {
  switch (level) {
    case 'low': return 'Low';
    case 'medium': return 'Moderate';
    case 'high': return 'High';
    case 'very_high': return 'Very High';
    default: return 'None';
  }
}

interface Props {
  selected: LayerType;
  onSelect: (layer: LayerType) => void;
  levels?: Partial<Record<LayerType, PollenLevel>>;
}

export function LayerSelector({ selected, onSelect, levels }: Props) {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 90,
        alignSelf: 'center',
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 24,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 5,
        gap: 4,
      }}
    >
      {LAYERS.map(({ key, emoji, label }) => {
        const level = levels?.[key];
        const active = selected === key;
        const color = levelColor(level);
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onSelect(key)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: active ? color : 'transparent',
              borderWidth: 2,
              borderColor: active ? color : '#E5E7EB',
              alignItems: 'center',
            }}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : '#374151' }}>
              {emoji} {label}
            </Text>
            {level !== undefined && (
              <Text style={{ fontSize: 10, color: active ? '#fff' : '#6B7280', marginTop: 1 }}>
                {levelLabel(level)}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
