import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SavrTheme } from "../../constants/theme";

export type InfoCardProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  title: string;
  subtitle: string;
  style?: ViewStyle;
};

export default function InfoCard({
  icon,
  iconColor,
  title,
  subtitle,
  style,
}: InfoCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
        <Ionicons
          name={icon}
          size={22}
          color={SavrTheme.colors.inputBackground}
        />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.flexSpacer} />
    </View>
  );
}

const { colors, spacing, radius, borderWidth, shadows, typography } = SavrTheme;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 160,
    padding: spacing.md,
    borderRadius: radius.lg + 2,
    backgroundColor: colors.softCard,
    borderWidth: borderWidth.hairline,
    borderColor: colors.cardStroke,
    ...shadows.soft,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: radius.md + 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs + 2,
  },
  title: {
    ...typography.cardTitle,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.xs - 2,
  },
  subtitle: {
    ...typography.caption,
    lineHeight: 18,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  flexSpacer: {
    flexGrow: 1,
    minHeight: 0,
  },
});
