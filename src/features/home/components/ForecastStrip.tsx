import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { DailyRiskScore, RiskLevel } from '@/features/forecasting/types';
import type { PollenLevel, SpeciesData } from '@/features/pollen/types';

const POLLEN_DOT_COLOR: Record<PollenLevel, string> = {
  none: '#d1d5db',
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  very_high: '#b91c1c',
};

const RISK_COLOR: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

const LEVEL_STYLE: Record<PollenLevel, { bg: string; text: string; label: string }> = {
  none: { bg: 'bg-neutral-100 dark:bg-neutral-700', text: 'text-neutral-500', label: 'None' },
  low: { bg: 'bg-success-100 dark:bg-success-900/40', text: 'text-success-700 dark:text-success-300', label: 'Low' },
  medium: { bg: 'bg-warning-100 dark:bg-warning-900/40', text: 'text-warning-700 dark:text-warning-300', label: 'Medium' },
  high: { bg: 'bg-error-100 dark:bg-error-900/40', text: 'text-error-700 dark:text-error-300', label: 'High' },
  very_high: { bg: 'bg-error-200 dark:bg-error-900/60', text: 'text-error-800 dark:text-error-200', label: 'Very high' },
};

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

interface ForecastStripProps {
  upcoming: DailyRiskScore[];
  isPro: boolean;
  onUpgradePress: () => void;
}

export function ForecastStrip({ upcoming, isPro, onUpgradePress }: ForecastStripProps) {
  const [selected, setSelected] = useState<DailyRiskScore | null>(null);

  if (upcoming.length === 0) return null;

  const pl = selected?.pollenLevels;

  return (
    <>
      <View>
        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
          Coming up
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
          {upcoming.map((day, index) => {
            const locked = !isPro && index >= 1;

            return (
              <TouchableOpacity
                key={day.date}
                activeOpacity={1}
                onPress={locked ? onUpgradePress : () => setSelected(day)}
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

      <BottomSheet
        visible={selected !== null}
        onClose={() => setSelected(null)}
        snapPoints={[0.55]}
      >
        {selected && (
          <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-neutral-900 dark:text-white">
                {formatFullDate(selected.date)}
              </Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: RISK_COLOR[selected.level] + '22' }}
              >
                <Text
                  className="text-sm font-semibold capitalize"
                  style={{ color: RISK_COLOR[selected.level] }}
                >
                  {selected.level} risk
                </Text>
              </View>
            </View>

            {/* Category rows */}
            <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Pollen levels
            </Text>
            {(['tree', 'grass', 'weed'] as const).map((cat) => {
              const level = pl?.[cat] ?? 'none';
              const style = LEVEL_STYLE[level];
              const catSpecies = (selected.species ?? []).filter((s) => s.category === cat);
              return (
                <View key={cat} className="py-3 border-b border-neutral-100 dark:border-neutral-700">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                    <View className={`px-3 py-0.5 rounded-full ${style.bg}`}>
                      <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
                    </View>
                  </View>
                  {catSpecies.length > 0 && (
                    <View className="flex-row flex-wrap gap-1 mt-1">
                      {catSpecies.map((s) => (
                        <SpeciesChip key={s.name} species={s} />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </BottomSheet>
    </>
  );
}

function SpeciesChip({ species }: { species: SpeciesData }) {
  const style = LEVEL_STYLE[species.level];
  return (
    <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${style.bg}`}>
      <Text className={`text-xs ${style.text}`}>{species.name}</Text>
    </View>
  );
}
