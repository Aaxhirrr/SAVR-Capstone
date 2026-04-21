import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Store } from '@/components/StoreSelectionModal';
import { UserSelectedStore } from '@/services/storeService';
import useMapboxToken from '@/hooks/useMapboxToken';
import { getStoreLogo } from '@/utils/storeBrandAssets';
import { matchesStore, isStoreInSelection, extractPostalFromAddress } from '@/lib/stores';

const MAP_STYLE =
  import.meta.env.VITE_MAPBOX_STYLE?.trim() || 'mapbox://styles/mapbox/streets-v12';

// Default zoom level - 12 shows roughly 5-8km area (neighborhood level)
const DEFAULT_ZOOM = 11;

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

interface StoreMapPanelProps {
  stores: Store[];
  selectedStores: UserSelectedStore[];
  onSelectionChange: (stores: UserSelectedStore[]) => void;
  userCoords?: { latitude: number; longitude: number } | null;
  onBoundsChange?: (bounds: MapBounds) => void;
  initialSelectedStores?: UserSelectedStore[]; // For fitting bounds on first load
  autoZoomBounds?: MapBounds | null; // When set, map will fitBounds to these bounds
}

export function StoreMapPanel({
  stores,
  selectedStores,
  onSelectionChange,
  userCoords,
  onBoundsChange,
  initialSelectedStores,
  autoZoomBounds
}: StoreMapPanelProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerMap = useRef<Map<string, { marker: mapboxgl.Marker; element: HTMLDivElement; store: Store }>>(new Map());
  const homeMarker = useRef<mapboxgl.Marker | null>(null);
  const mapboxToken = useMapboxToken();

  // Use refs for callbacks and state to avoid re-initialization
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const selectedStoresRef = useRef(selectedStores);
  const initialSelectedStoresRef = useRef(initialSelectedStores);
  const userCoordsRef = useRef(userCoords);
  const isFirstLoad = useRef(true);
  const isUpdatingMarkers = useRef(false);
  const hasInitializedView = useRef(false);

  // Keep refs up to date
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    selectedStoresRef.current = selectedStores;
  }, [selectedStores]);

  useEffect(() => {
    userCoordsRef.current = userCoords;
  }, [userCoords]);

  // Helper to report bounds
  const reportBounds = () => {
    if (!map.current || !onBoundsChangeRef.current || isUpdatingMarkers.current) return;

    const bounds = map.current.getBounds();
    if (!bounds) return;

    onBoundsChangeRef.current({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLon: bounds.getWest(),
      maxLon: bounds.getEast()
    });
  };

  // Initialize Map - only depends on mapboxToken
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    if (map.current) return; // Already initialized

    mapboxgl.accessToken = mapboxToken;

    // Use user coords if available, otherwise fall back to Toronto
    const coords = userCoordsRef.current;
    const initialCenter: [number, number] = coords
      ? [coords.longitude, coords.latitude]
      : [-79.3832, 43.6532]; // Toronto fallback

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: initialCenter,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    // If we already have coords, mark view as initialized immediately
    if (coords) {
      hasInitializedView.current = true;
    }

    map.current.on('error', (_e) => {
      console.error('Mapbox error:');
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: '© Mapbox © OpenStreetMap'
      }),
      'bottom-right'
    );

    // Report bounds after map loads
    map.current.on('load', () => {
      if (hasInitializedView.current) {
        // View was set at init time with coords — just report bounds
        const initialStores = initialSelectedStoresRef.current;
        if (initialStores && initialStores.length > 0) {
          const c = userCoordsRef.current!;
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([c.longitude, c.latitude]);
          initialStores.forEach(store => {
            if (store.latitude && store.longitude) {
              bounds.extend([store.longitude, store.latitude]);
            }
          });
          map.current?.fitBounds(bounds, {
            padding: 80,
            maxZoom: DEFAULT_ZOOM,
            duration: 0
          });
        }
        setTimeout(() => {
          reportBounds();
          isFirstLoad.current = false;
        }, 50);
      }
      // If no coords yet, we'll handle it in the userCoords effect
    });

    // Listen for map movement (pan/zoom)
    map.current.on('moveend', () => {
      if (!isUpdatingMarkers.current && !isFirstLoad.current) {
        reportBounds();
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]); // Only re-initialize if token changes

  // Handle userCoords changes - fly to location when coords arrive
  useEffect(() => {
    if (!map.current || !userCoords) return;

    // If map hasn't loaded yet, wait
    if (!map.current.loaded()) {
      map.current.on('load', () => {
        if (!hasInitializedView.current && userCoords) {
          hasInitializedView.current = true;

          const initialStores = initialSelectedStoresRef.current;
          if (initialStores && initialStores.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            bounds.extend([userCoords.longitude, userCoords.latitude]);

            initialStores.forEach(store => {
              if (store.latitude && store.longitude) {
                bounds.extend([store.longitude, store.latitude]);
              }
            });

            map.current?.fitBounds(bounds, {
              padding: 80,
              maxZoom: DEFAULT_ZOOM,
              duration: 0
            });
          } else {
            map.current?.jumpTo({
              center: [userCoords.longitude, userCoords.latitude],
              zoom: DEFAULT_ZOOM,
            });
          }

          setTimeout(() => {
            reportBounds();
            isFirstLoad.current = false;
          }, 50);
        }
      });
      return;
    }

    // Map is loaded - jump to coords if we haven't initialized view yet
    if (!hasInitializedView.current) {
      hasInitializedView.current = true;

      const initialStores = initialSelectedStoresRef.current;
      if (initialStores && initialStores.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([userCoords.longitude, userCoords.latitude]);

        initialStores.forEach(store => {
          if (store.latitude && store.longitude) {
            bounds.extend([store.longitude, store.latitude]);
          }
        });

        map.current.fitBounds(bounds, {
          padding: 80,
          maxZoom: DEFAULT_ZOOM,
          duration: 0
        });
      } else {
        map.current.jumpTo({
          center: [userCoords.longitude, userCoords.latitude],
          zoom: DEFAULT_ZOOM,
        });
      }

      setTimeout(() => {
        reportBounds();
        isFirstLoad.current = false;
      }, 50);
    } else {
      // Already initialized - fly to new location (e.g. "Use my location" was clicked)
      map.current.flyTo({
        center: [userCoords.longitude, userCoords.latitude],
        zoom: DEFAULT_ZOOM,
        duration: 800
      });

      setTimeout(() => {
        reportBounds();
      }, 850);
    }
  }, [userCoords]);

  // Helper to apply marker styles based on selection state
  const applyMarkerStyles = (el: HTMLDivElement, isSelected: boolean, isMaxReached: boolean) => {
    const isDisabled = !isSelected && isMaxReached;
    el.style.width = isSelected ? '64px' : '52px';
    el.style.height = isSelected ? '40px' : '32px';
    el.style.padding = isSelected ? '6px' : '5px';
    el.style.border = isSelected ? '3px solid #16a34a' : '1px solid #e2e8f0';
    el.style.boxShadow = isSelected ? '0 4px 12px rgba(22, 163, 74, 0.4)' : '0 2px 4px rgba(0,0,0,0.2)';
    el.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
    el.style.zIndex = isSelected ? '10' : '1';
    el.title = isDisabled ? 'Max 3 stores. Uncheck one to add this store.' : '';
  };

  // Update store markers when stores array changes
  useEffect(() => {
    if (!map.current) return;

    isUpdatingMarkers.current = true;

    const currentPlaceIds = new Set(stores.map(s => s.place_id).filter(Boolean));

    // Remove markers that are no longer in the stores array
    markerMap.current.forEach((entry, placeId) => {
      if (!currentPlaceIds.has(placeId)) {
        entry.marker.remove();
        markerMap.current.delete(placeId);
      }
    });

    // Add or update markers
    stores.forEach((store) => {
      if (!store.coordinates || !store.place_id) return;

      const existing = markerMap.current.get(store.place_id);
      if (existing) {
        // Marker already exists - just update selection styles
        const isSelected = isStoreInSelection(store, selectedStoresRef.current);
        const isMaxReached = selectedStoresRef.current.length >= 3;
        applyMarkerStyles(existing.element, isSelected, isMaxReached);
        return;
      }

      // Create new marker
      const logo = getStoreLogo(store.brand || store.name);
      const isSelected = isStoreInSelection(store, selectedStoresRef.current);
      const isMaxReached = selectedStoresRef.current.length >= 3;

      const el = document.createElement('div');
      el.className = 'store-marker';
      el.style.backgroundImage = `url(${logo})`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      el.style.backgroundOrigin = 'content-box';
      el.style.backgroundColor = 'white';
      el.style.borderRadius = '999px';

      applyMarkerStyles(el, isSelected, isMaxReached);

      // Click handler uses refs to get current state
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentSelected = selectedStoresRef.current;
        const isCurrentlySelected = isStoreInSelection(store, currentSelected);

        if (isCurrentlySelected) {
          onSelectionChangeRef.current(currentSelected.filter(s => !matchesStore(store, s)));
        } else {
          if (currentSelected.length >= 3) return;

          const newSelection: UserSelectedStore = {
            store_name: store.name,
            address: store.address,
            postal_code: (store as any).postal_code || extractPostalFromAddress(store.address),
            place_id: store.place_id,
            image_url: store.image_url,
            distance: store.distance,
            latitude: store.coordinates?.lat,
            longitude: store.coordinates?.lon,
            brand: store.brand,
          };
          onSelectionChangeRef.current([...currentSelected, newSelection]);
        }
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([store.coordinates.lon, store.coordinates.lat])
        .addTo(map.current!);

      markerMap.current.set(store.place_id, { marker, element: el, store });
    });

    isUpdatingMarkers.current = false;
  }, [stores]); // Only recreate when stores change

  // Update marker styles when selection changes (without recreating markers)
  useEffect(() => {
    const isMaxReached = selectedStores.length >= 3;

    markerMap.current.forEach((entry) => {
      const isSelected = isStoreInSelection(entry.store, selectedStores);
      applyMarkerStyles(entry.element, isSelected, isMaxReached);
    });
  }, [selectedStores]);

  // Update home marker when userCoords changes
  useEffect(() => {
    if (!map.current) return;

    // Remove existing home marker
    if (homeMarker.current) {
      homeMarker.current.remove();
      homeMarker.current = null;
    }

    // Add new home marker if we have coords
    if (userCoords) {
      homeMarker.current = new mapboxgl.Marker({ color: '#2563eb' })
        .setLngLat([userCoords.longitude, userCoords.latitude])
        .addTo(map.current);
    }
  }, [userCoords]);

  // Auto-zoom: when parent signals we need to zoom out to show more stores
  useEffect(() => {
    if (!map.current || !autoZoomBounds) return;

    const bounds = new mapboxgl.LngLatBounds(
      [autoZoomBounds.minLon, autoZoomBounds.minLat],
      [autoZoomBounds.maxLon, autoZoomBounds.maxLat]
    );

    map.current.fitBounds(bounds, {
      padding: 60,
      maxZoom: DEFAULT_ZOOM,
      duration: 800
    });
  }, [autoZoomBounds]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <style>{`
        .mapboxgl-map,
        .mapboxgl-canvas-container,
        .mapboxgl-canvas {
          width: 100% !important;
          height: 100% !important;
        }
        .mapboxgl-ctrl-logo,
        .mapboxgl-ctrl-bottom-left {
          display: none !important;
        }
        .mapboxgl-ctrl-attrib,
        .mapboxgl-ctrl-attrib.mapboxgl-compact,
        .mapboxgl-ctrl-attrib.mapboxgl-compact-show {
          background: transparent !important;
          background-color: transparent !important;
          font-size: 10px !important;
          padding: 0 5px !important;
          margin: 0 !important;
          min-height: 0 !important;
          box-shadow: none !important;
        }
        .mapboxgl-ctrl-attrib.mapboxgl-compact::after,
        .mapboxgl-ctrl-attrib.mapboxgl-compact-show::after {
          display: none !important;
        }
        .mapboxgl-ctrl-attrib-button {
          display: none !important;
        }
        .mapboxgl-ctrl-attrib a,
        .mapboxgl-ctrl-attrib-inner {
          color: rgba(0, 0, 0, 0.35) !important;
        }
        .mapboxgl-ctrl-bottom-right,
        .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl {
          background: transparent !important;
          background-color: transparent !important;
          box-shadow: none !important;
        }
        /* Target any element with mapbox gray background */
        [class*="mapboxgl-ctrl"] {
          background-color: transparent !important;
        }
      `}</style>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
