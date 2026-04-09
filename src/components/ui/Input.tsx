import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  testID?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  secureTextEntry,
  testID,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderClass = error
    ? 'border-error-500'
    : isFocused
      ? 'border-primary-500'
      : 'border-neutral-300 dark:border-neutral-700';

  return (
    <View className="w-full">
      {label ? (
        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center border rounded-lg bg-white dark:bg-neutral-800 px-3 py-3 ${borderClass}`}
      >
        {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
        <TextInput
          {...props}
          secureTextEntry={secureTextEntry}
          className="flex-1 text-base text-neutral-900 dark:text-white"
          placeholderTextColor="#9ca3af"
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          testID={testID}
        />
        {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text className="text-xs text-error-500 mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
