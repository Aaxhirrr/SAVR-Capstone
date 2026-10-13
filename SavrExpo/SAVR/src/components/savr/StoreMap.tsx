import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import MapView, { Marker } from 'react-native-maps';
import { knownStores } from '@/data/stores';
import type { KnownStore } from '@/models/domain';
import { Notice } from './ui';
import { colors } from '@/theme/tokens';

type Props = {
  location?: { latitude: number; longitude: number };
  selected?: string;
  onSelect: (store: KnownStore) => void;
};
export default function StoreMap({ location, selected, onSelect }: Props) {
  const map = useRef<MapView>(null);
  useEffect(() => {
    if (location)
      map.current?.animateToRegion({
        ...location,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
      });
  }, [location]);
  if (
    Platform.OS === 'android' &&
    !Constants.expoConfig?.extra?.androidMapsConfigured
  )
    return (
      <Notice message="The map is unavailable in this build. You can choose and save stores below." />
    );
  return (
    <MapView
      ref={map}
      style={{ height: 260, borderRadius: 20 }}
      showsUserLocation={!!location}
      initialRegion={{
        latitude: 43.7,
        longitude: -79.4,
        latitudeDelta: 0.55,
        longitudeDelta: 0.55,
      }}
    >
      {knownStores.map((store) => (
        <Marker
          key={store.id}
          coordinate={store}
          title={store.name}
          description={store.address}
          pinColor={selected === store.id ? colors.deep : '#B98432'}
          onPress={() => onSelect(store)}
        />
      ))}
    </MapView>
  );
}
