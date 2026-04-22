import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Screen, Stack } from '@/components/layout';
import { Button } from '@/components/ui';
import { useLocation } from '@/features/pollen/hooks/useLocation';
import { SymptomGrid } from '../components/SymptomGrid';
import { SeverityInput } from '../components/SeverityInput';
import { useSymptomLogger } from '../hooks/useSymptomLogger';
import { TIME_SLOTS } from '../types';
import type { SymptomType, TimeSlotKey } from '../types';

export default function LogSymptomsScreen() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [severity, setSeverity] = useState(5);
  const [timeSlot, setTimeSlot] = useState<TimeSlotKey>('morning');
  const [submitting, setSubmitting] = useState(false);

  const { logSymptoms } = useSymptomLogger();
  const { location } = useLocation();

  function toggleSymptom(symptom: SymptomType) {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom],
    );
  }

  async function handleSubmit() {
    if (selectedSymptoms.length === 0) {
      Alert.alert('No symptoms selected', 'Please select at least one symptom before saving.');
      return;
    }

    setSubmitting(true);
    try {
      await logSymptoms({
        symptoms: selectedSymptoms,
        severity,
        timeSlot,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });

      // Reset form
      setSelectedSymptoms([]);
      setSeverity(5);
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

          {/* Location indicator */}
          {location && (
            <View className="flex-row items-center">
              <Text className="text-xs text-neutral-400">📍 Using your location</Text>
            </View>
          )}

          {/* Submit */}
          <Button
            onPress={handleSubmit}
            disabled={submitting || selectedSymptoms.length === 0}
            label={submitting ? 'Saving…' : 'Save log'}
          />
        </Stack>
      </ScrollView>
    </Screen>
  );
}
