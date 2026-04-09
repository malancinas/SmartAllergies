import React from 'react';
import { View, Text, Pressable, ScrollView, I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import i18n from 'i18next';
import { useSettings } from '../hooks/useSettings';
import type { LanguageOption } from '../types';

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', rtl: false },
  { code: 'ar', label: 'العربية', rtl: true },
];

export function LanguageScreen() {
  const { language, setLanguage } = useSettings();

  async function handleSelect(option: LanguageOption) {
    const previousRtl = I18nManager.isRTL;
    setLanguage(option.code);
    i18n.changeLanguage(option.code);

    if (option.rtl !== previousRtl) {
      I18nManager.forceRTL(option.rtl);
      await Updates.reloadAsync();
    }
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="px-6 pt-6">
        {LANGUAGES.map((option) => (
          <Pressable
            key={option.code}
            onPress={() => handleSelect(option)}
            className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800"
          >
            <Text className="text-base text-gray-900 dark:text-white">{option.label}</Text>
            {language === option.code && (
              <View className="w-5 h-5 rounded-full border-2 border-primary-500 items-center justify-center">
                <View className="w-2.5 h-2.5 rounded-full bg-primary-500" />
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
