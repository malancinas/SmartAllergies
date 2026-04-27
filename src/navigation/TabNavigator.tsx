import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '@/types/navigation';
import { colors } from '@/theme/tokens';
import HomeScreen from '@/features/home/screens/HomeScreen';
import HistoryScreen from '@/features/symptoms/screens/HistoryScreen';
import AllergyProfileScreen from '@/features/insights/screens/AllergyProfileScreen';
import LogSymptomsScreen from '@/features/symptoms/screens/LogSymptomsScreen';
import { NotificationsScreen } from '@/features/notifications/screens/NotificationsScreen';
import MapScreen from '@/features/map/screens/MapScreen';
import SettingsNavigator from './SettingsNavigator';

const Tab = createBottomTabNavigator<TabParamList>();

// ─── Simple icon components (replace with icon library of your choice) ────────

function HomeIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 20 }}>🏠</Text>;
}
function HistoryIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 20 }}>📋</Text>;
}
function NotifIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 20 }}>🔔</Text>;
}
function MapIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 20 }}>🗺️</Text>;
}
function ProfileIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 20 }}>🧬</Text>;
}
function SettingsIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 20 }}>⚙️</Text>;
}

// Centre "Log" tab uses a prominent + button
function LogTabIcon({ focused }: { focused: boolean }) {
  return (
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: focused ? colors.primary[700] : colors.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Platform.OS === 'ios' ? 12 : 4,
        shadowColor: colors.primary[700],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 6,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 26, lineHeight: 30 }}>+</Text>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[400],
        headerShown: false,
        tabBarStyle: { paddingBottom: Platform.OS === 'ios' ? 20 : 6, height: Platform.OS === 'ios' ? 82 : 62 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <HistoryIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="AllergyProfile"
        component={AllergyProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color }) => <MapIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Log"
        component={LogSymptomsScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => <LogTabIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color }) => <NotifIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
