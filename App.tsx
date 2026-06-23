import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { checkForNewArticlesAndNotify } from './src/notifications/notifications';
import ClockScreen from './src/screens/ClockScreen';
import WorldClockScreen from './src/screens/WorldClockScreen';
import ArticlesScreen from './src/screens/ArticlesScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import * as Linking from 'expo-linking';
import { ArticlesStackParamList, RootTabParamList } from './src/navigation/types';

// Deep links: goodforfree://article/<id> opens that article (used by the widget).
const linking = {
  prefixes: [Linking.createURL('/'), 'goodforfree://'],
  config: {
    screens: {
      Articles: {
        screens: {
          ArticleDetail: 'article/:id',
        },
      },
    },
  },
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const ArticlesStack = createNativeStackNavigator<ArticlesStackParamList>();

export const navigationRef = createNavigationContainerRef<RootTabParamList>();

function ArticlesNavigator() {
  const { theme } = useSettings();
  return (
    <ArticlesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <ArticlesStack.Screen
        name="ArticlesList"
        component={ArticlesScreen}
        options={{ headerShown: false }}
      />
      <ArticlesStack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={({ route }) => ({ title: route.params?.title ?? 'Article' })}
      />
    </ArticlesStack.Navigator>
  );
}

function Tabs() {
  const { theme } = useSettings();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
            Clock: 'time-outline',
            World: 'earth-outline',
            Articles: 'newspaper-outline',
            Settings: 'settings-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Clock" component={ClockScreen} />
      <Tab.Screen name="World" component={WorldClockScreen} options={{ title: 'World' }} />
      <Tab.Screen name="Articles" component={ArticlesNavigator} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { theme, settings, ready } = useSettings();

  // On launch (once settings are loaded), check for new articles if the user
  // opted into notifications.
  useEffect(() => {
    if (ready && settings.notificationsEnabled) {
      checkForNewArticlesAndNotify();
    }
  }, [ready, settings.notificationsEnabled]);

  // When the user taps an article notification, jump to that article.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | { type?: string; articleId?: number }
        | undefined;
      if (data?.type === 'article' && data.articleId && navigationRef.isReady()) {
        // Navigate into the Articles tab's nested stack to the detail screen.
        // Cast to any: nested-navigator param typing isn't worth the ceremony here.
        (navigationRef as any).navigate('Articles', {
          screen: 'ArticleDetail',
          params: { id: data.articleId, title: 'Article' },
        });
      }
    });
    return () => sub.remove();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  const navTheme = {
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.accent,
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Tabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <Root />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
