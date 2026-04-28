import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateSymptomLog, EDIT_WINDOW_MS } from '@/services/database';
import { logger } from '@/services/logger';
import type { SymptomLog, SymptomType, TimeSlotKey } from '../types';

export interface UpdateSymptomLogInput {
  id: string;
  symptoms: SymptomType[];
  severity: number;
  timeSlot: TimeSlotKey;
  notes?: string;
  medications?: string;
}

const TIME_SLOT_HOURS: Record<TimeSlotKey, number> = {
  early_morning: 6,
  morning: 9,
  midday: 12,
  afternoon: 15,
  evening: 19,
  night: 23,
};

export function isEditable(log: SymptomLog): boolean {
  return Date.now() - new Date(log.createdAt).getTime() < EDIT_WINDOW_MS;
}

// Infer the closest time slot from a logged_at ISO string (stored as slot midpoint hour)
export function timeSlotFromLoggedAt(loggedAt: string): TimeSlotKey {
  const hour = new Date(loggedAt).getHours();
  if (hour >= 5 && hour <= 7) return 'early_morning';
  if (hour >= 8 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 13) return 'midday';
  if (hour >= 14 && hour <= 17) return 'afternoon';
  if (hour >= 18 && hour <= 21) return 'evening';
  return 'night';
}

// Rebuild logged_at preserving the original calendar date but with the new slot's midpoint hour
function rebuildLoggedAt(originalLoggedAt: string, slot: TimeSlotKey): string {
  const d = new Date(originalLoggedAt);
  d.setHours(TIME_SLOT_HOURS[slot], 0, 0, 0);
  return d.toISOString();
}

export function useSymptomEditor() {
  const queryClient = useQueryClient();

  const editLog = useCallback(
    async (
      input: UpdateSymptomLogInput,
      originalLoggedAt: string,
    ): Promise<{ success: boolean; reason?: 'window_expired' | 'not_found' }> => {
      const loggedAt = rebuildLoggedAt(originalLoggedAt, input.timeSlot);
      try {
        const result = await updateSymptomLog({
          id: input.id,
          loggedAt,
          severity: input.severity,
          symptoms: input.symptoms,
          notes: input.notes,
          medications: input.medications,
        });

        if (result.success) {
          await queryClient.invalidateQueries({ queryKey: ['symptom-history'] });
          await queryClient.invalidateQueries({ queryKey: ['allergy-profile'] });
          logger.debug('Symptom log updated', { id: input.id });
        }

        return result;
      } catch (err) {
        logger.error('Failed to update symptom log', { err });
        throw err;
      }
    },
    [queryClient],
  );

  return { editLog };
}
