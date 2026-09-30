import { useCallback, useRef, useState } from 'react';
import { FlatList, Modal, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSession } from '@/state/session';
import { useResource } from '@/hooks/use-resource';
import {
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Heading,
  IconButton,
  Loading,
  Notice,
  Screen,
  s,
} from '@/components/savr/ui';
import { canonicalBrand, knownStores } from '@/data/stores';
import { dateLabel, money } from '@/theme/tokens';
import { errorMessage } from '@/services/api';
import type { DealsPage } from '@/models/domain';

export default function FlyersScreen() {
  const { service } = useSession();
  const stores = useResource(
    useCallback((signal: AbortSignal) => service.stores(signal), [service]),
  );
  const lists = useResource(
    useCallback((signal: AbortSignal) => service.lists(signal), [service]),
  );
  const [chosenBrand, setBrand] = useState('');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const brands = [
    ...new Set(
      (stores.data ?? []).map((store) =>
        canonicalBrand(store.brand || store.name),
      ),
    ),
  ];
  const brand = brands.includes(chosenBrand) ? chosenBrand : (brands[0] ?? '');
  const deals = useResource(
    useCallback(
      async (signal: AbortSignal): Promise<DealsPage> =>
        brand
          ? service.deals(brand, search, page, signal)
          : { deals: [], total: 0, page: 1, pageSize: 30 },
      [service, brand, search, page],
    ),
  );
  const [selection, setSelection] = useState<{
    brand: string;
    ids: Set<string>;
  }>({ brand: '', ids: new Set() });
  const checked = selection.brand === brand ? selection.ids : new Set<string>();
  const setChecked = (
    update: Set<string> | ((old: Set<string>) => Set<string>),
  ) =>
    setSelection((old) => ({
      brand,
      ids:
        typeof update === 'function'
          ? update(old.brand === brand ? old.ids : new Set())
          : update,
    }));
  const [picking, setPicking] = useState(false);
  const [listId, setListId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pending = useRef(false);
  const toggle = (id: string) =>
    setChecked((old) => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const add = async () => {
    if (pending.current || !listId) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await service.addDeals([...checked], listId);
      setChecked(new Set());
      setPicking(false);
      setSuccess('Deals added to your grocery list.');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const refresh = () => {
    void stores.reload();
    void deals.reload();
  };
  return (
    <Screen scroll={false}>
      <FlatList
        data={deals.loading ? [] : (deals.data?.deals ?? [])}
        keyExtractor={(deal) => deal.id}
        contentContainerStyle={s.content}
        refreshing={deals.loading && !!deals.data}
        onRefresh={refresh}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <Heading
              title="Fresh deals"
              subtitle="Your weekly flyers, all in one place."
              action={
                <IconButton
                  label="Refresh flyers"
                  name="refresh-outline"
                  onPress={refresh}
                />
              }
            />
            <Notice
              message={stores.error || deals.error || (!picking ? error : '')}
              error
            />
            <Notice message={success} onDismiss={() => setSuccess('')} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {brands.map((value) => (
                <Chip
                  key={value}
                  label={
                    knownStores.find((s) => s.brand === value)?.name ?? value
                  }
                  selected={brand === value}
                  onPress={() => {
                    setBrand(value);
                    setPage(1);
                    setChecked(new Set());
                  }}
                />
              ))}
            </ScrollView>
            {!!brand && (
              <>
                <Field
                  label="Search this flyer"
                  placeholder="Milk, apples, cheese…"
                  value={input}
                  onChangeText={setInput}
                  returnKeyType="search"
                  onSubmitEditing={() => {
                    setSearch(input.trim());
                    setPage(1);
                    setChecked(new Set());
                  }}
                />
                <Button
                  title="Search deals"
                  secondary
                  onPress={() => {
                    setSearch(input.trim());
                    setPage(1);
                    setChecked(new Set());
                  }}
                />
              </>
            )}
            {checked.size > 0 && (
              <Button
                title={
                  'Add ' +
                  checked.size +
                  ' deal' +
                  (checked.size > 1 ? 's' : '') +
                  ' to a list'
                }
                icon="add"
                onPress={() => {
                  setPicking(true);
                  setListId('');
                  setError('');
                  void lists.reload();
                }}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          stores.loading || deals.loading ? (
            <Loading />
          ) : (
            <Empty
              title={brand ? 'No deals found.' : 'Pick your stores first.'}
              detail={
                brand
                  ? 'Try another search or check back for new flyers.'
                  : 'Save up to three stores to browse their weekly flyers.'
              }
            >
              {!brand && (
                <Button
                  title="Choose stores"
                  onPress={() => router.push('/(tabs)/stores')}
                />
              )}
            </Empty>
          )
        }
        renderItem={({ item }) => (
          <Card>
            {!!item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={{ height: 156, width: '100%' }}
                contentFit="contain"
                accessibilityLabel={item.name}
              />
            )}
            <Text style={s.cardTitle}>{item.name}</Text>
            {!!item.brand && <Text style={s.subtitle}>{item.brand}</Text>}
            <Text style={s.title}>
              {item.prePriceText}{' '}
              {item.priceFloat !== undefined
                ? money(item.priceFloat)
                : item.price}{' '}
              <Text style={s.subtitle}>{item.postPriceText}</Text>
            </Text>
            {item.originalPrice !== undefined && (
              <Text
                style={[s.subtitle, { textDecorationLine: 'line-through' }]}
              >
                {money(item.originalPrice)}
              </Text>
            )}
            {!!item.saleStory && <Text style={s.body}>{item.saleStory}</Text>}
            <Text style={s.subtitle}>
              {[dateLabel(item.validFrom), dateLabel(item.validTo)]
                .filter(Boolean)
                .join(' – ')}
            </Text>
            <Button
              title={checked.has(item.id) ? 'Selected ✓' : 'Select deal'}
              secondary={!checked.has(item.id)}
              onPress={() => toggle(item.id)}
            />
          </Card>
        )}
        ListFooterComponent={
          brand && deals.data && deals.data.total > 0 ? (
            <View style={s.row}>
              <Button
                title="Previous"
                secondary
                disabled={page <= 1 || deals.loading}
                onPress={() => setPage((p) => p - 1)}
              />
              <Text style={[s.label, s.flex, { textAlign: 'center' }]}>
                Page {page}
              </Text>
              <Button
                title="Next"
                secondary
                disabled={
                  page * deals.data.pageSize >= deals.data.total ||
                  deals.loading
                }
                onPress={() => setPage((p) => p + 1)}
              />
            </View>
          ) : null
        }
      />
      <Modal
        visible={picking}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setPicking(false);
        }}
      >
        <View style={s.scrim}>
          <View style={[s.dialog, { maxHeight: '85%' }]}>
            <Text style={s.cardTitle}>Choose a grocery list</Text>
            <Notice message={error || lists.error} error />
            {lists.loading ? (
              <Loading />
            ) : (
              <ScrollView contentContainerStyle={{ gap: 10 }}>
                {(lists.data ?? []).map((list) => (
                  <Chip
                    key={list.id}
                    label={list.name}
                    selected={listId === list.id}
                    onPress={() => {
                      if (!busy) setListId(list.id);
                    }}
                  />
                ))}
                {!lists.data?.length && (
                  <Text style={s.body}>
                    Create a list in Chat before adding flyer deals.
                  </Text>
                )}
              </ScrollView>
            )}
            <Button
              title="Add selected deals"
              disabled={!listId || lists.loading}
              loading={busy}
              onPress={() => void add()}
            />
            <Button
              title="Cancel"
              secondary
              disabled={busy}
              onPress={() => setPicking(false)}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
