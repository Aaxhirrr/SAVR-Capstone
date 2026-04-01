import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

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
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: "#DDE3E8",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    color: "#1F3B2D",
  },
});
