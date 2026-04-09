import React from 'react';
import { View, ViewStyle } from 'react-native';

export type RowAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type RowJustify = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
export type RowSpacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

export interface RowProps {
  children: React.ReactNode;
  spacing?: RowSpacing;
  align?: RowAlign;
  justify?: RowJustify;
  wrap?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const alignMap: Record<RowAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyMap: Record<RowJustify, string> = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const gapMap: Record<RowSpacing, string> = {
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

export function Row({ children, spacing = 0, align, justify, wrap = false, style, testID }: RowProps) {
  const classes = [
    'flex-row',
    wrap ? 'flex-wrap' : 'flex-nowrap',
    gapMap[spacing],
    align ? alignMap[align] : '',
    justify ? justifyMap[justify] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View className={classes} style={style} testID={testID}>
      {children}
    </View>
  );
}
