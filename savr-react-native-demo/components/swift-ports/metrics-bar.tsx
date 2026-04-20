import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SavrTheme } from "../../constants/theme";

export type MetricItem = {
  value: string;
  label: string;
  sublabel?: string;
};

type MetricsBarProps = {
  metrics: MetricItem[];
};

export default function MetricsBar({ metrics }: MetricsBarProps) {
  return (
    <View style={styles.outerPadding}>
      <View style={styles.container}>
        <View style={styles.grid}>
          {metrics.map((metric, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;

            return (
              <View
                key={`${metric.value}-${metric.label}-${index}`}
                style={[
                  styles.cell,
                  col === 0 ? styles.rightDivider : styles.noRightDivider,
                  row > 0 ? styles.topDivider : styles.noTopDivider,
                ]}
              >
                <Text style={styles.value}>{metric.value}</Text>
                <Text style={styles.label}>{metric.label}</Text>
                {!!metric.sublabel && metric.sublabel.trim().length > 0 && (
                  <Text style={styles.sublabel}>{metric.sublabel}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const { colors, spacing, radius, borderWidth, typography } = SavrTheme;

const styles = StyleSheet.create({
  outerPadding: {
    paddingHorizontal: spacing.lg,
  },
  container: {
    backgroundColor: colors.metricsGreen,
    borderRadius: radius.xl + 8,
    overflow: "hidden",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "50%",
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.md,
  },
  rightDivider: {
    borderRightWidth: borderWidth.hairline,
    borderRightColor: "rgba(255,255,255,0.08)",
  },
  noRightDivider: {},
  topDivider: {
    borderTopWidth: borderWidth.hairline,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  noTopDivider: {},
  value: {
    ...typography.sectionTitle,
    color: colors.inputBackground,
    lineHeight: 40,
  },
  label: {
    marginTop: spacing.xs,
    ...typography.overline,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
  },
  sublabel: {
    marginTop: spacing.xxs,
    ...typography.caption,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
});
