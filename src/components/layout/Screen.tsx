import React from 'react';
import { SafeAreaView, ScrollView, ViewStyle } from 'react-native';

export interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  padding?: boolean;
  scrollable?: boolean;
  testID?: string;
}

export function Screen({
  children,
  style,
  backgroundColor,
  padding = true,
  scrollable = false,
  testID,
}: ScreenProps) {
  const paddingClass = padding ? 'px-4 py-4' : '';
  const rootStyle: ViewStyle = { ...(backgroundColor ? { backgroundColor } : {}), ...style };

  if (scrollable) {
    return (
      <SafeAreaView
        className={`flex-1 bg-white dark:bg-neutral-900 ${paddingClass}`}
        style={rootStyle}
        testID={testID}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 bg-white dark:bg-neutral-900 ${paddingClass}`}
      style={rootStyle}
      testID={testID}
    >
      {children}
    </SafeAreaView>
  );
}
