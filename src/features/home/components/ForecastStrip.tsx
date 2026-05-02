import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { DailyRiskScore, RiskLevel, CorrelationWeights } from '@/features/forecasting/types';
import type { PollenLevel, WeatherPoint } from '@/features/pollen/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_COLOR: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

const RISK_CARD: Record<RiskLevel, { bg: string; text: string; accent: string }> = {
  low:    { bg: '#052e16', text: '#4ade80', accent: '#22c55e' },
  medium: { bg: '#451a03', text: '#fbbf24', accent: '#f59e0b' },
  high:   { bg: '#450a0a', text: '#f87171', accent: '#ef4444' },
};

const RISK_HERO_TITLE: Record<RiskLevel, string> = {
  low:    'Good day ahead',
  medium: 'Moderate risk day',
  high:   'High risk day',
};

const PLAN_COLOR: Record<RiskLevel, { bg: string; border: string; title: string; body: string }> = {
  low:    { bg: '#052e16', border: '#22c55e', title: '#4ade80', body: '#d1fae5' },
  medium: { bg: '#451a03', border: '#fbbf24', title: '#fbbf24', body: '#fef3c7' },
  high:   { bg: '#450a0a', border: '#f87171', title: '#f87171', body: '#fee2e2' },
};

const POLLEN_DOT_COLOR: Record<PollenLevel, string> = {
  none:      '#4b5563',
  low:       '#22c55e',
  medium:    '#f59e0b',
  high:      '#ef4444',
  very_high: '#b91c1c',
};

const POLLEN_LEVEL_LABEL: Record<PollenLevel, string> = {
  none: 'None', low: 'Low', medium: 'Medium', high: 'High', very_high: 'Very high',
};

const AQ_LEVEL_LABEL: Record<PollenLevel, string> = {
  none: 'Good', low: 'Low', medium: 'Moderate', high: 'Poor', very_high: 'Very poor',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function weatherIconName(code: number): React.ComponentProps<typeof Ionicons>['name'] {
  if (code === 0) return 'sunny-outline';
  if (code <= 3)  return 'partly-sunny-outline';
  if (code <= 48) return 'cloud-outline';
  if (code <= 67) return 'rainy-outline';
  if (code <= 77) return 'snow-outline';
  if (code <= 82) return 'rainy-outline';
  return 'thunderstorm-outline';
}

function getDayWeather(forecast: WeatherPoint[], dateStr: string): WeatherPoint | null {
  return (
    forecast.find((p) => p.time.startsWith(dateStr + 'T12')) ??
    forecast.find((p) => p.time.startsWith(dateStr)) ??
    null
  );
}

function formatWeekday(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' });
}

function formatDayNumber(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function primaryAllergenLabel(weights: CorrelationWeights): string {
  const candidates = [
    { label: 'tree pollen',  val: weights.tree },
    { label: 'grass pollen', val: weights.grass },
    { label: 'weed pollen',  val: weights.weed },
  ];
  return candidates.sort((a, b) => b.val - a.val)[0].label;
}

function buildPlanAheadMessage(
  day: DailyRiskScore,
  isWorstDay: boolean,
  weights?: CorrelationWeights,
): string {
  const dayName = new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long' });

  if (weights?.personalised) {
    const allergen = primaryAllergenLabel(weights);
    if (isWorstDay && day.level === 'high') {
      return `${dayName} is your highest predicted risk day this week. Your ${allergen} sensitivity is the main factor — take antihistamines the night before and keep windows closed in the morning.`;
    }
    if (day.level === 'high') {
      return `High ${allergen} exposure predicted. Based on your history, take antihistamines before going outside and limit time outdoors during peak hours.`;
    }
    if (day.level === 'medium') {
      return `Moderate ${allergen} levels expected. Carry medication and consider limiting prolonged outdoor exposure.`;
    }
    return `Low ${allergen} exposure predicted. A good day to be outdoors — enjoy it.`;
  }

  // Generic unweighted forecast
  if (isWorstDay && day.level === 'high') {
    return `${dayName} looks like your most challenging day this week. Plan outdoor activities carefully and keep antihistamines handy.`;
  }
  if (day.level === 'high') {
    return 'High pollen and allergen levels expected. Limit outdoor time and take medication proactively.';
  }
  if (day.level === 'medium') {
    return 'Moderate risk predicted. Sensitive individuals should carry medication before heading outside.';
  }
  return 'Low risk predicted. A good day for most allergy sufferers to enjoy the outdoors.';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TextCell({ label, value, iconName }: { label: string; value: string; iconName?: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#1f2937', borderRadius: 14, padding: 14, minHeight: 72 }}>
      <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {iconName && <Ionicons name={iconName} size={14} color="#9ca3af" />}
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>{value}</Text>
      </View>
    </View>
  );
}

function PollenCell({ label, level, levelLabel }: { label: string; level: PollenLevel; levelLabel?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#1f2937', borderRadius: 14, padding: 14, minHeight: 72 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: POLLEN_DOT_COLOR[level] }} />
        <Text style={{ fontSize: 11, color: '#6b7280' }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>{levelLabel ?? POLLEN_LEVEL_LABEL[level]}</Text>
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ForecastStripProps {
  upcoming: DailyRiskScore[];
  isPro: boolean;
  onUpgradePress: () => void;
  weights?: CorrelationWeights;
  riskToday?: DailyRiskScore | null;
  locationLabel?: string;
  weatherForecast?: WeatherPoint[];
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ForecastStrip({ upcoming, isPro, onUpgradePress, weights, riskToday, locationLabel, weatherForecast = [] }: ForecastStripProps) {
  const [selected, setSelected] = useState<DailyRiskScore | null>(null);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  if (upcoming.length === 0) return null;

  // Find the worst upcoming day for the "plan ahead" message
  const worstDay = [...upcoming].sort((a, b) => b.score - a.score)[0];
  const isWorstDay = selected?.date === worstDay?.date;

  const riskCard = RISK_CARD[selected?.level ?? 'low'];
  const planColor = PLAN_COLOR[selected?.level ?? 'low'];
  const riskIndex = selected ? Math.round(selected.score * 10) : 0;

  const heroSubtitle = isWorstDay && selected && selected.level !== 'low'
    ? 'Your worst conditions predicted'
    : selected?.level === 'low' ? 'Low exposure expected' : 'Elevated allergens forecast';

  const locationStr = locationLabel ?? 'Your location';
  const planMessage = selected ? buildPlanAheadMessage(selected, isWorstDay, weights) : '';

  const pl = selected?.pollenLevels;
  const aq = selected?.airQuality;
  const selectedWeather = selected ? getDayWeather(weatherForecast, selected.date) : null;

  return (
    <>
      {/* ── Compact strip ─────────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {upcoming.map((day, index) => {
          const locked = !isPro && index >= 1;
          const dayBg = isDark ? '#374151' : '#e5e7eb';

          return (
            <TouchableOpacity
              key={day.date}
              activeOpacity={1}
              onPress={locked ? onUpgradePress : () => setSelected(day)}
              style={{ flex: 1 }}
            >
              <View style={{ paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: dayBg, borderRadius: 16 }}>
                <Text
                  style={{ fontSize: 11, fontWeight: '500', color: locked ? (isDark ? '#4b5563' : '#9ca3af') : (isDark ? '#9ca3af' : '#6b7280') }}
                >
                  {formatWeekday(day.date)}
                </Text>
                <Text
                  style={{ fontSize: 18, fontWeight: '800', lineHeight: 24, marginTop: 1, color: locked ? (isDark ? '#4b5563' : '#9ca3af') : (isDark ? '#fff' : '#111827') }}
                >
                  {formatDayNumber(day.date)}
                </Text>

                {locked ? (
                  <>
                    <Text style={{ fontSize: 16, marginTop: 8 }}>🔒</Text>
                    <View style={{ marginTop: 4, backgroundColor: 'rgba(139,92,246,0.2)', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#a78bfa' }}>PRO</Text>
                    </View>
                  </>
                ) : (
                  <View style={{ marginTop: 8, gap: 3 }}>
                    {(['tree', 'grass', 'weed'] as const).map((type) => (
                      <View key={type} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: POLLEN_DOT_COLOR[day.pollenLevels?.[type] ?? 'none'] }} />
                        <Text style={{ fontSize: 10, fontWeight: '500', color: isDark ? '#9ca3af' : '#6b7280' }}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </View>
                    ))}
                    {day.airQuality && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: POLLEN_DOT_COLOR[day.airQuality.overallLevel] }} />
                        <Text style={{ fontSize: 10, fontWeight: '500', color: isDark ? '#9ca3af' : '#6b7280' }}>Air</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Detail sheet ─────────────────────────────────────────────────── */}
      <BottomSheet
        visible={selected !== null}
        onClose={() => setSelected(null)}
        snapPoints={[0.88]}
        backgroundColor="#111827"
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          {selected && (
            <>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="calendar-outline" size={20} color={riskCard.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>
                    {formatFullDate(selected.date)}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    Forecast · {locationStr}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelected(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>✕</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Day navigation strip */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {upcoming.map((day, index) => {
                    const locked = !isPro && index >= 1;
                    const isActive = selected.date === day.date;
                    return (
                      <TouchableOpacity
                        key={day.date}
                        onPress={locked ? onUpgradePress : () => setSelected(day)}
                        activeOpacity={0.8}
                        disabled={isActive}
                      >
                        <View style={{
                          backgroundColor: isActive ? RISK_COLOR[day.level] : '#1f2937',
                          borderRadius: 14,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          alignItems: 'center',
                          minWidth: 56,
                          opacity: locked && !isActive ? 0.4 : 1,
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: isActive ? '#fff' : '#6b7280' }}>
                            {formatWeekday(day.date)}
                          </Text>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: isActive ? '#fff' : '#e5e7eb', lineHeight: 22 }}>
                            {formatDayNumber(day.date)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Risk hero card */}
              <View style={{ backgroundColor: riskCard.bg, borderRadius: 18, padding: 18, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 30, fontWeight: '800', color: riskCard.text, lineHeight: 34 }}>
                      {RISK_HERO_TITLE[selected.level]}
                    </Text>
                    <Text style={{ fontSize: 13, color: riskCard.text, opacity: 0.7, marginTop: 4, lineHeight: 18 }}>
                      {heroSubtitle}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 42, fontWeight: '900', color: riskCard.text, lineHeight: 46 }}>
                      {riskIndex}
                    </Text>
                    <Text style={{ fontSize: 12, color: riskCard.text, opacity: 0.55 }}>/ 10 risk</Text>
                  </View>
                </View>
              </View>

              {/* Progress bar (low → high) */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', height: 8, borderRadius: 6, overflow: 'hidden', gap: 3 }}>
                  {[
                    { color: '#22c55e', dim: 'rgba(34,197,94,0.18)' },
                    { color: '#f59e0b', dim: 'rgba(245,158,11,0.18)' },
                    { color: '#ef4444', dim: 'rgba(239,68,68,0.18)' },
                  ].map((seg, i) => {
                    const fill = selected.level === 'low' ? 1 : selected.level === 'medium' ? 2 : 3;
                    return (
                      <View key={i} style={{ flex: 1, backgroundColor: i < fill ? seg.color : seg.dim, borderRadius: 4 }} />
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}>
                  {['Low', 'Medium', 'High'].map((lbl) => (
                    <Text key={lbl} style={{ fontSize: 10, color: '#4b5563' }}>{lbl}</Text>
                  ))}
                </View>
              </View>

              {/* Info grid: pollen, AQ, weather */}
              <View style={{ gap: 8, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <PollenCell label="Tree pollen"  level={pl?.tree  ?? 'none'} />
                  <PollenCell label="Grass pollen" level={pl?.grass ?? 'none'} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <PollenCell label="Weed pollen"  level={pl?.weed  ?? 'none'} />
                  <PollenCell
                    label="Air quality"
                    level={aq?.overallLevel ?? 'none'}
                    levelLabel={AQ_LEVEL_LABEL[aq?.overallLevel ?? 'none']}
                  />
                </View>
                {selectedWeather && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextCell
                      label="Temp. forecast"
                      value={`${Math.round(selectedWeather.temperature)}°C`}
                      iconName={weatherIconName(selectedWeather.weatherCode)}
                    />
                    <TextCell
                      label="Wind speed"
                      value={`${Math.round(selectedWeather.windSpeed)} km/h`}
                      iconName="speedometer-outline"
                    />
                  </View>
                )}
              </View>

              {/* Plan ahead */}
              <View style={{ backgroundColor: planColor.bg, borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: planColor.border }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: planColor.title, marginBottom: 5 }}>
                  Plan ahead
                </Text>
                <Text style={{ fontSize: 13, color: planColor.body, lineHeight: 20 }}>
                  {planMessage}
                </Text>
              </View>

              {/* Pro upgrade CTA for locked future days hint */}
              {!isPro && (
                <TouchableOpacity onPress={onUpgradePress} activeOpacity={0.8} style={{ marginTop: 14 }}>
                  <View style={{ backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 13 }}>🔒</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#a78bfa' }}>
                      Upgrade to Pro to unlock the full 5-day forecast
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      </BottomSheet>
    </>
  );
}
