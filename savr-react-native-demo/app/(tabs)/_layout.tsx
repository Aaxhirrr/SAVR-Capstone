import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SavrTheme } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: SavrTheme.colors.deepGreen,
        tabBarInactiveTintColor: SavrTheme.colors.mutedGreen,
        tabBarStyle: {
          backgroundColor: SavrTheme.colors.card,
          borderTopColor: SavrTheme.colors.line,
          borderTopWidth: SavrTheme.borderWidth.hairline,
          height: 64,
          paddingBottom: SavrTheme.spacing.xs,
          paddingTop: SavrTheme.spacing.xs,
        },
        tabBarLabelStyle: {
          fontSize: SavrTheme.typography.caption.fontSize,
          fontWeight: SavrTheme.typography.caption.fontWeight,
          fontFamily: SavrTheme.typography.caption.fontFamily,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="paperplane.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          title: "Test",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="checkmark.seal.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
