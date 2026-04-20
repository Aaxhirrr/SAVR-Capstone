import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { SavrTheme } from "../../constants/theme";

export type StoreChipProps = {
  text: string;
  style?: ViewStyle;
};

export default function StoreChip({ text, style }: StoreChipProps) {
  return (
    <View style={[styles.chip, style]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    backgroundColor: SavrTheme.colors.inputBackground,
    borderRadius: SavrTheme.radius.pill,
    borderWidth: SavrTheme.borderWidth.thin,
    borderColor: SavrTheme.colors.cardStroke,
    paddingHorizontal: SavrTheme.spacing.lg,
    paddingVertical: SavrTheme.spacing.sm,
  },
  text: {
    ...SavrTheme.typography.nav,
    lineHeight: 20,
    color: SavrTheme.colors.textPrimary,
  },
});
