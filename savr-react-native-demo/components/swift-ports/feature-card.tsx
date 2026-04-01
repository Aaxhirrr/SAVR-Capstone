import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type FeatureCardProps = {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
};

export default function FeatureCard({
  title,
  body,
  icon,
  iconColor,
}: FeatureCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.body}>{body}</Text>

        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E6E9EC",
  },
  content: {
    flex: 1,
    alignItems: "flex-start",
    padding: 22,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    color: "#1A4D2E",
    marginBottom: 18,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    color: "#5A6670",
  },
  spacer: {
    flex: 1,
  },
});
