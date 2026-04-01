import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
          placeholderTextColor="#8A93A0"
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
          <Ionicons name="camera-outline" size={18} color="#5A6472" />
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
          <Ionicons name="arrow-up-circle" size={22} color="#6EC774" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 16,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "#D7DDE2",
    boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.06)",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1C2430",
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
