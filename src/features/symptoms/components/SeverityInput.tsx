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

function badgeStyle(value: number): { bg: string; text: string } {
  if (value <= 3) return { bg: 'bg-success-100 dark:bg-success-900/40', text: 'text-success-700 dark:text-success-300' };
  if (value <= 6) return { bg: 'bg-warning-100 dark:bg-warning-900/40', text: 'text-warning-700 dark:text-warning-300' };
  return { bg: 'bg-error-100 dark:bg-error-900/40', text: 'text-error-700 dark:text-error-300' };
}

export function SeverityInput({ value, onChange }: SeverityInputProps) {
  const { bg, text } = badgeStyle(value);
  return (
    <View>
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
          {value}
          <Text className="text-xl font-normal text-neutral-400"> / 10</Text>
        </Text>
        <View className={`px-3 py-1 rounded-full ${bg}`}>
          <Text className={`text-sm font-semibold ${text}`}>
            {SEVERITY_LABELS[value] ?? ''}
          </Text>
        </View>
      </View>
      <Slider min={1} max={10} value={value} onChange={onChange} step={1} />
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-neutral-400">1 — Mild</Text>
        <Text className="text-xs text-neutral-400">10 — Severe</Text>
      </View>
    </View>
  );
}
