import React from 'react';
import { View, ViewStyle } from 'react-native';

export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
export type StackSpacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

export interface StackProps {
  children: React.ReactNode;
  spacing?: StackSpacing;
  align?: StackAlign;
  justify?: StackJustify;
  style?: ViewStyle;
  className?: string;
  testID?: string;
}

const alignMap: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyMap: Record<StackJustify, string> = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const gapMap: Record<StackSpacing, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
  16: 'gap-16',
};

export function Stack({ children, spacing = 0, align, justify, style, className, testID }: StackProps) {
  const classes = [
    'flex-col',
    gapMap[spacing],
    align ? alignMap[align] : '',
    justify ? justifyMap[justify] : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View className={classes} style={style} testID={testID}>
      {children}
    </View>
  );
}
