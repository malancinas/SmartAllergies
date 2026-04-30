import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { HourlyPollenPoint } from '@/features/pollen/types';

interface Props {
  todayHourly: HourlyPollenPoint[];
  isPro: boolean;
  onUpgradePress: () => void;
  /** Which allergen types to include — from the user's allergen profile setting */
  activeAllergens: string[];
  /** Beta-normalised weights per allergen type — present when the ML model is active (Pro only) */
  triggerWeights?: Partial<Record<string, number>>;
}

function formatHour(isoTime: string): string {
  const hour = parseInt(isoTime.slice(11, 13), 10);
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

interface WindowResult {
  startTime: string;
  endTime: string;
  avgTotal: number;
}

function pollenScore(
  p: HourlyPollenPoint,
  activeAllergens: string[],
  weights?: Partial<Record<string, number>>,
): number {
  const types = (['tree', 'grass', 'weed'] as const).filter((a) => activeAllergens.includes(a));
  if (types.length === 0) return p.tree + p.grass + p.weed;
  if (weights) {
    return types.reduce((sum, a) => sum + p[a] * (weights[a] ?? 0), 0);
  }
  return types.reduce((sum, a) => sum + p[a], 0);
}

function findBestWindow(
  points: HourlyPollenPoint[],
  activeAllergens: string[],
  weights?: Partial<Record<string, number>>,
  windowSize = 3,
): WindowResult | null {
  if (points.length < windowSize) return null;
  let bestAvg = Infinity;
  let bestIdx = 0;
  for (let i = 0; i <= points.length - windowSize; i++) {
    const avg =
      points.slice(i, i + windowSize).reduce((sum, p) => sum + pollenScore(p, activeAllergens, weights), 0) /
      windowSize;
    if (avg < bestAvg) {
      bestAvg = avg;
      bestIdx = i;
    }
  }
  return {
    startTime: points[bestIdx].time,
    endTime: points[bestIdx + windowSize - 1].time,
    avgTotal: bestAvg,
  };
}

function findPeakWindow(
  points: HourlyPollenPoint[],
  activeAllergens: string[],
  weights?: Partial<Record<string, number>>,
  windowSize = 3,
): WindowResult | null {
  if (points.length < windowSize) return null;
  let peakAvg = -Infinity;
  let peakIdx = 0;
  for (let i = 0; i <= points.length - windowSize; i++) {
    const avg =
      points.slice(i, i + windowSize).reduce((sum, p) => sum + pollenScore(p, activeAllergens, weights), 0) /
      windowSize;
    if (avg > peakAvg) {
      peakAvg = avg;
      peakIdx = i;
    }
  }
  return {
    startTime: points[peakIdx].time,
    endTime: points[peakIdx + windowSize - 1].time,
    avgTotal: peakAvg,
  };
}

export function PeakHoursCard({ todayHourly, isPro, onUpgradePress, activeAllergens, triggerWeights }: Props) {
  if (!isPro) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onUpgradePress}>
        <View className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Peak pollen hours
            </Text>
            <View className="bg-violet-100 dark:bg-violet-900/40 rounded-full px-2.5 py-0.5">
              <Text className="text-[10px] font-bold text-violet-600 dark:text-violet-400">PRO</Text>
            </View>
          </View>
          <View className="opacity-30 gap-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">🟢</Text>
              <View>
                <Text className="text-xs text-neutral-500">Best time outside</Text>
                <Text className="text-sm font-semibold text-neutral-800 dark:text-white">7am – 9am</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">🔴</Text>
              <View>
                <Text className="text-xs text-neutral-500">Peak pollen window</Text>
                <Text className="text-sm font-semibold text-neutral-800 dark:text-white">12pm – 3pm</Text>
              </View>
            </View>
          </View>
          <View className="mt-3 flex-row items-center gap-1.5">
            <Text className="text-base">🔒</Text>
            <Text className="text-xs text-violet-600 dark:text-violet-400 font-medium">
              Upgrade to Pro to see today's hourly pollen forecast
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Daytime hours only (6am–9pm) for more useful recommendations
  const daytimeHours = todayHourly.filter((h) => {
    const hour = parseInt(h.time.slice(11, 13), 10);
    return hour >= 6 && hour <= 21;
  });

  const best = findBestWindow(daytimeHours, activeAllergens, triggerWeights);
  const peak = findPeakWindow(daytimeHours, activeAllergens, triggerWeights);

  // If all data is zero (outside coverage) or no data yet, show a placeholder
  const allZero = todayHourly.length > 0 && todayHourly.every((h) => h.tree + h.grass + h.weed === 0);

  return (
    <View className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700">
      <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
        Peak pollen hours
      </Text>

      {allZero || !best || !peak ? (
        <Text className="text-xs text-neutral-400">Hourly data unavailable for your location.</Text>
      ) : (
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center">
              <Text className="text-base">🌿</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">Best time outside</Text>
              <Text className="text-sm font-semibold text-neutral-800 dark:text-white">
                {formatHour(best.startTime)} – {formatHour(best.endTime)}
              </Text>
            </View>
            <Text className="text-xs text-green-600 dark:text-green-400 font-medium">Lower risk</Text>
          </View>

          <View className="h-px bg-neutral-100 dark:bg-neutral-700" />

          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center">
              <Text className="text-base">⚠️</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">Peak pollen window</Text>
              <Text className="text-sm font-semibold text-neutral-800 dark:text-white">
                {formatHour(peak.startTime)} – {formatHour(peak.endTime)}
              </Text>
            </View>
            <Text className="text-xs text-red-500 dark:text-red-400 font-medium">Avoid if possible</Text>
          </View>
        </View>
      )}
    </View>
  );
}
