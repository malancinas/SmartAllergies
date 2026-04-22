import React from 'react';
import { View, Text } from 'react-native';
import type { RiskLevel } from '@/features/forecasting/types';

const CONFIG: Record<
  RiskLevel,
  { bg: string; border: string; text: string; emoji: string; label: string; sub: string }
> = {
  low: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    border: 'border-success-200 dark:border-success-700',
    text: 'text-success-800 dark:text-success-300',
    emoji: '😊',
    label: 'Low risk today',
    sub: 'Pollen levels are low. Enjoy the outdoors!',
  },
  medium: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    border: 'border-warning-200 dark:border-warning-700',
    text: 'text-warning-800 dark:text-warning-300',
    emoji: '😐',
    label: 'Medium risk today',
    sub: 'Consider taking antihistamines before going out.',
  },
  high: {
    bg: 'bg-error-50 dark:bg-error-900/20',
    border: 'border-error-200 dark:border-error-700',
    text: 'text-error-800 dark:text-error-300',
    emoji: '😷',
    label: 'High risk today',
    sub: 'Stay indoors if possible. Keep windows closed.',
  },
};

interface RiskBannerProps {
  level: RiskLevel;
  personalised: boolean;
}

export function RiskBanner({ level, personalised }: RiskBannerProps) {
  const cfg = CONFIG[level];

  return (
    <View className={`rounded-2xl border-2 p-4 ${cfg.bg} ${cfg.border}`}>
      <View className="flex-row items-center">
        <Text className="text-4xl mr-3">{cfg.emoji}</Text>
        <View className="flex-1">
          <Text className={`text-lg font-bold ${cfg.text}`}>{cfg.label}</Text>
          <Text className={`text-sm mt-0.5 ${cfg.text} opacity-80`}>{cfg.sub}</Text>
        </View>
      </View>
      {!personalised && (
        <Text className="text-xs text-neutral-400 mt-2">
          Personalising… log more symptoms to improve accuracy.
        </Text>
      )}
    </View>
  );
}
