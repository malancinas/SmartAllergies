import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SymptomType } from '../types';
import { SYMPTOM_TYPES } from '../types';

const SYMPTOM_META: Record<SymptomType, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  none: { icon: 'checkmark', label: 'None today' },
  sneezing: { icon: 'infinite', label: 'Sneezing' },
  itchy_eyes: { icon: 'eye-outline', label: 'Itchy eyes' },
  runny_nose: { icon: 'water-outline', label: 'Runny nose' },
  congestion: { icon: 'swap-horizontal-outline', label: 'Congestion' },
  skin_reaction: { icon: 'sunny-outline', label: 'Skin reaction' },
  headache: { icon: 'flash-outline', label: 'Headache' },
};

interface SymptomGridProps {
  selected: SymptomType[];
  onToggle: (symptom: SymptomType) => void;
}

export function SymptomGrid({ selected, onToggle }: SymptomGridProps) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {SYMPTOM_TYPES.map((symptom) => {
        const { icon, label } = SYMPTOM_META[symptom];
        const isSelected = selected.includes(symptom);
        return (
          <TouchableOpacity
            key={symptom}
            onPress={() => onToggle(symptom)}
            style={{ width: '47%' }}
            className={`flex-row items-center px-3 py-3 rounded-xl border ${
              isSelected
                ? 'bg-primary-50 border-primary-500 dark:bg-primary-900/30 dark:border-primary-400'
                : 'bg-white border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700'
            }`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={label}
          >
            <Ionicons
              name={icon}
              size={18}
              color={isSelected ? '#16a34a' : '#9ca3af'}
              style={{ marginRight: 8 }}
            />
            <Text
              className={`text-sm font-medium flex-1 ${
                isSelected
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
