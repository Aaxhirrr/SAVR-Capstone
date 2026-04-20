import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SavrTheme } from "../../constants/theme";

type PillTagProps = {
  text: string;
};

export default function PillTag({ text }: PillTagProps) {
  return (
    <View style={styles.container} accessibilityRole="text">
      <Text style={styles.text}>{text.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SavrTheme.spacing.xs - 2,
    paddingHorizontal: SavrTheme.spacing.sm - 2,
    backgroundColor: SavrTheme.colors.softCard,
    borderRadius: SavrTheme.radius.pill,
    borderWidth: SavrTheme.borderWidth.hairline,
    borderColor: SavrTheme.colors.cardStroke,
    alignSelf: "flex-start",
  },
  text: {
    ...SavrTheme.typography.caption,
    color: SavrTheme.colors.textSecondary,
    letterSpacing: 0.2,
  },
});
