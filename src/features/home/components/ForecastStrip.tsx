import React from 'react';
import { View, Text, ScrollView } from 'react-native';
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
}

export function ForecastStrip({ upcoming }: ForecastStripProps) {
  if (upcoming.length === 0) return null;

  return (
    <View>
      <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
        Coming up
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
        {upcoming.map((day) => (
          <View
            key={day.date}
            className="items-center mx-1 bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 border border-neutral-100 dark:border-neutral-700"
          >
            <Text className="text-xs text-neutral-400">{formatDay(day.date)}</Text>
            <Text className="text-xs text-neutral-400">{formatDate(day.date)}</Text>
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
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
