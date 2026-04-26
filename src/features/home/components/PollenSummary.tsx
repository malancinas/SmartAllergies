import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui';
import { DataQualityIndicator } from './DataQualityIndicator';
import type { MergedDailyPollenForecast, PollenLevel, SpeciesData } from '@/features/pollen/types';

const LEVEL_STYLE: Record<PollenLevel, { bg: string; text: string; label: string }> = {
  none: { bg: 'bg-neutral-100 dark:bg-neutral-700', text: 'text-neutral-500', label: 'None' },
  low: { bg: 'bg-success-100 dark:bg-success-900/40', text: 'text-success-700 dark:text-success-300', label: 'Low' },
  medium: { bg: 'bg-warning-100 dark:bg-warning-900/40', text: 'text-warning-700 dark:text-warning-300', label: 'Medium' },
  high: { bg: 'bg-error-100 dark:bg-error-900/40', text: 'text-error-700 dark:text-error-300', label: 'High' },
  very_high: { bg: 'bg-error-200 dark:bg-error-900/60', text: 'text-error-800 dark:text-error-200', label: 'Very high' },
};

function PollenPill({
  label,
  level,
  active,
}: {
  label: string;
  level: PollenLevel;
  active: boolean;
}) {
  const style = LEVEL_STYLE[level];
  return (
    <View
      className={`flex-1 items-center py-3 rounded-xl ${style.bg}`}
      style={active ? { borderWidth: 2, borderColor: '#6366f1' } : { opacity: 0.45 }}
    >
      <Text className={`text-xs font-medium ${style.text}`}>{label}</Text>
      <Text className={`text-sm font-bold mt-0.5 ${style.text}`}>{style.label}</Text>
      {active && (
        <Text style={{ fontSize: 9, marginTop: 2, color: '#6366f1', fontWeight: '600' }}>
          YOUR ALLERGEN
        </Text>
      )}
    </View>
  );
}

function SpeciesPill({ species, active }: { species: SpeciesData; active: boolean }) {
  const style = LEVEL_STYLE[species.level];
  return (
    <View
      className={`items-center px-3 py-2 rounded-lg ${style.bg}`}
      style={active ? { borderWidth: 1.5, borderColor: '#6366f1' } : { opacity: 0.5 }}
    >
      <Text className={`text-xs font-semibold ${style.text}`}>{species.name}</Text>
      <Text style={{ fontSize: 10, marginTop: 1 }} className={style.text}>
        {style.label}
      </Text>
    </View>
  );
}

interface PollenSummaryProps {
  today: MergedDailyPollenForecast;
  limitedCoverage: boolean;
  allergenProfile?: string[];
  onQualityPress?: () => void;
}

export function PollenSummary({
  today,
  limitedCoverage,
  allergenProfile,
  onQualityPress,
}: PollenSummaryProps) {
  const profile = allergenProfile ?? ['tree', 'grass', 'weed'];
  const allSelected = profile.length === 0;

  const activeSpecies = (today.species ?? []).filter((s) => s.level !== 'none');

  return (
    <Card variant="outlined">
      <View className="flex-row items-center mb-3">
        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Today's pollen
        </Text>
        {onQualityPress && (
          <DataQualityIndicator confidence={today.confidence} onPress={onQualityPress} />
        )}
      </View>
      <View className="flex-row gap-2">
        <PollenPill label="Tree" level={today.tree.level} active={allSelected || profile.includes('tree')} />
        <PollenPill label="Grass" level={today.grass.level} active={allSelected || profile.includes('grass')} />
        <PollenPill label="Weed" level={today.weed.level} active={allSelected || profile.includes('weed')} />
      </View>

      {activeSpecies.length > 0 && (
        <View className="mt-3">
          <Text className="text-xs text-neutral-400 dark:text-neutral-500 mb-2">
            Active allergens
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {activeSpecies.map((s) => (
              <SpeciesPill
                key={s.name}
                species={s}
                active={allSelected || profile.includes(s.category)}
              />
            ))}
          </View>
        </View>
      )}

      {limitedCoverage && (
        <Text className="text-xs text-neutral-400 mt-2 text-center">
          Limited pollen data for your region
        </Text>
      )}
    </Card>
  );
}
