import { StripeProvider } from '@stripe/stripe-react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { defineBackgroundTasks } from '@/lib/background-tasks';
import { configureNotificationHandling } from '@/lib/notifications';

// Both must run at module scope so background launches and notification
// deliveries are handled even before any component mounts.
defineBackgroundTasks();
configureNotificationHandling();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

// Public Stripe test-mode key; safe to embed, used only to exercise the SDK.
const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51H000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <StripeProvider
            publishableKey={STRIPE_PUBLISHABLE_KEY}
            merchantIdentifier="merchant.com.anonymous.sampleexpo56app">
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AnimatedSplashOverlay />
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="post/[id]" options={{ title: 'Post' }} />
                <Stack.Screen name="sensors" options={{ title: 'Sensor Lab' }} />
                <Stack.Screen name="payments" options={{ title: 'Go Premium' }} />
                <Stack.Screen
                  name="browser"
                  options={{ title: 'In-App Browser', presentation: 'modal' }}
                />
                <Stack.Screen name="settings" options={{ title: 'System Toolbox' }} />
              </Stack>
            </ThemeProvider>
          </StripeProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
