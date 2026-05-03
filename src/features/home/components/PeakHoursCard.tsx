import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { HourlyPollenPoint } from '@/features/pollen/types';

interface Props {
  todayHourly: HourlyPollenPoint[];
  isPro: boolean;
  onUpgradePress: () => void;
  activeAllergens: string[];
  triggerWeights?: Partial<Record<string, number>>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHour(isoTime: string): string {
  const hour = parseInt(isoTime.slice(11, 13), 10);
  if (hour === 0) return '12 am';
  if (hour < 12) return `${hour} am`;
  if (hour === 12) return '12 pm';
  return `${hour - 12} pm`;
}

interface WindowResult {
  startTime: string;
  endTime: string;
  avgTotal: number;
}

function pollenScore(
  p: HourlyPollenPoint,
  activeAllergens: string[],
  weights?: Partial<Record<string, number>>,
): number {
  const types = (['tree', 'grass', 'weed'] as const).filter((a) => activeAllergens.includes(a));
  if (types.length === 0) return p.tree + p.grass + p.weed;
  if (weights) return types.reduce((sum, a) => sum + p[a] * (weights[a] ?? 0), 0);
  return types.reduce((sum, a) => sum + p[a], 0);
}

function findBestWindow(
  points: HourlyPollenPoint[],
  activeAllergens: string[],
  weights?: Partial<Record<string, number>>,
  windowSize = 3,
): WindowResult | null {
  if (points.length < windowSize) return null;
  let bestAvg = Infinity, bestIdx = 0;
  for (let i = 0; i <= points.length - windowSize; i++) {
    const avg = points.slice(i, i + windowSize).reduce((s, p) => s + pollenScore(p, activeAllergens, weights), 0) / windowSize;
    if (avg < bestAvg) { bestAvg = avg; bestIdx = i; }
  }
  return { startTime: points[bestIdx].time, endTime: points[bestIdx + windowSize - 1].time, avgTotal: bestAvg };
}

function findPeakWindow(
  points: HourlyPollenPoint[],
  activeAllergens: string[],
  weights?: Partial<Record<string, number>>,
  windowSize = 3,
): WindowResult | null {
  if (points.length < windowSize) return null;
  let peakAvg = -Infinity, peakIdx = 0;
  for (let i = 0; i <= points.length - windowSize; i++) {
    const avg = points.slice(i, i + windowSize).reduce((s, p) => s + pollenScore(p, activeAllergens, weights), 0) / windowSize;
    if (avg > peakAvg) { peakAvg = avg; peakIdx = i; }
  }
  return { startTime: points[peakIdx].time, endTime: points[peakIdx + windowSize - 1].time, avgTotal: peakAvg };
}

function findModerateWindow(
  points: HourlyPollenPoint[],
  activeAllergens: string[],
  peakIdx: number,
  weights?: Partial<Record<string, number>>,
  windowSize = 2,
): WindowResult | null {
  if (points.length < windowSize) return null;
  let modAvg = -Infinity, modIdx = -1;
  const peakEndIdx = peakIdx + 2; // peak window is always 3 hours
  for (let i = 0; i <= points.length - windowSize; i++) {
    if (i + windowSize - 1 >= peakIdx && i <= peakEndIdx) continue;
    const avg = points.slice(i, i + windowSize).reduce((s, p) => s + pollenScore(p, activeAllergens, weights), 0) / windowSize;
    if (avg > modAvg) { modAvg = avg; modIdx = i; }
  }
  if (modIdx === -1) return null;
  return { startTime: points[modIdx].time, endTime: points[modIdx + windowSize - 1].time, avgTotal: modAvg };
}

// ─── Grouped time bar (5 × 3-hour segments, windows as source of truth) ──────

const TIME_GROUPS = [
  { label: '6 am',  hours: [6, 7, 8] },
  { label: '9 am',  hours: [9, 10, 11] },
  { label: '12 pm', hours: [12, 13, 14] },
  { label: '3 pm',  hours: [15, 16, 17] },
  { label: '6 pm',  hours: [18, 19, 20] },
];
const TIME_AXIS_LABELS = ['6 am', '9 am', '12 pm', '3 pm', '6 pm', '9 pm'];

type SegmentLevel = 'peak' | 'moderate' | 'low';

function windowHours(w: WindowResult): Set<number> {
  const start = parseInt(w.startTime.slice(11, 13), 10);
  const end   = parseInt(w.endTime.slice(11, 13), 10);
  const s = new Set<number>();
  for (let h = start; h <= end; h++) s.add(h);
  return s;
}

function classifySegment(
  hours: number[],
  peakHours: Set<number>,
  moderateHours: Set<number>,
): SegmentLevel {
  if (hours.some((h) => peakHours.has(h))) return 'peak';
  if (hours.some((h) => moderateHours.has(h))) return 'moderate';
  return 'low';
}

const LEVEL_COLORS = {
  peak:     { light: '#fee2e2' as const, dark: 'rgba(248,113,113,0.28)' as const },
  moderate: { light: '#fef3c7' as const, dark: 'rgba(251,191,36,0.28)'  as const },
  low:      { light: '#dcfce7' as const, dark: 'rgba(74,222,128,0.28)'  as const },
};
const LEVEL_TEXT = {
  peak:     { light: '#dc2626', dark: '#f87171' },
  moderate: { light: '#b45309', dark: '#fbbf24' },
  low:      { light: '#15803d', dark: '#4ade80' },
};
const LEVEL_LABEL: Record<SegmentLevel, string> = { peak: 'Peak', moderate: 'Mod', low: 'Low' };

function levelColor(level: SegmentLevel, isDark: boolean): string {
  return isDark ? LEVEL_COLORS[level].dark : LEVEL_COLORS[level].light;
}

function GroupedBar({
  peak,
  moderate,
}: {
  peak: WindowResult;
  moderate: WindowResult | null;
}) {
  const isDark = useColorScheme() === 'dark';
  const peakHours = windowHours(peak);
  const modHours  = moderate ? windowHours(moderate) : new Set<number>();

  const segments = TIME_GROUPS.map(({ hours }) => classifySegment(hours, peakHours, modHours));

  const legendItems = [
    { level: 'peak'     as const, label: 'Peak pollen' },
    { level: 'moderate' as const, label: 'Moderate' },
    { level: 'low'      as const, label: 'Low' },
  ];

  return (
    <View>
      {/* Time axis labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        {TIME_AXIS_LABELS.map((lbl) => (
          <Text key={lbl} style={{ fontSize: 10, color: '#9ca3af' }}>{lbl}</Text>
        ))}
      </View>

      {/* Segmented bar — single gradient with tight fade zones at colour transitions */}
      {(() => {
        // Each segment occupies 20% of the bar. Fade zone is ±2% around each boundary.
        const n = segments.length;
        const gradientColors: string[] = [];
        const gradientLocations: number[] = [];
        segments.forEach((level, i) => {
          const c = levelColor(level, isDark);
          const start = i / n;
          const end   = (i + 1) / n;
          const fadeHalf = 0.02;
          if (i === 0) {
            gradientColors.push(c);
            gradientLocations.push(start);
          }
          gradientColors.push(c);
          gradientLocations.push(Math.max(start, end - fadeHalf));
          if (i < n - 1) {
            gradientColors.push(levelColor(segments[i + 1], isDark));
            gradientLocations.push(Math.min(1, end + fadeHalf));
          }
        });
        gradientColors.push(levelColor(segments[n - 1], isDark));
        gradientLocations.push(1);

        return (
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            locations={gradientLocations as [number, number, ...number[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flexDirection: 'row', height: 36, borderRadius: 8, overflow: 'hidden' }}
          >
            {segments.map((level, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? LEVEL_TEXT[level].dark : LEVEL_TEXT[level].light }}>
                  {LEVEL_LABEL[level]}
                </Text>
              </View>
            ))}
          </LinearGradient>
        );
      })()}

      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 2 }}>
        {legendItems.map(({ level, label }) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{
              width: 11, height: 11, borderRadius: 2,
              borderWidth: 1.5,
              borderColor: levelColor(level, isDark),
              backgroundColor: 'transparent',
            }} />
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Window row ───────────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function WindowRow({
  iconName,
  iconColor,
  iconBg,
  rowBg,
  categoryLabel,
  timeLabel,
  description,
  badge,
  badgeColor,
  badgeBg,
}: {
  iconName: IoniconName;
  iconColor: string;
  iconBg: string;
  rowBg: string;
  categoryLabel: string;
  timeLabel: string;
  description: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: rowBg, borderRadius: 16, padding: 14 }}>
      <View style={{
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: iconBg,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 1 }}>{categoryLabel}</Text>
        <Text className="text-neutral-900 dark:text-white" style={{ fontSize: 16, fontWeight: '800', lineHeight: 20 }}>{timeLabel}</Text>
        <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{description}</Text>
      </View>
      <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: badgeBg }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: badgeColor }}>{badge}</Text>
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PeakHoursCard({ todayHourly, isPro, onUpgradePress, activeAllergens, triggerWeights }: Props) {
  if (!isPro) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onUpgradePress}>
        <View className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-700">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Peak pollen hours
            </Text>
            <View className="bg-violet-100 dark:bg-violet-900/40 rounded-full px-2.5 py-0.5">
              <Text className="text-[10px] font-bold text-violet-600 dark:text-violet-400">PRO</Text>
            </View>
          </View>
          <View style={{ opacity: 0.3, gap: 8 }}>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">🟢</Text>
              <View>
                <Text className="text-xs text-neutral-500">Best time outside</Text>
                <Text className="text-sm font-semibold text-neutral-800 dark:text-white">7 am – 9 am</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">🔴</Text>
              <View>
                <Text className="text-xs text-neutral-500">Peak pollen window</Text>
                <Text className="text-sm font-semibold text-neutral-800 dark:text-white">12 pm – 3 pm</Text>
              </View>
            </View>
          </View>
          <View className="mt-3 flex-row items-center gap-1.5">
            <Text className="text-base">🔒</Text>
            <Text className="text-xs text-violet-600 dark:text-violet-400 font-medium">
              Upgrade to Pro to see today's hourly pollen forecast
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Daytime 6am–8pm (hours 6–20 = 15 data points, groups into 5 × 3-hr bands)
  const daytimeHours = todayHourly.filter((h) => {
    const hour = parseInt(h.time.slice(11, 13), 10);
    return hour >= 6 && hour <= 20;
  });

  const best = findBestWindow(daytimeHours, activeAllergens, triggerWeights);
  const peak = findPeakWindow(daytimeHours, activeAllergens, triggerWeights);

  const noData = todayHourly.length === 0 || daytimeHours.every((h) => h.tree + h.grass + h.weed === 0);
  const allergenAllClear =
    !noData && daytimeHours.every((h) => pollenScore(h, activeAllergens, triggerWeights) === 0);
  const uniformlyLow =
    !noData && !allergenAllClear && best != null && peak != null &&
    peak.startTime === best.startTime && peak.avgTotal === best.avgTotal;

  const allergenLabel =
    activeAllergens.length === 0
      ? 'your allergens'
      : activeAllergens.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(' & ') + ' pollen';

  let peakStartIdx = 0;
  if (peak) peakStartIdx = daytimeHours.findIndex((h) => h.time === peak.startTime);
  const moderate = peak && !uniformlyLow
    ? findModerateWindow(daytimeHours, activeAllergens, peakStartIdx, triggerWeights)
    : null;

  return (
    <View className="bg-white dark:bg-neutral-800 rounded-3xl p-5">
      {noData || !best || !peak ? (
        <Text className="text-xs text-neutral-400">Hourly data unavailable for your location.</Text>
      ) : allergenAllClear ? (
        <View className="flex-row items-center gap-2">
          <Text className="text-base">🟢</Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {allergenLabel} is at 0 today — all clear, go outside any time!
          </Text>
        </View>
      ) : uniformlyLow ? (
        <View className="flex-row items-center gap-2">
          <Text className="text-base">🟢</Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {allergenLabel} is very low all day — any time is a good time to go outside.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {/* Grouped time bar */}
          <GroupedBar
            peak={peak}
            moderate={moderate}
          />

          {/* Peak window */}
          <WindowRow
            iconName="warning-outline"
            iconColor="#ef4444"
            iconBg="rgba(239,68,68,0.18)"
            rowBg="rgba(239,68,68,0.07)"
            categoryLabel="Peak pollen window"
            timeLabel={`${formatHour(peak.startTime)} – ${formatHour(peak.endTime)}`}
            description={`Highest ${allergenLabel} concentration`}
            badge="Highest Risk"
            badgeColor="#fff"
            badgeBg="#ef4444"
          />

          {/* Moderate window */}
          {moderate && moderate.avgTotal > 0 && (
            <WindowRow
              iconName="time-outline"
              iconColor="#f59e0b"
              iconBg="rgba(245,158,11,0.18)"
              rowBg="rgba(245,158,11,0.07)"
              categoryLabel="Moderate window"
              timeLabel={`${formatHour(moderate.startTime)} – ${formatHour(moderate.endTime)}`}
              description="Limit time outdoors if sensitive"
              badge="Caution"
              badgeColor="#fff"
              badgeBg="#f59e0b"
            />
          )}

          {/* Best window */}
          <WindowRow
            iconName="checkmark-circle-outline"
            iconColor="#22c55e"
            iconBg="rgba(34,197,94,0.18)"
            rowBg="rgba(34,197,94,0.07)"
            categoryLabel="Best time outside"
            timeLabel={`${formatHour(best.startTime)} – ${formatHour(best.endTime)}`}
            description="Pollen is at its lowest during this window"
            badge="Lowest Risk"
            badgeColor="#fff"
            badgeBg="#22c55e"
          />
        </View>
      )}
    </View>
  );
}
