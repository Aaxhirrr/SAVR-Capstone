import { apiClient } from './api';

// --- STORE KEY HELPERS ---
// Store keys use the format: {canonical_store_name}::{address}
// Example: "walmart::123 Main St, Toronto" or just "walmart" (fallback)

/**
 * Parse a store_key into its canonical store name and address.
 * @param storeKey - The store key (e.g., "walmart::123 Main St, Toronto")
 * @returns Object with storeName and address (address may be undefined)
 */
export function parseStoreKey(storeKey: string): { storeName: string; address?: string } {
  if (storeKey.includes('::')) {
    const [storeName, ...addressParts] = storeKey.split('::');
    return { storeName, address: addressParts.join('::') };
  }
  return { storeName: storeKey };
}

/**
 * Get just the canonical store name from a store_key.
 * @param storeKey - The store key (e.g., "walmart::123 Main St, Toronto")
 * @returns The canonical store name (e.g., "walmart")
 */
export function getStoreNameFromKey(storeKey: string): string {
  return parseStoreKey(storeKey).storeName;
}

/**
 * Get a display-friendly name from a store_key.
 * Returns the address portion if available, otherwise formats the store name.
 * @param storeKey - The store key (e.g., "walmart::123 Main St, Toronto")
 * @returns A display-friendly name
 */
export function getDisplayNameFromStoreKey(storeKey: string): string {
  const { storeName, address } = parseStoreKey(storeKey);
  if (address) {
    // If address is very long, truncate it
    const truncatedAddress = address.length > 40 ? address.substring(0, 37) + '...' : address;
    return truncatedAddress;
  }
  // Fallback to formatted store name
  return storeName.charAt(0).toUpperCase() + storeName.slice(1);
}

/**
 * Generate a store_key from store name and address.
 * @param storeName - The canonical store name
 * @param address - The store address (optional)
 * @returns The store key
 */
export function generateStoreKey(storeName: string, address?: string): string {
  if (address) {
    return `${storeName}::${address}`;
  }
  return storeName;
}

// --- NEW/UPDATED TYPE DEFINITIONS (Based on Backend Pydantic Schemas) ---

export interface GroceryProduct {
  brand?: string;
  name: string;
  price: string;
  size?: string;
  pricePerUnit?: string;
  store: string;
  imageUrl?: string;
  // Multi-buy metadata (optional)
  isMultiBuy?: boolean;
  multiBuyText?: string;
  // Unit pricing normalization
  pricePerKg?: number | null;
  pricePerLb?: number | null;
  pricePer100g?: number | null;
  pricePerEach?: number | null;
  unitPricingType?: string | null;
  unitPricingConfidence?: string | null;
  id?: number | string; // search_results.id from DB (number) or a frontend-generated ID (string)
  productCode?: string | null; // Store product code for cart integration (e.g. "20188873_EA")
}

// SearchResultInDB (maps to backend schema: search_results table)
export interface SearchResultInDB extends GroceryProduct {
  id: number; // Primary key from search_results table
  session_id: string; // Foreign key to search_sessions table (UUID)
  search_term: string;
  // store_name is equivalent to store in GroceryProduct for this context
  scraped_at: string; // ISO date string from DB
}

// ProductSelectionBase (common fields for product selections)
export interface ProductSelectionBase {
  item_name: string; // The name of the grocery list item (e.g., "Milk")
  store_name: string; // The store for which this selection is made (e.g., "Loblaws")
  selected_product_id?: number | null; // FK to search_results.id, if a product is chosen
  is_nothing: boolean; // True if user explicitly selected "Nothing" for this item/store
}

// ProductSelectionCreate (payload for creating a new product selection)
export interface ProductSelectionCreate extends ProductSelectionBase {
  session_id: string; // The search session ID from which this selection is being made (UUID)
}

// ProductSelectionInDB (represents a product selection stored in the database)
export interface ProductSelectionInDB extends ProductSelectionBase {
  id: number; // Primary key from product_selections table
  session_id: string; // FK to search_sessions.id (UUID)
  user_id: string; // FK to users.id (UUID)
  list_id: string; // FK to grocery_lists.id (UUID)
  selected_at: string; // ISO date string
  updated_at: string; // ISO date string
  // selected_product_detail?: SearchResultInDB; // Optionally populated by backend
}

// ShoppingDataForList (comprehensive data structure for a list's shopping info)
export interface ShoppingDataForList {
  // Results from the latest search session, keyed by item_name, then by store_name
  results: Record<string, Record<string, SearchResultInDB[]>>;
  // User's current selections for each item/store, mapping to the chosen SearchResultInDB
  selections: Record<string, Record<string, SearchResultInDB>>;
  session_id?: string | null; // ID of the latest search session (UUID)
  last_checked?: string | null; // Timestamp of when the last search was completed (ISO string)
  status?: string; // Status of the latest search session (e.g., "pending", "completed", "failed")
}

// --- END OF NEW/UPDATED TYPE DEFINITIONS ---

// For backward compatibility (will be phased out)
export interface NoFrillsProduct extends Omit<GroceryProduct, 'store'> {
  store?: string;
}

// This type is widely used. If results in ShoppingDataForList become SearchResultInDB[],
// then this might also need to align or be used only for deprecated functions.
export interface ShoppingResults {
  [itemName: string]: GroceryProduct[];
}

declare global {
  interface Window {
    _searchResultItemsReceived?: Record<string, Set<string>>;
  }
}

/**
 * Test the shopping router to see if it's accessible
 */
export const testShoppingRouter = async (): Promise<{ status: string; message: string }> => {
  try {

    const endpoints = [
      '/api-test',        // Simple test endpoint
      '/cors-test',       // Test with explicit CORS headers
      '/shopping/test',   // Shopping test endpoint (corrected path)
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get(endpoint, { timeout: 1000 });
        if (response.data && typeof response.data.message === 'string') {
            return response.data;
        } else if (response.data && typeof response.data.status === 'string'){
             return response.data;
        } else if (response.data) {
            return { status: 'success', message: JSON.stringify(response.data) };
        }

      } catch (error) {
        console.error(`Failed with endpoint ${endpoint}:`);
      }
    }

    // Fallback if all specific test endpoints fail
    try {
      const healthResponse = await apiClient.get('/health', { timeout: 1000 });
      if (healthResponse.data) {
        return { status: 'success', message: 'Fallback /health endpoint accessible' };
      }
    } catch (fallbackError) {
      console.error('Fallback /health endpoint also failed:', fallbackError);
    }

    throw new Error('All API test endpoints failed');
  } catch (error) {
    console.error('Error testing API connectivity:');
    return { status: 'error', message: error instanceof Error ? error.message : 'Unknown API testing error' };
  }
};

/**
 * DEPRECATED: Get product options from No Frills for items in a grocery list
 */
export const shopNoFrills = async (_groceryListId: string, _postalCode: string = "K2S 0X2", _items?: string[]): Promise<ShoppingResults> => {
  console.warn("shopNoFrills is DEPRECATED. Use checkPricesDirectly and getShoppingDataForList for the new DB-backed flow.");
  return {};
};

/**
 * NEW: Fetches combined search results and user selections for a given grocery list.
 * Retrieves data from the '/lists/{listId}/latest-search' endpoint.
 */
export const getShoppingDataForList = async (listId: string): Promise<ShoppingDataForList> => {
  if (!listId) {
    console.error('getShoppingDataForList: listId is required.');
    throw new Error('List ID is required.');
  }
  try {
    const response = await apiClient.get<ShoppingDataForList>(`/lists/${listId}/latest-search`);

    const data = response.data || {};
    // Ensure nested structures exist to prevent runtime errors in components
    if (!data.results) data.results = {};
    if (!data.selections) data.selections = {};

    return data;
  } catch (error) {
    console.error(`Error fetching shopping data for list ${listId}:`);
    throw error;
  }
};

/**
 * NEW: Saves or updates a user's product selection for a specific item and store on a list.
 * Posts data to the '/lists/{listId}/selections' endpoint.
 */
export const saveProductSelection = async (
  listId: string,
  selectionData: ProductSelectionCreate
): Promise<ProductSelectionInDB> => {
  if (!listId) {
    console.error('saveProductSelection: listId is required.');
    throw new Error('List ID is required.');
  }
  if (!selectionData || typeof selectionData.item_name !== 'string' || typeof selectionData.store_name !== 'string') {
    console.error('saveProductSelection: Invalid selectionData provided.', selectionData);
    throw new Error('Invalid selection data: item_name and store_name are required.');
  }
  try {
    const response = await apiClient.post<ProductSelectionInDB>(`/lists/${listId}/selections`, selectionData);
    return response.data;
  } catch (error) {
    console.error(`Error saving product selection for list ${listId}:`);
    throw error;
  }
};

/**
 * MODIFIED: Initiates a price check for specified stores and products by calling the '/check_prices' endpoint.
 * The backend now handles session creation and incremental saving to the database.
 * This function returns the backend's response, which includes session info, errors, and results.
 */
export const checkPricesDirectly = async (
  stores: { store_name: string; postal_code: string; address?: string; latitude?: number; longitude?: number; retailer_store_id?: string; brand?: string }[],
  products: string[],
  listId: string
): Promise<{
  session_id: string;
  message: string;
  errors?: any[];
  skipped_stores?: string[];
  results?: ShoppingResults; // This might need to be ShoppingDataForList['results'] or similar
}> => {
  if (!listId) {
    const errMsg = 'checkPricesDirectly: listId is required for database operations.';
    console.error(errMsg);
    throw new Error(errMsg);
  }
  if (!stores || stores.length === 0) {
    const errMsg = 'checkPricesDirectly: stores array cannot be empty.';
    console.error(errMsg);
    throw new Error(errMsg);
  }
   if (!products || products.length === 0) {
    const errMsg = 'checkPricesDirectly: products array cannot be empty.';
    console.error(errMsg);
    throw new Error(errMsg);
  }

  try {
    const response = await apiClient.post('/check_prices', {
      stores,
      products,
      list_id: listId,
    }, {
      timeout: 120000, // 2 minutes - price checks can take 30-60s with Cloud Run
    });

    return {
      session_id: response.data?.session_id || '',
      message: response.data?.message || 'Price check process interaction complete.',
      errors: response.data?.errors || [],
      skipped_stores: response.data?.skipped_stores || [],
      results: response.data?.results || {} // Ensure this aligns with what backend actually sends
    };
  } catch (error) {
    console.error('Error initiating price check:');
    throw error;
  }
};

/**
 * DEPRECATED: Streams No Frills products. Needs significant rewrite or removal.
 */
export async function streamNoFrillsProducts(
  _listId: string,
  _postalCode: string,
  _items: string[],
  _onItemComplete?: (item: string, products: GroceryProduct[], store: string) => void,
  _onProgress?: (progress: number, completedItems: number, totalItems: number) => void,
  _onComplete?: (results: ShoppingResults) => void,
  _onError?: (error: Error) => void
): Promise<string> {
  console.warn("streamNoFrillsProducts is DEPRECATED and needs updates for the new DB flow. It will not function correctly.");
  if (_onError) _onError(new Error("streamNoFrillsProducts is deprecated."));
  return Promise.resolve("deprecated-search-id");
}

/**
 * DEPRECATED: Gets debug information for a search. Session model changes affect this.
 */
export const debugSearchState = async (_searchId: string): Promise<any> => {
  console.warn("debugSearchState is DEPRECATED and might need updates for the new session model.");
  return Promise.resolve({ message: "debugSearchState is deprecated" });
};

/**
 * DEPRECATED: Gets search results directly using a search ID. Use getShoppingDataForList.
 */
export const getSearchResultsDirectly = async (_searchId: string): Promise<ShoppingResults | null> => {
  console.warn("getSearchResultsDirectly is DEPRECATED. Use getShoppingDataForList.");
  return null;
};

/**
 * DEPRECATED: LLM product selection. Needs review for new DB flow and types.
 */
export async function llmSelectProducts(
  _groceryListId: string,
  _shoppingData: ShoppingDataForList
): Promise<Record<string, Record<string, GroceryProduct>>> {
  console.warn("llmSelectProducts is DEPRECATED and needs review/update for the new DB flow and types. It will return empty selections.");
  return {};
}