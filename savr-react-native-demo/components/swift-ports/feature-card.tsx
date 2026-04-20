import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SavrTheme } from "../../constants/theme";

export type FeatureCardProps = {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
};

export default function FeatureCard({
  title,
  body,
  icon,
  iconColor,
}: FeatureCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.body}>{body}</Text>

        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const { colors, spacing, radius, borderWidth, typography, shadows } = SavrTheme;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 220,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.xl,
    borderWidth: borderWidth.hairline,
    borderColor: colors.cardStroke,
    ...shadows.soft,
  },
  content: {
    flex: 1,
    alignItems: "flex-start",
    padding: spacing.lg + 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md + 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg - 2,
  },
  title: {
    ...typography.cardTitle,
    lineHeight: 22,
    color: colors.textPrimary,
    marginBottom: spacing.lg - 2,
  },
  body: {
    ...typography.body,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  spacer: {
    flex: 1,
  },
});
