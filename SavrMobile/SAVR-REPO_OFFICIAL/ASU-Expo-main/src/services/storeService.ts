import axios from 'axios';
import { API_BASE_URL } from './api';
import { getToken } from './auth';

export type Store = {
  id: string;
  name: string;
  address: string;
  distance: number;
  place_id: string;
  image_url: string;
  postal_code?: string;
  brand?: string;
};

export type UserSelectedStore = {
  id?: number;
  store_name: string;
  address: string;
  postal_code: string;
  image_url?: string;
  place_id?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
};

async function getAuthHeaders() {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getUserSelectedStores(): Promise<UserSelectedStore[]> {
  const headers = await getAuthHeaders();
  const response = await axios.get<UserSelectedStore[]>(
    `${API_BASE_URL}/user/selected_stores`,
    { headers }
  );
  return response.data;
}

export async function addUserSelectedStore(
  store: Omit<UserSelectedStore, 'id'>
): Promise<UserSelectedStore> {
  const headers = await getAuthHeaders();
  const response = await axios.post<UserSelectedStore>(
    `${API_BASE_URL}/user/selected_stores`,
    store,
    { headers }
  );
  return response.data;
}

export async function removeUserSelectedStore(storeId: number): Promise<void> {
  const headers = await getAuthHeaders();
  await axios.delete(`${API_BASE_URL}/user/selected_stores/${storeId}`, {
    headers,
  });
}

export async function getCoordinatesFromAddress(
  address: string
): Promise<{ latitude: number; longitude: number }> {
  const headers = await getAuthHeaders();
  const response = await axios.get<{ latitude: number; longitude: number }>(
    `${API_BASE_URL}/stores/geocode`,
    { headers, params: { address } }
  );
  return response.data;
}

export async function getNearbyStoresFromDB(params: {
  latitude: number;
  longitude: number;
  radius?: number;
  brands?: string;
}): Promise<Store[]> {
  const headers = await getAuthHeaders();
  const response = await axios.get<Store[]>(
    `${API_BASE_URL}/stores/nearby/db`,
    { headers, params }
  );
  return response.data;
}

/** Derive flyer brand key from store name (e.g. "No Frills Kanata" -> "nofrills") */
export function storeBrandKey(storeName: string): string {
  const n = storeName.toLowerCase();
  if (n.includes('no frills') || n.includes('nofrills')) return 'nofrills';
  if (n.includes('food basics') || n.includes('foodbasics')) return 'foodbasics';
  if (n.includes('atlantic') && n.includes('superstore')) return 'atlanticsuperstore';
  if (n.includes('superstore')) return 'superstore';
  if (n.includes('loblaw')) return 'loblaws';
  if (n.includes('independent')) return 'independent';
  if (n.includes('metro')) return 'metro';
  if (n.includes('sobey')) return 'sobeys';
  if (n.includes('safeway')) return 'safeway';
  if (n.includes('walmart')) return 'walmart';
  if (n.includes('zehrs')) return 'zehrs';
  if (n.includes('fortinos')) return 'fortinos';
  if (n.includes('maxi')) return 'maxi';
  if (n.includes('valu') || n.includes('value')) return 'valuemart';
  if (n.includes('freshco')) return 'freshco';
  if (n.includes('foodland')) return 'foodland';
  if (n.includes('t&t') || n.includes('tnt')) return 'tnt';
  return storeName.toLowerCase().replace(/\s+/g, '');
}
