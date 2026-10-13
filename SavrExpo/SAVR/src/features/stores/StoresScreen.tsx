import { useCallback, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useSession } from '@/state/session';
import { useResource } from '@/hooks/use-resource';
import {
  Button,
  Card,
  Heading,
  IconButton,
  Loading,
  Notice,
  Screen,
  s,
} from '@/components/savr/ui';
import StoreMap from '@/components/savr/StoreMap';
import { canonicalBrand, knownStores, storeImages } from '@/data/stores';
import { colors } from '@/theme/tokens';
import { errorMessage } from '@/services/api';
import type { KnownStore, SavedStore } from '@/models/domain';

export default function StoresScreen() {
  const { service } = useSession();
  const resource = useResource(
    useCallback((signal: AbortSignal) => service.stores(signal), [service]),
  );
  const [busy, setBusy] = useState('');
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  }>();
  const [highlighted, setHighlighted] = useState<KnownStore>();
  const [error, setError] = useState('');
  const pending = useRef(false);
  const saved = resource.data ?? [];
  const locate = async () => {
    setLocating(true);
    setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted)
        throw new Error(
          'Location access was denied. You can still choose stores from the list.',
        );
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLocating(false);
    }
  };
  const changeStore = async (
    store: KnownStore | SavedStore,
    remove = false,
  ) => {
    if (pending.current || !resource.data) return;
    if (!remove && saved.length >= 3) {
      setError('You can save up to three stores. Remove one first.');
      return;
    }
    pending.current = true;
    setBusy(store.id);
    setError('');
    try {
      if (remove) await service.removeStore(store.id);
      else await service.addStore(store as KnownStore);
      resource.setData(await service.stores());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      pending.current = false;
      setBusy('');
    }
  };
  return (
    <Screen scroll={false}>
      <FlatList
        data={knownStores}
        keyExtractor={(store) => store.id}
        contentContainerStyle={s.content}
        refreshing={resource.loading && !!resource.data}
        onRefresh={() => void resource.reload()}
        ListHeaderComponent={
          <View style={{ gap: 18 }}>
            <Heading
              title="Your stores"
              subtitle="Choose up to three grocery stores."
              action={
                <IconButton
                  label="Refresh stores"
                  name="refresh-outline"
                  onPress={() => void resource.reload()}
                />
              }
            />
            <Notice message={resource.error || error} error />
            <StoreMap
              location={location}
              selected={highlighted?.id}
              onSelect={setHighlighted}
            />
            <Button
              title="Show my location"
              icon="locate-outline"
              secondary
              loading={locating}
              onPress={() => void locate()}
            />
            <Text style={s.subtitle}>
              Map pins show representative locations for supported chains.
              Choose the stores you shop at below.
            </Text>
            {highlighted && (
              <Card style={{ backgroundColor: colors.pale }}>
                <Text style={s.cardTitle}>{highlighted.name}</Text>
                <Text style={s.body}>
                  {highlighted.address} · {highlighted.postalCode}
                </Text>
              </Card>
            )}
            <Text style={s.cardTitle}>Saved stores · {saved.length}/3</Text>
            {resource.loading && !resource.data && <Loading />}
            {saved.map((store) => (
              <View key={store.id} style={s.row}>
                <View style={s.flex}>
                  <Text style={s.label}>{store.name}</Text>
                  <Text style={s.subtitle}>{store.address}</Text>
                </View>
                <Button
                  title="Remove"
                  secondary
                  loading={busy === store.id}
                  disabled={!!busy}
                  onPress={() => void changeStore(store, true)}
                />
              </View>
            ))}
            {!saved.length && !resource.loading && (
              <Text style={s.subtitle}>
                Save stores to see their weekly flyers.
              </Text>
            )}
            <Text style={s.cardTitle}>Explore stores</Text>
          </View>
        }
        renderItem={({ item }) => {
          const selected = saved.some(
            (store) => canonicalBrand(store.brand || store.name) === item.brand,
          );
          return (
            <Card>
              <View style={s.row}>
                <Image
                  source={storeImages[item.brand]}
                  style={{ width: 64, height: 44 }}
                  contentFit="contain"
                  accessibilityLabel={item.name}
                />
                <View style={s.flex}>
                  <Text style={s.cardTitle}>{item.name}</Text>
                  <Text style={s.subtitle}>{item.address}</Text>
                  <Text style={s.subtitle}>{item.postalCode}</Text>
                </View>
              </View>
              <Button
                title={selected ? 'Saved' : 'Save store'}
                secondary={selected}
                disabled={
                  selected || saved.length >= 3 || !!busy || !resource.data
                }
                loading={busy === item.id}
                onPress={() => void changeStore(item)}
              />
            </Card>
          );
        }}
      />
    </Screen>
  );
}
