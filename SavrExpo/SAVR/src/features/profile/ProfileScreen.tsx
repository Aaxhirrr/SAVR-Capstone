import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/state/session';
import { useResource } from '@/hooks/use-resource';
import {
  Button,
  Card,
  Chip,
  Confirm,
  Field,
  Heading,
  IconButton,
  Loading,
  Notice,
  Screen,
  s,
} from '@/components/savr/ui';
import { errorMessage } from '@/services/api';
import { readCache, writeCache } from '@/storage/cache';
import type { Profile } from '@/models/domain';

const dietaryOptions = [
  'Gluten Free',
  'Dairy Free',
  'Nut Allergy',
  'Peanut Allergy',
  'Shellfish Allergy',
  'Vegetarian',
  'Vegan',
  'Kosher',
  'Halal',
  'Keto',
  'Paleo',
  'Diabetic',
  'Low Sodium',
  'Low FODMAP',
  'Weight Watchers',
  'Celiac Disease',
  'Pescatarian',
  'Soy Allergy',
  'Egg Allergy',
  'Low Carb',
  'High Protein',
];
const emptyProfile: Profile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  dietary: [],
  likedBrands: {},
  dislikedBrands: {},
};
type Tab = 'Account' | 'Dietary' | 'Brands' | 'Security';
export default function ProfileScreen() {
  const { service, session, profile, setProfile, signOut } = useSession();
  const userId = session?.userId ?? '';
  const resource = useResource(
    useCallback(
      async (_signal: AbortSignal) => {
        const remote = await service.profile();
        // Swift's profile response can omit address; keep the last confirmed local value.
        const cached = await readCache<Profile>(userId, 'profile').catch(
          () => null,
        );
        return { ...remote, address: remote.address || cached?.address || '' };
      },
      [service, userId],
    ),
  );
  const [draft, setDraft] = useState<Profile | null>(null);
  const form = draft ?? resource.data ?? profile ?? emptyProfile;
  const setForm = (update: (old: Profile) => Profile) =>
    setDraft((old) => update(old ?? form));
  const [tab, setTab] = useState<Tab>('Account');
  const [custom, setCustom] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmation, setConfirmation] = useState<'logout' | 'delete' | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pending = useRef(false);
  const set =
    (key: 'firstName' | 'lastName' | 'phone' | 'address') => (value: string) =>
      setForm((old) => ({ ...old, [key]: value }));
  const act = async (action: () => Promise<void>, message = '') => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await action();
      setSuccess(message);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      pending.current = false;
      setBusy(false);
      setConfirmation(null);
    }
  };
  const save = () =>
    act(async () => {
      await service.saveProfile(form);
      setProfile(form);
      resource.setData(form);
      setDraft(null);
      await writeCache(userId, 'profile', form).catch(() => {
        throw new Error(
          'Your profile was saved, but its offline copy could not be updated.',
        );
      });
    }, 'Your preferences have been saved.');
  const changePassword = () => {
    if (!currentPassword || password.length < 8) {
      setError(
        'Enter your current password and a new password of at least 8 characters.',
      );
      return;
    }
    if (password !== confirmPassword) {
      setError('Your new passwords do not match.');
      return;
    }
    void act(async () => {
      await service.changePassword(currentPassword, password);
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
    }, 'Your password has been changed.');
  };
  const toggleDietary = (value: string) =>
    setForm((old) => ({
      ...old,
      dietary: old.dietary.includes(value)
        ? old.dietary.filter((v) => v !== value)
        : [...old.dietary, value],
    }));
  return (
    <Screen>
      <Heading
        title="Made for you"
        subtitle={form.email || 'Manage your account and grocery preferences.'}
      />
      <View style={s.wrap}>
        {(['Account', 'Dietary', 'Brands', 'Security'] as const).map((t) => (
          <Chip
            key={t}
            label={t}
            selected={tab === t}
            onPress={() => setTab(t)}
          />
        ))}
      </View>
      <Notice message={resource.error || error} error />
      <Notice message={success} onDismiss={() => setSuccess('')} />
      {resource.error && (
        <Button
          title="Reload profile"
          secondary
          loading={resource.loading}
          onPress={() => void resource.reload()}
        />
      )}
      {resource.loading && !resource.data ? (
        <Loading />
      ) : (
        <>
          {tab === 'Account' && (
            <Card>
              <Text style={s.cardTitle}>Account details</Text>
              <Field
                label="First name"
                value={form.firstName}
                onChangeText={set('firstName')}
                editable={!busy}
              />
              <Field
                label="Last name"
                value={form.lastName}
                onChangeText={set('lastName')}
                editable={!busy}
              />
              <Field
                label="Phone"
                value={form.phone}
                onChangeText={set('phone')}
                keyboardType="phone-pad"
                editable={!busy}
              />
              <Field
                label="Address"
                value={form.address}
                onChangeText={set('address')}
                autoComplete="street-address"
                editable={!busy}
              />
            </Card>
          )}
          {tab === 'Dietary' && (
            <Card>
              <Text style={s.cardTitle}>What works for you?</Text>
              <Text style={s.body}>
                Choose your dietary preferences and food allergies.
              </Text>
              <View style={s.wrap}>
                {[...new Set([...dietaryOptions, ...form.dietary])].map(
                  (option) => (
                    <Chip
                      key={option}
                      label={option}
                      selected={form.dietary.includes(option)}
                      onPress={() => {
                        if (!busy) toggleDietary(option);
                      }}
                    />
                  ),
                )}
              </View>
              <Field
                label="Another preference"
                placeholder="Add your own"
                value={custom}
                onChangeText={setCustom}
                editable={!busy}
              />
              <Button
                title="Add preference"
                secondary
                disabled={!custom.trim() || busy}
                onPress={() => {
                  const value = custom.trim();
                  if (!form.dietary.includes(value)) toggleDietary(value);
                  setCustom('');
                }}
              />
            </Card>
          )}
          {tab === 'Brands' && (
            <>
              <BrandEditor
                title="Brands you like"
                entries={form.likedBrands}
                disabled={busy}
                onChange={(value) =>
                  setForm((old) => ({ ...old, likedBrands: value }))
                }
              />
              <BrandEditor
                title="Brands to avoid"
                entries={form.dislikedBrands}
                disabled={busy}
                onChange={(value) =>
                  setForm((old) => ({ ...old, dislikedBrands: value }))
                }
              />
            </>
          )}
          {tab !== 'Security' && (
            <Button
              title="Save changes"
              loading={busy}
              disabled={!resource.data}
              onPress={() => void save()}
            />
          )}
          {tab === 'Security' && (
            <>
              <Card>
                <Text style={s.cardTitle}>Change password</Text>
                <Field
                  label="Current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                  editable={!busy}
                />
                <Field
                  label="New password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  editable={!busy}
                />
                <Field
                  label="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!busy}
                />
                <Button
                  title="Update password"
                  loading={busy}
                  onPress={changePassword}
                />
              </Card>
              <Card>
                <Text style={s.cardTitle}>Account access</Text>
                <Button
                  title="Sign out"
                  secondary
                  disabled={busy}
                  onPress={() => setConfirmation('logout')}
                />
                <Button
                  title="Delete account"
                  danger
                  disabled={busy}
                  onPress={() => setConfirmation('delete')}
                />
              </Card>
            </>
          )}
        </>
      )}
      <Button title="SAVR home" secondary onPress={() => router.push('/')} />
      <Confirm
        visible={!!confirmation}
        title={
          confirmation === 'delete'
            ? 'Delete your account?'
            : 'Sign out of SAVR?'
        }
        detail={
          confirmation === 'delete'
            ? 'This permanently deletes your account. This cannot be undone.'
            : 'Your server-saved lists will be available when you sign in again. Local conversation copies will be cleared.'
        }
        busy={busy}
        onCancel={() => setConfirmation(null)}
        onConfirm={() =>
          void act(async () => {
            if (confirmation === 'delete') await service.deleteAccount();
            await signOut();
          })
        }
      />
    </Screen>
  );
}
function BrandEditor({
  title,
  entries,
  disabled,
  onChange,
}: {
  title: string;
  entries: Record<string, string>;
  disabled: boolean;
  onChange: (value: Record<string, string>) => void;
}) {
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  return (
    <Card>
      <Text style={s.cardTitle}>{title}</Text>
      {Object.entries(entries).map(([key, value]) => (
        <View key={key} style={s.row}>
          <View style={s.flex}>
            <Text style={s.label}>{value}</Text>
            <Text style={s.subtitle}>{key}</Text>
          </View>
          <IconButton
            label={'Remove ' + value}
            name="close-circle-outline"
            disabled={disabled}
            onPress={() => {
              const next = { ...entries };
              delete next[key];
              onChange(next);
            }}
          />
        </View>
      ))}
      <Field
        label="Category"
        placeholder="Dairy, bread, produce…"
        value={category}
        onChangeText={setCategory}
        editable={!disabled}
      />
      <Field
        label="Brand"
        placeholder="Brand name"
        value={brand}
        onChangeText={setBrand}
        editable={!disabled}
      />
      <Button
        title="Add brand"
        secondary
        disabled={!brand.trim() || disabled}
        onPress={() => {
          onChange({
            ...entries,
            [category.trim() || brand.trim()]: brand.trim(),
          });
          setCategory('');
          setBrand('');
        }}
      />
    </Card>
  );
}
