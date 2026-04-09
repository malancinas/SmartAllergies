import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';

export interface TabItem {
  key: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
  testID?: string;
}

export function Tabs({ tabs, activeTab, onChange, testID }: TabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="border-b border-neutral-200 dark:border-neutral-700"
      testID={testID}
    >
      <View className="flex-row">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onChange(tab.key)}
              className={`px-4 py-3 border-b-2 ${isActive ? 'border-primary-500' : 'border-transparent'}`}
            >
              <Text
                className={`text-sm font-medium ${isActive ? 'text-primary-500' : 'text-neutral-500'}`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
