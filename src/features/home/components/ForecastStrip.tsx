import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import type { DailyRiskScore, RiskLevel } from '@/features/forecasting/types';

const DOT_COLOR: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
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
              <View className="items-center bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 border border-neutral-100 dark:border-neutral-700 overflow-hidden">
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
                  <>
                    <View
                      className="w-3 h-3 rounded-full mt-2"
                      style={{ backgroundColor: DOT_COLOR[day.level] }}
                    />
                    <Text
                      className="text-xs font-semibold mt-1 capitalize"
                      style={{ color: DOT_COLOR[day.level] }}
                    >
                      {day.level}
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
