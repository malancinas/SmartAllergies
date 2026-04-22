import React from 'react';
import { View, Text } from 'react-native';
import { Slider } from '@/components/ui';

interface SeverityInputProps {
  value: number;
  onChange: (value: number) => void;
}

const SEVERITY_LABELS: Record<number, string> = {
  1: 'Barely noticeable',
  2: 'Very mild',
  3: 'Mild',
  4: 'Mild–moderate',
  5: 'Moderate',
  6: 'Moderate–severe',
  7: 'Fairly severe',
  8: 'Severe',
  9: 'Very severe',
  10: 'Worst ever',
};

function severityColor(value: number): string {
  if (value <= 3) return 'text-success-600';
  if (value <= 6) return 'text-warning-600';
  return 'text-error-600';
}

export function SeverityInput({ value, onChange }: SeverityInputProps) {
  return (
    <View>
      <View className="flex-row justify-between items-baseline mb-2">
        <Text className="text-3xl font-bold text-neutral-900 dark:text-white">{value}</Text>
        <Text className={`text-sm font-medium ${severityColor(value)}`}>
          {SEVERITY_LABELS[value] ?? ''}
        </Text>
      </View>
      <Slider min={1} max={10} value={value} onChange={onChange} step={1} />
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-neutral-400">1 — Mild</Text>
        <Text className="text-xs text-neutral-400">10 — Severe</Text>
      </View>
    </View>
  );
}
