import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type InfoCardProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  title: string;
  subtitle: string;
  style?: ViewStyle;
};

export default function InfoCard({
  icon,
  iconColor,
  title,
  subtitle,
  style,
}: InfoCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.flexSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 160,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F7F8F9",
    borderWidth: 1,
    borderColor: "#E3E6EA",
    boxShadow: "0px 8px 12px rgba(0, 0, 0, 0.05)",
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1C2430",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: "#5F6B7A",
  },
  flexSpacer: {
    flexGrow: 1,
    minHeight: 0,
  },
});
