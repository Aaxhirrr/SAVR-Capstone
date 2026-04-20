import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SavrTheme } from "../../constants/theme";

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

const { colors, radius, spacing, typography, borderWidth } = SavrTheme;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.statBar,
    borderRadius: radius.xl + 4,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.xl + 4,
    overflow: "hidden",
  },
  statBlock: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  value: {
    ...typography.heroTitle,
    fontSize: 44,
    lineHeight: 50,
    color: colors.inputBackground,
    textAlign: "center",
  },
  label: {
    ...typography.body,
    lineHeight: 22,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  separator: {
    height: borderWidth.hairline,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginVertical: spacing.md + 2,
  },
});
