import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, Modal, Pressable } from 'react-native';
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
    bgLight: string;
    bgDark: string;
    border: string;
    headerColor: string;
    titleColor: string;
    titleColorDark: string;
    subColor: string;
    subColorDark: string;
    dotColor: string;
    dividerColor: string;
    dividerColorDark: string;
    dotAlign: 'flex-start' | 'center' | 'flex-end';
    label: string;
    sub: string;
    personalLabel: string;
    personalSub: string;
  }
> = {
  low: {
    bg: 'bg-success-100 dark:bg-success-900/40',
    bgLight: '#dcfce7',
    bgDark: 'rgba(74,222,128,0.28)',
    border: 'border-success-200 dark:border-success-700',
    headerColor: '#22c55e',
    titleColor: '#14532d',
    titleColorDark: '#bbf7d0',
    subColor: '#166534',
    subColorDark: '#86efac',
    dotColor: '#22c55e',
    dividerColor: '#bbf7d0',
    dividerColorDark: 'rgba(74,222,128,0.35)',
    dotAlign: 'flex-start',
    label: 'Low risk today',
    sub: 'Pollen levels are low. Enjoy the outdoors!',
    personalLabel: 'Low risk for you today',
    personalSub: 'Your allergens are manageable. A good day to go outside.',
  },
  medium: {
    bg: 'bg-warning-100 dark:bg-warning-900/40',
    bgLight: '#fef3c7',
    bgDark: 'rgba(251,191,36,0.28)',
    border: 'border-warning-200 dark:border-warning-600',
    headerColor: '#f59e0b',
    titleColor: '#78350f',
    titleColorDark: '#fde68a',
    subColor: '#92400e',
    subColorDark: '#fcd34d',
    dotColor: '#f59e0b',
    dividerColor: '#fde68a',
    dividerColorDark: 'rgba(251,191,36,0.35)',
    dotAlign: 'center',
    label: 'Moderate allergy risk',
    sub: 'Consider taking antihistamines before going out.',
    personalLabel: 'Moderate allergy risk',
    personalSub: 'Tree pollen elevated — consider antihistamines before going outside.',
  },
  high: {
    bg: 'bg-error-100 dark:bg-error-900/40',
    bgLight: '#fee2e2',
    bgDark: 'rgba(248,113,113,0.28)',
    border: 'border-error-200 dark:border-error-600',
    headerColor: '#ef4444',
    titleColor: '#7f1d1d',
    titleColorDark: '#fecaca',
    subColor: '#991b1b',
    subColorDark: '#fca5a5',
    dotColor: '#ef4444',
    dividerColor: '#fecaca',
    dividerColorDark: 'rgba(248,113,113,0.35)',
    dotAlign: 'flex-end',
    label: 'High risk today',
    sub: 'Stay indoors if possible. Keep windows closed.',
    personalLabel: 'High risk for you today',
    personalSub: 'Your main allergens are high. Limit outdoor time.',
  },
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
        <Text style={{ fontSize: 14, color: dotColor }}>
          <Text style={{ fontWeight: '700' }}>{name}</Text>
          <Text style={{ fontWeight: '400', opacity: 0.7 }}> — {rowLabel}</Text>
        </Text>
      </View>
      <TouchableOpacity onPress={onChangeAllergensPress} activeOpacity={0.7} style={{ marginLeft: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#6366f1' }}>Change ›</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function RiskInfoModal({
  visible,
  onClose,
  level,
  isPro,
  allergenSource,
  personalised,
  activeAllergens,
  daysNeeded,
  topTrigger,
  headerColor,
}: {
  visible: boolean;
  onClose: () => void;
  level: RiskLevel;
  isPro: boolean;
  allergenSource?: 'model' | 'manual';
  personalised: boolean;
  activeAllergens?: string[];
  daysNeeded?: number;
  topTrigger?: CorrelationResult;
  headerColor: string;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const bg = isDark ? '#1f2937' : '#ffffff';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const divider = isDark ? '#374151' : '#e5e7eb';
  const pillBg = isDark ? '#374151' : '#f3f4f6';

  const isModelPro = isPro && allergenSource === 'model';
  const manualDisplay = allergenDisplayLabel(activeAllergens ?? []);

  let methodText: string;
  let triggerLine: string;
  let confidenceLine: string | null = null;
  let learningLine: string | null = null;

  if (!isPro || allergenSource === 'manual') {
    methodText = 'Your risk score is calculated from live pollen levels for the allergens you have manually selected.';
    triggerLine = `📌  Manually selected: ${manualDisplay.name}`;
  } else if (isModelPro && !personalised) {
    methodText = 'Your risk uses a general pollen model. Keep logging your symptoms daily and the app will learn your personal triggers.';
    triggerLine = daysNeeded && daysNeeded > 0
      ? `🧬  ${daysNeeded} more day${daysNeeded === 1 ? '' : 's'} of logging to personalise your score`
      : '🧬  Building your profile — keep logging!';
    learningLine = 'The app is still learning from your data.';
  } else {
    methodText = 'Your risk score is personalised to your allergy history using machine learning trained on your symptom logs.';
    triggerLine = topTrigger ? `🔬  Learnt trigger: ${topTrigger.label}` : '🔬  Personalised to your history';
    if (topTrigger) {
      const pct = Math.round(topTrigger.correlation * 100);
      const pts = topTrigger.dataPoints;
      confidenceLine = `${pct}% correlation · ${pts} symptom log${pts === 1 ? '' : 's'}`;
    }
    learningLine = 'The app continues to learn — accuracy improves as you log more days.';
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}} style={{ width: '100%' }}>
          <View style={{ backgroundColor: bg, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 }}>
            {/* Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: textPrimary }}>How your risk is calculated</Text>
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Method */}
            <Text style={{ fontSize: 13, color: textSecondary, lineHeight: 19, marginBottom: 14 }}>{methodText}</Text>

            <View style={{ height: 1, backgroundColor: divider, marginBottom: 14 }} />

            {/* Trigger pill */}
            <View style={{ backgroundColor: pillBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: confidenceLine || learningLine ? 10 : 0 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: textPrimary }}>{triggerLine}</Text>
            </View>

            {/* Confidence */}
            {confidenceLine && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: headerColor }} />
                <Text style={{ fontSize: 12, color: textSecondary }}>{confidenceLine}</Text>
              </View>
            )}

            {/* Learning note */}
            {learningLine && (
              <Text style={{ fontSize: 12, color: headerColor, fontWeight: '600', marginTop: 2 }}>
                {learningLine}
              </Text>
            )}

            {/* Free upsell */}
            {!isPro && (
              <>
                <View style={{ height: 1, backgroundColor: divider, marginTop: 14, marginBottom: 12 }} />
                <Text style={{ fontSize: 12, color: textSecondary, lineHeight: 18 }}>
                  🔒  Upgrade to <Text style={{ fontWeight: '700', color: textPrimary }}>Pro</Text> to unlock a personalised risk score based on your actual symptom history.
                </Text>
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

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
  const [showInfo, setShowInfo] = useState(false);
  const scheme = useColorScheme();
  const cfg = LEVEL_CONFIG[level];
  const label = isPro ? cfg.personalLabel : cfg.label;
  const sub   = isPro ? cfg.personalSub   : cfg.sub;
  const manualDisplay = allergenDisplayLabel(activeAllergens ?? []);
  const dividerColor = scheme === 'dark' ? cfg.dividerColorDark : cfg.dividerColor;

  const titleColor = scheme === 'dark' ? cfg.titleColorDark : cfg.titleColor;
  const bgColor    = scheme === 'dark' ? cfg.bgDark         : cfg.bgLight;

  return (
    <>
    <RiskInfoModal
      visible={showInfo}
      onClose={() => setShowInfo(false)}
      level={level}
      isPro={isPro}
      allergenSource={allergenSource}
      personalised={personalised}
      activeAllergens={activeAllergens}
      daysNeeded={daysNeeded}
      topTrigger={topTrigger}
      headerColor={cfg.headerColor}
    />
    <View
      className="rounded-2xl p-4"
      style={{ backgroundColor: bgColor }}
    >
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 1.2, color: cfg.headerColor }}>
          TODAY'S RISK
        </Text>
        <TouchableOpacity onPress={() => setShowInfo(true)} activeOpacity={0.7} hitSlop={8}>
          <View style={{
            width: 26, height: 26, borderRadius: 13,
            borderWidth: 1.5, borderColor: cfg.headerColor,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="information" size={13} color={cfg.headerColor} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Risk title + subtitle */}
      <Text style={{ fontSize: 20, fontWeight: '800', color: titleColor, lineHeight: 26 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, color: cfg.headerColor, marginTop: 4, lineHeight: 19 }}>
        {sub}
      </Text>

      {/* Gradient severity bar */}
      <SeverityBar level={level} dotColor={cfg.dotColor} dotAlign={cfg.dotAlign} />

      {/* Divider + trigger */}
      <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: dividerColor }}>
        {isPro ? (
          allergenSource === 'model' ? (
            personalised && topTrigger ? (
              <>
                <TriggerRow
                  dotColor={cfg.dotColor}
                  name={topTrigger.label}
                  rowLabel="Learnt Trigger"
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
              rowLabel="Selected Trigger"
              onChangeAllergensPress={onChangeAllergensPress}
            />
          )
        ) : (
          <>
            <TriggerRow
              dotColor={cfg.dotColor}
              name={manualDisplay.name}
              rowLabel="Selected Trigger"
              onChangeAllergensPress={onChangeAllergensPress}
            />
            <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
              Upgrade to Pro for a risk score personalised to your allergy history.
            </Text>
          </>
        )}
      </View>
    </View>
    </>
  );
}
