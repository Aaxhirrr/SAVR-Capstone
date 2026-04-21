import api from './api';
// import type { GeoJSON } from 'geojson';

export interface Store {
  id: string;
  name: string;
  address: string;
  distance: number; // in kilometers
  rating?: number;
  place_id: string;
  website?: string;
  image_url: string; // Use the single image URL from backend
  postal_code?: string;
  brand?: string; // Normalized brand name from DB (e.g., 'metro', 'loblaws', 'nofrills')
  retailer_store_id?: string; // Original store ID from the retailer (e.g., Loblaw storeId for API calls)
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

export interface DBStoreSearchParams {
  latitude: number;
  longitude: number;
  radius?: number; // in meters, default 15000 (15km)
  brands?: string; // comma-separated list of normalized brand names
  limit?: number; // max stores to return
}

export interface BoundsSearchParams {
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
  brands?: string; // comma-separated list of normalized brand names
  limit?: number; // max stores to return, default 100
}

export interface StoreCredential {
  id: string;
  store_id: string;
  username: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface StoreCredentialCreate {
  store_id: string;
  username: string;
  password: string;
}

export interface UserSelectedStore {
  id?: number; // Optional for new selections before saving
  store_name: string;
  address: string;
  postal_code: string;
  image_url?: string; // Added for store logo
  place_id?: string;
  distance?: number;
  // Store coordinates for geo-targeting (from Mapbox store selection)
  latitude?: number;
  longitude?: number;
  retailer_store_id?: string;
  brand?: string;
}

export interface AddressSuggestion {
  place_name: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: string;
  longitude: string;
}

const storeService = {
  /**
   * Get nearby grocery stores from our local database (preferred method).
   * This uses curated store data instead of Mapbox search.
   */
  getNearbyStoresFromDB: async (params: DBStoreSearchParams): Promise<Store[]> => {
    try {
      const response = await api.get('/stores/nearby/db', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching stores from database:');
      throw error;
    }
  },

  /**
   * Get stores within a bounding box (for map-based search).
   * More efficient for map panning/zooming scenarios.
   */
  getStoresInBounds: async (params: BoundsSearchParams): Promise<Store[]> => {
    try {
      const response = await api.get('/stores/nearby/db/bounds', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching stores in bounds:');
      throw error;
    }
  },

  /**
   * Get user's coordinates from address
   */
  getCoordinatesFromAddress: async (address: string): Promise<{latitude: number, longitude: number}> => {
    try {
      const response = await api.get('/stores/geocode', { params: { address } });
      return response.data;
    } catch (error) {
      
      // For development, return mock Toronto coordinates
      return {
        latitude: 43.6532,
        longitude: -79.3832
      };
    }
  },

  /**
   * Get address autocomplete suggestions
   */
  addressSuggest: async (
    q: string,
    proximityLat?: number,
    proximityLon?: number,
  ): Promise<AddressSuggestion[]> => {
    const params: Record<string, string | number> = { q };
    if (proximityLat !== undefined && proximityLon !== undefined) {
      params.proximity_lat = proximityLat;
      params.proximity_lon = proximityLon;
    }
    const response = await api.get('/stores/address-suggest', { params });
    return response.data;
  },

  /**
   * Reverse geocode coordinates to a structured address
   */
  reverseGeocode: async (latitude: number, longitude: number): Promise<{street: string, city: string, province: string, postalCode: string}> => {
    const response = await api.get('/stores/reverse-geocode', { params: { latitude, longitude } });
    return response.data;
  },

  /**
   * Save store credentials for a user
   */
  saveStoreCredentials: async (data: StoreCredentialCreate): Promise<StoreCredential> => {
    try {
      const response = await api.post('/stores/credentials', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all store credentials for a user
   */
  getStoreCredentials: async (): Promise<StoreCredential[]> => {
    try {
      const response = await api.get('/stores/credentials');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  /**
   * Delete a store credential
   */
  deleteStoreCredentials: async (credentialId: string): Promise<void> => {
    try {
      await api.delete(`/stores/credentials/${credentialId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user-selected stores
   */
  getUserSelectedStores: async (): Promise<UserSelectedStore[]> => {
    const response = await api.get('/user/selected_stores');
    return response.data;
  },

  /**
   * Add a user-selected store
   */
  addUserSelectedStore: async (store: Omit<UserSelectedStore, 'id'>): Promise<UserSelectedStore> => {
    const response = await api.post('/user/selected_stores', store);
    return response.data;
  },

  /**
   * Remove a user-selected store
   */
  removeUserSelectedStore: async (storeId: number): Promise<void> => {
    await api.delete(`/user/selected_stores/${storeId}`);
  }
};

export default storeService; 