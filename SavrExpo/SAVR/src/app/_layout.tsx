import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { SessionProvider, useSession } from '@/state/session';
import { Loading, Notice } from '@/components/savr/ui';
import { colors } from '@/theme/tokens';
void SplashScreen.preventAutoHideAsync();
function Navigation() {
  const { session, loading, notice, dismissNotice } = useSession();
  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync();
  }, [loading]);
  if (loading) return <Loading label="Loading your account…" />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.deep,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ title: 'Welcome back' }} />
        <Stack.Screen name="sign-up" options={{ title: 'Get started' }} />
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="lists/[id]"
            options={{ title: 'Your grocery list' }}
          />
          <Stack.Screen name="profile" options={{ title: 'Your profile' }} />
        </Stack.Protected>
      </Stack>
      <Notice message={notice} onDismiss={dismissNotice} />
      <StatusBar style="dark" />
    </View>
  );
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <Navigation />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
