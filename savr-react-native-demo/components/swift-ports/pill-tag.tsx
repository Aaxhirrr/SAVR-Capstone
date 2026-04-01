import React from "react";
import { StyleSheet, Text, View } from "react-native";

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
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D7DDE2",
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4E5968",
    letterSpacing: 0.2,
  },
});
