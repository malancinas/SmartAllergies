import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { RiskLevel } from '@/features/forecasting/types';
import type { CorrelationResult } from '@/features/insights/correlationEngine';

// ─── Config ───────────────────────────────────────────────────────────────────

const GENERIC_CONFIG: Record<
  RiskLevel,
  { bg: string; border: string; text: string; emoji: string; label: string; sub: string }
> = {
  low: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    border: 'border-success-200 dark:border-success-700',
    text: 'text-success-800 dark:text-success-300',
    emoji: '😊',
    label: 'Low risk today',
    sub: 'Pollen levels are low. Enjoy the outdoors!',
  },
  medium: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    border: 'border-warning-200 dark:border-warning-700',
    text: 'text-warning-800 dark:text-warning-300',
    emoji: '😐',
    label: 'Moderate risk today',
    sub: 'Consider taking antihistamines before going out.',
  },
  high: {
    bg: 'bg-error-50 dark:bg-error-900/20',
    border: 'border-error-200 dark:border-error-700',
    text: 'text-error-800 dark:text-error-300',
    emoji: '😷',
    label: 'High risk today',
    sub: 'Stay indoors if possible. Keep windows closed.',
  },
};

const PERSONAL_CONFIG: Record<RiskLevel, { label: string; sub: string }> = {
  low: {
    label: 'Low risk for you today',
    sub: 'Your allergens are manageable. A good day to go outside.',
  },
  medium: {
    label: 'Moderate risk for you today',
    sub: 'Your triggers are elevated — consider antihistamines.',
  },
  high: {
    label: 'High risk for you today',
    sub: 'Your main allergens are high. Limit outdoor time.',
  },
};

const TRIGGER_EMOJI: Record<string, string> = {
  grassPollen: '🌾',
  treePollen: '🌳',
  weedPollen: '🌿',
  pm25: '💨',
  pm10: '💨',
  ozone: '🌫️',
  no2: '🏭',
  so2: '🏭',
  uvIndex: '☀️',
  dust: '🟤',
};

const ALLERGEN_META: Record<string, { emoji: string; label: string }> = {
  tree: { emoji: '🌳', label: 'Tree' },
  grass: { emoji: '🌾', label: 'Grass' },
  weed: { emoji: '🌿', label: 'Weed' },
};

function allergenDisplayLabel(allergens: string[]): { emoji: string; name: string } {
  const active = allergens.filter((a) => ALLERGEN_META[a]);
  if (active.length === 0) return { emoji: '🌿', name: 'None selected' };
  const names = active.map((a) => ALLERGEN_META[a].label).join(', ');
  return { emoji: ALLERGEN_META[active[0]].emoji, name: names + ' pollen' };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RiskBannerProps {
  level: RiskLevel;
  personalised: boolean;
  isPro: boolean;
  /** 'model' = ML-derived triggers, 'manual' = user-selected allergens */
  allergenSource?: 'model' | 'manual';
  /** Active allergens for manual mode display */
  activeAllergens?: string[];
  /** Days still needed before profile is ready (Pro only, model mode only) */
  daysNeeded?: number;
  /** Top correlator once profile is ready (model mode only) */
  topTrigger?: CorrelationResult;
  onProfilePress?: () => void;
  onChangeAllergensPress?: () => void;
}

// ─── Shared trigger row ───────────────────────────────────────────────────────

function TriggerRow({
  emoji,
  rowLabel,
  name,
  onChangeAllergensPress,
}: {
  emoji: string;
  rowLabel: string;
  name: string;
  onChangeAllergensPress?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2 flex-1">
        <Text style={{ fontSize: 15 }}>{emoji}</Text>
        <View className="flex-1">
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide font-medium">
            {rowLabel}
          </Text>
          <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {name}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onChangeAllergensPress} activeOpacity={0.7} className="ml-3">
        <Text className="text-xs font-semibold text-primary-600 dark:text-primary-400">
          Change ›
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RiskBanner({
  level,
  personalised,
  isPro,
  allergenSource,
  activeAllergens,
  daysNeeded,
  topTrigger,
  onProfilePress,
  onChangeAllergensPress,
}: RiskBannerProps) {
  const base = GENERIC_CONFIG[level];
  const label = isPro ? PERSONAL_CONFIG[level].label : base.label;
  const sub = isPro ? PERSONAL_CONFIG[level].sub : base.sub;

  const manualDisplay = allergenDisplayLabel(activeAllergens ?? []);

  return (
    <View className={`rounded-2xl border-2 p-4 ${base.bg} ${base.border}`}>
      {/* Main row */}
      <View className="flex-row items-center">
        <Text className="text-4xl mr-3">{base.emoji}</Text>
        <View className="flex-1">
          <Text className={`text-lg font-bold ${base.text}`}>{label}</Text>
          <Text className={`text-sm mt-0.5 ${base.text} opacity-80`}>{sub}</Text>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
        {isPro ? (
          allergenSource === 'model' ? (
            personalised && topTrigger ? (
              // Pro, model mode, ready
              <>
                <TriggerRow
                  emoji={TRIGGER_EMOJI[topTrigger.key] ?? '🔬'}
                  rowLabel="Your analysed trigger"
                  name={topTrigger.label}
                  onChangeAllergensPress={onChangeAllergensPress}
                />
                <TouchableOpacity
                  onPress={onProfilePress}
                  activeOpacity={0.7}
                  className="mt-3"
                >
                  <Text className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                    See your personal allergy profile ›
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // Pro, model mode, still building
              daysNeeded !== undefined && daysNeeded > 0 && (
                <Text className="text-xs text-neutral-400">
                  🧬 {daysNeeded} more day{daysNeeded === 1 ? '' : 's'} of logging to personalise your score.
                </Text>
              )
            )
          ) : (
            // Pro, manual mode
            <TriggerRow
              emoji={manualDisplay.emoji}
              rowLabel="Your selected allergens"
              name={manualDisplay.name}
              onChangeAllergensPress={onChangeAllergensPress}
            />
          )
        ) : (
          // Free user: show their selected allergens + upgrade message
          <>
            <TriggerRow
              emoji={manualDisplay.emoji}
              rowLabel="Your selected allergens"
              name={manualDisplay.name}
              onChangeAllergensPress={onChangeAllergensPress}
            />
            <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
              Upgrade to Pro for a risk score personalised to your allergy history.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
