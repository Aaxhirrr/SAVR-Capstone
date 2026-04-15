import { Theme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { SavrTheme } from "@/constants/theme";

export const unstable_settings = {
  anchor: "(tabs)",
};

const navigationTheme: Theme = {
  dark: false,
  colors: {
    primary: SavrTheme.colors.brandGreen,
    background: SavrTheme.colors.bg,
    card: SavrTheme.colors.card,
    text: SavrTheme.colors.textPrimary,
    border: SavrTheme.colors.line,
    notification: SavrTheme.colors.brandOrange,
  },
  fonts: {
    regular: {
      fontFamily:
        SavrTheme.typography.body.fontFamily ??
        SavrTheme.typography.bodyBold.fontFamily,
      fontWeight: SavrTheme.typography.body.fontWeight,
    },
    medium: {
      fontFamily:
        SavrTheme.typography.nav.fontFamily ??
        SavrTheme.typography.body.fontFamily,
      fontWeight: SavrTheme.typography.nav.fontWeight,
    },
    bold: {
      fontFamily:
        SavrTheme.typography.cardTitle.fontFamily ??
        SavrTheme.typography.nav.fontFamily,
      fontWeight: SavrTheme.typography.cardTitle.fontWeight,
    },
    heavy: {
      fontFamily:
        SavrTheme.typography.sectionTitle.fontFamily ??
        SavrTheme.typography.cardTitle.fontFamily,
      fontWeight: SavrTheme.typography.sectionTitle.fontWeight,
    },
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: SavrTheme.colors.bg,
          },
          headerTintColor: SavrTheme.colors.textPrimary,
          headerTitleStyle: {
            fontSize: SavrTheme.typography.nav.fontSize,
            fontWeight: SavrTheme.typography.nav.fontWeight,
            fontFamily: SavrTheme.typography.nav.fontFamily,
          },
          contentStyle: {
            backgroundColor: SavrTheme.colors.bg,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Modal",
          }}
        />
      </Stack>
      <StatusBar style="dark" backgroundColor={SavrTheme.colors.bg} />
    </ThemeProvider>
  );
}
