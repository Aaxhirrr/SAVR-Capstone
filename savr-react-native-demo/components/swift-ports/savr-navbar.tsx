import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type SavrNavBarProps = {
  onSignIn: () => void;
  onGetStarted: () => void;
};

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant: "secondary" | "primary";
};

function NavButton({ title, onPress, variant }: ButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonBase,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          isPrimary ? styles.primaryText : styles.secondaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export default function SavrNavBar({
  onSignIn,
  onGetStarted,
}: SavrNavBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={styles.logoText}>savr</Text>
        <View style={styles.logoDot} />
      </View>

      <View style={styles.actionsRow}>
        <NavButton title="Sign In" onPress={onSignIn} variant="secondary" />
        <NavButton
          title="Get Started"
          onPress={onGetStarted}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  logoText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#6DC271",
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF3B30",
    marginLeft: -12,
    marginTop: 2,
    opacity: 0.9,
  },
  actionsRow: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonBase: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE3E8",
  },
  primaryButton: {
    backgroundColor: "#6DC271",
    borderWidth: 1,
    borderColor: "#6DC271",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryText: {
    color: "#1A4D2E",
  },
  primaryText: {
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
