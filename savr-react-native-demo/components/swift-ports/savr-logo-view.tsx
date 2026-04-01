import React from "react";
import { AccessibilityProps, StyleSheet, Text, View } from "react-native";

type SavrLogoViewProps = {
  fontSize?: number;
  size?: number;
} & AccessibilityProps;

export default function SavrLogoView({
  fontSize = 54,
  size,
  accessibilityLabel = "Savr",
  ...accessibilityProps
}: SavrLogoViewProps) {
  const resolvedFontSize = size ?? fontSize;
  const dotSize = Math.max(8, resolvedFontSize * 0.1);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      {...accessibilityProps}
    >
      <Text style={[styles.logoText, { fontSize: resolvedFontSize }]}>
        savr
      </Text>
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            transform: [
              { translateX: resolvedFontSize * 0.28 },
              { translateY: -resolvedFontSize * 0.18 },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    position: "relative",
  },
  logoText: {
    fontWeight: "900",
    color: "rgb(110, 199, 115)",
    includeFontPadding: false,
  },
  dot: {
    position: "absolute",
    backgroundColor: "#FF3B30",
    top: 0,
    left: 0,
  },
});
