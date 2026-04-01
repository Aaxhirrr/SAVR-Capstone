import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
        <Ionicons name="camera" size={20} color="#5A6170" />
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
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#E6C9A7",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: "500",
    color: "#202938",
    paddingVertical: 8,
  },
  iconButtonCamera: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE8DC",
  },
  iconButtonSubmit: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6DC271",
  },
  pressed: {
    opacity: 0.8,
  },
});
