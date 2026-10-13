import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ColorValue,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { colors } from '@/theme/tokens';
export function Icon({
  name,
  color = colors.deep,
  size = 22,
}: {
  name: ComponentProps<typeof Ionicons>['name'];
  color?: ColorValue;
  size?: number;
}) {
  return (
    <Ionicons
      name={name}
      color={color}
      size={size}
      accessible={false}
      aria-hidden
    />
  );
}
export function Logo() {
  return (
    <Image
      source={require('@/assets/brand/wordmark.svg')}
      style={{ width: 112, height: 40 }}
      contentFit="contain"
      accessibilityLabel="SAVR"
    />
  );
}
export function Screen({
  children,
  scroll = true,
}: PropsWithChildren<{ scroll?: boolean }>) {
  return (
    <SafeAreaView style={s.screen} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.content}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Heading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.heading}>
      <View style={s.flex}>
        <Text style={s.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}
export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Button({
  title,
  onPress,
  loading,
  disabled,
  secondary,
  danger,
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      aria-busy={loading}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        danger && s.danger,
        (disabled || loading) && s.disabled,
        pressed && { opacity: 0.75 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.deep : 'white'} />
      ) : (
        icon && (
          <Icon
            name={icon}
            color={secondary ? colors.deep : 'white'}
            size={18}
          />
        )
      )}
      <Text style={[s.buttonText, secondary && { color: colors.deep }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  label,
  name,
  onPress,
  disabled,
}: {
  label: string;
  name: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={[s.iconButton, disabled && s.disabled]}
    >
      <Icon name={name} />
    </Pressable>
  );
}
export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#7D857B"
        autoCapitalize="sentences"
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 88, textAlignVertical: 'top' },
          style,
        ]}
      />
    </View>
  );
}
export function Notice({
  message,
  error = false,
  onDismiss,
}: {
  message?: string;
  error?: boolean;
  onDismiss?: () => void;
}) {
  if (!message) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[s.notice, error && { backgroundColor: colors.dangerBg }]}
    >
      <Text style={[s.body, s.flex, error && { color: colors.danger }]}>
        {message}
      </Text>
      {onDismiss && (
        <IconButton label="Dismiss message" name="close" onPress={onDismiss} />
      )}
    </View>
  );
}
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={s.empty}>
      <ActivityIndicator color={colors.deep} />
      <Text style={s.subtitle}>{label}</Text>
    </View>
  );
}
export function Empty({
  title,
  detail,
  children,
}: PropsWithChildren<{ title: string; detail: string }>) {
  return (
    <View style={s.empty}>
      <Icon name="leaf-outline" size={38} />
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={[s.subtitle, { textAlign: 'center' }]}>{detail}</Text>
      {children}
    </View>
  );
}
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      aria-pressed={selected}
      style={[
        s.chip,
        selected && { backgroundColor: colors.deep, borderColor: colors.deep },
      ]}
    >
      <Text style={[s.label, selected && { color: 'white' }]}>{label}</Text>
    </Pressable>
  );
}
export function Confirm({
  visible,
  title,
  detail,
  busy,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  detail: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
    >
      <View style={s.scrim}>
        <View style={s.dialog} accessibilityViewIsModal>
          <Text style={s.cardTitle}>{title}</Text>
          <Text style={s.body}>{detail}</Text>
          <Button title="Confirm" onPress={onConfirm} danger loading={busy} />
          <Button title="Cancel" onPress={onCancel} secondary disabled={busy} />
        </View>
      </View>
    </Modal>
  );
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    padding: 22,
    gap: 20,
    width: '100%',
    maxWidth: 840,
    alignSelf: 'center',
    paddingBottom: 36,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.deep,
    letterSpacing: -0.8,
  },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 4 },
  body: { fontSize: 16, lineHeight: 24, color: colors.text },
  label: { fontSize: 14, fontWeight: '600', color: colors.deep },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.deep },
  card: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  button: {
    backgroundColor: colors.deep,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondary: { backgroundColor: colors.pale },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.45 },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  iconButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { gap: 8 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    backgroundColor: 'white',
    fontSize: 16,
  },
  notice: {
    backgroundColor: colors.pale,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  empty: {
    padding: 32,
    gap: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
  },
  scrim: {
    flex: 1,
    backgroundColor: '#00000066',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    backgroundColor: colors.paper,
    padding: 24,
    gap: 18,
    borderRadius: 20,
    width: '100%',
    maxWidth: 440,
  },
});
