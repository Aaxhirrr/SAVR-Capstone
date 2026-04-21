import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Star, Navigation, ExternalLink, X, ChevronDown } from 'lucide-react';
import storeService, { UserSelectedStore } from '@/services/storeService';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import styles from './StoresPage.module.css';
import { byDistanceAsc } from '@/lib/stores';

// Define the updated Store interface
export interface Store {
  id: string;
  name: string;
  address: string;
  distance: number; // in kilometers
  rating?: number;
  place_id: string;
  website?: string;
  image_url: string; // Use the single image URL from backend
}

// Helper function to generate placeholder image (can be removed if not used elsewhere, or kept as a backup)
// const generatePlaceholderImage = (storeName: string): string => { ... };

const StoresPage = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [selectedStore, setSelectedStore] = useState<string | null>(null); // Unused
  // const [credentialForm, setCredentialForm] = useState({ // Unused
  //   username: '',
  //   password: ''
  // });
  // State to track selected stores for price checking (by store_name+postal_code)
  const [selectedStores, setSelectedStores] = useState<UserSelectedStore[]>([]);
  const [radius, setRadius] = useState<number>(5); // New state for search radius
  const MAX_PRICE_CHECK_STORES = 3;

  // Define allowed store brands for filtering
  const ALLOWED_STORE_BRANDS = [
    'loblaw', 'loblaws',
    'no frills', 'nofrills', 
    'independent grocer', 'your independent', 'yig', 'independent',
    'superstore', 'real canadian superstore', 'rcss',
    'food basics', 'foodbasics',
    'walmart', 'wal-mart',
    // Empire (Sobeys family)
    'sobeys', "sobey's", "sobey’s", 'safeway', 'sobeys extra', 'sobeys urban fresh', 'urban fresh'
  ];

  // Helper function to check if a store is from an allowed brand
  const isAllowedStore = (storeName: string): boolean => {
    const lowerName = storeName.toLowerCase();
    return ALLOWED_STORE_BRANDS.some(brand => lowerName.includes(brand));
  };

  // Helper to check if a store is selected (by name+postal)
  const isStoreSelected = (store: Store) => {
    // Use store.postal_code if available, else extract from address
    const postal = (store as any).postal_code || extractPostal(store.address);
    return selectedStores.some(sel => sel.store_name === store.name && sel.postal_code === postal);
  };

  // Helper to count selected stores excluding the current store
  const numOtherSelected = (store: Store) => {
    const postal = (store as any).postal_code || extractPostal(store.address);
    return selectedStores.filter(sel => !(sel.store_name === store.name && sel.postal_code === postal)).length;
  };

  // Helper to extract postal code from address string (assumes last 2 words are postal)
  function extractPostal(address: string) {
    const match = address.match(/[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d/);
    return match ? match[0].replace(' ', '') : '';
  }

  // On mount, fetch user-selected stores
  useEffect(() => {
    storeService.getUserSelectedStores()
      .then(fetchedStores => {
         console.log('[useEffect] Fetched initial selected stores:', fetchedStores);
         setSelectedStores(fetchedStores);
      })
      .catch(e => console.error('Failed to fetch selected stores', e));
  }, []);

  // Handle toggling price check for a store
  const handlePriceCheckToggle = async (storeId: string, checked: boolean) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    const postal = (store as any).postal_code || extractPostal(store.address);
    console.log(`Toggling store: ${store.name} (${storeId}), Checked: ${checked}, Current Selected: ${selectedStores.length}`);

    if (checked) {
      if (selectedStores.length >= MAX_PRICE_CHECK_STORES) {
        console.warn(`Attempted to add when max (${MAX_PRICE_CHECK_STORES}) reached.`);
        alert(`You can only select up to ${MAX_PRICE_CHECK_STORES} stores for price check.`);
        return;
      }
      try {
        console.log('Calling addUserSelectedStore...');
        const added = await storeService.addUserSelectedStore({
          store_name: store.name,
          address: store.address,
          postal_code: postal,
        });
        console.log('Backend call successful, received:', added);
        setSelectedStores(prev => {
          const newArr = [...prev, added];
          console.log('[State Update - Add] Previous length:', prev.length, 'New array:', newArr);
          return newArr;
        });
      } catch (e: any) {
        console.error('Failed to add selected store:', e);
        alert('Failed to add store: ' + (e?.response?.data?.detail || e.message || 'Unknown error'));
        // Optionally refresh
        // storeService.getUserSelectedStores().then(setSelectedStores);
      }
    } else {
      const sel = selectedStores.find(sel => sel.store_name === store.name && sel.postal_code === postal);
      if (!sel) {
        console.warn('Attempted to remove store not found in selected list:', store.name);
        return;
      }
      try {
        console.log('Calling removeUserSelectedStore for ID:', sel.id);
        if (sel.id) {
          await storeService.removeUserSelectedStore(sel.id);
          console.log('Backend remove call successful.');
          setSelectedStores(prev => {
            const newArr = prev.filter(s => s.id !== sel.id);
            console.log('[State Update - Remove] Previous length:', prev.length, 'New array:', newArr);
            return newArr;
          });
        }
      } catch (e: any) {
        console.error('Failed to remove selected store:', e);
        alert('Failed to remove store: ' + (e?.response?.data?.detail || e.message || 'Unknown error'));
        // Optionally refresh
        // storeService.getUserSelectedStores().then(setSelectedStores);
      }
    }
  };

  // Fetch stores when radius changes
  useEffect(() => {
    const fetchNearbyStores = async () => {
      try {
        console.log('Starting to fetch nearby stores...');
        setIsLoading(true);
        setError(null);

        // Get user data from localStorage
        const userJson = localStorage.getItem('user');
        console.log('User data from localStorage:', userJson);

        if (!userJson) {
          throw new Error('User data not found');
        }

        const user = JSON.parse(userJson);
        console.log('Parsed user data:', user);

        // Check if user has address information
        if (!user.address) {
          console.log('User has no address information:', user);
          throw new Error('Address information not found in your profile');
        }

        console.log('User address found:', user.address);

        // Format the address for geocoding
        const addressString = `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.province || ''}, ${user.address.postalCode || ''}, Canada`;
        console.log('Formatted address string:', addressString);

        // Get coordinates from address
        console.log('Calling geocoding API...');
        const coordinates = await storeService.getCoordinatesFromAddress(addressString);
        console.log('Got coordinates:', coordinates);

        // Get nearby stores using coordinates
        console.log('Fetching nearby stores with coordinates:', coordinates);
        const nearbyStores = await storeService.getNearbyStores({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radius: radius * 1000, // Use selected radius in meters
          provider: 'mapbox'
        });

        console.log('Received nearby stores:', nearbyStores);
        
        // Filter stores to only include allowed brands, then sort by distance
        const filteredStores = nearbyStores
          .filter(store => isAllowedStore(store.name))
          .sort(byDistanceAsc);
        console.log('Filtered stores (allowed brands only):', filteredStores);
        
        setStores(filteredStores);

      } catch (err) {
        console.error('Error fetching nearby stores:', err);
        setError(err instanceof Error ? err.message : 'Failed to load nearby stores');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearbyStores();
  }, [radius]);

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  const openDirections = (store: Store) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}&destination_place_id=${store.place_id}`, '_blank');
  };

  // Function to open store website
  const openStoreWebsite = (store: Store) => {
    if (store.website) {
      window.open(store.website, '_blank');
    } else {
      // If no website available, search for it on Google
      window.open(`https://www.google.com/search?q=${encodeURIComponent(store.name + ' ' + store.address)}`, '_blank');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Nearby Grocery Stores</h1>
      </div>

      {/* Slider for search radius and selected stores dropdown */}
      <div className="flex items-center mb-4" style={{ maxWidth: '100%' }}>
        <div className="flex items-center flex-1" style={{ maxWidth: '25%' }}>
          <Label htmlFor="radius-slider" className="mr-4 whitespace-nowrap">Search Radius:</Label>
          <input
            id="radius-slider"
            type="range"
            min={1}
            max={50}
            step={1}
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            className={`flex-1 mx-2 ${styles['theme-slider']}`}
          />
          <span className="ml-2 font-medium">{radius} km</span>
        </div>
        {/* Selected Stores Dropdown - right aligned */}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-4 flex items-center justify-between" style={{ minWidth: 180 }}>
                <span>Selected Stores ({selectedStores.length})</span>
                <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[260px]">
              {selectedStores.length === 0 ? (
                <div className="p-3 text-muted-foreground text-sm">No stores selected.</div>
              ) : (
                selectedStores.map(sel => (
                  <DropdownMenuItem key={sel.id} className="flex items-center justify-between">
                    <span className="truncate max-w-[245px]">{sel.store_name} <span className="text-xs text-muted-foreground">{sel.postal_code}</span></span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      title="Unselect store"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          if (sel.id) {
                            await storeService.removeUserSelectedStore(sel.id);
                            setSelectedStores(prev => prev.filter(s => s.id !== sel.id));
                          }
                        } catch (err: any) {
                          alert('Failed to remove store: ' + (err?.response?.data?.detail || err.message || 'Unknown error'));
                        }
                      }}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
            <p className="mt-2 text-muted-foreground">
              Please make sure your address information is complete in your profile.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link to="/profile">Update Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && stores.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p>No grocery stores found near your location.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {stores.map(store => {
          // Calculate disabled state for logging
          const currentlySelected = isStoreSelected(store);
          const otherSelectedCount = numOtherSelected(store);
          const isDisabled = !currentlySelected && otherSelectedCount >= MAX_PRICE_CHECK_STORES;
          console.log(`Rendering Store: ${store.name}, Selected: ${currentlySelected}, OtherSelected: ${otherSelectedCount}, Max: ${MAX_PRICE_CHECK_STORES}, Disabled: ${isDisabled}`);

          return (
            <Card key={store.id} className="overflow-hidden flex flex-col">
              <div className="h-48 overflow-hidden bg-gray-100">
                <img
                  src={store.image_url}
                  alt={store.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Log the error for debugging
                    console.warn(`Primary image failed for store "${store.name}". Falling back to generic placeholder.`);
                    // Prevent infinite loop
                    target.onerror = null; 
                    // Fallback directly to the local generic placeholder
                    target.src = "/assets/store-placeholder.png"; 
                  }}
                />
              </div>

              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{store.name}</span>
                  <span className="text-sm font-normal bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center">
                    <Navigation className="h-3 w-3 mr-1" />
                    {formatDistance(store.distance)}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col flex-1">
                <div className="space-y-4 flex-1">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                    <span className="text-sm">{store.address}</span>
                  </div>

                  {store.rating && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-500" />
                      <span className="text-sm">{store.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-auto">
                  <div className="flex items-center justify-between mb-3">
                    <Label htmlFor={`price-check-${store.id}`} className="text-sm font-medium text-muted-foreground">
                      Include in Price Check
                    </Label>
                    <Switch
                      id={`price-check-${store.id}`}
                      checked={currentlySelected}
                      onCheckedChange={(checked) => {
                        console.log(`Switch clicked for store ${store.name} (${store.id}), new checked state: ${checked}`);
                        handlePriceCheckToggle(store.id, checked);
                      }}
                      disabled={isDisabled} // Use the calculated value
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openDirections(store)}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Directions
                    </Button>
                    
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openStoreWebsite(store)}
                      title={store.website ? "Visit store website" : "Search for store online"}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Website
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StoresPage; 
