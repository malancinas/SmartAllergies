import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children?: React.ReactNode;
  label?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary-500 active:bg-primary-600',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-secondary-500 active:bg-secondary-600',
    text: 'text-white',
  },
  outline: {
    container: 'border border-neutral-300 bg-white dark:bg-neutral-900 active:bg-neutral-50',
    text: 'text-neutral-900 dark:text-white',
  },
  ghost: {
    container: 'bg-transparent active:bg-neutral-100',
    text: 'text-neutral-900 dark:text-white',
  },
  destructive: {
    container: 'bg-error-500 active:bg-error-600',
    text: 'text-white',
  },
};

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'px-3 py-2 rounded-md', text: 'text-sm' },
  md: { container: 'px-4 py-3 rounded-lg', text: 'text-base' },
  lg: { container: 'px-6 py-4 rounded-xl', text: 'text-lg' },
};

export function Button({
  children,
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = variantClasses[variant];
  const sizeStyle = sizeClasses[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center ${variantStyle.container} ${sizeStyle.container} ${isDisabled ? 'opacity-50' : ''}`}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <Spinner size="sm" color={variant === 'outline' || variant === 'ghost' ? undefined : '#fff'} testID={testID ? `${testID}-spinner` : 'button-spinner'} />
      ) : (
        <>
          {leftIcon}
          <Text className={`font-semibold ${variantStyle.text} ${sizeStyle.text} ${leftIcon ? 'ml-2' : ''} ${rightIcon ? 'mr-2' : ''}`}>
            {label ?? children}
          </Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}
