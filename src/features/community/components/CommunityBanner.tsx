import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui';
import type { CommunityAggregate } from '../types';

interface CommunityBannerProps {
  aggregate: CommunityAggregate | null;
  loading: boolean;
}

export function CommunityBanner({ aggregate, loading }: CommunityBannerProps) {
  // Don't render while loading, or if below the minimum signal thresholds
  if (loading || !aggregate || aggregate.count < 3 || aggregate.avgSeverity < 6) {
    return null;
  }

  const count = aggregate.count;
  const label = count === 1 ? 'person' : 'people';

  return (
    <Card variant="filled">
      <View className="flex-row items-center gap-3">
        <Text className="text-xl">👥</Text>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Community signal
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {count} {label} nearby reported high symptoms today
          </Text>
        </View>
      </View>
    </Card>
  );
}
