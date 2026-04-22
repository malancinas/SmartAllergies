import './global.css';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './src/locales/en.json';
import ar from './src/locales/ar.json';
import RootNavigator from '@/navigation/RootNavigator';
import { Loader } from '@/components/ui/Loader';
import { ToastContainer } from '@/components/ui/Toast';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { useAuthStore } from '@/stores/persistent/authStore';
import { initRevenueCat, syncEntitlement, loginRevenueCat } from '@/features/subscription/service';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

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
      <RootNavigator />
      <Loader />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppWithI18n />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
