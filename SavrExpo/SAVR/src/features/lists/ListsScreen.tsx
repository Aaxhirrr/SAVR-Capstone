import { useCallback, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/state/session';
import { useResource } from '@/hooks/use-resource';
import {
  Button,
  Card,
  Confirm,
  Empty,
  Field,
  Heading,
  Icon,
  IconButton,
  Loading,
  Notice,
  Screen,
  s,
} from '@/components/savr/ui';
import { dateLabel, money } from '@/theme/tokens';
import { errorMessage } from '@/services/api';
import type { GroceryList } from '@/models/domain';
import { removeCache } from '@/storage/cache';

export default function ListsScreen() {
  const { service, session } = useSession();
  const resource = useResource(
    useCallback((signal: AbortSignal) => service.lists(signal), [service]),
  );
  const [target, setTarget] = useState<GroceryList | null>(null);
  const [renaming, setRenaming] = useState<GroceryList | null>(null);
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const remove = async () => {
    if (!target || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await service.deleteList(target.id);
      resource.setData((old) => old?.filter((l) => l.id !== target.id) ?? []);
      if (session)
        await removeCache(session.userId, 'chat.list.' + target.id).catch(
          () => {},
        );
      setTarget(null);
    } catch (e) {
      setTarget(null);
      setError(errorMessage(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <Screen scroll={false}>
      <FlatList
        data={resource.data ?? []}
        keyExtractor={(l) => l.id}
        contentContainerStyle={s.content}
        refreshing={resource.loading && !!resource.data}
        onRefresh={() => void resource.reload()}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <Heading
              title="My lists"
              subtitle="A little planning. A lot less guesswork."
              action={
                <IconButton
                  label="Refresh lists"
                  name="refresh-outline"
                  onPress={() => void resource.reload()}
                />
              }
            />
            <Button
              title="Build a list with SAVR"
              icon="add"
              onPress={() => router.push('/(tabs)/chat')}
            />
            <Notice message={resource.error || error} error />
          </View>
        }
        ListEmptyComponent={
          resource.loading ? (
            <Loading />
          ) : (
            <Empty
              title="Your next shop starts here."
              detail="Ask SAVR to create a grocery list, then find it here."
            />
          )
        }
        renderItem={({ item }) => (
          <Card>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Open ' + item.name}
              onPress={() =>
                router.push({
                  pathname: '/lists/[id]',
                  params: { id: item.id },
                })
              }
            >
              <View style={s.row}>
                <Icon name="receipt-outline" />
                <Text style={[s.cardTitle, s.flex]}>
                  {aliases[item.id] || item.name}
                </Text>
                <Icon name="chevron-forward" />
              </View>
              <Text style={s.subtitle}>
                {item.items.length} items ·{' '}
                {dateLabel(item.createdAt) || 'Saved list'}
              </Text>
              {item.savings !== undefined && item.savings > 0 && (
                <Text style={s.label}>
                  Potential savings {money(item.savings)}
                </Text>
              )}
            </Pressable>
            <View style={s.row}>
              <View style={s.flex}>
                <Button
                  title="Rename"
                  secondary
                  onPress={() => {
                    setRenaming(item);
                    setName(aliases[item.id] || item.name);
                  }}
                />
              </View>
              <IconButton
                label={'Delete ' + item.name}
                name="trash-outline"
                onPress={() => setTarget(item)}
              />
            </View>
          </Card>
        )}
      />
      <Confirm
        visible={!!target}
        title="Delete this list?"
        detail="This permanently removes the list from your account."
        busy={busy}
        onCancel={() => setTarget(null)}
        onConfirm={() => void remove()}
      />
      <Modal
        visible={!!renaming}
        transparent
        animationType="fade"
        onRequestClose={() => setRenaming(null)}
      >
        <View style={s.scrim}>
          <View style={s.dialog}>
            <Field label="List name" value={name} onChangeText={setName} />
            <Text style={s.subtitle}>
              This display name lasts until you close the app. The saved list
              name stays the same.
            </Text>
            <Button
              title="Rename"
              disabled={!name.trim()}
              onPress={() => {
                if (renaming)
                  setAliases((old) => ({ ...old, [renaming.id]: name.trim() }));
                setRenaming(null);
              }}
            />
            <Button
              title="Cancel"
              secondary
              onPress={() => setRenaming(null)}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
