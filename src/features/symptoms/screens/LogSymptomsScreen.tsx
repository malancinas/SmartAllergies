import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Screen, Stack } from '@/components/layout';
import { Button } from '@/components/ui';
import { useLocation } from '@/features/pollen/hooks/useLocation';
import { useCurrentPollen } from '@/features/pollen/hooks/useCurrentPollen';
import { SymptomGrid } from '../components/SymptomGrid';
import { SeverityInput } from '../components/SeverityInput';
import { MedicationPicker } from '../components/MedicationPicker';
import { useSymptomLogger } from '../hooks/useSymptomLogger';
import { useSubscriptionStore } from '@/stores/persistent/subscriptionStore';
import { PaywallSheet } from '@/features/subscription/components/PaywallSheet';
import { FREE_LIMITS } from '@/features/subscription/types';
import { getDatabase, getMostRecentMedicationSelection } from '@/services/database';
import { TIME_SLOTS } from '../types';
import type { SymptomType, TimeSlotKey } from '../types';

export default function LogSymptomsScreen() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [severity, setSeverity] = useState(5);
  const [timeSlot, setTimeSlot] = useState<TimeSlotKey>('morning');
  const [medications, setMedications] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [locationName, setLocationName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const navigation = useNavigation<any>();

  const { logSymptoms } = useSymptomLogger();
  const { location } = useLocation();
  const { today: todayPollen, todayWeather } = useCurrentPollen();
  const tier = useSubscriptionStore((s) => s.tier);

  useEffect(() => {
    getMostRecentMedicationSelection().then(setMedications);
  }, []);

  useEffect(() => {
    if (!location) return;
    Location.reverseGeocodeAsync({ latitude: location.latitude, longitude: location.longitude })
      .then((results) => {
        const r = results[0];
        if (!r) return;
        const parts = [r.city, r.region, r.country].filter(Boolean);
        setLocationName(parts.slice(0, 2).join(', '));
      })
      .catch(() => {});
  }, [location]);

  function toggleSymptom(symptom: SymptomType) {
    setSelectedSymptoms((prev) => {
      if (symptom === 'none') {
        return prev.includes('none') ? [] : ['none'];
      }
      const withoutNone = prev.filter((s) => s !== 'none');
      return withoutNone.includes(symptom)
        ? withoutNone.filter((s) => s !== symptom)
        : [...withoutNone, symptom];
    });
  }

  async function checkLogLimit(): Promise<boolean> {
    if (tier === 'pro') return true;
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(DISTINCT DATE(logged_at)) as count FROM symptom_logs",
    );
    return (result?.count ?? 0) < FREE_LIMITS.MAX_LOG_DAYS;
  }

  async function handleSubmit() {
    if (selectedSymptoms.length === 0) {
      Alert.alert('No symptoms selected', 'Select at least one symptom, or tap "None today" if you have no symptoms.');
      return;
    }

    const withinLimit = await checkLogLimit();
    if (!withinLimit) {
      setPaywallVisible(true);
      return;
    }

    setSubmitting(true);
    try {
      await logSymptoms({
        symptoms: selectedSymptoms,
        severity,
        timeSlot,
        notes: notes.trim() || undefined,
        medications: medications.length > 0 ? medications.join(', ') : undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
        environment: todayPollen
          ? {
              grassPollen: todayPollen.grass.rawValue,
              treePollen: todayPollen.tree.rawValue,
              weedPollen: todayPollen.weed.rawValue,
              alderPollen: todayPollen.species?.find((s) => s.name === 'Alder')?.rawValue,
              birchPollen: todayPollen.species?.find((s) => s.name === 'Birch')?.rawValue,
              olivePollen: todayPollen.species?.find((s) => s.name === 'Olive')?.rawValue,
              mugwortPollen: todayPollen.species?.find((s) => s.name === 'Mugwort')?.rawValue,
              ragweedPollen: todayPollen.species?.find((s) => s.name === 'Ragweed')?.rawValue,
              pm25: todayPollen.airQuality?.pm25.rawValue,
              pm10: todayPollen.airQuality?.pm10.rawValue,
              ozone: todayPollen.airQuality?.ozone.rawValue,
              no2: todayPollen.airQuality?.no2.rawValue,
              so2: todayPollen.airQuality?.so2.rawValue,
              uvIndex: todayPollen.airQuality?.uvIndex.rawValue,
              dust: todayPollen.airQuality?.dust.rawValue,
              temperature: todayWeather?.temperature,
              humidity: todayWeather?.humidity,
              windSpeed: todayWeather?.windSpeed,
              precipitationProbability: todayWeather?.precipitationProbability,
            }
          : undefined,
      });

      setSelectedSymptoms([]);
      setSeverity(5);
      setNotes('');
      getMostRecentMedicationSelection().then(setMedications);
      navigation.navigate('History');
    } catch {
      Alert.alert('Error', 'Could not save your log. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Split time slots into rows of 2
  const timeSlotRows: (typeof TIME_SLOTS[number])[][] = [];
  for (let i = 0; i < TIME_SLOTS.length; i += 2) {
    timeSlotRows.push([TIME_SLOTS[i], TIME_SLOTS[i + 1]].filter(Boolean) as typeof TIME_SLOTS[number][]);
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack spacing={6} className="py-4">
          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
              Log symptoms
            </Text>
            <Text className="text-sm text-neutral-500 mt-1">
              Record how you felt during any part of the day.
            </Text>
          </View>

          {/* Symptom picker */}
          <View>
            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
              Symptoms
            </Text>
            <SymptomGrid selected={selectedSymptoms} onToggle={toggleSymptom} />
          </View>

          {/* Severity */}
          <View>
            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
              Overall severity
            </Text>
            <SeverityInput value={severity} onChange={setSeverity} />
          </View>

          {/* Time of day */}
          <View>
            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
              Time of day
            </Text>
            <View style={{ gap: 8 }}>
              {timeSlotRows.map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row" style={{ gap: 8 }}>
                  {row.map((slot) => {
                    const active = timeSlot === slot.key;
                    return (
                      <TouchableOpacity
                        key={slot.key}
                        onPress={() => setTimeSlot(slot.key)}
                        style={{ flex: 1 }}
                        className={`py-3 rounded-xl items-center border ${
                          active
                            ? 'bg-primary-500 border-primary-500'
                            : 'bg-white border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            active ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Medications */}
          <View>
            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
              Medication taken (optional)
            </Text>
            <MedicationPicker value={medications} onChange={setMedications} label="" />
          </View>

          {/* Notes */}
          <View>
            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
              Notes (optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. went for a walk, windows open all day…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white"
              style={{ minHeight: 80 }}
            />
            {location && (
              <Text className="text-xs text-neutral-400 mt-2">
                📍 Logging with your current location{locationName ? ` — ${locationName}` : ''}
              </Text>
            )}
          </View>

          {/* Free tier notice */}
          {tier === 'free' && (
            <Text className="text-xs text-neutral-400 text-center">
              Free plan: log on up to {FREE_LIMITS.MAX_LOG_DAYS} days. Upgrade to Pro for unlimited.
            </Text>
          )}

          {/* Submit */}
          <Button
            onPress={handleSubmit}
            disabled={submitting || selectedSymptoms.length === 0}
            label={submitting ? 'Saving…' : 'Save log'}
          />
        </Stack>
      </ScrollView>

      <PaywallSheet
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        featureName="Unlimited symptom logging"
        subtitle={`You've logged your symptoms on ${FREE_LIMITS.MAX_LOG_DAYS} days — we've been storing the pollen and air quality data alongside every log. Upgrade now and your personalised allergen profile will be ready to go.`}
      />
    </Screen>
  );
}
