import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type SavrTopBarProps = {
  onSignIn: () => void;
  onGetStarted: () => void;
};

export default function SavrTopBar({
  onSignIn,
  onGetStarted,
}: SavrTopBarProps) {
  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>savr</Text>
            <View style={styles.logoDot} />
          </View>

          <View style={styles.liveWrap}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live prices updating</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onSignIn}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            style={({ pressed }) => [
              styles.signInButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>

          <Pressable
            onPress={onGetStarted}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            style={({ pressed }) => [
              styles.getStartedButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#F8F6F2",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoWrap: {
    position: "relative",
    alignSelf: "flex-start",
  },
  logoText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#6DB473",
    lineHeight: 40,
    includeFontPadding: false,
  },
  logoDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    right: -3,
    top: 2,
  },
  liveWrap: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6DB473",
  },
  liveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5D6674",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  signInButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: "#DDE2E8",
  },
  signInText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#234031",
  },
  getStartedButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6DB473",
  },
  getStartedText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.82,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#DDE2E8",
  },
});
