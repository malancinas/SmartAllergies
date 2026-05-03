import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useColorScheme, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { MergedDailyPollenForecast, PollenLevel, SpeciesData, AirQualityData, AirQualityMetric, HourlyPollenPoint } from '@/features/pollen/types';

// ─── Level styles (grid cards) ────────────────────────────────────────────────

const LEVEL_STYLE: Record<PollenLevel, { bg: string; text: string; label: string; rawBg: string; rawText: string; darkBg: string; darkText: string; rawBorder: string; darkBorder: string }> = {
  none:     { bg: 'bg-neutral-100 dark:bg-neutral-700',       text: 'text-neutral-400',                        label: 'None',      rawBg: '#e5e7eb', rawText: '#9ca3af', darkBg: '#374151',                 darkText: '#9ca3af', rawBorder: '#d1d5db',                  darkBorder: 'rgba(156,163,175,0.35)' },
  low:      { bg: 'bg-success-100 dark:bg-success-900/40',    text: 'text-success-700 dark:text-success-300',  label: 'Low',       rawBg: '#dcfce7', rawText: '#15803d', darkBg: 'rgba(74,222,128,0.28)',   darkText: '#4ade80', rawBorder: '#bbf7d0',                  darkBorder: 'rgba(74,222,128,0.50)'  },
  medium:   { bg: 'bg-warning-100 dark:bg-warning-900/40',    text: 'text-warning-700 dark:text-warning-300',  label: 'Medium',    rawBg: '#fef3c7', rawText: '#b45309', darkBg: 'rgba(251,191,36,0.28)',   darkText: '#fbbf24', rawBorder: '#fde68a',                  darkBorder: 'rgba(251,191,36,0.50)'  },
  high:     { bg: 'bg-error-100 dark:bg-error-900/40',        text: 'text-error-700 dark:text-error-300',      label: 'High',      rawBg: '#fee2e2', rawText: '#dc2626', darkBg: 'rgba(248,113,113,0.28)',  darkText: '#f87171', rawBorder: '#fecaca',                  darkBorder: 'rgba(248,113,113,0.50)' },
  very_high:{ bg: 'bg-error-200 dark:bg-error-900/60',        text: 'text-error-800 dark:text-error-200',      label: 'Very high', rawBg: '#fecaca', rawText: '#b91c1c', darkBg: 'rgba(248,113,113,0.40)',  darkText: '#f87171', rawBorder: '#fca5a5',                  darkBorder: 'rgba(248,113,113,0.65)' },
};

// ─── Pollen detail sheet constants ────────────────────────────────────────────

const LEVEL_CARD: Record<PollenLevel, { bg: string; text: string; accent: string }> = {
  none:      { bg: '#1f2937', text: '#9ca3af', accent: '#6b7280' },
  low:       { bg: '#052e16', text: '#4ade80', accent: '#22c55e' },
  medium:    { bg: '#451a03', text: '#fbbf24', accent: '#f59e0b' },
  high:      { bg: '#450a0a', text: '#f87171', accent: '#ef4444' },
  very_high: { bg: '#3b0764', text: '#e879f9', accent: '#d946ef' },
};

const LEVEL_INDEX: Record<PollenLevel, number> = {
  none: 0, low: 2, medium: 4, high: 7, very_high: 9,
};

const LEVEL_SUBTITLE: Record<PollenLevel, string> = {
  none:      'No significant pollen detected',
  low:       'Unlikely to affect most people',
  medium:    'Noticeable for sensitive individuals',
  high:      'May affect most allergy sufferers',
  very_high: 'Severe — take precautions outdoors',
};

const LEVEL_TIP: Record<PollenLevel, string> = {
  none:      'All clear today. No precautions needed — enjoy your time outside.',
  low:       'Low risk today. Keep antihistamines handy if you\'re particularly sensitive.',
  medium:    'Consider taking antihistamines before going out. Keep windows closed at home.',
  high:      'Limit outdoor time, especially in the morning. Shower after being outside.',
  very_high: 'Stay indoors where possible. Take prescribed medication and wear sunglasses outdoors.',
};

const SEASON_END: Record<'tree' | 'grass' | 'weed', string> = {
  tree:  '~Late June',
  grass: '~Late August',
  weed:  '~Late September',
};

const POLLEN_LEVEL_FILL: Record<PollenLevel, number> = {
  none: 0, low: 1, medium: 2, high: 3, very_high: 4,
};

const POLLEN_BAR_SEGMENTS = [
  { color: '#22c55e', dimColor: 'rgba(34,197,94,0.18)' },
  { color: '#f59e0b', dimColor: 'rgba(245,158,11,0.18)' },
  { color: '#ef4444', dimColor: 'rgba(239,68,68,0.18)' },
  { color: '#dc2626', dimColor: 'rgba(220,38,38,0.18)' },
];
const POLLEN_BAR_LABELS = ['Low', 'Medium', 'High', 'Very high'];

// ─── Air quality detail sheet constants ───────────────────────────────────────

const AQ_CARD: Record<PollenLevel, { bg: string; text: string; accent: string }> = {
  none:      { bg: '#052e16', text: '#4ade80', accent: '#22c55e' },
  low:       { bg: '#042f2e', text: '#2dd4bf', accent: '#14b8a6' },
  medium:    { bg: '#451a03', text: '#fbbf24', accent: '#f59e0b' },
  high:      { bg: '#431407', text: '#fb923c', accent: '#f97316' },
  very_high: { bg: '#450a0a', text: '#f87171', accent: '#ef4444' },
};

const AQ_LEVEL_LABEL: Record<PollenLevel, string> = {
  none: 'Good', low: 'Low', medium: 'Moderate', high: 'Poor', very_high: 'Very poor',
};

const AQ_INDEX: Record<PollenLevel, number> = {
  none: 1, low: 3, medium: 5, high: 7, very_high: 9,
};

const AQ_SUBTITLE: Record<PollenLevel, string> = {
  none:      'Air quality is excellent today',
  low:       'Good air quality — minimal risk',
  medium:    'Some groups may be affected',
  high:      'Unhealthy for sensitive groups',
  very_high: 'Very unhealthy — avoid outdoors',
};

const AQ_ACTION: Record<PollenLevel, string> = {
  none:      'enjoy your day',
  low:       'minimal impact',
  medium:    'limit exertion if sensitive',
  high:      'limit outdoor exertion',
  very_high: 'avoid outdoor activity',
};

const AQ_TIP: Record<PollenLevel, string> = {
  none:      'Air quality is excellent. Enjoy outdoor activities without any restriction.',
  low:       'Air quality is good. No action needed for most people.',
  medium:    'Sensitive individuals — those with asthma or heart conditions — should consider reducing prolonged outdoor exertion.',
  high:      'Limit strenuous outdoor activities, especially during peak hours. Stay indoors when possible.',
  very_high: 'Avoid all outdoor physical activity. Keep windows closed and consider wearing an N95 mask if you must go outside.',
};

const AQ_BAR_SEGMENTS = [
  { color: '#22c55e', dimColor: 'rgba(34,197,94,0.18)' },
  { color: '#f59e0b', dimColor: 'rgba(245,158,11,0.18)' },
  { color: '#f97316', dimColor: 'rgba(249,115,22,0.18)' },
  { color: '#dc2626', dimColor: 'rgba(220,38,38,0.18)' },
];
const AQ_BAR_LABELS = ['Good', 'Moderate', 'Poor', 'Hazardous'];

const AQ_METRIC_BADGE: Record<PollenLevel, { bg: string; text: string }> = {
  none:      { bg: 'rgba(34,197,94,0.15)',  text: '#4ade80' },
  low:       { bg: 'rgba(34,197,94,0.15)',  text: '#4ade80' },
  medium:    { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  high:      { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
  very_high: { bg: 'rgba(220,38,38,0.15)',  text: '#f87171' },
};

const LEVEL_ORDER: Record<PollenLevel, number> = { none: 0, low: 1, medium: 2, high: 3, very_high: 4 };

// ─── Shared constants ─────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<'tree' | 'grass' | 'weed', string> = {
  tree: 'Tree', grass: 'Grass', weed: 'Weed',
};

type CategoryIconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICON: Record<'tree' | 'grass' | 'weed', CategoryIconName> = {
  tree: 'leaf',
  grass: 'leaf-outline',
  weed: 'flower-outline',
};

const AQ_METRICS: { key: keyof Omit<AirQualityData, 'overallLevel'>; label: string }[] = [
  { key: 'pm25',    label: 'PM2.5' },
  { key: 'pm10',    label: 'PM10' },
  { key: 'ozone',   label: 'Ozone' },
  { key: 'no2',     label: 'NO₂' },
  { key: 'so2',     label: 'SO₂' },
  { key: 'uvIndex', label: 'UV index' },
  { key: 'dust',    label: 'Dust' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatGrains(value: number): string {
  if (value === 0) return '0';
  if (value < 10) return value.toFixed(1);
  return Math.round(value).toString();
}

function formatAqValue(metric: AirQualityMetric, key: string): string {
  const v = metric.rawValue;
  if (key === 'uvIndex') return v.toFixed(1);
  if (v === 0) return '0';
  if (v < 10) return v.toFixed(1);
  return Math.round(v).toString();
}

function formatHourShort(isoTime: string): string {
  const hour = parseInt(isoTime.slice(11, 13), 10);
  if (hour === 0) return '12 am';
  if (hour < 12) return `${hour} am`;
  if (hour === 12) return '12 pm';
  return `${hour - 12} pm`;
}

function findCategoryPeak(
  points: HourlyPollenPoint[],
  category: 'tree' | 'grass' | 'weed',
  windowSize = 2,
): { start: string; end: string } | null {
  const daytime = points.filter((p) => {
    const h = parseInt(p.time.slice(11, 13), 10);
    return h >= 6 && h <= 20;
  });
  if (daytime.length < windowSize) return null;
  let peakAvg = -Infinity, peakIdx = 0;
  for (let i = 0; i <= daytime.length - windowSize; i++) {
    const avg = daytime.slice(i, i + windowSize).reduce((s, p) => s + p[category], 0) / windowSize;
    if (avg > peakAvg) { peakAvg = avg; peakIdx = i; }
  }
  if (peakAvg === 0) return null;
  return { start: daytime[peakIdx].time, end: daytime[peakIdx + windowSize - 1].time };
}

function findCategoryBest(
  points: HourlyPollenPoint[],
  category: 'tree' | 'grass' | 'weed',
  windowSize = 2,
): { start: string; end: string } | null {
  const daytime = points.filter((p) => {
    const h = parseInt(p.time.slice(11, 13), 10);
    return h >= 6 && h <= 20;
  });
  if (daytime.length < windowSize) return null;
  let bestAvg = Infinity, bestIdx = 0;
  for (let i = 0; i <= daytime.length - windowSize; i++) {
    const avg = daytime.slice(i, i + windowSize).reduce((s, p) => s + p[category], 0) / windowSize;
    if (avg < bestAvg) { bestAvg = avg; bestIdx = i; }
  }
  return { start: daytime[bestIdx].time, end: daytime[bestIdx + windowSize - 1].time };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PollenGridCell({
  iconName, label, level, levelLabel, active, onPress,
}: {
  iconName: CategoryIconName; label: string; level: PollenLevel;
  levelLabel?: string; active: boolean; onPress: () => void;
}) {
  const scheme = useColorScheme();
  const s = LEVEL_STYLE[level];
  const displayLabel = levelLabel ?? s.label;
  const bg = scheme === 'dark' ? s.darkBg : s.rawBg;
  const border = scheme === 'dark' ? s.darkBorder : s.rawBorder;
  const textColor = scheme === 'dark' ? s.darkText : s.rawText;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ flex: 1 }}>
      <View
        className="rounded-2xl p-4"
        style={[
          { minHeight: 118, backgroundColor: bg, borderWidth: 1, borderColor: border },
          !active && { opacity: 0.45 },
        ]}
      >
        <Ionicons name={iconName} size={24} color={textColor} style={{ marginBottom: 10 }} />
        <Text style={{ fontSize: 12, color: textColor, opacity: 0.75, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: textColor, lineHeight: 24 }}>{displayLabel}</Text>
        <Text style={{ fontSize: 11, color: textColor, opacity: 0.75, marginTop: 6 }}>tap for detail</Text>
      </View>
    </TouchableOpacity>
  );
}

function InfoCell({ label, value, locked }: { label: string; value: string; locked?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#1f2937', borderRadius: 14, padding: 14, minHeight: 72 }}>
      <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{label}</Text>
      {locked ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 11 }}>🔒</Text>
          <Text style={{ fontSize: 12, color: '#7c3aed', fontWeight: '600' }}>Pro</Text>
        </View>
      ) : (
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 18 }} numberOfLines={2}>{value}</Text>
      )}
    </View>
  );
}

function AqMetricRowDark({ label, metricKey, metric, locked }: { label: string; metricKey: string; metric: AirQualityMetric; locked: boolean }) {
  const valueStr = formatAqValue(metric, metricKey);
  const unitStr = metric.unit ? ` ${metric.unit}` : '';
  const badge = AQ_METRIC_BADGE[metric.level];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
      <Text style={{ fontSize: 14, color: '#e5e7eb', fontWeight: '500' }}>{label}</Text>
      {locked ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(124,58,237,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
          <Text style={{ fontSize: 11 }}>🔒</Text>
          <Text style={{ fontSize: 12, color: '#a78bfa', fontWeight: '600' }}>Pro</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 13, color: '#6b7280' }}>{valueStr}{unitStr}</Text>
          <View style={{ backgroundColor: badge.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ fontSize: 12, color: badge.text, fontWeight: '600' }}>{AQ_LEVEL_LABEL[metric.level]}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function SpeciesRow({ species }: { species: SpeciesData }) {
  const style = LEVEL_STYLE[species.level];
  return (
    <View className="flex-row items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-700">
      <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{species.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>{formatGrains(species.rawValue)} g/m³</Text>
        <View className={`px-2.5 py-0.5 rounded-full ${style.bg}`}>
          <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PollenSummaryProps {
  today: MergedDailyPollenForecast;
  limitedCoverage: boolean;
  allergenProfile?: string[];
  isPro: boolean;
  onUpgradePress: () => void;
  todayHourly?: HourlyPollenPoint[];
  locationLabel?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PollenSummary({ today, limitedCoverage, allergenProfile, isPro, onUpgradePress, todayHourly, locationLabel }: PollenSummaryProps) {
  const profile = allergenProfile ?? ['tree', 'grass', 'weed'];
  const allSelected = profile.length === 0;
  const [openCategory, setOpenCategory] = useState<'tree' | 'grass' | 'weed' | null>(null);
  const [aqOpen, setAqOpen] = useState(false);
  const [pillAdSeen, setPillAdSeen] = useState(false);
  const [pillAdPlaying, setPillAdPlaying] = useState(false);

  async function handlePillPress(action: () => void) {
    if (isPro || pillAdSeen) { action(); return; }
    setPillAdPlaying(true);
    // TODO: swap for real rewarded-ad call
    await new Promise<void>((resolve) => setTimeout(resolve, 1500));
    setPillAdPlaying(false);
    setPillAdSeen(true);
    action();
  }

  const categorySpecies = openCategory ? (today.species ?? []).filter((s) => s.category === openCategory) : [];
  const categoryLevel = openCategory ? today[openCategory].level : 'none';
  const categoryRaw   = openCategory ? today[openCategory].rawValue : 0;

  const aq = today.airQuality;
  const aqLevel = aq?.overallLevel ?? 'none';

  // Pollen sheet computed values
  const pollenCard = LEVEL_CARD[categoryLevel];
  const pollenFill = POLLEN_LEVEL_FILL[categoryLevel];
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
  const locationStr = locationLabel ?? 'Your location';

  const peakWindow = openCategory && todayHourly?.length
    ? findCategoryPeak(todayHourly, openCategory)
    : null;
  const bestWindow = openCategory && todayHourly?.length
    ? findCategoryBest(todayHourly, openCategory)
    : null;

  const mainSpecies = categorySpecies
    .slice()
    .sort((a, b) => b.rawValue - a.rawValue)
    .slice(0, 2)
    .map((s) => s.name)
    .join(', ');

  // AQ sheet computed values
  const aqCard = AQ_CARD[aqLevel];
  const aqFill = POLLEN_LEVEL_FILL[aqLevel];

  const dominantPollutant = aq
    ? ([
        { label: 'PM2.5', metric: aq.pm25 },
        { label: 'PM10',  metric: aq.pm10 },
        { label: 'Ozone', metric: aq.ozone },
        { label: 'NO₂',   metric: aq.no2 },
        { label: 'SO₂',   metric: aq.so2 },
        { label: 'Dust',  metric: aq.dust },
      ] as { label: string; metric: AirQualityMetric }[])
        .sort((a, b) => LEVEL_ORDER[b.metric.level] - LEVEL_ORDER[a.metric.level])[0]
    : null;

  const aqHeroSubtitle = dominantPollutant && LEVEL_ORDER[dominantPollutant.metric.level] >= 2
    ? `${dominantPollutant.label} elevated — ${AQ_ACTION[aqLevel]}`
    : AQ_SUBTITLE[aqLevel];

  const advisoryColor  = aqLevel === 'none' || aqLevel === 'low' ? '#22c55e' : aqLevel === 'medium' ? '#fbbf24' : '#f87171';
  const advisoryBg     = aqLevel === 'none' || aqLevel === 'low' ? '#052e16' : aqLevel === 'medium' ? '#451a03' : '#450a0a';
  const advisoryTitle  = aqLevel === 'none' || aqLevel === 'low' ? '#4ade80' : aqLevel === 'medium' ? '#fbbf24' : '#f87171';
  const advisoryBody   = aqLevel === 'none' || aqLevel === 'low' ? '#d1fae5' : aqLevel === 'medium' ? '#fef3c7' : '#fee2e2';

  return (
    <>
      {/* 2×2 grid */}
      <View pointerEvents={pillAdPlaying ? 'none' : 'auto'} style={{ gap: 10, opacity: pillAdPlaying ? 0.5 : 1 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <PollenGridCell
            iconName={CATEGORY_ICON.tree}
            label={CATEGORY_LABEL.tree}
            level={today.tree.level}
            active={allSelected || profile.includes('tree')}
            onPress={() => handlePillPress(() => setOpenCategory('tree'))}
          />
          <PollenGridCell
            iconName={CATEGORY_ICON.grass}
            label={CATEGORY_LABEL.grass}
            level={today.grass.level}
            active={allSelected || profile.includes('grass')}
            onPress={() => handlePillPress(() => setOpenCategory('grass'))}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <PollenGridCell
            iconName={CATEGORY_ICON.weed}
            label={CATEGORY_LABEL.weed}
            level={today.weed.level}
            active={allSelected || profile.includes('weed')}
            onPress={() => handlePillPress(() => setOpenCategory('weed'))}
          />
          {aq ? (
            <PollenGridCell
              iconName={'partly-sunny-outline' as CategoryIconName}
              label="Air quality"
              level={aqLevel}
              levelLabel={AQ_LEVEL_LABEL[aqLevel]}
              active
              onPress={() => handlePillPress(() => setAqOpen(true))}
            />
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>
      </View>
      {pillAdPlaying && (
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <ActivityIndicator size="small" color="#6366f1" />
        </View>
      )}

      {limitedCoverage && (
        <Text className="text-xs text-neutral-400 mt-1 text-center">
          Limited pollen data for your region
        </Text>
      )}

      {/* ── Pollen category detail sheet ─────────────────────────────────── */}
      <BottomSheet
        visible={openCategory !== null}
        onClose={() => setOpenCategory(null)}
        snapPoints={[0.82]}
        backgroundColor="#111827"
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          {openCategory && (
            <>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name={CATEGORY_ICON[openCategory]} size={20} color={pollenCard.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>
                    {CATEGORY_LABEL[openCategory]} pollen
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {dateStr} · {locationStr}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setOpenCategory(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>✕</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Level hero card */}
              <View style={{ backgroundColor: pollenCard.bg, borderRadius: 18, padding: 18, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 30, fontWeight: '800', color: pollenCard.text, lineHeight: 34 }}>
                      {LEVEL_STYLE[categoryLevel].label}
                    </Text>
                    <Text style={{ fontSize: 13, color: pollenCard.text, opacity: 0.7, marginTop: 4, lineHeight: 18 }}>
                      {LEVEL_SUBTITLE[categoryLevel]}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 42, fontWeight: '900', color: pollenCard.text, lineHeight: 46 }}>
                      {LEVEL_INDEX[categoryLevel]}
                    </Text>
                    <Text style={{ fontSize: 12, color: pollenCard.text, opacity: 0.55 }}>/ 10 index</Text>
                  </View>
                </View>
              </View>

              {/* Progress bar */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', height: 8, borderRadius: 6, overflow: 'hidden', gap: 3 }}>
                  {POLLEN_BAR_SEGMENTS.map((seg, i) => (
                    <View key={i} style={{ flex: 1, backgroundColor: i < pollenFill ? seg.color : seg.dimColor, borderRadius: 4 }} />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}>
                  {POLLEN_BAR_LABELS.map((lbl) => (
                    <Text key={lbl} style={{ fontSize: 10, color: '#4b5563' }}>{lbl}</Text>
                  ))}
                </View>
              </View>

              {/* 2×2 info grid */}
              <View style={{ gap: 8, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <InfoCell
                    label="Peak today"
                    value={peakWindow ? `${formatHourShort(peakWindow.start)}–${formatHourShort(peakWindow.end)}` : '—'}
                    locked={!isPro && !!todayHourly?.length}
                  />
                  <InfoCell
                    label="Best window"
                    value={bestWindow ? `${formatHourShort(bestWindow.start)}–${formatHourShort(bestWindow.end)}` : '—'}
                    locked={!isPro && !!todayHourly?.length}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <InfoCell
                    label="Main species"
                    value={mainSpecies || (categoryRaw === 0 ? 'None active' : 'No data')}
                  />
                  <InfoCell label="Season end" value={SEASON_END[openCategory]} />
                </View>
              </View>

              {/* Personal tip */}
              <View style={{ backgroundColor: '#052e16', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#22c55e' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#4ade80', marginBottom: 5 }}>Your tip for today</Text>
                <Text style={{ fontSize: 13, color: '#d1fae5', lineHeight: 20 }}>{LEVEL_TIP[categoryLevel]}</Text>
              </View>

              {/* Species breakdown */}
              {categorySpecies.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#4b5563', letterSpacing: 0.8, marginBottom: 8 }}>
                    SPECIES BREAKDOWN
                  </Text>
                  {categorySpecies.map((s) => <SpeciesRow key={s.name} species={s} />)}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </BottomSheet>

      {/* ── Air quality detail sheet ──────────────────────────────────────── */}
      {aq && (
        <BottomSheet
          visible={aqOpen}
          onClose={() => setAqOpen(false)}
          snapPoints={[0.88]}
          backgroundColor="#111827"
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="partly-sunny-outline" size={20} color={aqCard.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>Air quality</Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {dateStr} · Pollutants & UV
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAqOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#9ca3af', fontSize: 14 }}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Level hero card */}
            <View style={{ backgroundColor: aqCard.bg, borderRadius: 18, padding: 18, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 30, fontWeight: '800', color: aqCard.text, lineHeight: 34 }}>
                    {AQ_LEVEL_LABEL[aqLevel]}
                  </Text>
                  <Text style={{ fontSize: 13, color: aqCard.text, opacity: 0.7, marginTop: 4, lineHeight: 18 }}>
                    {aqHeroSubtitle}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 42, fontWeight: '900', color: aqCard.text, lineHeight: 46 }}>
                    {AQ_INDEX[aqLevel]}
                  </Text>
                  <Text style={{ fontSize: 12, color: aqCard.text, opacity: 0.55 }}>/ 10 AQI</Text>
                </View>
              </View>
            </View>

            {/* Progress bar */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', height: 8, borderRadius: 6, overflow: 'hidden', gap: 3 }}>
                {AQ_BAR_SEGMENTS.map((seg, i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: i < aqFill ? seg.color : seg.dimColor, borderRadius: 4 }} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}>
                {AQ_BAR_LABELS.map((lbl) => (
                  <Text key={lbl} style={{ fontSize: 10, color: '#4b5563' }}>{lbl}</Text>
                ))}
              </View>
            </View>

            {/* Metrics list */}
            <View style={{ marginBottom: 16 }}>
              {AQ_METRICS.map(({ key, label }) => (
                <AqMetricRowDark
                  key={key}
                  label={label}
                  metricKey={key}
                  metric={aq[key] as AirQualityMetric}
                  locked={!isPro && key !== 'pm25'}
                />
              ))}
            </View>

            {/* Upgrade CTA for free users */}
            {!isPro && (
              <TouchableOpacity onPress={onUpgradePress} activeOpacity={0.8} style={{ marginBottom: 16 }}>
                <View style={{ backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 13 }}>🔒</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#a78bfa' }}>
                    Upgrade to Pro to unlock all metrics
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Health advisory */}
            <View style={{ backgroundColor: advisoryBg, borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: advisoryColor }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: advisoryTitle, marginBottom: 5 }}>Health advisory</Text>
              <Text style={{ fontSize: 13, color: advisoryBody, lineHeight: 20 }}>{AQ_TIP[aqLevel]}</Text>
            </View>
          </ScrollView>
        </BottomSheet>
      )}
    </>
  );
}
