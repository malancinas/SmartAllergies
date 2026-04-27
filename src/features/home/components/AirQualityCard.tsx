import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { AirQualityData, AirQualityMetric, PollenLevel } from '@/features/pollen/types';

const LEVEL_STYLE: Record<PollenLevel, { bg: string; text: string; label: string }> = {
  none:     { bg: 'bg-neutral-100 dark:bg-neutral-700',        text: 'text-neutral-500',                           label: 'Good' },
  low:      { bg: 'bg-success-100 dark:bg-success-900/40',     text: 'text-success-700 dark:text-success-300',     label: 'Low' },
  medium:   { bg: 'bg-warning-100 dark:bg-warning-900/40',     text: 'text-warning-700 dark:text-warning-300',     label: 'Moderate' },
  high:     { bg: 'bg-error-100 dark:bg-error-900/40',         text: 'text-error-700 dark:text-error-300',         label: 'High' },
  very_high:{ bg: 'bg-error-200 dark:bg-error-900/60',         text: 'text-error-800 dark:text-error-200',         label: 'Very high' },
};

const METRICS: { key: keyof Omit<AirQualityData, 'overallLevel'>; label: string }[] = [
  { key: 'pm25',    label: 'PM2.5' },
  { key: 'pm10',    label: 'PM10' },
  { key: 'ozone',   label: 'Ozone' },
  { key: 'no2',     label: 'NO₂' },
  { key: 'so2',     label: 'SO₂' },
  { key: 'uvIndex', label: 'UV Index' },
  { key: 'dust',    label: 'Dust' },
];

function formatValue(metric: AirQualityMetric, key: string): string {
  const v = metric.rawValue;
  if (key === 'uvIndex') return v.toFixed(1);
  if (v === 0) return '0';
  if (v < 10) return v.toFixed(1);
  return Math.round(v).toString();
}

function MetricRow({ label, metricKey, metric }: { label: string; metricKey: string; metric: AirQualityMetric }) {
  const style = LEVEL_STYLE[metric.level];
  const valueStr = formatValue(metric, metricKey);
  const unitStr = metric.unit ? ` ${metric.unit}` : '';
  return (
    <View className="flex-row items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-700">
      <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>{valueStr}{unitStr}</Text>
        <View className={`px-2.5 py-0.5 rounded-full ${style.bg}`}>
          <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
        </View>
      </View>
    </View>
  );
}

interface AirQualityCardProps {
  airQuality: AirQualityData;
}

export function AirQualityCard({ airQuality }: AirQualityCardProps) {
  const [open, setOpen] = useState(false);
  const overall = LEVEL_STYLE[airQuality.overallLevel];

  return (
    <>
      <Card variant="outlined">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Air Quality
          </Text>
        </View>
        <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.8}>
          <View className={`flex-row items-center justify-between px-4 py-3 rounded-xl ${overall.bg}`}>
            <Text className={`text-sm font-semibold ${overall.text}`}>Overall</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text className={`text-sm font-bold ${overall.text}`}>{overall.label}</Text>
              <Text style={{ fontSize: 9, color: '#a5b4fc' }}>tap for detail</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Card>

      <BottomSheet visible={open} onClose={() => setOpen(false)} snapPoints={[0.72]}>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">Air Quality</Text>
            <View className={`px-3 py-1 rounded-full ${overall.bg}`}>
              <Text className={`text-sm font-semibold ${overall.text}`}>{overall.label}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#9ca3af', letterSpacing: 0.5, marginBottom: 2 }}>
            POLLUTANTS & UV — DAILY PEAK
          </Text>
          {METRICS.map(({ key, label }) => (
            <MetricRow
              key={key}
              label={label}
              metricKey={key}
              metric={airQuality[key] as AirQualityMetric}
            />
          ))}
        </View>
      </BottomSheet>
    </>
  );
}
