import React from 'react';
import { Text, TouchableOpacity, View, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/types/navigation';
import { Screen } from '@/components/layout';
import { Stack } from '@/components/layout';
import { Button, Input, Divider } from '@/components/ui';
import { useLogin } from '../hooks/useLogin';
import { useGoogleSignInMutation, useAppleSignInMutation } from '../api';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavProp>();
  const { email, setEmail, password, setPassword, errors, isLoading, handleLogin } = useLogin();
  const googleMutation = useGoogleSignInMutation();
  const appleMutation = useAppleSignInMutation();

  return (
    <Screen scrollable>
      <Stack spacing={4}>
        <View className="items-center mb-2 mt-8">
          <Text style={{ fontSize: 48 }}>🌿</Text>
        </View>

        <Text className="text-2xl font-bold text-center text-neutral-900 dark:text-white">
          Welcome back
        </Text>
        <Text className="text-sm text-center text-neutral-500 mb-2">
          Sign in to your account
        </Text>

        {(errors.general || googleMutation.error) ? (
          <Text className="text-sm text-error-500 text-center">
            {errors.general ?? (googleMutation.error as Error).message}
          </Text>
        ) : null}

        <Button
          variant="outline"
          onPress={() => googleMutation.mutate()}
          loading={googleMutation.isPending}
          testID="login-google-btn"
        >
          Continue with Google
        </Button>

        {Platform.OS === 'ios' && (
          <Button
            variant="outline"
            onPress={() => appleMutation.mutate()}
            loading={appleMutation.isPending}
            testID="login-apple-btn"
          >
            Continue with Apple
          </Button>
        )}

        <Divider />

        <Input
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          testID="login-email-input"
        />

        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
          testID="login-password-input"
        />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text className="text-sm text-neutral-500 text-right">Forgot password?</Text>
        </TouchableOpacity>

        <Button
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          testID="login-submit-btn"
        >
          Sign In
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text className="text-sm text-center text-neutral-500">
            Don't have an account?{' '}
            <Text className="font-semibold text-neutral-900 dark:text-white">Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </Stack>
    </Screen>
  );
}
