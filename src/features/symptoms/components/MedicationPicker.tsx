import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui';
import { getPreviouslyUsedMedications } from '@/services/database';

const COMMON_MEDICATIONS = [
  'Loratadine (Claritin)',
  'Cetirizine (Zyrtec)',
  'Fexofenadine (Allegra)',
  'Diphenhydramine (Benadryl)',
  'Montelukast (Singulair)',
  'Fluticasone nasal spray (Flonase)',
  'Budesonide nasal spray (Rhinocort)',
  'Azelastine nasal spray',
  'Loratadine-D (Claritin-D)',
  'Cetirizine-D (Zyrtec-D)',
];

interface MedicationPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
}

export function MedicationPicker({
  value,
  onChange,
  label = 'Medications taken (optional)',
}: MedicationPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [previouslyUsed, setPreviouslyUsed] = useState<string[]>([]);

  useEffect(() => {
    getPreviouslyUsedMedications().then(setPreviouslyUsed);
  }, []);

  function openSheet() {
    setDraft(value);
    setOpen(true);
  }

  function toggleDraft(med: string) {
    setDraft((prev) =>
      prev.includes(med) ? prev.filter((m) => m !== med) : [...prev, med],
    );
  }

  function handleDone() {
    onChange(draft);
    setOpen(false);
  }

  function handleClear() {
    setDraft([]);
  }

  const commonNotPrevious = COMMON_MEDICATIONS.filter((m) => !previouslyUsed.includes(m));
  const displayText = value.length > 0 ? value.join(', ') : null;

  return (
    <>
      <View>
        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          {label}
        </Text>
        <TouchableOpacity
          onPress={openSheet}
          className="border border-neutral-300 dark:border-neutral-600 rounded-xl px-4 py-3 bg-white dark:bg-neutral-800 flex-row justify-between items-center"
          accessibilityRole="button"
          accessibilityLabel={displayText ?? 'Select medications'}
        >
          <Text
            className={`text-sm flex-1 mr-2 ${
              displayText
                ? 'text-neutral-900 dark:text-white'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
            numberOfLines={2}
          >
            {displayText ?? 'Select medications…'}
          </Text>
          <Text className="text-neutral-400 text-xs">▾</Text>
        </TouchableOpacity>
      </View>

      <BottomSheet visible={open} onClose={handleDone} snapPoints={[0.65]}>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base font-semibold text-neutral-800">Medications taken</Text>
          {draft.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Text className="text-sm text-neutral-400">Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Previously used */}
          {previouslyUsed.length > 0 && (
            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
              Previously used
            </Text>
          )}
          {previouslyUsed.map((med) => {
            const selected = draft.includes(med);
            return (
              <TouchableOpacity
                key={`prev-${med}`}
                onPress={() => toggleDraft(med)}
                className={`py-3 border-b border-neutral-100 flex-row justify-between items-center`}
              >
                <Text
                  className={`text-sm flex-1 mr-2 ${
                    selected ? 'text-primary-600 font-semibold' : 'text-neutral-700'
                  }`}
                >
                  {med}
                </Text>
                <View
                  className={`w-5 h-5 rounded border-2 items-center justify-center ${
                    selected ? 'bg-primary-500 border-primary-500' : 'border-neutral-300'
                  }`}
                >
                  {selected && <Text className="text-white text-xs font-bold">✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Common medications */}
          {commonNotPrevious.length > 0 && (
            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mt-3 mb-1">
              Common allergy medications
            </Text>
          )}
          {commonNotPrevious.map((med) => {
            const selected = draft.includes(med);
            return (
              <TouchableOpacity
                key={med}
                onPress={() => toggleDraft(med)}
                className="py-3 border-b border-neutral-100 flex-row justify-between items-center"
              >
                <Text
                  className={`text-sm flex-1 mr-2 ${
                    selected ? 'text-primary-600 font-semibold' : 'text-neutral-700'
                  }`}
                >
                  {med}
                </Text>
                <View
                  className={`w-5 h-5 rounded border-2 items-center justify-center ${
                    selected ? 'bg-primary-500 border-primary-500' : 'border-neutral-300'
                  }`}
                >
                  {selected && <Text className="text-white text-xs font-bold">✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}

          <View className="h-4" />
        </ScrollView>

        <View className="pt-3">
          <Button label={draft.length > 0 ? `Done (${draft.length} selected)` : 'Done'} onPress={handleDone} />
        </View>
      </BottomSheet>
    </>
  );
}
