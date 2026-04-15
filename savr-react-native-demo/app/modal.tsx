import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SavrTheme } from "@/constants/theme";

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          SAVR Modal
        </ThemedText>
        <ThemedText style={styles.body}>
          This modal now uses the centralized SAVR design tokens for color,
          typography, spacing, and radius.
        </ThemedText>
        <Link href="/" dismissTo style={styles.linkButton}>
          <ThemedText style={styles.linkText}>Go to home screen</ThemedText>
        </Link>
      </View>
    </ThemedView>
  );
}

const { colors, typography, spacing, radius, borderWidth, shadows } = SavrTheme;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    borderColor: colors.cardStroke,
    padding: spacing.xl,
    ...shadows.card,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    ...typography.sectionTitle,
  },
  body: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    ...typography.body,
    lineHeight: 24,
  },
  linkButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandGreen,
    borderRadius: radius.pill,
    borderWidth: borderWidth.thin,
    borderColor: colors.deepGreen,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  linkText: {
    color: colors.deepGreen,
    ...typography.bodyBold,
  },
});
