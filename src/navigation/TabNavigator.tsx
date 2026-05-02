import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '@/types/navigation';
import { colors } from '@/theme/tokens';
import HomeStackNavigator from './HomeStackNavigator';
import HistoryNavigator from './HistoryNavigator';
import LogSymptomsScreen from '@/features/symptoms/screens/LogSymptomsScreen';
import MapScreen from '@/features/map/screens/MapScreen';
import SettingsNavigator from './SettingsNavigator';

const Tab = createBottomTabNavigator<TabParamList>();

function HomeIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 20 }}>🏠</Text>;
}
function HistoryIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 20 }}>📋</Text>;
}
function MapIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 20 }}>🗺️</Text>;
}
function ProfileIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 20 }}>👤</Text>;
}

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
        tabBarActiveTintColor: colors.primary[400],
        tabBarInactiveTintColor: colors.neutral[500],
        headerShown: false,
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          height: Platform.OS === 'ios' ? 82 : 62,
          backgroundColor: '#111827',
          borderTopColor: '#1f2937',
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryNavigator}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <HistoryIcon color={color} />,
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
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color }) => <MapIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
