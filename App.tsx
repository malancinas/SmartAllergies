import './global.css';
import React, { Component } from 'react';
import { View, Text, ScrollView } from 'react-native';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red', marginBottom: 10 }}>
            App crashed
          </Text>
          <ScrollView>
            <Text style={{ fontSize: 13, color: '#333' }}>
              {(this.state.error as Error).message}{'\n\n'}
              {(this.state.error as Error).stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './src/locales/en.json';
import ar from './src/locales/ar.json';
import RootNavigator from '@/navigation/RootNavigator';
import { Loader } from '@/components/ui/Loader';
import { ToastContainer } from '@/components/ui/Toast';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { useAuthStore } from '@/stores/persistent/authStore';
import { initRevenueCat, syncEntitlement, loginRevenueCat } from '@/features/subscription/service';
import { ENV } from '@/config/env';

const { GoogleSignin } = require('@react-native-google-signin/google-signin');
console.log('[Google] configuring with webClientId:', ENV.GOOGLE_CLIENT_ID);
GoogleSignin.configure({ webClientId: ENV.GOOGLE_CLIENT_ID });

i18n.use(initReactI18next).init({
  lng: useSettingsStore.getState().language ?? 'en',
  fallbackLng: 'en',
  resources: {
    en,
    ar,
  },
  interpolation: {
    escapeValue: false,
  },
  ns: ['common', 'auth', 'profile', 'settings', 'notifications'],
  defaultNS: 'common',
});


function ThemeSync() {
  const { setColorScheme } = useNativewindColorScheme();
  const theme = useSettingsStore((s) => s.theme);
  React.useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);
  return null;
}

function AppWithI18n() {
  const language = useSettingsStore((s) => s.language);
  const user = useAuthStore((s) => s.user);

  React.useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  React.useEffect(() => {
    initRevenueCat(user?.id);
    if (user?.id) {
      loginRevenueCat(user.id).catch(() => {});
    } else {
      syncEntitlement().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <>
      <ThemeSync />
      <RootNavigator />
      <Loader />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AppWithI18n />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
