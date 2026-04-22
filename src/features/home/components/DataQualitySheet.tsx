import React from 'react';
import { View, Text } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { MergedDailyPollenForecast, PollenConfidence } from '@/features/pollen/types';

const CONFIDENCE_LABEL: Record<PollenConfidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

const CONFIDENCE_BG: Record<PollenConfidence, string> = {
  high: 'bg-success-100 dark:bg-success-900/40',
  medium: 'bg-warning-100 dark:bg-warning-900/40',
  low: 'bg-error-100 dark:bg-error-900/40',
};

const CONFIDENCE_TEXT: Record<PollenConfidence, string> = {
  high: 'text-success-700 dark:text-success-300',
  medium: 'text-warning-700 dark:text-warning-300',
  low: 'text-error-700 dark:text-error-300',
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

interface DataQualitySheetProps {
  visible: boolean;
  onClose: () => void;
  today: MergedDailyPollenForecast;
}

export function DataQualitySheet({ visible, onClose, today }: DataQualitySheetProps) {
  const { confidence, sourceMetadata } = today;

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[0.55]}>
      <View className="flex-1">
        <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          Data Quality
        </Text>

        {/* Confidence badge */}
        <View className={`self-start px-3 py-1.5 rounded-full mb-4 ${CONFIDENCE_BG[confidence]}`}>
          <Text className={`text-sm font-semibold ${CONFIDENCE_TEXT[confidence]}`}>
            {CONFIDENCE_LABEL[confidence]}
          </Text>
        </View>

        {/* Low confidence explanation */}
        {confidence === 'low' && (
          <View className="bg-error-50 dark:bg-error-900/20 rounded-xl p-3 mb-4">
            <Text className="text-sm text-error-700 dark:text-error-300">
              {sourceMetadata.length < 2
                ? 'Only one data source is available right now.'
                : 'The two pollen data sources disagree significantly for your area.'}
            </Text>
          </View>
        )}

        {/* Regional coverage warning */}
        {today.sourceMetadata.some((s) => s.coverage === 'regional') && (
          <View className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-3 mb-4">
            <Text className="text-sm text-warning-700 dark:text-warning-300">
              ⚠️ Nearest pollen sensor is regional — readings may be less accurate for your exact location.
            </Text>
          </View>
        )}

        {/* Sources */}
        <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
          Sources
        </Text>
        {sourceMetadata.map((source) => (
          <View
            key={source.name}
            className="flex-row items-start justify-between py-3 border-b border-neutral-100 dark:border-neutral-700"
          >
            <View>
              <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {source.name}
              </Text>
              <Text className="text-xs text-neutral-400 mt-0.5 capitalize">{source.coverage}</Text>
            </View>
            <Text className="text-xs text-neutral-400">
              Updated {formatTime(source.lastUpdated)}
            </Text>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}
