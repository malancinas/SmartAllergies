import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { DailyRiskScore, RiskLevel } from '@/features/forecasting/types';
import type { PollenLevel, SpeciesData, AirQualityData, AirQualityMetric } from '@/features/pollen/types';

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

const AQ_LEVEL_LABEL: Record<PollenLevel, string> = {
  none: 'Good', low: 'Low', medium: 'Moderate', high: 'High', very_high: 'Very high',
};

const AQ_METRICS: { key: keyof Omit<AirQualityData, 'overallLevel'>; label: string }[] = [
  { key: 'pm25',    label: 'PM2.5' },
  { key: 'pm10',    label: 'PM10' },
  { key: 'ozone',   label: 'Ozone' },
  { key: 'no2',     label: 'NO₂' },
  { key: 'so2',     label: 'SO₂' },
  { key: 'uvIndex', label: 'UV Index' },
  { key: 'dust',    label: 'Dust' },
];

function formatAqValue(metric: AirQualityMetric, key: string): string {
  const v = metric.rawValue;
  if (key === 'uvIndex') return v.toFixed(1);
  if (v === 0) return '0';
  if (v < 10) return v.toFixed(1);
  return Math.round(v).toString();
}

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
  const rv = selected?.rawValues;

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
                      {day.airQuality && (
                        <View className="flex-row items-center gap-1.5">
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: POLLEN_DOT_COLOR[day.airQuality.overallLevel],
                            }}
                          />
                          <Text style={{ fontSize: 10, color: '#6b7280', fontWeight: '500' }}>Air</Text>
                        </View>
                      )}
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
        snapPoints={[0.82]}
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

            {/* Pollen rows */}
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
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                      <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                      {rv?.[cat] !== undefined && (
                        <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                          {rv[cat] < 10 ? rv[cat].toFixed(1) : Math.round(rv[cat])} g/m³
                        </Text>
                      )}
                    </View>
                    <View className={`px-3 py-0.5 rounded-full ${style.bg}`}>
                      <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
                    </View>
                  </View>
                  {catSpecies.length > 0 && (
                    <View className="mt-1">
                      {catSpecies.map((s) => (
                        <SpeciesRow key={s.name} species={s} />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Air Quality rows */}
            {selected.airQuality && (() => {
              const aq = selected.airQuality!;
              const aqStyle = LEVEL_STYLE[aq.overallLevel];
              return (
                <>
                  <View className="flex-row items-center justify-between mt-4 mb-2">
                    <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Air Quality
                    </Text>
                    <View className={`px-2.5 py-0.5 rounded-full ${aqStyle.bg}`}>
                      <Text className={`text-xs font-semibold ${aqStyle.text}`}>
                        {AQ_LEVEL_LABEL[aq.overallLevel]}
                      </Text>
                    </View>
                  </View>
                  {AQ_METRICS.map(({ key, label }) => {
                    const metric = aq[key] as AirQualityMetric;
                    const locked = !isPro && key !== 'pm25';
                    const mStyle = LEVEL_STYLE[metric.level];
                    const valueStr = formatAqValue(metric, key);
                    const unitStr = metric.unit ? ` ${metric.unit}` : '';
                    return (
                      <View key={key} className="flex-row items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                        <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</Text>
                        {locked ? (
                          <View className="bg-violet-100 dark:bg-violet-900/40 px-2.5 py-0.5 rounded-full flex-row items-center gap-1">
                            <Text style={{ fontSize: 11 }}>🔒</Text>
                            <Text className="text-xs font-semibold text-violet-600 dark:text-violet-400">Pro</Text>
                          </View>
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 12, color: '#9ca3af' }}>{valueStr}{unitStr}</Text>
                            <View className={`px-2.5 py-0.5 rounded-full ${mStyle.bg}`}>
                              <Text className={`text-xs font-semibold ${mStyle.text}`}>{AQ_LEVEL_LABEL[metric.level]}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  {!isPro && (
                    <TouchableOpacity onPress={onUpgradePress} activeOpacity={0.8} className="mt-3">
                      <View className="bg-violet-50 dark:bg-violet-900/20 rounded-xl px-4 py-3 flex-row items-center justify-center gap-2">
                        <Text style={{ fontSize: 13 }}>🔒</Text>
                        <Text className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                          Upgrade to Pro to unlock all metrics
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </>
              );
            })()}
          </View>
        )}
      </BottomSheet>
    </>
  );
}

function SpeciesRow({ species }: { species: SpeciesData }) {
  const style = LEVEL_STYLE[species.level];
  const raw = species.rawValue;
  const formatted = raw === 0 ? '0' : raw < 10 ? raw.toFixed(1) : Math.round(raw).toString();
  return (
    <View className="flex-row items-center justify-between py-1.5 pl-2 border-l-2 border-neutral-100 dark:border-neutral-700 mb-1">
      <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
        {species.name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 11, color: '#9ca3af' }}>{formatted} g/m³</Text>
        <View className={`px-2 py-0.5 rounded-full ${style.bg}`}>
          <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
        </View>
      </View>
    </View>
  );
}
