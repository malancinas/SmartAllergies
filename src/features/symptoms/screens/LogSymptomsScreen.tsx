import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Screen, Stack } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { useLocation } from '@/features/pollen/hooks/useLocation';
import { useCurrentPollen } from '@/features/pollen/hooks/useCurrentPollen';
import { SymptomGrid } from '../components/SymptomGrid';
import { SeverityInput } from '../components/SeverityInput';
import { useSymptomLogger } from '../hooks/useSymptomLogger';
import { useSubmitSignal } from '@/features/community/hooks/useSubmitSignal';
import { useAuthStore } from '@/stores/persistent/authStore';
import { useSubscriptionStore } from '@/stores/persistent/subscriptionStore';
import { PaywallSheet } from '@/features/subscription/components/PaywallSheet';
import { FREE_LIMITS } from '@/features/subscription/types';
import { getDatabase } from '@/services/database';
import { TIME_SLOTS } from '../types';
import type { SymptomType, TimeSlotKey } from '../types';

export default function LogSymptomsScreen() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [severity, setSeverity] = useState(5);
  const [timeSlot, setTimeSlot] = useState<TimeSlotKey>('morning');
  const [medications, setMedications] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const { logSymptoms } = useSymptomLogger();
  const { submit: submitSignal } = useSubmitSignal();
  const { location } = useLocation();
  const { today: todayPollen } = useCurrentPollen();
  const user = useAuthStore((s) => s.user);
  const tier = useSubscriptionStore((s) => s.tier);

  function toggleSymptom(symptom: SymptomType) {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom],
    );
  }

  async function checkLogLimit(): Promise<boolean> {
    if (tier === 'pro') return true;
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM symptom_logs',
    );
    return (result?.count ?? 0) < FREE_LIMITS.MAX_SYMPTOM_LOGS;
  }

  async function handleSubmit() {
    if (selectedSymptoms.length === 0) {
      Alert.alert('No symptoms selected', 'Please select at least one symptom before saving.');
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
        medications: medications.trim() || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
        environment: todayPollen
          ? {
              grassPollen: todayPollen.grass.rawValue,
              treePollen: todayPollen.tree.rawValue,
              weedPollen: todayPollen.weed.rawValue,
              pm25: todayPollen.airQuality?.pm25.rawValue,
              pm10: todayPollen.airQuality?.pm10.rawValue,
              ozone: todayPollen.airQuality?.ozone.rawValue,
              no2: todayPollen.airQuality?.no2.rawValue,
              so2: todayPollen.airQuality?.so2.rawValue,
              uvIndex: todayPollen.airQuality?.uvIndex.rawValue,
              dust: todayPollen.airQuality?.dust.rawValue,
            }
          : undefined,
      });

      // Submit to community signal (guards inside — Pro + opted-in only)
      if (user && location) {
        submitSignal({
          userId: user.id,
          lat: location.latitude,
          lon: location.longitude,
          severity,
        });
      }

      // Reset form
      setSelectedSymptoms([]);
      setSeverity(5);
      setMedications('');
      Alert.alert('Saved', 'Your symptoms have been logged.');
    } catch {
      Alert.alert('Error', 'Could not save your log. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
              How are you feeling right now?
            </Text>
          </View>

          {/* Symptom picker */}
          <View>
            <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
              Symptoms
            </Text>
            <SymptomGrid selected={selectedSymptoms} onToggle={toggleSymptom} />
          </View>

          {/* Severity */}
          <View>
            <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
              Overall severity
            </Text>
            <SeverityInput value={severity} onChange={setSeverity} />
          </View>

          {/* Time of day */}
          <View>
            <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
              Time of day
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {TIME_SLOTS.map((slot) => {
                const active = timeSlot === slot.key;
                return (
                  <TouchableOpacity
                    key={slot.key}
                    onPress={() => setTimeSlot(slot.key)}
                    className={`px-4 py-2 rounded-full border ${
                      active
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-white border-neutral-300 dark:bg-neutral-800 dark:border-neutral-600'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        active ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Medications */}
          <Input
            label="Medications taken (optional)"
            placeholder="e.g. loratadine 10mg"
            value={medications}
            onChangeText={setMedications}
          />

          {/* Location indicator */}
          {location && (
            <View className="flex-row items-center">
              <Text className="text-xs text-neutral-400">📍 Using your location</Text>
            </View>
          )}

          {/* Free tier notice */}
          {tier === 'free' && (
            <Text className="text-xs text-neutral-400 text-center">
              Free plan: up to {FREE_LIMITS.MAX_SYMPTOM_LOGS} logs. Upgrade to Pro for unlimited.
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
      />
    </Screen>
  );
}
