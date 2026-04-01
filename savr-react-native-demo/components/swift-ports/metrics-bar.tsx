import React from "react";
import { StyleSheet, Text, View } from "react-native";

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

const METRICS_GREEN = "#2F7A3E";

const styles = StyleSheet.create({
  outerPadding: {
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: METRICS_GREEN,
    borderRadius: 28,
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
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  rightDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(255,255,255,0.08)",
  },
  noRightDivider: {},
  topDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  noTopDivider: {},
  value: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 40,
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
  },
  sublabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
});
