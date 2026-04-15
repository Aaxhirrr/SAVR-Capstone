import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SavrTheme } from "@/constants/theme";

export type SavrTopBarProps = {
  onSignIn: () => void;
  onGetStarted: () => void;
};

const { colors, typography, spacing, radius, borderWidth, shadows } = SavrTheme;

export default function SavrTopBar({
  onSignIn,
  onGetStarted,
}: SavrTopBarProps) {
  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>savr</Text>
            <View style={styles.logoDot} />
          </View>

          <View style={styles.liveWrap}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live prices updating</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onSignIn}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            style={({ pressed }) => [
              styles.signInButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>

          <Pressable
            onPress={onGetStarted}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            style={({ pressed }) => [
              styles.getStartedButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoWrap: {
    position: "relative",
    alignSelf: "flex-start",
  },
  logoText: {
    color: colors.brandGreen,
    lineHeight: 40,
    letterSpacing: 0.2,
    includeFontPadding: false,
    ...typography.cta,
    fontSize: 34, // preserve previous compact top-bar logo sizing
  },
  logoDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orangeBorder,
    right: -3,
    top: 2,
  },
  liveWrap: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.softCard,
    borderWidth: borderWidth.hairline,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandGreen,
  },
  liveText: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  signInButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.softCard,
    borderWidth: borderWidth.thin,
    borderColor: colors.line,
    ...shadows.soft,
  },
  signInText: {
    color: colors.deepGreen,
    ...typography.nav,
  },
  getStartedButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandGreen,
    borderWidth: borderWidth.thin,
    borderColor: colors.deepGreen,
    ...shadows.soft,
  },
  getStartedText: {
    color: colors.deepGreen,
    ...typography.bodyBold,
  },
  pressed: {
    opacity: 0.82,
  },
  divider: {
    height: borderWidth.hairline,
    backgroundColor: colors.line,
  },
});
