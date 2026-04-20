import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SavrTheme } from "../../constants/theme";

export type ProcessCardProps = {
  number: string;
  step: string;
  title: string;
  body: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

export default function ProcessCard({
  number,
  step,
  title,
  body,
  icon,
}: ProcessCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.numberRow}>
        <Text style={styles.number}>{number}</Text>
      </View>

      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>

      <Text style={styles.step}>{step}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 250,
    alignItems: "center",
    paddingHorizontal: SavrTheme.spacing.xl,
    paddingVertical: SavrTheme.spacing.xl,
    backgroundColor: SavrTheme.colors.mintGlow,
    borderRadius: SavrTheme.radius.xl + 2,
  },
  numberRow: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: SavrTheme.spacing.xs - 2,
  },
  number: {
    ...SavrTheme.typography.sectionTitle,
    lineHeight: 38,
    color: "rgba(0,0,0,0.08)",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: SavrTheme.radius.lg,
    backgroundColor: SavrTheme.colors.brandGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SavrTheme.spacing.sm + 2,
  },
  step: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: SavrTheme.colors.brandGreen,
    marginBottom: SavrTheme.spacing.xs - 2,
    textTransform: "uppercase",
  },
  title: {
    ...SavrTheme.typography.cardTitle,
    lineHeight: 22,
    color: SavrTheme.colors.textPrimary,
    textAlign: "center",
    marginBottom: SavrTheme.spacing.xs,
  },
  body: {
    ...SavrTheme.typography.body,
    lineHeight: 22,
    color: SavrTheme.colors.textSecondary,
    textAlign: "center",
  },
});
