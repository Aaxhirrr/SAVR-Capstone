import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SavrTheme } from "../../constants/theme";

type HeroSearchBarProps = {
  text: string;
  onChangeText: (value: string) => void;
  onCamera: () => void;
  onSubmit: () => void;
  placeholder?: string;
};

export default function HeroSearchBar({
  text,
  onChangeText,
  onCamera,
  onSubmit,
  placeholder = "Ask SAVR anything...",
}: HeroSearchBarProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onCamera}
        style={({ pressed }) => [
          styles.iconButtonCamera,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open camera"
      >
        <Ionicons
          name="camera"
          size={20}
          color={SavrTheme.colors.textSecondary}
        />
      </Pressable>

      <TextInput
        value={text}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A909C"
        style={styles.input}
        returnKeyType="send"
        onSubmitEditing={onSubmit}
      />

      <Pressable
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.iconButtonSubmit,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Submit search"
      >
        <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: SavrTheme.spacing.sm,
    backgroundColor: SavrTheme.colors.inputBackground,
    borderRadius: SavrTheme.radius.lg + 2,
    borderWidth: SavrTheme.borderWidth.regular,
    borderColor: SavrTheme.colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: "500",
    color: SavrTheme.colors.textPrimary,
    paddingVertical: SavrTheme.spacing.xs,
  },
  iconButtonCamera: {
    width: 42,
    height: 42,
    borderRadius: SavrTheme.radius.md + 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SavrTheme.colors.peach,
  },
  iconButtonSubmit: {
    width: 42,
    height: 42,
    borderRadius: SavrTheme.radius.md + 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SavrTheme.colors.brandGreen,
  },
  pressed: {
    opacity: 0.8,
  },
});
