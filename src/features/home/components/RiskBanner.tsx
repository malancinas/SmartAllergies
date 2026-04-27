import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { RiskLevel } from '@/features/forecasting/types';
import type { CorrelationResult } from '@/features/insights/correlationEngine';
import { correlationStrength } from '@/features/insights/correlationEngine';

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface RiskBannerProps {
  level: RiskLevel;
  personalised: boolean;
  isPro: boolean;
  /** Days still needed before profile is ready (Pro only, while building) */
  daysNeeded?: number;
  /** Top correlator once profile is ready */
  topTrigger?: CorrelationResult;
  onUpgradePress?: () => void;
  onProfilePress?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RiskBanner({
  level,
  personalised,
  isPro,
  daysNeeded,
  topTrigger,
  onUpgradePress,
  onProfilePress,
}: RiskBannerProps) {
  const base = GENERIC_CONFIG[level];
  const label = personalised ? PERSONAL_CONFIG[level].label : base.label;
  const sub = personalised ? PERSONAL_CONFIG[level].sub : base.sub;

  // Only surface a trigger if the correlation is at least moderate strength
  const showTrigger =
    isPro && personalised && topTrigger && Math.abs(topTrigger.correlation) >= 0.4;
  const triggerStrength = topTrigger ? correlationStrength(topTrigger.correlation) : null;

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

      {/* Bottom section — only shown for Pro users */}
      {isPro && (
        <View className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
          {personalised ? (
            // Ready: trigger pill (if signal is strong enough) + profile CTA
            <>
              {showTrigger && topTrigger && triggerStrength && (
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <Text style={{ fontSize: 15 }}>{TRIGGER_EMOJI[topTrigger.key] ?? '🔬'}</Text>
                    <View>
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide font-medium">
                        Your main trigger
                      </Text>
                      <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {topTrigger.label}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="rounded-full px-2.5 py-1"
                    style={{ backgroundColor: `${triggerStrength.color}22` }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: triggerStrength.color }}>
                      {triggerStrength.label}
                    </Text>
                  </View>
                </View>
              )}
              <TouchableOpacity
                onPress={onProfilePress}
                activeOpacity={0.7}
                className="flex-row items-center justify-between"
              >
                <Text className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  See your personal allergy profile
                </Text>
                <Text className="text-sm text-primary-500">›</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Still building — show progress nudge
            daysNeeded !== undefined && daysNeeded > 0 && (
              <Text className="text-xs text-neutral-400">
                🧬 {daysNeeded} more day{daysNeeded === 1 ? '' : 's'} of logging to personalise your score.
              </Text>
            )
          )}
        </View>
      )}

      {/* Free user upgrade nudge */}
      {!isPro && (
        <TouchableOpacity
          onPress={onUpgradePress}
          activeOpacity={0.7}
          className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 flex-row items-center justify-between"
        >
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 flex-1">
            Based on local pollen levels. Upgrade to Pro for a score personalised to your allergy history.
          </Text>
          <Text className="text-xs font-semibold text-primary-600 dark:text-primary-400 ml-2">
            Upgrade ›
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
