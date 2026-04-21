import { useEffect, useMemo, useRef, useState, memo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Store } from '@/components/StoreSelectionModal';
import { UserSelectedStore } from '@/services/storeService';
import { StoreCard } from './StoreCard';
import { byDistanceAsc, isStoreInSelection, extractPostalFromAddress, normalizePostal } from '@/lib/stores';

interface StoreListPanelProps {
  stores: Store[];
  selectedStores: UserSelectedStore[];
  onSelectionChange: (stores: UserSelectedStore[]) => void;
  loading: boolean;
  onUseMyLocation?: () => void;
  locationLoading?: boolean;
  userCoords?: { latitude: number; longitude: number } | null;
}

// Haversine formula to calculate distance between two points in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Convert UserSelectedStore to Store format for display
function selectedToStore(selected: UserSelectedStore, userCoords?: { latitude: number; longitude: number } | null): Store & { postal_code?: string } {
  let distance = selected.distance || 0;
  // Recalculate distance from user coordinates if available
  if (userCoords && selected.latitude && selected.longitude) {
    distance = haversineDistance(userCoords.latitude, userCoords.longitude, selected.latitude, selected.longitude);
  }
  return {
    id: selected.place_id || `selected-${selected.store_name}`,
    name: selected.store_name,
    address: selected.address,
    distance,
    place_id: selected.place_id || `selected-${selected.store_name}`,
    image_url: selected.image_url || '',
    brand: selected.brand,
    postal_code: selected.postal_code,
    coordinates: selected.latitude && selected.longitude ? {
      lat: selected.latitude,
      lon: selected.longitude
    } : undefined
  };
}

// Memoized selected stores section - completely independent of map stores
interface SelectedStoresSectionProps {
  selectedStores: UserSelectedStore[];
  onRemoveStore: (store: UserSelectedStore) => void;
  highlightedStoreIds: Set<string>;
  userCoords?: { latitude: number; longitude: number } | null;
}

const SelectedStoresSection = memo(function SelectedStoresSection({
  selectedStores,
  onRemoveStore,
  highlightedStoreIds,
  userCoords
}: SelectedStoresSectionProps) {
  const getStoreKey = (store: Store) => {
    const postal = normalizePostal((store as any).postal_code || extractPostalFromAddress(store.address));
    return (store.place_id || store.id || `${store.name}|${postal}`).toLowerCase();
  };

  if (selectedStores.length === 0) return null;

  return (
    <div className="space-y-3">
      {selectedStores.map(selected => {
        const store = selectedToStore(selected, userCoords);
        const highlight = highlightedStoreIds.has(getStoreKey(store));

        return (
          <StoreCard
            key={selected.place_id || selected.store_name}
            store={store as Store}
            isSelected={true}
            onSelect={() => onRemoveStore(selected)}
            highlight={highlight}
            isMaxReached={selectedStores.length >= 3}
          />
        );
      })}
    </div>
  );
});

export function StoreListPanel({ stores, selectedStores, onSelectionChange, loading, onUseMyLocation, locationLoading, userCoords }: StoreListPanelProps) {
  const [highlightedStoreIds, setHighlightedStoreIds] = useState<Set<string>>(new Set());
  const prevSelectedKeysRef = useRef<Set<string>>(new Set());

  const getStoreKey = (store: Store) => {
    const postal = normalizePostal((store as any).postal_code || extractPostalFromAddress(store.address));
    return (store.place_id || store.id || `${store.name}|${postal}`).toLowerCase();
  };

  const getSelectedStoreKey = (selected: UserSelectedStore) => {
    return (selected.place_id || `${selected.store_name}|${selected.postal_code || ''}`).toLowerCase();
  };

  // Handler for adding stores from unselected list
  const handleSelectStore = useCallback((store: Store) => {
    if (selectedStores.length >= 3) return;

    const newSelection: UserSelectedStore = {
      store_name: store.name,
      address: store.address,
      postal_code: (store as any).postal_code || extractPostalFromAddress(store.address),
      place_id: store.place_id,
      image_url: store.image_url,
      distance: store.distance,
      latitude: store.coordinates?.lat,
      longitude: store.coordinates?.lon,
      retailer_store_id: store.retailer_store_id,
      brand: store.brand,
    };
    onSelectionChange([...selectedStores, newSelection]);
  }, [selectedStores, onSelectionChange]);

  // Handler for removing stores from selected section
  const handleRemoveStore = useCallback((selected: UserSelectedStore) => {
    onSelectionChange(selectedStores.filter(s => {
      // Only use place_id matching if both have a truthy place_id
      if (s.place_id && selected.place_id && s.place_id === selected.place_id) {
        return false; // Remove this store
      }
      // Fallback to name + postal code matching
      if (s.store_name === selected.store_name && s.postal_code === selected.postal_code) {
        return false; // Remove this store
      }
      return true; // Keep this store
    }));
  }, [selectedStores, onSelectionChange]);

  // Track highlights for newly selected stores
  useEffect(() => {
    const currentKeys = new Set(selectedStores.map(getSelectedStoreKey));
    const prevKeys = prevSelectedKeysRef.current;

    currentKeys.forEach(key => {
      if (!prevKeys.has(key)) {
        setHighlightedStoreIds(prev => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
        setTimeout(() => {
          setHighlightedStoreIds(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }, 900);
      }
    });

    prevSelectedKeysRef.current = currentKeys;
  }, [selectedStores]);

  // Get unselected stores from the stores array
  const unselectedList = useMemo(() => {
    return stores
      .filter(store => !isStoreInSelection(store, selectedStores))
      .sort(byDistanceAsc);
  }, [stores, selectedStores]);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex-shrink-0 mb-4 space-y-2">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Nearby Stores</h3>
            {onUseMyLocation && (
              <button
                type="button"
                onClick={onUseMyLocation}
                disabled={locationLoading}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {locationLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Detecting...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    Use my location
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Select up to 3 stores to compare prices. Pan or zoom the map to explore different areas.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {/* Selected Stores Section - Memoized, only updates when selectedStores changes */}
            <SelectedStoresSection
              selectedStores={selectedStores}
              onRemoveStore={handleRemoveStore}
              highlightedStoreIds={highlightedStoreIds}
              userCoords={userCoords}
            />

            {/* Divider if both sections have items */}
            {selectedStores.length > 0 && unselectedList.length > 0 && (
              <div className="border-t pt-3" />
            )}

            {/* Unselected Stores Section - Animated */}
            <AnimatePresence mode="popLayout">
              {unselectedList.map(store => {
                const highlight = highlightedStoreIds.has(getStoreKey(store));
                return (
                  <motion.div
                    key={store.place_id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    layout
                  >
                    <StoreCard
                      store={store}
                      isSelected={false}
                      onSelect={() => handleSelectStore(store)}
                      highlight={highlight}
                      isMaxReached={selectedStores.length >= 3}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty State */}
            {stores.length === 0 && selectedStores.length === 0 && (
              <div className="text-center py-10 px-4">
                <div className="text-muted-foreground mb-2">No stores found in this area.</div>
                <p className="text-xs text-muted-foreground">
                  Try panning or zooming the map to explore a different area.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
