import React from 'react';
import { View } from 'react-native';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  color?: string;
  thickness?: number;
  testID?: string;
}

export function Divider({
  orientation = 'horizontal',
  color,
  thickness = 1,
  testID,
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <View
        className="bg-neutral-200 dark:bg-neutral-700 self-stretch"
        style={{ width: thickness, ...(color ? { backgroundColor: color } : {}) }}
        testID={testID}
      />
    );
  }

  return (
    <View
      className="w-full bg-neutral-200 dark:bg-neutral-700"
      style={{ height: thickness, ...(color ? { backgroundColor: color } : {}) }}
      testID={testID}
    />
  );
}
