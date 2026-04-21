import { useState, useEffect, useMemo, useRef } from 'react';
// import type { GeoJSON } from 'geojson';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Star, Navigation, ExternalLink, X, ChevronDown, RefreshCw } from 'lucide-react';
import storeService, { UserSelectedStore } from '@/services/storeService';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { byDistanceAsc } from '@/lib/stores';
import { getCachedStores, setCachedStores, clearStoreCache } from '@/lib/storeCache';
import StoreMiniMap from '@/components/StoreMiniMap';
import useMapboxToken from '@/hooks/useMapboxToken';
import { cn } from '@/lib/utils';

// Define the Store interface (same as StoresPage)
export interface Store {
  id: string;
  name: string;
  address: string;
  distance: number; // in kilometers
  rating?: number;
  place_id: string;
  website?: string;
  image_url: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  route?: {
    distance_m?: number;
    duration_s?: number;
    geometry?: GeoJSON.LineString;
  } | null;
}

interface StoreSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoresUpdated: (stores: UserSelectedStore[]) => void;
}

// Nearby stores cache is now user-scoped and centralized in '@/lib/storeCache'

const StoreSelectionModal = ({ isOpen, onClose, onStoresUpdated }: StoreSelectionModalProps) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStores, setSelectedStores] = useState<UserSelectedStore[]>([]);
  const [radius, setRadius] = useState<number>(5);
  const [pendingRadius, setPendingRadius] = useState<number>(5);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [highlightedStoreIds, setHighlightedStoreIds] = useState<Set<string>>(new Set());
  const prevSelectedKeysRef = useRef<Set<string>>(new Set());
  const mapboxToken = useMapboxToken();
  const MAX_PRICE_CHECK_STORES = 3; // Users can select up to 3 stores in the modal

  // Helper to check if a store is selected (uses robust three-tier matching)
  const isStoreSelected = (store: Store) => {
    return selectedStores.some(sel => matchesStore(store, sel));
  };

  const getStoreKey = (store: Store) => {
    const postal = (store as any).postal_code || extractPostal(store.address);
    return (store.id || store.place_id || `${store.name}|${postal}`).toLowerCase();
  };

  const getSelectedStoreKey = (sel: UserSelectedStore) => {
    return (sel.place_id || `${sel.store_name}|${sel.postal_code || ''}`).toLowerCase();
  };

  // Helper to count selected stores excluding the current store
  const numOtherSelected = (store: Store) => {
    return selectedStores.filter(sel => !matchesStore(store, sel)).length;
  };

  // Helper to extract postal code from address string
  function extractPostal(address: string) {
    const match = address.match(/[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d/);
    return match ? match[0].replace(' ', '') : '';
  }

  // Normalize postal code for consistent comparison (removes all whitespace, uppercase)
  const normalizePostal = (postal?: string | null) =>
    (postal || '').replace(/\s+/g, '').toUpperCase();

  // Helper to match a nearby store with a selected store using three-tier matching
  const matchesStore = (store: Store, selected: UserSelectedStore) => {
    // Priority 1: place_id match (most reliable)
    if (store.place_id && selected.place_id && store.place_id === selected.place_id) {
      return true;
    }

    // Priority 2: name + postal match (case-insensitive for name)
    const selPostal = normalizePostal(selected.postal_code);
    const storePostal = normalizePostal((store as any).postal_code || extractPostal(store.address));

    if (selected.store_name.toLowerCase() === store.name.toLowerCase()) {
      if (selPostal && storePostal && selPostal === storePostal) {
        return true;
      }
      // Priority 3: name + address fallback (when postal unavailable)
      if (!selPostal && !storePostal && selected.address === store.address) {
        return true;
      }
    }

    return false;
  };

  // Load user-selected stores when modal opens
  useEffect(() => {
    if (isOpen) {
      storeService.getUserSelectedStores()
        .then(fetchedStores => {
          console.log('[StoreModal] Fetched initial selected stores:', fetchedStores);
          setSelectedStores(fetchedStores);
        })
        .catch(e => console.error('Failed to fetch selected stores', e));
    }
  }, [isOpen]);

  // Handle toggling price check for a store
  const handlePriceCheckToggle = async (storeId: string, checked: boolean) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    const postal = (store as any).postal_code || extractPostal(store.address);

    if (checked) {
      if (selectedStores.length >= MAX_PRICE_CHECK_STORES) {
        alert(`You can only select up to ${MAX_PRICE_CHECK_STORES} stores for price check.`);
        return;
      }
      try {
        const added = await storeService.addUserSelectedStore({
          store_name: store.name,
          address: store.address,
          postal_code: postal,
          // Include coordinates for geo-targeting (from Mapbox store selection)
          latitude: store.coordinates?.lat,
          longitude: store.coordinates?.lon,
        });
        const newStores = [...selectedStores, added];
        setSelectedStores(newStores);
        onStoresUpdated(newStores);
      } catch (e: any) {
        console.error('Failed to add selected store:', e);
        alert('Failed to add store: ' + (e?.response?.data?.detail || e.message || 'Unknown error'));
      }
    } else {
      const sel = selectedStores.find(sel => matchesStore(store, sel));
      if (!sel) return;
      try {
        if (sel.id) {
          await storeService.removeUserSelectedStore(sel.id);
          const newStores = selectedStores.filter(s => s.id !== sel.id);
          setSelectedStores(newStores);
          onStoresUpdated(newStores);
        }
      } catch (e: any) {
        console.error('Failed to remove selected store:', e);
        alert('Failed to remove store: ' + (e?.response?.data?.detail || e.message || 'Unknown error'));
      }
    }
  };

  useEffect(() => {
    setPendingRadius(radius);
  }, [radius]);

  const hasPendingRadiusChange = pendingRadius !== radius;

  const applyRadiusChange = () => {
    if (!hasPendingRadiusChange || isLoading) return;
    setRadius(pendingRadius);
  };

  const getStoredUserCoords = () => {
    const saved = localStorage.getItem('user_coords');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (typeof parsed?.lat === 'number' && typeof parsed?.lon === 'number') {
        return parsed as { lat: number; lon: number };
      }
      return null;
    } catch {
      return null;
    }
  };

  // Fetch stores function with caching
  const fetchNearbyStores = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user data from localStorage
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        throw new Error('User data not found');
      }

      const user = JSON.parse(userJson);
      if (!user.address) {
        throw new Error('Address information not found in your profile');
      }

      // Format the address for geocoding
      const addressString = `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.province || ''}, ${user.address.postalCode || ''}, Canada`;

      let coords = getStoredUserCoords();
      if (!coords) {
        const coordinates = await storeService.getCoordinatesFromAddress(addressString);
        coords = { lat: coordinates.latitude, lon: coordinates.longitude };
        localStorage.setItem('user_coords', JSON.stringify(coords));
      }
      setUserCoords(coords);

      const userId = localStorage.getItem('user_id');
      const cached = !forceRefresh ? getCachedStores(userId, radius) : null;
      if (cached) {
        console.log('[StoreModal] Using user-scoped cached store data');
        // No need to filter by brand - our database only contains allowed stores
        const cachedSorted = cached.sort(byDistanceAsc);
        setStores(cachedSorted);
        setIsLoading(false);
        return;
      }

      // Get nearby stores from our curated database
      const nearbyStores = await storeService.getNearbyStoresFromDB({
        latitude: coords.lat,
        longitude: coords.lon,
        radius: radius * 1000, // Convert km to meters
      });

      // Database already returns stores sorted by distance, but ensure consistency
      const sortedStores = nearbyStores.sort(byDistanceAsc);

      // Update user-scoped cache
      setCachedStores(userId, sortedStores, radius);

      // No need to filter by brand - our database only contains allowed stores
      setStores(sortedStores);
    } catch (err) {
      console.error('Error fetching nearby stores:', err);
      setError(err instanceof Error ? err.message : 'Failed to load nearby stores');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Fetch stores when radius changes or modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNearbyStores();
    }
  }, [isOpen, radius]);

  // Clear in-memory cache when radius changes so subsequent requests refetch
  useEffect(() => {
    try { clearStoreCache(); } catch {}
  }, [radius]);

  const formatDistance = (distance: number): string => {
    if (distance < 0) {
      return 'Out of range';
    }
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  const openDirections = (store: Store) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}&destination_place_id=${store.place_id}`, '_blank');
  };

  const openStoreWebsite = (store: Store) => {
    if (store.website) {
      window.open(store.website, '_blank');
    } else {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(store.name + ' ' + store.address)}`, '_blank');
    }
  };

  const handleRefresh = () => {
    fetchNearbyStores(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[80vw] max-h-[80vh] sm:max-h-[75vh] overflow-hidden flex flex-col p-4 sm:p-6 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]" style={{ backgroundColor: '#F1F8E9' }}>
        <style>
          {`
            .modal-theme-slider {
              accent-color: #6FCF97;
            }
            
            .modal-theme-slider::-webkit-slider-thumb {
              background: #6FCF97;
              border: 2px solid #43B06A;
            }
            
            .modal-theme-slider::-webkit-slider-runnable-track {
              background: #E6F4EA;
            }
            
            .modal-theme-slider::-moz-range-thumb {
              background: #6FCF97;
              border: 2px solid #43B06A;
            }
            
            .modal-theme-slider::-moz-range-track {
              background: #E6F4EA;
            }
            
            .modal-theme-slider::-ms-thumb {
              background: #6FCF97;
              border: 2px solid #43B06A;
            }
            
            .modal-theme-slider::-ms-fill-lower {
              background: #E6F4EA;
            }
            
            .modal-theme-slider::-ms-fill-upper {
              background: #E6F4EA;
            }
            
            .modal-theme-slider:focus {
              outline: none;
            }
          `}
        </style>
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold">Select Your Stores</DialogTitle>
        </DialogHeader>
        
        <TooltipProvider>
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center mb-3 sm:mb-4 gap-3 sm:gap-4 flex-shrink-0">
              <div className="flex items-center w-full sm:w-auto sm:flex-1 sm:max-w-md">
                <Label htmlFor="radius-slider" className="mr-2 sm:mr-4 whitespace-nowrap text-xs sm:text-sm">Search Radius:</Label>
                <input
                  id="radius-slider"
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={pendingRadius}
                  onChange={e => setPendingRadius(Number(e.target.value))}
                  className="flex-1 mx-2 modal-theme-slider"
                />
                <span className="ml-2 font-medium text-xs sm:text-sm whitespace-nowrap">{pendingRadius} km</span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="ml-3 px-3 py-2"
                  onClick={applyRadiusChange}
                  disabled={!hasPendingRadiusChange || isLoading}
                >
                  Apply
                </Button>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-2 flex-1 sm:flex-none py-2 px-3"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                {/* Selected Stores Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center justify-between flex-1 sm:flex-none sm:min-w-[180px] py-2 px-3">
                      <span className="text-xs sm:text-sm">Selected ({selectedStores.length})</span>
                      <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:min-w-[260px] sm:w-auto max-w-[320px]">
                  {selectedStores.length === 0 ? (
                    <div className="p-3 text-muted-foreground text-xs sm:text-sm">No stores selected.</div>
                  ) : (
                    selectedStores.map(sel => (
                      <DropdownMenuItem key={sel.id} className="flex items-center justify-between gap-2">
                        <span className="truncate flex-1 text-xs sm:text-sm">
                          {sel.store_name}
                          <span className="text-xs text-muted-foreground ml-1">{sel.postal_code}</span>
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-8 sm:w-8 flex-shrink-0 p-1"
                          title="Unselect store"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              if (sel.id) {
                                await storeService.removeUserSelectedStore(sel.id);
                                const newStores = selectedStores.filter(s => s.id !== sel.id);
                                setSelectedStores(newStores);
                                onStoresUpdated(newStores);
                              }
                            } catch (err: any) {
                              alert('Failed to remove store: ' + (err?.response?.data?.detail || err.message || 'Unknown error'));
                            }
                          }}
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                        </Button>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-1 px-1">
              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Card className="mb-6 border-destructive">
                  <CardContent className="pt-6">
                    <div className="text-destructive">{error}</div>
                    <p className="mt-2 text-muted-foreground">
                      Please make sure your address information is complete in your profile.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" onClick={handleRefresh} className="py-2 px-4">
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Stores Found */}
              {!isLoading && !error && stores.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p>No grocery stores found near your location.</p>
                  </CardContent>
                </Card>
              )}

              {/* Store Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-2">
              {useMemo(() => {
                // Render-time guarantee: selected stores first, each group sorted by distance
                const sorted = [...stores].sort(byDistanceAsc);
                const selected: Store[] = [];
                const unselected: Store[] = [];
                sorted.forEach(s => (isStoreSelected(s) ? selected : unselected).push(s));

                // Find selected stores that are NOT in the nearby stores list (out of range)
                // and convert them to Store objects so they can be displayed
                const outOfRangeSelected: Store[] = selectedStores
                  .filter(sel => {
                    // Check if this selected store exists in the nearby stores using matchesStore
                    return !stores.some(store => matchesStore(store, sel));
                  })
                  .map(sel => ({
                    id: sel.place_id || `selected-${sel.id}`,
                    name: sel.store_name,
                    address: sel.address,
                    distance: sel.distance ?? -1, // Use -1 to indicate unknown/out-of-range
                    place_id: sel.place_id || `selected-${sel.id}`,
                    image_url: sel.image_url || '',
                    postal_code: sel.postal_code,
                  } as Store));

                // Put all selected stores first (including out-of-range ones), then unselected
                return [...selected, ...outOfRangeSelected, ...unselected];
              }, [stores, selectedStores]).map(store => {
                const currentlySelected = isStoreSelected(store);
                const otherSelectedCount = numOtherSelected(store);
                const isDisabled = !currentlySelected && otherSelectedCount >= MAX_PRICE_CHECK_STORES;
                const shouldHighlight = highlightedStoreIds.has(getStoreKey(store));

                return (
                  <Card key={store.id} className={cn(
                    "overflow-hidden flex flex-col transition-all",
                    shouldHighlight && "animate-store-highlight ring-2 ring-primary/30"
                  )}>
                    <div className="h-32 sm:h-40 overflow-hidden bg-gray-100 border-b">
                      <StoreMiniMap
                        origin={userCoords}
                        destination={store.coordinates ?? null}
                        token={mapboxToken}
                        fallbackSrc={store.image_url}
                        alt={`${store.name} map`}
                      />
                    </div>

                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                        <span className="text-base sm:text-lg">{store.name}</span>
                        <span className={cn(
                          "text-xs sm:text-sm font-normal px-2 py-1 rounded-full flex items-center w-fit",
                          store.distance < 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-primary/10 text-primary"
                        )}>
                          <Navigation className="h-3 w-3 mr-1" />
                          {formatDistance(store.distance)}
                        </span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 p-3 sm:p-6 pt-0">
                      <div className="space-y-3 sm:space-y-4 flex-1">
                        <div className="flex items-start">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 mt-1 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{store.address}</span>
                        </div>

                        {store.rating && (
                          <div className="flex items-center">
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-yellow-500" />
                            <span className="text-xs sm:text-sm">{store.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 sm:pt-4 mt-auto">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <Label htmlFor={`price-check-${store.id}`} className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Include in Price Check
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Switch
                                  id={`price-check-${store.id}`}
                                  checked={currentlySelected}
                                  onCheckedChange={(checked) => {
                                    handlePriceCheckToggle(store.id, checked);
                                  }}
                                  disabled={isDisabled}
                                />
                              </div>
                            </TooltipTrigger>
                            {isDisabled && (
                              <TooltipContent>
                                <p className="text-xs sm:text-sm">3 stores max. Toggle off one of your selections to add another store.</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs sm:text-sm py-2 px-3"
                            onClick={() => openDirections(store)}
                          >
                            <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Directions
                          </Button>
                          
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1 text-xs sm:text-sm py-2 px-3"
                            onClick={() => openStoreWebsite(store)}
                            title={store.website ? "Visit store website" : "Search for store online"}
                          >
                            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Visit Website</span>
                            <span className="sm:hidden">Website</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};

export default StoreSelectionModal; 
