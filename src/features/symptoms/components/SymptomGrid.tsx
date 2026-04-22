import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { SymptomType } from '../types';
import { SYMPTOM_TYPES } from '../types';

const SYMPTOM_META: Record<SymptomType, { emoji: string; label: string }> = {
  sneezing: { emoji: '🤧', label: 'Sneezing' },
  itchy_eyes: { emoji: '👁️', label: 'Itchy eyes' },
  runny_nose: { emoji: '💧', label: 'Runny nose' },
  congestion: { emoji: '😤', label: 'Congestion' },
  skin_reaction: { emoji: '🔴', label: 'Skin reaction' },
  headache: { emoji: '🤕', label: 'Headache' },
};

interface SymptomGridProps {
  selected: SymptomType[];
  onToggle: (symptom: SymptomType) => void;
}

export function SymptomGrid({ selected, onToggle }: SymptomGridProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {SYMPTOM_TYPES.map((symptom) => {
        const { emoji, label } = SYMPTOM_META[symptom];
        const isSelected = selected.includes(symptom);
        return (
          <TouchableOpacity
            key={symptom}
            onPress={() => onToggle(symptom)}
            className={`flex-row items-center px-4 py-3 rounded-2xl border-2 ${
              isSelected
                ? 'bg-primary-50 border-primary-500 dark:bg-primary-900/30'
                : 'bg-white border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700'
            }`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={label}
          >
            <Text className="text-xl mr-2">{emoji}</Text>
            <Text
              className={`text-sm font-medium ${
                isSelected
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-neutral-700 dark:text-neutral-300'
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
