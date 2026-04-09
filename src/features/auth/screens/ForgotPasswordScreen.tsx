import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/types/navigation';
import { Screen, Stack } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { useForgotPasswordMutation } from '../api';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NavProp>();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const mutation = useForgotPasswordMutation();

  function handleSubmit() {
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email address');
      return;
    }
    setEmailError('');
    mutation.mutate({ email: email.trim() });
  }

  if (mutation.isSuccess) {
    return (
      <Screen>
        <Stack spacing={4} align="center">
          <View className="w-16 h-16 bg-success-100 rounded-full items-center justify-center">
            <Text className="text-2xl">✓</Text>
          </View>
          <Text className="text-xl font-bold text-neutral-900 dark:text-white text-center">
            Check your email
          </Text>
          <Text className="text-sm text-neutral-500 text-center">
            We sent a reset link to {email}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text className="text-sm text-neutral-500">← Back to Sign In</Text>
          </TouchableOpacity>
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack spacing={4}>
        <View className="items-center mb-4 mt-8">
          <View className="w-12 h-12 bg-neutral-100 rounded-full items-center justify-center">
            <Text className="text-xl">✉</Text>
          </View>
        </View>

        <Text className="text-2xl font-bold text-center text-neutral-900 dark:text-white">
          Reset password
        </Text>
        <Text className="text-sm text-center text-neutral-500 mb-4">
          Enter your email and we'll send you a reset link
        </Text>

        <Input
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          testID="forgot-password-email-input"
        />

        <Button
          onPress={handleSubmit}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          testID="forgot-password-submit-btn"
        >
          Send Reset Link
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text className="text-sm text-center text-neutral-500 mt-4">← Back to Sign In</Text>
        </TouchableOpacity>
      </Stack>
    </Screen>
  );
}
