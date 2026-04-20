import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SavrTheme } from "../../constants/theme";

export type SavrSearchBarProps = {
  text: string;
  onChangeText: (value: string) => void;
  onCamera: () => void;
  onSubmit: () => void;
  placeholder?: string;
};

export default function SavrSearchBar({
  text,
  onChangeText,
  onCamera,
  onSubmit,
  placeholder = "What are you shopping for?",
}: SavrSearchBarProps) {
  return (
    <View style={styles.outer}>
      <View style={styles.container}>
        <TextInput
          value={text}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          autoCapitalize="sentences"
          autoCorrect
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />

        <Pressable
          onPress={onCamera}
          accessibilityRole="button"
          accessibilityLabel="Open camera"
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="camera-outline"
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>

        <Pressable
          onPress={onSubmit}
          accessibilityRole="button"
          accessibilityLabel="Submit search"
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="arrow-up-circle"
            size={22}
            color={colors.brandGreen}
          />
        </Pressable>
      </View>
    </View>
  );
}

const { colors, spacing, radius, borderWidth, shadows, typography } = SavrTheme;

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: spacing.md,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg + 2,
    backgroundColor: colors.softCard,
    borderWidth: borderWidth.hairline,
    borderColor: colors.cardStroke,
    ...shadows.soft,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.75,
  },
});
