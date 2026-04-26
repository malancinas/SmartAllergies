import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import type { DailyRiskScore } from '@/features/forecasting/types';
import type { PollenLevel } from '@/features/pollen/types';

const POLLEN_DOT_COLOR: Record<PollenLevel, string> = {
  none: '#d1d5db',
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  very_high: '#b91c1c',
};

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

interface ForecastStripProps {
  upcoming: DailyRiskScore[];
  isPro: boolean;
  onUpgradePress: () => void;
}

export function ForecastStrip({ upcoming, isPro, onUpgradePress }: ForecastStripProps) {
  if (upcoming.length === 0) return null;

  return (
    <View>
      <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
        Coming up
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
        {upcoming.map((day, index) => {
          // index 0 = tomorrow (free), index 1+ = locked for free users
          const locked = !isPro && index >= 1;

          return (
            <TouchableOpacity
              key={day.date}
              activeOpacity={locked ? 0.7 : 1}
              onPress={locked ? onUpgradePress : undefined}
              className="mx-1"
            >
              <View className="items-center bg-white dark:bg-neutral-800 rounded-xl px-3 py-3 border border-neutral-100 dark:border-neutral-700 overflow-hidden">
                <Text className={`text-xs ${locked ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-400'}`}>
                  {formatDay(day.date)}
                </Text>
                <Text className={`text-xs ${locked ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-400'}`}>
                  {formatDate(day.date)}
                </Text>

                {locked ? (
                  <>
                    <Text className="text-base mt-2">🔒</Text>
                    <View className="mt-1 bg-violet-100 dark:bg-violet-900/40 rounded-full px-2 py-0.5">
                      <Text className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                        PRO
                      </Text>
                    </View>
                  </>
                ) : (
                  <View className="mt-2 gap-1">
                    {(['tree', 'grass', 'weed'] as const).map((type) => (
                      <View key={type} className="flex-row items-center gap-1.5">
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: POLLEN_DOT_COLOR[day.pollenLevels?.[type] ?? 'none'],
                          }}
                        />
                        <Text style={{ fontSize: 10, color: '#6b7280', fontWeight: '500' }}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
