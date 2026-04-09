import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/types/navigation';
import { Screen, Stack } from '@/components/layout';
import { Button, Input, Divider } from '@/components/ui';
import { useRegister } from '../hooks/useRegister';
import { useGoogleSignInMutation } from '../api';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<NavProp>();
  const { fields, setters, errors, isLoading, handleRegister } = useRegister();
  const googleMutation = useGoogleSignInMutation();

  return (
    <Screen scrollable>
      <Stack spacing={4}>
        <View className="items-center mb-4 mt-8">
          <View className="w-12 h-12 bg-neutral-900 rounded-xl" />
        </View>

        <Text className="text-2xl font-bold text-center text-neutral-900 dark:text-white">
          Create account
        </Text>
        <Text className="text-sm text-center text-neutral-500 mb-4">
          Start your journey today
        </Text>

        {errors.general ? (
          <Text className="text-sm text-error-500 text-center">{errors.general}</Text>
        ) : null}

        <Input
          label="Full name"
          placeholder="John Doe"
          value={fields.name}
          onChangeText={setters.setName}
          error={errors.name}
          testID="register-name-input"
        />

        <Input
          label="Email address"
          placeholder="you@example.com"
          value={fields.email}
          onChangeText={setters.setEmail}
          error={errors.email}
          testID="register-email-input"
        />

        <Input
          label="Password"
          placeholder="••••••••"
          value={fields.password}
          onChangeText={setters.setPassword}
          secureTextEntry
          error={errors.password}
          testID="register-password-input"
        />

        <Input
          label="Confirm password"
          placeholder="••••••••"
          value={fields.confirmPassword}
          onChangeText={setters.setConfirmPassword}
          secureTextEntry
          error={errors.confirmPassword}
          testID="register-confirm-password-input"
        />

        <Button
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          testID="register-submit-btn"
        >
          Create Account
        </Button>

        <Divider />

        <Button
          variant="outline"
          onPress={() => googleMutation.mutate()}
          loading={googleMutation.isPending}
          testID="register-google-btn"
        >
          Continue with Google
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text className="text-sm text-center text-neutral-500">
            Already have an account?{' '}
            <Text className="font-semibold text-neutral-900 dark:text-white">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </Stack>
    </Screen>
  );
}
