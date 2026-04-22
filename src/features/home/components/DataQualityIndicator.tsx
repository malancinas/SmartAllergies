import React from 'react';
import { Pressable, View } from 'react-native';
import type { PollenConfidence } from '@/features/pollen/types';

const CONFIDENCE_COLOR: Record<PollenConfidence, string> = {
  high: 'bg-success-500',
  medium: 'bg-warning-500',
  low: 'bg-error-500',
};

interface DataQualityIndicatorProps {
  confidence: PollenConfidence;
  onPress: () => void;
}

export function DataQualityIndicator({ confidence, onPress }: DataQualityIndicatorProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Data quality: ${confidence}`}
      accessibilityRole="button"
      className="ml-2 justify-center"
      hitSlop={8}
    >
      <View className={`w-2.5 h-2.5 rounded-full ${CONFIDENCE_COLOR[confidence]}`} />
    </Pressable>
  );
}
