import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../contexts/AuthContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://94c1718ad5231733d897e96799b24a21@o4510085819203584.ingest.us.sentry.io/4510085821890560',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Custom theme inspired by Airbnb
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FF5A5F', // Airbnb red
    primaryContainer: '#FFE6E7',
    secondary: '#00A699', // Airbnb teal
    secondaryContainer: '#E6F7F6',
    surface: '#FFFFFF',
    surfaceVariant: '#F7F7F7',
    outline: '#E0E0E0',
    background: '#FAFAFA',
  },
  roundness: 12,
};

export default Sentry.wrap(function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <FavoritesProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="booking/[id]" options={{ headerShown: false }} />
          </Stack>
        </FavoritesProvider>
      </AuthProvider>
    </PaperProvider>
  );
});