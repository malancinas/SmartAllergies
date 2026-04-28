import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, Stack } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { SymptomGrid } from '../components/SymptomGrid';
import { SeverityInput } from '../components/SeverityInput';
import { useSymptomEditor, timeSlotFromLoggedAt } from '../hooks/useSymptomEditor';
import { getSymptomLogById } from '@/services/database';
import { TIME_SLOTS } from '../types';
import type { SymptomType, TimeSlotKey } from '../types';
import type { HistoryStackParamList } from '@/types/navigation';
import { TouchableOpacity } from 'react-native';

type EditLogRouteProp = RouteProp<HistoryStackParamList, 'EditLog'>;
type EditLogNavProp = NativeStackNavigationProp<HistoryStackParamList, 'EditLog'>;

export default function EditSymptomLogScreen() {
  const route = useRoute<EditLogRouteProp>();
  const navigation = useNavigation<EditLogNavProp>();
  const { editLog } = useSymptomEditor();
  const { logId } = route.params;

  const { data: log, isLoading } = useQuery({
    queryKey: ['symptom-log', logId],
    queryFn: () => getSymptomLogById(logId),
    staleTime: 0,
  });

  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [severity, setSeverity] = useState(5);
  const [timeSlot, setTimeSlot] = useState<TimeSlotKey>('morning');
  const [medications, setMedications] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [initialised, setInitialised] = useState(false);

  // Pre-fill form once log is loaded
  if (log && !initialised) {
    setSelectedSymptoms(log.symptoms as SymptomType[]);
    setSeverity(log.severity);
    setTimeSlot(timeSlotFromLoggedAt(log.logged_at));
    setMedications(log.medications ?? '');
    setNotes(log.notes ?? '');
    setInitialised(true);
  }

  function toggleSymptom(symptom: SymptomType) {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom],
    );
  }

  async function handleSave() {
    if (!log) return;
    if (selectedSymptoms.length === 0) {
      Alert.alert('No symptoms selected', 'Please select at least one symptom.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await editLog(
        {
          id: logId,
          symptoms: selectedSymptoms,
          severity,
          timeSlot,
          notes: notes.trim() || undefined,
          medications: medications.trim() || undefined,
        },
        log.logged_at,
      );

      if (result.success) {
        navigation.goBack();
      } else {
        Alert.alert(
          'Edit window closed',
          'This log can no longer be edited — the 48-hour window has passed.',
        );
        navigation.goBack();
      }
    } catch {
      Alert.alert('Error', 'Could not save your changes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || !initialised) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (!log) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-neutral-500">Log not found.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack spacing={6} className="py-4">
          <View>
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white">Edit log</Text>
            <Text className="text-sm text-neutral-500 mt-1">
              Editable for 48 hours from when it was first logged.
            </Text>
          </View>

          <View>
            <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
              Symptoms
            </Text>
            <SymptomGrid selected={selectedSymptoms} onToggle={toggleSymptom} />
          </View>

          <View>
            <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
              Overall severity
            </Text>
            <SeverityInput value={severity} onChange={setSeverity} />
          </View>

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

          <Input
            label="Medications taken (optional)"
            placeholder="e.g. loratadine 10mg"
            value={medications}
            onChangeText={setMedications}
          />

          <Input
            label="Notes (optional)"
            placeholder="Any other context…"
            value={notes}
            onChangeText={setNotes}
          />

          <Button
            onPress={handleSave}
            disabled={submitting || selectedSymptoms.length === 0}
            label={submitting ? 'Saving…' : 'Save changes'}
          />
        </Stack>
      </ScrollView>
    </Screen>
  );
}
