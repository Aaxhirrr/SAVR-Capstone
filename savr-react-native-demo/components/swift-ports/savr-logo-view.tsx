import React from "react";
import { AccessibilityProps, StyleSheet, Text, View } from "react-native";

import { SavrTheme } from "@/constants/theme";

type SavrLogoViewProps = {
  fontSize?: number;
  size?: number;
} & AccessibilityProps;

const { colors, typography } = SavrTheme;

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
    color: colors.brandGreen,
    fontWeight: typography.hero.fontWeight,
    fontFamily: typography.hero.fontFamily,
    includeFontPadding: false,
    lineHeight: undefined,
  },
  dot: {
    position: "absolute",
    backgroundColor: colors.orangeBorder,
    top: 0,
    left: 0,
  },
});
