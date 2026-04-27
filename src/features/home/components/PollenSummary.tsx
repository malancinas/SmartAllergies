import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { MergedDailyPollenForecast, PollenLevel, SpeciesData } from '@/features/pollen/types';

const LEVEL_STYLE: Record<PollenLevel, { bg: string; text: string; label: string }> = {
  none:     { bg: 'bg-neutral-100 dark:bg-neutral-700',        text: 'text-neutral-500',                           label: 'None' },
  low:      { bg: 'bg-success-100 dark:bg-success-900/40',     text: 'text-success-700 dark:text-success-300',     label: 'Low' },
  medium:   { bg: 'bg-warning-100 dark:bg-warning-900/40',     text: 'text-warning-700 dark:text-warning-300',     label: 'Medium' },
  high:     { bg: 'bg-error-100 dark:bg-error-900/40',         text: 'text-error-700 dark:text-error-300',         label: 'High' },
  very_high:{ bg: 'bg-error-200 dark:bg-error-900/60',         text: 'text-error-800 dark:text-error-200',         label: 'Very high' },
};

const CATEGORY_LABEL: Record<'tree' | 'grass' | 'weed', string> = {
  tree: 'Tree',
  grass: 'Grass',
  weed: 'Weed',
};

function formatGrains(value: number): string {
  if (value === 0) return '0';
  if (value < 10) return value.toFixed(1);
  return Math.round(value).toString();
}

function PollenPill({
  label,
  level,
  active,
  onPress,
}: {
  label: string;
  level: PollenLevel;
  active: boolean;
  onPress: () => void;
}) {
  const style = LEVEL_STYLE[level];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={1} style={{ flex: 1 }}>
      <View
        className={`items-center py-3 rounded-xl ${style.bg}`}
        style={active ? { borderWidth: 2, borderColor: '#6366f1' } : { opacity: 0.45 }}
      >
        <Text className={`text-xs font-medium ${style.text}`}>{label}</Text>
        <Text className={`text-sm font-bold mt-0.5 ${style.text}`}>{style.label}</Text>
        <Text style={{ fontSize: 9, marginTop: 3, color: '#a5b4fc' }}>tap for detail</Text>
      </View>
    </TouchableOpacity>
  );
}

function SpeciesRow({ species }: { species: SpeciesData }) {
  const style = LEVEL_STYLE[species.level];
  return (
    <View className="flex-row items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-700">
      <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {species.name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>
          {formatGrains(species.rawValue)} g/m³
        </Text>
        <View className={`px-2.5 py-0.5 rounded-full ${style.bg}`}>
          <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
        </View>
      </View>
    </View>
  );
}

interface PollenSummaryProps {
  today: MergedDailyPollenForecast;
  limitedCoverage: boolean;
  allergenProfile?: string[];
}

export function PollenSummary({
  today,
  limitedCoverage,
  allergenProfile,
}: PollenSummaryProps) {
  const profile = allergenProfile ?? ['tree', 'grass', 'weed'];
  const allSelected = profile.length === 0;
  const [openCategory, setOpenCategory] = useState<'tree' | 'grass' | 'weed' | null>(null);

  const categorySpecies = openCategory
    ? (today.species ?? []).filter((s) => s.category === openCategory)
    : [];

  const categoryLevel = openCategory ? today[openCategory].level : 'none';
  const categoryRaw = openCategory ? today[openCategory].rawValue : 0;

  return (
    <>
      <Card variant="outlined">
        <View className="flex-row items-center mb-3">
          <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Today's pollen
          </Text>
        </View>
        <View className="flex-row gap-2">
          {(['tree', 'grass', 'weed'] as const).map((cat) => (
            <PollenPill
              key={cat}
              label={CATEGORY_LABEL[cat]}
              level={today[cat].level}
              active={allSelected || profile.includes(cat)}
              onPress={() => setOpenCategory(cat)}
            />
          ))}
        </View>
        {limitedCoverage && (
          <Text className="text-xs text-neutral-400 mt-2 text-center">
            Limited pollen data for your region
          </Text>
        )}
      </Card>

      <BottomSheet
        visible={openCategory !== null}
        onClose={() => setOpenCategory(null)}
        snapPoints={[0.72]}
      >
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">
              {openCategory ? CATEGORY_LABEL[openCategory] : ''} Pollen
            </Text>
            <View className={`px-3 py-1 rounded-full ${LEVEL_STYLE[categoryLevel].bg}`}>
              <Text className={`text-sm font-semibold ${LEVEL_STYLE[categoryLevel].text}`}>
                {LEVEL_STYLE[categoryLevel].label}
              </Text>
            </View>
          </View>

          {/* Today's concentration */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#111827' }}>
              {formatGrains(categoryRaw)}
            </Text>
            <Text style={{ fontSize: 13, color: '#9ca3af', fontWeight: '500' }}>grains/m³ today</Text>
          </View>

          {/* Species breakdown */}
          {categorySpecies.length > 0 ? (
            <>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9ca3af', letterSpacing: 0.5, marginBottom: 2 }}>
                SPECIES BREAKDOWN
              </Text>
              {categorySpecies.map((s) => <SpeciesRow key={s.name} species={s} />)}
            </>
          ) : (
            <Text className="text-sm text-neutral-400 mb-2">
              No species-level data available for this category.
            </Text>
          )}
        </View>
      </BottomSheet>
    </>
  );
}
