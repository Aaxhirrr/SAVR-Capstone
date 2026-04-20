import React from "react";
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SavrTheme } from "../../constants/theme";

type AuthFieldProps = {
  title: string;
  placeholder: string;
  text: string;
  onChangeText: (value: string) => void;
  isSecure?: boolean;
  keyboard?: KeyboardTypeOptions;
};

export default function AuthField({
  title,
  placeholder,
  text,
  onChangeText,
  isSecure = false,
  keyboard = "default",
}: AuthFieldProps) {
  const contentType: TextInputProps["textContentType"] = isSecure
    ? "password"
    : keyboard === "email-address"
      ? "emailAddress"
      : "username";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <TextInput
        value={text}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A93A0"
        secureTextEntry={isSecure}
        keyboardType={keyboard}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={contentType}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
  },
  title: {
    ...SavrTheme.typography.overline,
    color: SavrTheme.colors.textPrimary,
    marginBottom: SavrTheme.spacing.xs,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: SavrTheme.colors.softCard,
    borderRadius: SavrTheme.radius.md - 2,
    borderWidth: SavrTheme.borderWidth.thin,
    borderColor: SavrTheme.colors.cardStroke,
    ...SavrTheme.typography.body,
    fontWeight: "500",
    color: SavrTheme.colors.textPrimary,
  },
});
