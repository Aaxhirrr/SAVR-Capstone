import { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, List as ListIcon } from 'lucide-react';
import { StoreListPanel } from './StoreListPanel';
import { StoreMapPanel, MapBounds } from './StoreMapPanel';
import { UserSelectedStore } from '@/services/storeService';
import { Store } from '@/components/StoreSelectionModal';
import storeService from '@/services/storeService';
import { byDistanceAsc } from '@/lib/stores';

interface StoreSelectorLayoutProps {
  selectedStores: UserSelectedStore[];
  onSelectionChange: (stores: UserSelectedStore[]) => void;
}

// Haversine formula to calculate distance between two points in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Read cached coords from localStorage synchronously (no async wait)
function getCachedCoords(): { latitude: number; longitude: number } | null {
  try {
    const cached = localStorage.getItem('user_coords');
    if (cached) {
      const { lat, lon } = JSON.parse(cached);
      if (lat && lon) return { latitude: lat, longitude: lon };
    }
  } catch { /* ignore */ }
  return null;
}

export function StoreSelectorLayout({ selectedStores, onSelectionChange }: StoreSelectorLayoutProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapStores, setMapStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(null);
  // Initialize with cached coords so map + store fetch can start immediately
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(getCachedCoords);
  const [locationLoading, setLocationLoading] = useState(false);
  const [autoZoomBounds, setAutoZoomBounds] = useState<MapBounds | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoZoomPending = useRef(true); // true on initial load and after "Use my location"
  // Store the initial selected stores for fitting map bounds on first load
  const initialSelectedStoresRef = useRef<UserSelectedStore[]>(selectedStores);
  // Track whether we've already done an initial store fetch (before map bounds)
  const didInitialFetch = useRef(false);

  // Fetch user coordinates on mount (updates cache for next time)
  useEffect(() => {
    const fetchUserCoords = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        if (!user.address) return;

        const addressString = `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.province || ''}, ${user.address.postalCode || ''}, Canada`;
        const coords = await storeService.getCoordinatesFromAddress(addressString);
        // Cache for instant access next time
        localStorage.setItem('user_coords', JSON.stringify({ lat: coords.latitude, lon: coords.longitude }));
        setUserCoords(coords);
      } catch (e) {
        console.error("Failed to fetch user coordinates");
      }
    };

    fetchUserCoords();
  }, []);

  // Pre-fetch stores immediately based on coords (don't wait for map bounds)
  useEffect(() => {
    if (!userCoords || didInitialFetch.current) return;
    didInitialFetch.current = true;

    const fetchInitialStores = async () => {
      setLoading(true);
      try {
        const stores = await storeService.getNearbyStoresFromDB({
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          radius: 15000, // 15km — roughly matches DEFAULT_ZOOM=11
        });
        setMapStores(stores.sort(byDistanceAsc));
        setIsInitialLoad(false);
      } catch (e) {
        console.error("Failed to pre-fetch stores");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialStores();
  }, [userCoords]);

  // Use browser geolocation to re-center map on user's actual position
  const handleUseMyLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });
      const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      autoZoomPending.current = true;
      setUserCoords(coords);
      localStorage.setItem('user_coords', JSON.stringify({ lat: coords.latitude, lon: coords.longitude }));
    } catch (err) {
      console.error('[StoreSelector] Geolocation error:');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // Debounce bounds changes - update debouncedBounds 200ms after user stops moving map
  useEffect(() => {
    if (!mapBounds) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedBounds(mapBounds);
    }, 200);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [mapBounds]);

  // Fetch stores when debounced bounds change
  useEffect(() => {
    if (!debouncedBounds) return;

    const fetchStores = async () => {
      setLoading(true);
      try {
        // Calculate center of bounds
        const centerLat = (debouncedBounds.minLat + debouncedBounds.maxLat) / 2;
        const centerLon = (debouncedBounds.minLon + debouncedBounds.maxLon) / 2;

        // Calculate radius as distance from center to corner (in meters)
        const radiusKm = haversineDistance(
          centerLat, centerLon,
          debouncedBounds.maxLat, debouncedBounds.maxLon
        );
        const radiusMeters = Math.ceil(radiusKm * 1000);

        // Pad bounds by 30% so stores near edges don't vanish on small pans
        const latPad = (debouncedBounds.maxLat - debouncedBounds.minLat) * 0.3;
        const lonPad = (debouncedBounds.maxLon - debouncedBounds.minLon) * 0.3;

        // Try the new bounds endpoint first, fall back to radius-based
        let stores: Store[];
        try {
          stores = await storeService.getStoresInBounds({
            min_lat: debouncedBounds.minLat - latPad,
            max_lat: debouncedBounds.maxLat + latPad,
            min_lon: debouncedBounds.minLon - lonPad,
            max_lon: debouncedBounds.maxLon + lonPad,
            limit: 100
          });
        } catch {
          // Fall back to radius-based search using existing endpoint
          stores = await storeService.getNearbyStoresFromDB({
            latitude: centerLat,
            longitude: centerLon,
            radius: Math.min(radiusMeters * 1.3, 50000) // Cap at 50km
          });
        }

        setMapStores(stores.sort(byDistanceAsc));
        setIsInitialLoad(false); // First successful load complete

        // Auto-zoom: if too few stores and we have user coords, fetch wider and zoom out
        const MIN_STORES = 10;
        if (autoZoomPending.current && stores.length < MIN_STORES && userCoords) {
          autoZoomPending.current = false;
          try {
            const widerStores = await storeService.getNearbyStoresFromDB({
              latitude: userCoords.latitude,
              longitude: userCoords.longitude,
              radius: 200000, // 200km
              limit: 15
            });
            if (widerStores.length > stores.length) {
              // Compute bounding box that fits all wider stores + user location
              let minLat = userCoords.latitude, maxLat = userCoords.latitude;
              let minLon = userCoords.longitude, maxLon = userCoords.longitude;
              for (const s of widerStores) {
                if (s.coordinates) {
                  minLat = Math.min(minLat, s.coordinates.lat);
                  maxLat = Math.max(maxLat, s.coordinates.lat);
                  minLon = Math.min(minLon, s.coordinates.lon);
                  maxLon = Math.max(maxLon, s.coordinates.lon);
                }
              }
              setAutoZoomBounds({ minLat, maxLat, minLon, maxLon });
            }
          } catch (e) {
            console.error('Auto-zoom wider fetch failed:');
          }
        } else if (stores.length >= MIN_STORES) {
          autoZoomPending.current = false;
        }
      } catch (e) {
        console.error("Failed to fetch stores");
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [debouncedBounds]);

  // Memoized handler for when map bounds change
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

  // Mobile View Toggle
  const MobileViewToggle = () => (
    <div className="md:hidden w-full px-4 py-2 bg-background border-b z-10">
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'map')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list"><ListIcon className="w-4 h-4 mr-2"/> List</TabsTrigger>
          <TabsTrigger value="map"><MapPin className="w-4 h-4 mr-2"/> Map</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full relative">
      <MobileViewToggle />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - List View */}
        <div className={`
          w-full md:w-[400px] flex-shrink-0 border-r bg-background flex flex-col transition-transform duration-300 absolute md:relative h-full z-10
          ${viewMode === 'map' ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
        `}>
          <StoreListPanel
            stores={mapStores}
            selectedStores={selectedStores}
            onSelectionChange={onSelectionChange}
            loading={isInitialLoad && loading}
            onUseMyLocation={handleUseMyLocation}
            locationLoading={locationLoading}
            userCoords={userCoords}
          />
        </div>

        {/* Right Panel - Map View */}
        <div className={`
          flex-1 relative h-full w-full transition-transform duration-300 absolute md:relative
           ${viewMode === 'list' ? 'translate-x-full md:translate-x-0' : 'translate-x-0'}
        `}>
          <StoreMapPanel
            stores={mapStores}
            selectedStores={selectedStores}
            onSelectionChange={onSelectionChange}
            userCoords={userCoords}
            onBoundsChange={handleBoundsChange}
            initialSelectedStores={initialSelectedStoresRef.current}
            autoZoomBounds={autoZoomBounds}
          />
        </div>
      </div>
    </div>
  );
}
