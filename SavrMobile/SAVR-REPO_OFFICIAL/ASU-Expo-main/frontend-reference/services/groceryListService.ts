import { GroceryItem as BaseChatItem, GroceryList } from './chatService';
import { apiClient } from './api';
import authService from './authService';

// Extended GroceryItem interface for database storage with UI state
export interface GroceryItem extends BaseChatItem {
  id?: string;
  checked?: boolean;
}

export interface SavedGroceryList {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  lastUpdated: string;
  items: GroceryItem[];
  // Chat session association (for linking list to chat history)
  chat_session_id?: string;
  // Price comparison fields
  savings_amount?: number;
  savings_percent?: number;
  most_expensive_store_name?: string;
  most_expensive_store_price?: number;
  least_expensive_store_name?: string;
  least_expensive_store_price?: number;
  price_comparison_updated_at?: string;
}

export interface GroceryListSavingsUpdate {
  savings_amount: number;
  savings_percent: number;
  most_expensive_store_name: string;
  most_expensive_store_price: number;
  least_expensive_store_name: string;
  least_expensive_store_price: number;
}

export interface SavingsSummary {
  saved_this_month: number;
  total_saved: number;
  month_start_date: string;
  lists_with_savings_count: number;
}

// Local storage key for saved lists
const LOCAL_STORAGE_LISTS_KEY = 'savr_grocery_lists';

// Helper to store lists in localStorage
const saveListsToLocalStorage = (lists: SavedGroceryList[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_LISTS_KEY, JSON.stringify(lists));
  } catch (error) {
    console.error('Error saving lists to localStorage:');
  }
};

// Helper to get lists from localStorage
const getListsFromLocalStorage = (): SavedGroceryList[] => {
  try {
    const listsJson = localStorage.getItem(LOCAL_STORAGE_LISTS_KEY);
    if (!listsJson) return [];
    return JSON.parse(listsJson);
  } catch (error) {
    console.error('Error reading lists from localStorage:');
    return [];
  }
};

/**
 * Save a grocery list to the database
 */
export const saveGroceryList = async (groceryList: GroceryList): Promise<SavedGroceryList> => {
  try {
    const userId = authService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const extendedItems: GroceryItem[] = groceryList.items.map(item => ({
      ...item,
      checked: false // Default state is unchecked
    }));

    const requestData = {
      name: groceryList.name || 'My Grocery List',
      userId,
      items: extendedItems
    };

    // Save to the backend; throw if it fails
    const response = await apiClient.post('/grocery-lists/', requestData);
    const savedList = response.data;
    // Cache in localStorage as well
    const currentLists = getListsFromLocalStorage();
    saveListsToLocalStorage([savedList, ...currentLists]);
    return savedList;
  } catch (error) {
    console.error('Error saving grocery list:');
    throw error;
  }
};

/**
 * Start the automated cart building process
 */
export const startCartBuildingProcess = async (_groceryListId: string): Promise<void> => {
  try {
    // This is a placeholder for the future implementation
    // await apiClient.post(`/grocery-lists/${groceryListId}/build-cart`);
  } catch (error) {
    console.error('Error starting cart building process:');
    throw error;
  }
};

/**
 * Get all grocery lists for the current user
 */
export const getUserGroceryLists = async (): Promise<SavedGroceryList[]> => {
  try {
    const userId = authService.getUserId();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Try to get from API first
      const response = await apiClient.get(`/grocery-lists/all`);
      
      
      // Also update localStorage with the latest data
      saveListsToLocalStorage(response.data);
      
      return response.data;
    } catch (apiError) {
      console.error('API error fetching grocery lists, using localStorage fallback:', apiError);
      
      // Fallback to local storage if API fails
      const localLists = getListsFromLocalStorage();
      
      // Filter lists by user ID
      const userLists = localLists.filter(list => list.userId === userId);
      
      return userLists;
    }
  } catch (error) {
    console.error('Error fetching user grocery lists:');
    throw error;
  }
};

/**
 * Get a specific grocery list by ID
 */
export const getGroceryListById = async (listId: string): Promise<SavedGroceryList> => {
  try {
    try {
      // Try to get from API first
      const response = await apiClient.get(`/grocery-lists/${listId}`);
      return response.data;
    } catch (apiError) {
      console.error(`API error fetching grocery list ${listId}, using localStorage fallback:`, apiError);
      
      // Fallback to local storage if API fails
      const localLists = getListsFromLocalStorage();
      const list = localLists.find(list => list.id === listId);
      
      if (!list) {
        throw new Error(`Grocery list with ID ${listId} not found`);
      }
      
      return list;
    }
  } catch (error) {
    console.error(`Error fetching grocery list ${listId}:`);
    throw error;
  }
};

/**
 * Delete a grocery list by ID
 */
export const deleteGroceryList = async (listId: string): Promise<void> => {
  try {
    try {
      // Try to delete from API first
      await apiClient.delete(`/grocery-lists/${listId}`);
    } catch (apiError) {
      console.error(`API error deleting grocery list ${listId}, using localStorage fallback:`, apiError);
    }
    
    // Always update localStorage regardless of API success/failure
    const localLists = getListsFromLocalStorage();
    const updatedLists = localLists.filter(list => list.id !== listId);
    saveListsToLocalStorage(updatedLists);
  } catch (error) {
    console.error(`Error deleting grocery list ${listId}:`);
    throw error;
  }
};

/**
 * Update the price comparison/savings data for a grocery list
 */
export const updateGroceryListSavings = async (
  listId: string, 
  savingsData: GroceryListSavingsUpdate
): Promise<SavedGroceryList> => {
  try {
    
    // Send update to API
    const response = await apiClient.put(`/grocery-lists/${listId}/savings`, savingsData);
    const updatedList = response.data;
    
    // Update localStorage with the new data
    const localLists = getListsFromLocalStorage();
    const updatedLists = localLists.map(list => 
      list.id === listId ? updatedList : list
    );
    saveListsToLocalStorage(updatedLists);
    
    return updatedList;
  } catch (error) {
    console.error(`Error updating savings data for list ${listId}:`);
    throw error;
  }
};

/**
 * Update items in a grocery list
 */
/**
 * Rename a grocery list
 */
export const renameGroceryList = async (
  listId: string,
  name: string
): Promise<SavedGroceryList> => {
  try {
    const response = await apiClient.put(`/grocery-lists/${listId}`, { name });
    const updatedList = response.data;

    // Update localStorage cache
    const localLists = getListsFromLocalStorage();
    const updatedLists = localLists.map(list =>
      list.id === listId ? updatedList : list
    );
    saveListsToLocalStorage(updatedLists);

    return updatedList;
  } catch (error) {
    console.error(`Error renaming grocery list ${listId}:`);
    throw error;
  }
};

export const updateGroceryListItems = async (
  listId: string,
  items: GroceryItem[]
): Promise<SavedGroceryList> => {
  try {
    const response = await apiClient.put(`/grocery-lists/${listId}`, { items });
    const updatedList = response.data;

    // Update localStorage cache
    const localLists = getListsFromLocalStorage();
    const updatedLists = localLists.map(list =>
      list.id === listId ? updatedList : list
    );
    saveListsToLocalStorage(updatedLists);

    return updatedList;
  } catch (error) {
    console.error(`Error updating grocery list items for ${listId}:`);
    throw error;
  }
};

/**
 * Get feature flags for grocery list features
 */
export const getGroceryListFeatures = async (): Promise<{ instacart_enabled: boolean }> => {
  const response = await apiClient.get('/grocery-lists/features');
  return response.data;
};

/**
 * Get an Instacart shopping list link for a grocery list
 */
export const getInstacartLink = async (listId: string, storeKey?: string): Promise<{ url: string }> => {
  const response = await apiClient.post(`/grocery-lists/${listId}/instacart-link`, {
    store_key: storeKey || undefined,
  });
  return response.data;
};

/**
 * Get savings summary for the current user
 */
export const getSavingsSummary = async (): Promise<SavingsSummary> => {
  try {
    const token = authService.getToken();
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await apiClient.get('/grocery-lists/savings-summary', { headers });
    
    return response.data;
  } catch (error: any) {
    console.error('[getSavingsSummary] Error fetching savings summary. Full error object:');
    if (error.response) {
      console.error('[getSavingsSummary] Error response data:');
      console.error('[getSavingsSummary] Error response status:', error.response.status);
      console.error('[getSavingsSummary] Error response headers:');
    } else if (error.request) {
      console.error('[getSavingsSummary] Error request (no response received):', error.request);
    } else {
      console.error('[getSavingsSummary] Error message (no response/request object):', error.message);
    }
    throw error;
  }
}; 