import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemeProvider, useTheme } from './src/utils/theme';
import { PremiumProvider } from './src/contexts/PremiumContext';
import { initNotifications } from './src/utils/notifications';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import SubjectScreen from './src/screens/SubjectScreen';
import LearnScreen from './src/screens/LearnScreen';
import ExamScreen from './src/screens/ExamScreen';
import ExamResultScreen from './src/screens/ExamResultScreen';
import SRSReviewScreen from './src/screens/SRSReviewScreen';
import BookmarksScreen from './src/screens/BookmarksScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PaywallScreen from './src/screens/PaywallScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, color, size }) {
  return <Ionicons name={name} size={size || 22} color={color} />;
}

function HomeTabs() {
  const { colors, dark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Fächer',
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'book' : 'book-outline'} color={color} />,
        }}
      />
      <Tab.Screen
        name="BookmarksTab"
        component={BookmarksScreen}
        options={{
          tabBarLabel: 'Merkliste',
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'bookmark' : 'bookmark-outline'} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Statistik',
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'stats-chart' : 'stats-chart-outline'} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { colors, dark } = useTheme();

  const navTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.brand,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: '600' },
          headerBackTitle: 'Zurück',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Subject"
          component={SubjectScreen}
          options={({ route }) => ({
            title: route.params?.subjectId?.toUpperCase() || 'Fach',
          })}
        />
        <Stack.Screen
          name="Learn"
          component={LearnScreen}
          options={({ route }) => ({
            title: route.params?.filterMode === 'wrong'
              ? 'Fehler wiederholen'
              : route.params?.filterMode === 'topic'
              ? route.params?.filterTopic || 'Thema'
              : 'Lernmodus',
          })}
        />
        <Stack.Screen
          name="Exam"
          component={ExamScreen}
          options={{ title: 'Prüfungsmodus', headerBackVisible: false }}
        />
        <Stack.Screen
          name="ExamResult"
          component={ExamResultScreen}
          options={{ title: 'Ergebnis', headerBackVisible: false }}
        />
        <Stack.Screen
          name="SRSReview"
          component={SRSReviewScreen}
          options={{ title: 'Wiederholung' }}
        />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{
            title: 'HQ Elektrotechnik Premium',
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppContent() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('hq_onboarding_done').then((val) => {
      setShowOnboarding(val !== 'true');
      setLoading(false);
    }).catch(() => setLoading(false));
    initNotifications().catch(() => {});
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#007AFF' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onDone={() => setShowOnboarding(false)} />;
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <ThemeProvider>
      <PremiumProvider>
        <AppContent />
      </PremiumProvider>
    </ThemeProvider>
  );
}
