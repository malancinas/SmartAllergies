import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui';
import type { DailyPollenForecast, PollenLevel } from '@/features/pollen/types';

const LEVEL_STYLE: Record<PollenLevel, { bg: string; text: string; label: string }> = {
  none: { bg: 'bg-neutral-100 dark:bg-neutral-700', text: 'text-neutral-500', label: 'None' },
  low: { bg: 'bg-success-100 dark:bg-success-900/40', text: 'text-success-700 dark:text-success-300', label: 'Low' },
  medium: { bg: 'bg-warning-100 dark:bg-warning-900/40', text: 'text-warning-700 dark:text-warning-300', label: 'Medium' },
  high: { bg: 'bg-error-100 dark:bg-error-900/40', text: 'text-error-700 dark:text-error-300', label: 'High' },
  very_high: { bg: 'bg-error-200 dark:bg-error-900/60', text: 'text-error-800 dark:text-error-200', label: 'Very high' },
};

function PollenPill({ label, level }: { label: string; level: PollenLevel }) {
  const style = LEVEL_STYLE[level];
  return (
    <View className={`flex-1 items-center py-3 rounded-xl ${style.bg}`}>
      <Text className={`text-xs font-medium ${style.text}`}>{label}</Text>
      <Text className={`text-sm font-bold mt-0.5 ${style.text}`}>{style.label}</Text>
    </View>
  );
}

interface PollenSummaryProps {
  today: DailyPollenForecast;
  limitedCoverage: boolean;
}

export function PollenSummary({ today, limitedCoverage }: PollenSummaryProps) {
  return (
    <Card variant="outlined">
      <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
        Today's pollen
      </Text>
      <View className="flex-row gap-2">
        <PollenPill label="Tree" level={today.tree.level} />
        <PollenPill label="Grass" level={today.grass.level} />
        <PollenPill label="Weed" level={today.weed.level} />
      </View>
      {limitedCoverage && (
        <Text className="text-xs text-neutral-400 mt-2 text-center">
          Limited pollen data for your region
        </Text>
      )}
    </Card>
  );
}
