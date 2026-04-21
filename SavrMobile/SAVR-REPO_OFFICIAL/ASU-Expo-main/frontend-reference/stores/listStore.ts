import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { userScopedStateStorage } from '@/lib/userScopedStorage';
import {
  getUserGroceryLists,
  SavedGroceryList,
  updateGroceryListItems,
  renameGroceryList,
  updateGroceryListSavings,
} from '@/services/groceryListService';
import {
  getShoppingDataForList,
  ShoppingDataForList,
  SearchResultInDB,
} from '@/services/shoppingService';
import { isEqual, isMeatCategory, isProduceCategory } from '@/lib/storeUtils';

// Interface for per-list price data
export interface ListPriceData extends ShoppingDataForList {
  storeSubtotals: Record<string, { total: number; itemCount: number }>;
  dataSource: 'api' | 'mock' | 'localStorage' | null;
}

// Drawer states
export type DrawerState = 'collapsed' | 'peek' | 'expanded';

interface ListState {
  // Cached lists
  lists: SavedGroceryList[];
  isLoadingLists: boolean;

  // Selection
  selectedListId: string | null;

  // Drawer state
  drawerState: DrawerState;

  // Price data per list
  listPriceDataMap: Record<string, ListPriceData>;

  // Price check state
  isPollingActive: boolean;
  isCheckingPrices: boolean;
  selectedStoreKey: string | null;
  searchingStoresMap: Record<string, Array<{ store_name: string; postal_code: string; address?: string; latitude?: number; longitude?: number; brand?: string }>>;
  priceCheckListId: string | null;

  // Pricing unit for display: 'store' shows raw prices, others show converted unit prices
  pricingMode: 'store' | '/ea';

  // Refs for list selection order (for LRU cache eviction)
  _listSelectionOrder: string[];

  // Actions
  fetchLists: () => Promise<void>;
  selectList: (listId: string | null) => void;
  setDrawerState: (state: DrawerState) => void;
  updateListPriceData: (listId: string, data: Partial<ListPriceData>) => void;
  setSelectedStore: (storeKey: string | null) => void;
  setIsPollingActive: (active: boolean) => void;
  setIsCheckingPrices: (checking: boolean) => void;
  setSearchingStores: (listId: string, stores: Array<{ store_name: string; postal_code: string; address?: string; latitude?: number; longitude?: number }>) => void;
  setPriceCheckListId: (listId: string | null) => void;
  setPricingMode: (mode: 'store' | '/ea') => void;
  fetchListPriceData: (listId: string) => Promise<void>;
  updateSelectionFunctional: (
    listId: string,
    itemName: string,
    storeName: string,
    product: SearchResultInDB
  ) => void;
  calculateStoreSubtotals: (listId: string) => void;
  getSelectedList: () => SavedGroceryList | null;
  getCurrentListPriceData: () => ListPriceData | null;
  addOrUpdateList: (list: SavedGroceryList) => void;
  renameList: (listId: string, newName: string) => Promise<void>;
  updateItemName: (listId: string, oldName: string, newName: string) => Promise<void>;
  deleteItem: (listId: string, itemName: string) => Promise<void>;
  updateItemQuantity: (listId: string, itemName: string, quantity: number) => void;
}

// Cache size limit (keep data for last N lists)
const MAX_CACHED_LISTS = 5;

// Debounce timer for quantity updates
let _qtyDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const useListStore = create<ListState>()(
  persist(
    (set, get) => ({
      // Initial state
      lists: [],
      isLoadingLists: false,
      selectedListId: null,
      drawerState: 'collapsed',
      listPriceDataMap: {},
      isPollingActive: false,
      isCheckingPrices: false,
      selectedStoreKey: null,
      pricingMode: 'store',
      searchingStoresMap: {},
      priceCheckListId: null,
      _listSelectionOrder: [],

      // Fetch all lists for current user
      fetchLists: async () => {
        set({ isLoadingLists: true });
        try {
          const userLists = await getUserGroceryLists();

          // Deduplicate and sort by createdAt descending
          const uniqueListMap = new Map<string, SavedGroceryList>();
          for (const list of userLists) {
            uniqueListMap.set(list.id, list);
          }
          const sortedLists = Array.from(uniqueListMap.values()).sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          });

          set({ lists: sortedLists, isLoadingLists: false });
        } catch (error) {
          console.error('Error fetching grocery lists:');
          set({ lists: [], isLoadingLists: false });
        }
      },

      // Select a list by ID
      selectList: (listId: string | null) => {
        const state = get();
        if (state.selectedListId === listId) return;

        set({
          selectedListId: listId,
          selectedStoreKey: null, // Reset store selection when switching lists
        });

        // Update selection order for LRU cache
        if (listId) {
          const newOrder = [
            listId,
            ...state._listSelectionOrder.filter(id => id !== listId),
          ].slice(0, MAX_CACHED_LISTS);
          set({ _listSelectionOrder: newOrder });
        }
      },

      // Set drawer state
      setDrawerState: (drawerState: DrawerState) => {
        set({ drawerState });
      },

      // Update price data for a specific list
      updateListPriceData: (listId: string, data: Partial<ListPriceData>) => {
        const state = get();

        // Update selection order
        const newOrder = [
          listId,
          ...state._listSelectionOrder.filter(id => id !== listId),
        ].slice(0, MAX_CACHED_LISTS);

        const currentDataForList = state.listPriceDataMap[listId] || {
          results: {},
          selections: {},
          storeSubtotals: {},
          dataSource: null,
          session_id: null,
          last_checked: null,
          status: undefined,
        };

        // Check if there's any actual change
        let hasMeaningfulChange = false;
        if (data.results !== undefined && !isEqual(currentDataForList.results, data.results)) {
          hasMeaningfulChange = true;
        }
        if (data.selections !== undefined && !isEqual(currentDataForList.selections, data.selections)) {
          hasMeaningfulChange = true;
        }
        if (data.status !== undefined && currentDataForList.status !== data.status) {
          hasMeaningfulChange = true;
        }
        if (data.session_id !== undefined && currentDataForList.session_id !== data.session_id) {
          hasMeaningfulChange = true;
        }
        if (data.last_checked !== undefined && currentDataForList.last_checked !== data.last_checked) {
          hasMeaningfulChange = true;
        }
        if (data.dataSource !== undefined && currentDataForList.dataSource !== data.dataSource) {
          hasMeaningfulChange = true;
        }
        if (data.storeSubtotals !== undefined && !isEqual(currentDataForList.storeSubtotals, data.storeSubtotals)) {
          hasMeaningfulChange = true;
        }

        if (!hasMeaningfulChange) {
          return;
        }

        const updatedData: ListPriceData = {
          ...currentDataForList,
          ...data,
          results: data.results !== undefined ? data.results : currentDataForList.results,
          selections: data.selections !== undefined ? data.selections : currentDataForList.selections,
          storeSubtotals: data.storeSubtotals !== undefined ? data.storeSubtotals : currentDataForList.storeSubtotals,
        };

        const newMap = {
          ...state.listPriceDataMap,
          [listId]: updatedData,
        };

        // Evict based on selection order (LRU)
        const listIds = Object.keys(newMap);
        if (listIds.length > MAX_CACHED_LISTS) {
          const idsToKeep = new Set(newOrder);
          listIds.forEach(id => {
            if (!idsToKeep.has(id)) {
              delete newMap[id];
            }
          });
        }

        set({
          listPriceDataMap: newMap,
          _listSelectionOrder: newOrder,
        });
      },

      // Set selected store for viewing in drawer
      setSelectedStore: (storeKey: string | null) => {
        set({ selectedStoreKey: storeKey });
      },

      // Set polling state
      setIsPollingActive: (active: boolean) => {
        set({ isPollingActive: active });
      },

      // Set checking prices state
      setIsCheckingPrices: (checking: boolean) => {
        set({ isCheckingPrices: checking });
      },

      // Set pricing mode and recalculate subtotals
      setPricingMode: (mode: 'store' | '/ea') => {
        set({ pricingMode: mode });
        // Recalculate subtotals for current list (set() is synchronous in Zustand)
        const listId = get().selectedListId;
        if (listId) {
          get().calculateStoreSubtotals(listId);
        }
      },

      // Set stores being searched (for immediate UI feedback), keyed per list
      setSearchingStores: (listId, stores) => {
        const state = get();
        set({
          searchingStoresMap: {
            ...state.searchingStoresMap,
            [listId]: stores,
          },
        });
      },

      // Track which list has an active price check
      setPriceCheckListId: (listId) => {
        set({ priceCheckListId: listId });
      },

      // Fetch price data for a list from API
      fetchListPriceData: async (listId: string) => {
        if (!listId) return;

        try {
          const apiData = await getShoppingDataForList(listId);
          const hasResults = apiData.results && Object.keys(apiData.results).length > 0;

          get().updateListPriceData(listId, {
            results: apiData.results || {},
            selections: apiData.selections || {},
            session_id: apiData.session_id || null,
            last_checked: apiData.last_checked || null,
            status: apiData.status,
            dataSource: 'api',
          });

          // If we have results, calculate subtotals and auto-select store
          if (hasResults) {
            // Calculate store subtotals
            get().calculateStoreSubtotals(listId);

            // Auto-select the cheapest store if none selected
            const state = get();
            const priceData = state.listPriceDataMap[listId];
            if (priceData && priceData.storeSubtotals && !state.selectedStoreKey) {
              const sortedStores = Object.entries(priceData.storeSubtotals)
                .filter(([, data]) => data.total > 0)
                .sort((a, b) => a[1].total - b[1].total);

              if (sortedStores.length > 0) {
                set({ selectedStoreKey: sortedStores[0][0] });
              }
            }

            // Heal-on-load: if list has subtotals but no saved savings, save them now
            const listObj = state.lists.find(l => l.id === listId);
            const subtotals = priceData?.storeSubtotals || {};
            if (listObj && !listObj.price_comparison_updated_at && apiData.status === 'completed') {
              const storeEntries = Object.entries(subtotals)
                .filter(([, d]) => d.total > 0)
                .map(([name, d]) => ({ name, total: d.total }));

              if (storeEntries.length >= 2) {
                const sorted = storeEntries.sort((a, b) => a.total - b.total);
                const cheapest = sorted[0];
                const mostExpensive = sorted[sorted.length - 1];
                const savingsAmount = mostExpensive.total - cheapest.total;
                const savingsPercent = mostExpensive.total > 0
                  ? (savingsAmount / mostExpensive.total) * 100 : 0;

                updateGroceryListSavings(listId, {
                  savings_amount: parseFloat(savingsAmount.toFixed(2)),
                  savings_percent: parseFloat(savingsPercent.toFixed(4)),
                  most_expensive_store_name: mostExpensive.name,
                  most_expensive_store_price: parseFloat(mostExpensive.total.toFixed(2)),
                  least_expensive_store_name: cheapest.name,
                  least_expensive_store_price: parseFloat(cheapest.total.toFixed(2)),
                }).then(() => {
                  // Update the list object with the new data
                  get().addOrUpdateList({
                    ...listObj,
                    savings_amount: parseFloat(savingsAmount.toFixed(2)),
                    savings_percent: parseFloat(savingsPercent.toFixed(4)),
                    most_expensive_store_name: mostExpensive.name,
                    most_expensive_store_price: parseFloat(mostExpensive.total.toFixed(2)),
                    least_expensive_store_name: cheapest.name,
                    least_expensive_store_price: parseFloat(cheapest.total.toFixed(2)),
                    price_comparison_updated_at: new Date().toISOString(),
                  });
                }).catch((_err) => {
                  console.error('[listStore] Heal-on-load savings save failed:');
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching shopping data for list ${listId}:`);
          get().updateListPriceData(listId, {
            results: {},
            selections: {},
            dataSource: 'api',
            status: 'error',
            storeSubtotals: {},
          });
        }
      },

      // Functional update for selections to avoid stale closures
      updateSelectionFunctional: (
        listId: string,
        itemName: string,
        storeName: string,
        product: SearchResultInDB
      ) => {
        const state = get();
        const currentDataForList = state.listPriceDataMap[listId] || {
          results: {},
          selections: {},
          storeSubtotals: {},
          dataSource: null,
          session_id: null,
          last_checked: null,
          status: undefined,
        };

        const latestSelections = currentDataForList.selections || {};
        const newSelections = {
          ...latestSelections,
          [itemName]: {
            ...(latestSelections[itemName] || {}),
            [storeName]: product,
          },
        };

        set({
          listPriceDataMap: {
            ...state.listPriceDataMap,
            [listId]: {
              ...currentDataForList,
              selections: newSelections,
            },
          },
        });
      },

      // Calculate store subtotals for a list
      calculateStoreSubtotals: (listId: string) => {
        const state = get();
        const currentData = state.listPriceDataMap[listId];
        if (!currentData) return;

        // Check if we have any data to work with
        const hasResults = currentData.results && Object.keys(currentData.results).length > 0;
        const hasSelections = currentData.selections && Object.keys(currentData.selections).length > 0;

        if (!hasResults && !hasSelections) {
          return;
        }

        const totals: Record<string, { total: number; itemCount: number }> = {};

        // Build item-to-category lookup for meat-aware pricing
        const list = state.lists.find(l => l.id === listId);
        const itemCategoryMap: Record<string, string> = {};
        if (list) {
          for (const item of list.items) {
            itemCategoryMap[item.name] = item.category || '';
          }
        }

        // If we have results, iterate through those to build store totals
        // Use selections if available, otherwise fall back to first product in results
        if (hasResults) {
          Object.entries(currentData.results).forEach(([itemName, storeProducts]) => {
            if (!storeProducts || typeof storeProducts !== 'object') return;

            Object.entries(storeProducts).forEach(([storeName, products]) => {
              if (!Array.isArray(products) || products.length === 0) return;

              // Get selection if available, otherwise use first product
              const selection = currentData.selections?.[itemName]?.[storeName];
              const product = selection || products[0];

              if (!product) return;

              // Skip products with name "Nothing" or price "$0.00"
              if (product.name === 'Nothing' || product.price === '$0.00') {
                return;
              }

              if (!totals[storeName]) {
                totals[storeName] = { total: 0, itemCount: 0 };
              }

              const mode = get().pricingMode;
              let priceValue = 0;
              const p = product as any;

              if (mode === '/ea') {
                if (isMeatCategory(itemCategoryMap[itemName]) && p.pricePer100g != null) {
                  priceValue = p.pricePer100g;
                } else if (isProduceCategory(itemCategoryMap[itemName]) && p.pricePerEach != null) {
                  priceValue = p.pricePerEach;
                }
              }
              if (priceValue === 0) {
                // Store mode, or /ea mode without pricePerEach — use store price
                const priceStr = product.price || '0';
                try {
                  if (typeof priceStr === 'string') {
                    const numericPart = priceStr.replace(/[$£€]/g, '').trim();
                    priceValue = parseFloat(numericPart) || 0;
                  } else if (typeof priceStr === 'number') {
                    priceValue = priceStr;
                  }
                } catch {
                  priceValue = 0;
                }
              }

              const itemObj = list?.items.find(it => it.name === itemName);
              const qty = itemObj?.priceQty ?? 1;
              totals[storeName].total += priceValue * qty;
              totals[storeName].itemCount += 1;
            });
          });
        } else if (hasSelections) {
          // Fallback: only selections available (legacy behavior)
          Object.entries(currentData.selections).forEach(([itemName, storeSelections]) => {
            if (!storeSelections) return;

            Object.entries(storeSelections).forEach(([storeName, product]) => {
              if (!product) return;

              if (product.name === 'Nothing' || product.price === '$0.00') {
                return;
              }

              if (!totals[storeName]) {
                totals[storeName] = { total: 0, itemCount: 0 };
              }

              const priceStr = product.price || '0';
              let priceValue = 0;

              try {
                if (typeof priceStr === 'string') {
                  const numericPart = priceStr.replace(/[$£€]/g, '').trim();
                  priceValue = parseFloat(numericPart) || 0;
                } else if (typeof priceStr === 'number') {
                  priceValue = priceStr;
                }
              } catch {
                priceValue = 0;
              }

              const itemObj = list?.items.find(it => it.name === itemName);
              const qty = itemObj?.priceQty ?? 1;
              totals[storeName].total += priceValue * qty;
              totals[storeName].itemCount += 1;
            });
          });
        }

        if (Object.keys(totals).length > 0) {
          const needsUpdate = !isEqual(totals, currentData.storeSubtotals);
          if (needsUpdate) {
            get().updateListPriceData(listId, { storeSubtotals: totals });
          }
        }
      },

      // Get the currently selected list object
      getSelectedList: () => {
        const state = get();
        if (!state.selectedListId) return null;
        return state.lists.find(l => l.id === state.selectedListId) || null;
      },

      // Get price data for current list
      getCurrentListPriceData: () => {
        const state = get();
        if (!state.selectedListId) return null;
        return state.listPriceDataMap[state.selectedListId] || {
          results: {},
          selections: {},
          storeSubtotals: {},
          dataSource: null,
          session_id: null,
          last_checked: null,
          status: undefined,
        };
      },

      // Add or update a list in the store
      addOrUpdateList: (list: SavedGroceryList) => {
        const state = get();
        const existingIndex = state.lists.findIndex(l => l.id === list.id);

        let newLists: SavedGroceryList[];
        if (existingIndex >= 0) {
          // Update existing
          newLists = [...state.lists];
          newLists[existingIndex] = list;
        } else {
          // Add new at the beginning
          newLists = [list, ...state.lists];
        }

        // Sort by createdAt descending
        newLists.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        set({ lists: newLists });
      },

      // Update an item's name in a list (optimistic update with rollback)
      renameList: async (listId: string, newName: string) => {
        const state = get();
        const list = state.lists.find(l => l.id === listId);
        if (!list || list.name === newName) return;

        // Optimistic update
        const newLists = state.lists.map(l =>
          l.id === listId ? { ...l, name: newName } : l
        );
        set({ lists: newLists });

        try {
          await renameGroceryList(listId, newName);
        } catch (error) {
          console.error('Failed to rename list:');
          set({ lists: state.lists });
          throw error;
        }
      },

      updateItemName: async (listId: string, oldName: string, newName: string) => {
        const state = get();
        const list = state.lists.find(l => l.id === listId);
        if (!list) return;

        // Skip if name unchanged
        if (oldName === newName) return;

        // Optimistic update
        const updatedItems = list.items.map(item =>
          item.name === oldName ? { ...item, name: newName } : item
        );
        const optimisticList = { ...list, items: updatedItems };

        // Update store optimistically
        const newLists = state.lists.map(l =>
          l.id === listId ? optimisticList : l
        );
        set({ lists: newLists });

        try {
          // Only persist to API if user is authenticated
          const authService = (await import('@/services/authService')).default;
          if (authService.isAuthenticated()) {
            await updateGroceryListItems(listId, updatedItems);
          }
        } catch (error) {
          // Rollback on error
          console.error('Failed to update item name:');
          set({ lists: state.lists });
          throw error;
        }
      },

      // Delete an item from a list (optimistic update with rollback)
      deleteItem: async (listId: string, itemName: string) => {
        const state = get();
        const list = state.lists.find(l => l.id === listId);
        if (!list) return;

        // Optimistic update
        const updatedItems = list.items.filter(item => item.name !== itemName);
        const optimisticList = { ...list, items: updatedItems };

        // Update store optimistically
        const newLists = state.lists.map(l =>
          l.id === listId ? optimisticList : l
        );
        set({ lists: newLists });

        // Remove deleted item from price data (results & selections) and recalculate subtotals
        const priceData = state.listPriceDataMap[listId];
        if (priceData) {
          const newResults = { ...priceData.results };
          const newSelections = { ...priceData.selections };
          delete newResults[itemName];
          delete newSelections[itemName];

          get().updateListPriceData(listId, {
            results: newResults,
            selections: newSelections,
          });
          get().calculateStoreSubtotals(listId);
        }

        try {
          // Only persist to API if user is authenticated
          const authService = (await import('@/services/authService')).default;
          if (authService.isAuthenticated()) {
            await updateGroceryListItems(listId, updatedItems);
          }
        } catch (error) {
          // Rollback on error
          console.error('Failed to delete item:');
          set({ lists: state.lists });
          // Restore price data too
          if (priceData) {
            get().updateListPriceData(listId, {
              results: priceData.results,
              selections: priceData.selections,
            });
            get().calculateStoreSubtotals(listId);
          }
          throw error;
        }
      },

      // Update item quantity with optimistic update and debounced API persistence
      updateItemQuantity: (listId: string, itemName: string, quantity: number) => {
        const state = get();
        const list = state.lists.find(l => l.id === listId);
        if (!list) return;

        const clampedQty = Math.max(1, Math.min(99, quantity));
        const updatedItems = list.items.map(item =>
          item.name === itemName ? { ...item, priceQty: clampedQty } : item
        );
        const optimisticList = { ...list, items: updatedItems };

        // Optimistic update
        const newLists = state.lists.map(l =>
          l.id === listId ? optimisticList : l
        );
        set({ lists: newLists });

        // Recalculate subtotals immediately
        get().calculateStoreSubtotals(listId);

        // Debounced API persistence
        if (_qtyDebounceTimer) clearTimeout(_qtyDebounceTimer);
        _qtyDebounceTimer = setTimeout(async () => {
          try {
            const authService = (await import('@/services/authService')).default;
            if (authService.isAuthenticated()) {
              const currentList = get().lists.find(l => l.id === listId);
              if (currentList) {
                await updateGroceryListItems(listId, currentList.items);
              }
            }
          } catch (error) {
            console.error('Failed to persist quantity update:');
          }
        }, 500);
      },
    }),
    {
      name: 'savr-list-storage',
      storage: createJSONStorage(() => userScopedStateStorage),
      partialize: (state) => ({
        selectedListId: state.selectedListId,
        drawerState: state.drawerState,
        // Don't persist listPriceDataMap to avoid stale data
      }),
    }
  )
);

export default useListStore;
