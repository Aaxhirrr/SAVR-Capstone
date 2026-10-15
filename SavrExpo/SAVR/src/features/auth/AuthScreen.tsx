import { useRef, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import {
  Button,
  Card,
  Field,
  Heading,
  Notice,
  Screen,
  s,
} from '@/components/savr/ui';
import { useSession } from '@/state/session';
import { errorMessage } from '@/services/api';
import type { Signup } from '@/models/domain';

const initial: Signup = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  street: '',
  city: '',
  province: '',
  postal: '',
};
export default function AuthScreen({ signup = false }: { signup?: boolean }) {
  const { session, signIn, signUp } = useSession();
  const [form, setForm] = useState(initial);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const set = (key: keyof Signup) => (value: string) =>
    setForm((old) => ({ ...old, [key]: value }));
  const submit = async () => {
    if (pending.current) return;
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password.');
      return;
    }
    if (
      signup &&
      (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ||
        form.password.length < 8)
    ) {
      setError('Enter a valid email and a password of at least 8 characters.');
      return;
    }
    if (signup && form.password !== confirm) {
      setError('Your passwords do not match.');
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      if (signup) await signUp(form);
      else await signIn(form.email, form.password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  if (session) return <Redirect href="/(tabs)/chat" />;
  return (
    <Screen>
      <Heading
        title={signup ? 'Good food. Better savings.' : 'Welcome back.'}
        subtitle={
          signup
            ? 'Create your free SAVR account.'
            : 'Your next grocery trip starts here.'
        }
      />
      <Card>
        <Field
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!busy}
        />
        <Field
          label="Password"
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={signup ? 'new-password' : 'current-password'}
          editable={!busy}
          onSubmitEditing={() => {
            if (!signup) void submit();
          }}
        />
        {signup && (
          <>
            <Field
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              editable={!busy}
            />
            <Text style={s.cardTitle}>
              About you <Text style={s.subtitle}>(optional)</Text>
            </Text>
            <Field
              label="First name"
              value={form.firstName}
              onChangeText={set('firstName')}
              autoComplete="given-name"
              editable={!busy}
            />
            <Field
              label="Last name"
              value={form.lastName}
              onChangeText={set('lastName')}
              autoComplete="family-name"
              editable={!busy}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChangeText={set('phone')}
              keyboardType="phone-pad"
              autoComplete="tel"
              editable={!busy}
            />
            <Field
              label="Street address"
              value={form.street}
              onChangeText={set('street')}
              autoComplete="street-address"
              editable={!busy}
            />
            <Field
              label="City"
              value={form.city}
              onChangeText={set('city')}
              editable={!busy}
            />
            <View style={s.row}>
              <View style={s.flex}>
                <Field
                  label="Province"
                  placeholder="Ontario"
                  value={form.province}
                  onChangeText={set('province')}
                  editable={!busy}
                />
              </View>
              <View style={s.flex}>
                <Field
                  label="Postal code"
                  placeholder="A1A 1A1"
                  autoCapitalize="characters"
                  value={form.postal}
                  onChangeText={set('postal')}
                  editable={!busy}
                />
              </View>
            </View>
          </>
        )}
        <Notice message={error} error />
        <Button
          title={signup ? 'Create account' : 'Sign in'}
          loading={busy}
          onPress={() => void submit()}
        />
      </Card>
      <Button
        title={
          signup
            ? 'Already have an account? Sign in'
            : 'New to SAVR? Create an account'
        }
        secondary
        disabled={busy}
        onPress={() => router.replace(signup ? '/sign-in' : '/sign-up')}
      />
    </Screen>
  );
}
