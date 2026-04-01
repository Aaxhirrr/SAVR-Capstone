import React from "react";
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

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
    fontSize: 14,
    fontWeight: "700",
    color: "rgb(46,59,84)",
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "rgb(242,245,247)",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgb(199,207,217)",
    fontSize: 16,
    fontWeight: "500",
    color: "#1B2430",
  },
});
