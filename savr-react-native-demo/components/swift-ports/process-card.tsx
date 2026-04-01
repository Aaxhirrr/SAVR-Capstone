import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type ProcessCardProps = {
  number: string;
  step: string;
  title: string;
  body: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

export default function ProcessCard({
  number,
  step,
  title,
  body,
  icon,
}: ProcessCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.numberRow}>
        <Text style={styles.number}>{number}</Text>
      </View>

      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>

      <Text style={styles.step}>{step}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 250,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: "#F5F9F5",
    borderRadius: 22,
  },
  numberRow: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 6,
  },
  number: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 38,
    color: "rgba(0,0,0,0.08)",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#6DC271",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  step: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "#6DC271",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
    color: "#1A4D2E",
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: "#5A6670",
    textAlign: "center",
  },
});
