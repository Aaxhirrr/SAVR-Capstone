import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type StatItem = [string, string];

export type StatBarProps = {
  stats: StatItem[];
};

export default function StatBar({ stats }: StatBarProps) {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => {
        const [value, label] = stat;
        const isLast = index === stats.length - 1;

        return (
          <React.Fragment key={`${value}-${label}-${index}`}>
            <View style={styles.statBlock}>
              <Text style={styles.value}>{value}</Text>
              <Text style={styles.label}>{label}</Text>
            </View>

            {!isLast ? <View style={styles.separator} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2F7A3E",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 28,
    overflow: "hidden",
  },
  statBlock: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  value: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginVertical: 18,
  },
});
