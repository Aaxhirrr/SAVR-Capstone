import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function FooterView() {
  return (
    <View style={styles.root}>
      <View style={styles.divider} />

      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>savr</Text>
          <View style={styles.logoDot} />
        </View>

        <Text style={styles.caption}>
          Built with love in Canada · 2026 © SAVR
        </Text>

        <View style={styles.linksRow}>
          <Text style={styles.link}>Blog</Text>
          <Text style={styles.link}>Privacy</Text>
          <Text style={styles.link}>Terms</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#DDE3E8",
  },
  content: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  logoWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#6EC774",
    includeFontPadding: false,
  },
  logoDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#FF3B30",
    top: 1,
    right: -1,
  },
  caption: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6A7280",
    textAlign: "center",
  },
  linksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  link: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F3B2D",
  },
});
