import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '@/types/navigation';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { Button } from '@/components/ui';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingWelcome'>;

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🌿',
    title: 'Local Allergies',
    subtitle: 'Know your risk before you step outside.',
  },
  {
    emoji: '📍',
    title: 'Live pollen near you',
    subtitle: 'Updated throughout the day. UK-wide heatmap included.',
  },
  {
    emoji: '📊',
    title: 'Built around you',
    subtitle: 'Your risk score learns from your allergens and daily symptom logs.',
  },
];

export default function OnboardingWelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { setHasOnboarded } = useSettingsStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const slide = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveSlide(slide);
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 justify-between py-12">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {SLIDES.map((slide) => (
            <View
              key={slide.title}
              style={{ width }}
              className="items-center justify-center px-10 gap-5"
            >
              <Text style={{ fontSize: 80 }}>{slide.emoji}</Text>
              <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center">
                {slide.title}
              </Text>
              <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-7">
                {slide.subtitle}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View className="px-8 gap-6">
          <View className="flex-row justify-center gap-2">
            {SLIDES.map((_, i) => (
              <View
                key={i}
                className={`h-2 rounded-full ${
                  i === activeSlide
                    ? 'w-6 bg-primary-500'
                    : 'w-2 bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </View>

          <Button label="Get started" onPress={() => navigation.navigate('OnboardingLocation')} />

          <TouchableOpacity onPress={() => setHasOnboarded(true)}>
            <Text className="text-sm text-center text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Text className="font-semibold text-gray-900 dark:text-white">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
