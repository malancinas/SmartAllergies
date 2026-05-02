import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RiskLevel } from '@/features/forecasting/types';
import type { CorrelationResult } from '@/features/insights/correlationEngine';

// ─── Gradient precomputation ──────────────────────────────────────────────────

function lerpColor(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }, t: number): string {
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r},${g},${b})`;
}

const GREEN = { r: 34, g: 197, b: 94 };
const AMBER = { r: 245, g: 158, b: 11 };
const RED   = { r: 239, g: 68,  b: 68  };
const STEPS = 24;

const GRADIENT_COLORS: string[] = Array.from({ length: STEPS }, (_, i) => {
  const t = i / (STEPS - 1);
  if (t <= 0.5) return lerpColor(GREEN, AMBER, t * 2);
  return lerpColor(AMBER, RED, (t - 0.5) * 2);
});

// ─── Config ───────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<
  RiskLevel,
  {
    bg: string;
    border: string;
    headerColor: string;
    titleColor: string;
    subColor: string;
    dotColor: string;
    dotAlign: 'flex-start' | 'center' | 'flex-end';
    label: string;
    sub: string;
    personalLabel: string;
    personalSub: string;
  }
> = {
  low: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    border: 'border-success-200 dark:border-success-800',
    headerColor: '#22c55e',
    titleColor: '#14532d',
    subColor: '#166534',
    dotColor: '#22c55e',
    dotAlign: 'flex-start',
    label: 'Low risk today',
    sub: 'Pollen levels are low. Enjoy the outdoors!',
    personalLabel: 'Low risk for you today',
    personalSub: 'Your allergens are manageable. A good day to go outside.',
  },
  medium: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    border: 'border-warning-200 dark:border-warning-800',
    headerColor: '#f59e0b',
    titleColor: '#78350f',
    subColor: '#92400e',
    dotColor: '#f59e0b',
    dotAlign: 'center',
    label: 'Moderate allergy risk',
    sub: 'Consider taking antihistamines before going out.',
    personalLabel: 'Moderate allergy risk',
    personalSub: 'Tree pollen elevated — consider antihistamines before going outside.',
  },
  high: {
    bg: 'bg-error-50 dark:bg-error-900/20',
    border: 'border-error-200 dark:border-error-800',
    headerColor: '#ef4444',
    titleColor: '#7f1d1d',
    subColor: '#991b1b',
    dotColor: '#ef4444',
    dotAlign: 'flex-end',
    label: 'High risk today',
    sub: 'Stay indoors if possible. Keep windows closed.',
    personalLabel: 'High risk for you today',
    personalSub: 'Your main allergens are high. Limit outdoor time.',
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

// ─── Gradient severity bar ────────────────────────────────────────────────────

function SeverityBar({ level, dotColor, dotAlign }: { level: RiskLevel; dotColor: string; dotAlign: 'flex-start' | 'center' | 'flex-end' }) {
  return (
    <View style={{ marginTop: 14, marginBottom: 0 }}>
      {/* Track + dot layer */}
      <View style={{ position: 'relative' }}>
        {/* Gradient bar */}
        <View style={{ height: 4, flexDirection: 'row', borderRadius: 2, overflow: 'hidden' }}>
          {GRADIENT_COLORS.map((color, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: color }} />
          ))}
        </View>
        {/* Indicator dot — absolutely overlaid, aligned to risk position */}
        <View
          style={{
            position: 'absolute',
            top: -4,
            left: 0,
            right: 0,
            alignItems: dotAlign,
          }}
          pointerEvents="none"
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#fff',
              borderWidth: 2,
              borderColor: dotColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2,
            }}
          />
        </View>
      </View>
      {/* Labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        {(['Low', 'Moderate', 'High'] as const).map((lbl, i) => {
          const isActive = (level === 'low' && i === 0) || (level === 'medium' && i === 1) || (level === 'high' && i === 2);
          return (
            <Text
              key={lbl}
              style={{ fontSize: 11, fontWeight: isActive ? '700' : '400', color: isActive ? dotColor : '#9ca3af' }}
            >
              {lbl}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RiskBannerProps {
  level: RiskLevel;
  personalised: boolean;
  isPro: boolean;
  allergenSource?: 'model' | 'manual';
  activeAllergens?: string[];
  daysNeeded?: number;
  topTrigger?: CorrelationResult;
  onProfilePress?: () => void;
  onChangeAllergensPress?: () => void;
}

// ─── Trigger row ─────────────────────────────────────────────────────────────

function TriggerRow({
  dotColor,
  name,
  rowLabel,
  onChangeAllergensPress,
}: {
  dotColor: string;
  name: string;
  rowLabel: string;
  onChangeAllergensPress?: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
        <Text style={{ fontSize: 13, color: '#374151' }}>
          <Text style={{ fontWeight: '500' }}>{name}</Text>
          <Text style={{ color: '#6b7280' }}> · {rowLabel}</Text>
        </Text>
      </View>
      <TouchableOpacity onPress={onChangeAllergensPress} activeOpacity={0.7} style={{ marginLeft: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#6366f1' }}>Change ›</Text>
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
  const cfg = LEVEL_CONFIG[level];
  const label = isPro ? cfg.personalLabel : cfg.label;
  const sub   = isPro ? cfg.personalSub   : cfg.sub;
  const manualDisplay = allergenDisplayLabel(activeAllergens ?? []);

  return (
    <View className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: cfg.headerColor }}>
          TODAY'S RISK
        </Text>
        <View style={{
          width: 26, height: 26, borderRadius: 13,
          borderWidth: 1.5, borderColor: cfg.headerColor,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="information" size={13} color={cfg.headerColor} />
        </View>
      </View>

      {/* Risk title + subtitle */}
      <Text style={{ fontSize: 20, fontWeight: '800', color: cfg.titleColor, lineHeight: 26 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, color: cfg.subColor, marginTop: 4, lineHeight: 19 }}>
        {sub}
      </Text>

      {/* Gradient severity bar */}
      <SeverityBar level={level} dotColor={cfg.dotColor} dotAlign={cfg.dotAlign} />

      {/* Divider + trigger */}
      <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)' }}>
        {isPro ? (
          allergenSource === 'model' ? (
            personalised && topTrigger ? (
              <>
                <TriggerRow
                  dotColor={cfg.dotColor}
                  name={topTrigger.label}
                  rowLabel="your key trigger"
                  onChangeAllergensPress={onChangeAllergensPress}
                />
                <TouchableOpacity onPress={onProfilePress} activeOpacity={0.7} style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#6366f1' }}>
                    See your personal allergy profile ›
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              daysNeeded !== undefined && daysNeeded > 0 && (
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                  🧬 {daysNeeded} more day{daysNeeded === 1 ? '' : 's'} of logging to personalise your score.
                </Text>
              )
            )
          ) : (
            <TriggerRow
              dotColor={cfg.dotColor}
              name={manualDisplay.name}
              rowLabel="your selected allergens"
              onChangeAllergensPress={onChangeAllergensPress}
            />
          )
        ) : (
          <>
            <TriggerRow
              dotColor={cfg.dotColor}
              name={manualDisplay.name}
              rowLabel="your selected allergens"
              onChangeAllergensPress={onChangeAllergensPress}
            />
            <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
              Upgrade to Pro for a risk score personalised to your allergy history.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
