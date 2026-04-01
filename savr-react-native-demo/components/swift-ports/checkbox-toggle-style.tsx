import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

export interface CheckboxToggleStyleProps {
  isOn: boolean;
  onToggle: (nextValue: boolean) => void;
  label: string | React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export default function CheckboxToggleStyle({
  isOn,
  onToggle,
  label,
  containerStyle,
  labelStyle,
  disabled = false,
}: CheckboxToggleStyleProps) {
  const handlePress = () => {
    if (disabled) return;
    onToggle(!isOn);
  };

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isOn, disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        containerStyle,
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.box, isOn && styles.boxOn]}>
          {isOn ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>

        {typeof label === "string" ? (
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        ) : (
          <View style={styles.labelNode}>{label}</View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C9CFD8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  boxOn: {
    backgroundColor: "rgba(109, 180, 115, 0.20)",
  },
  checkmark: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6DB473",
    lineHeight: 15,
  },
  label: {
    color: "#5B6472",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    flexShrink: 1,
  },
  labelNode: {
    flexShrink: 1,
  },
});
