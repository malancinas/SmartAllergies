import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { insertSymptomLog, insertLogEnvironment } from '@/services/database';
import { logger } from '@/services/logger';
import type { CreateSymptomLogInput, TimeSlotKey } from '../types';

function timeSlotToHour(slot: TimeSlotKey): number {
  // Use the midpoint hour for each slot
  const midpoints: Record<TimeSlotKey, number> = {
    early_morning: 6,
    morning: 9,
    midday: 12,
    afternoon: 15,
    evening: 19,
    night: 23,
  };
  return midpoints[slot];
}

function buildLoggedAt(slot: TimeSlotKey): string {
  const now = new Date();
  now.setHours(timeSlotToHour(slot), 0, 0, 0);
  return now.toISOString();
}

export function useSymptomLogger() {
  const queryClient = useQueryClient();

  const logSymptoms = useCallback(
    async (input: CreateSymptomLogInput): Promise<void> => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const loggedAt = buildLoggedAt(input.timeSlot);

      try {
        await insertSymptomLog({
          id,
          loggedAt,
          severity: input.severity,
          symptoms: input.symptoms,
          latitude: input.latitude,
          longitude: input.longitude,
          locationLabel: input.locationLabel,
          notes: input.notes,
          medications: input.medications,
        });

        if (input.environment) {
          const date = loggedAt.slice(0, 10);
          await insertLogEnvironment({ logId: id, date, ...input.environment });
        }

        // Invalidate history + allergy profile so both screens re-read
        await queryClient.invalidateQueries({ queryKey: ['symptom-history'] });
        await queryClient.invalidateQueries({ queryKey: ['allergy-profile'] });
        logger.debug('Symptom log saved', { id, loggedAt, severity: input.severity });
      } catch (err) {
        logger.error('Failed to save symptom log', { err });
        throw err;
      }
    },
    [queryClient],
  );

  return { logSymptoms };
}
