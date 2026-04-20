import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SavrTheme } from "../../constants/theme";

export default function FooterView() {
  return (
    <View style={styles.root}>
      <View style={styles.divider} />

      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>savr</Text>
          <View style={styles.logoDot} />
        </View>

        <Text style={styles.caption}>
          Built with love in Canada · 2026 © SAVR
        </Text>

        <View style={styles.linksRow}>
          <Text style={styles.link}>Blog</Text>
          <Text style={styles.link}>Privacy</Text>
          <Text style={styles.link}>Terms</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  divider: {
    height: SavrTheme.borderWidth.hairline,
    backgroundColor: SavrTheme.colors.cardStroke,
  },
  content: {
    paddingHorizontal: SavrTheme.spacing.xxl - 4,
    paddingVertical: SavrTheme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: SavrTheme.spacing.lg - 2,
  },
  logoWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    ...SavrTheme.typography.heroTitle,
    fontSize: 28,
    color: SavrTheme.colors.brandGreen,
    includeFontPadding: false,
  },
  logoDot: {
    position: "absolute",
    width: SavrTheme.spacing.xs - 1,
    height: SavrTheme.spacing.xs - 1,
    borderRadius: (SavrTheme.spacing.xs - 1) / 2,
    backgroundColor: SavrTheme.colors.orangeBorder,
    top: 1,
    right: -1,
  },
  caption: {
    ...SavrTheme.typography.body,
    fontSize: 15,
    fontWeight: "500",
    color: SavrTheme.colors.textSecondary,
    textAlign: "center",
  },
  linksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SavrTheme.spacing.xl,
  },
  link: {
    ...SavrTheme.typography.nav,
    fontSize: 15,
    color: SavrTheme.colors.textPrimary,
  },
});
