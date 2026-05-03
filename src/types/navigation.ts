export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingLocation: undefined;
  OnboardingAllergens: undefined;
  OnboardingNotifications: undefined;
  OnboardingPro: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Map: undefined;
  Log: undefined;
  Settings: undefined;
};

export type HistoryStackParamList = {
  HistoryMain: undefined;
  EditLog: { logId: string };
};

export type HomeStackParamList = {
  HomeMain: undefined;
  AllergyProfile: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Language: undefined;
  Subscription: undefined;
  Export: undefined;
  AllergenProfile: undefined;
  AllergyReport: undefined;
  AlertSchedules: undefined;
  AlertEdit: { scheduleId?: string };
};
