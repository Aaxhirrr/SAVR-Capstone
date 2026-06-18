import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SavrTheme } from "@/constants/theme";

export type SavrNavBarProps = {
  onSignIn: () => void;
  onGetStarted: () => void;
};

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant: "secondary" | "primary";
};

const { colors, typography, spacing, radius, borderWidth } = SavrTheme;

function NavButton({ title, onPress, variant }: ButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonBase,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          isPrimary ? styles.primaryText : styles.secondaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export default function SavrNavBar({
  onSignIn,
  onGetStarted,
}: SavrNavBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={styles.logoText}>savr</Text>
        <View style={styles.logoDot} />
      </View>

      <View style={styles.actionsRow}>
        <NavButton title="Sign In" onPress={onSignIn} variant="secondary" />
        <NavButton
          title="Get Started"
          onPress={onGetStarted}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: colors.bg,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  logoText: {
    color: colors.brandGreen,
    letterSpacing: 0.2,
    includeFontPadding: false,
    ...typography.sectionTitle,
    fontSize: 26,
    lineHeight: 30,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.orangeBorder,
    marginLeft: -12,
    marginTop: 2,
    opacity: 0.9,
  },
  actionsRow: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  buttonBase: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: borderWidth.hairline,
  },
  secondaryButton: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.line,
  },
  primaryButton: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.deepGreen,
  },
  buttonText: {
    ...typography.caption,
    fontSize: 14,
  },
  secondaryText: {
    color: colors.deepGreen,
  },
  primaryText: {
    color: colors.inputBackground,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
