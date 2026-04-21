import { useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import useListStore from '@/stores/listStore';
import {
  checkPricesDirectly,
  getShoppingDataForList,
} from '@/services/shoppingService';
import storeService, { UserSelectedStore } from '@/services/storeService';
import { SavedGroceryList, saveGroceryList, updateGroceryListSavings } from '@/services/groceryListService';
import { formatStoreName } from '@/lib/storeUtils';

export interface UsePriceCheckOptions {
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function usePriceCheck(options?: UsePriceCheckOptions) {
  const { toast } = useToast();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchStartTimeRef = useRef<number | null>(null);
  const staleSessionIdRef = useRef<string | null>(null);

  const {
    updateListPriceData,
    calculateStoreSubtotals,
    setSelectedStore,
    setIsPollingActive,
    setIsCheckingPrices,
    setSearchingStores,
    setPriceCheckListId,
    isPollingActive,
    isCheckingPrices,
    addOrUpdateList,
    selectList,
  } = useListStore();

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    // Clear per-list searching stores for the active price check list
    const activeListId = useListStore.getState().priceCheckListId;
    if (activeListId) {
      setSearchingStores(activeListId, []);
    }
    setIsPollingActive(false);
    setIsCheckingPrices(false);
    setPriceCheckListId(null);
    searchStartTimeRef.current = null;
  }, [setIsPollingActive, setIsCheckingPrices, setSearchingStores, setPriceCheckListId]);

  // Start polling for results
  const startPolling = useCallback((listId: string) => {
    setIsPollingActive(true);

    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    let pollCount = 0;
    const maxPolls = 600; // Poll for up to 10 minutes (600 * 1s)

    pollingIntervalRef.current = setInterval(async () => {
      pollCount++;
      try {
        const data = await getShoppingDataForList(listId);

        // Skip stale data from previous session
        if (staleSessionIdRef.current && data.session_id === staleSessionIdRef.current) {
          return;
        }
        // Once we see a new session, clear the stale ref
        if (staleSessionIdRef.current && data.session_id !== staleSessionIdRef.current) {
          staleSessionIdRef.current = null;
        }

        const hasResults = Object.keys(data.results || {}).length > 0;

        // Build update payload
        const payloadForUpdate: Parameters<typeof updateListPriceData>[1] = {
          dataSource: 'api',
          status: data.status,
          session_id: data.session_id !== undefined ? data.session_id : null,
          last_checked: data.last_checked !== undefined ? data.last_checked : null,
        };

        // Handle results - only include if we have data or session is terminal
        if (data.results && Object.keys(data.results).length > 0) {
          payloadForUpdate.results = data.results;
        } else if (data.status === 'completed' || data.status === 'failed') {
          payloadForUpdate.results = data.results || {};
        }

        // Handle selections with the same logic
        if (data.selections && Object.keys(data.selections).length > 0) {
          payloadForUpdate.selections = data.selections;
        } else if (data.status === 'completed' || data.status === 'failed') {
          payloadForUpdate.selections = data.selections || {};
        }

        updateListPriceData(listId, payloadForUpdate);

        // Calculate store subtotals if we have results (drives store tabs UI)
        if (hasResults) {
          calculateStoreSubtotals(listId);

          // Auto-select cheapest store if none selected or current selection has no data
          const currentStore = useListStore.getState().selectedStoreKey;
          const state = useListStore.getState();
          const priceData = state.listPriceDataMap[listId];
          const currentStoreHasData = currentStore && priceData?.storeSubtotals?.[currentStore]?.total > 0;
          if (!currentStoreHasData && priceData?.storeSubtotals) {
            const sortedStores = Object.entries(priceData.storeSubtotals)
              .filter(([, d]) => d.total > 0)
              .sort((a, b) => a[1].total - b[1].total);
            if (sortedStores.length > 0) {
              setSelectedStore(sortedStores[0][0]);
            }
          }
        }

        // Check if we should stop polling
        const sessionOver = data.status === 'completed' || data.status === 'failed';

        if (sessionOver) {

          // Calculate search stats BEFORE stopPolling() clears searchStartTimeRef
          const elapsedMs = searchStartTimeRef.current ? Date.now() - searchStartTimeRef.current : 0;
          const elapsedSeconds = Math.round(elapsedMs / 1000);

          stopPolling();

          // Count stores and products
          const storeSet = new Set<string>();
          let totalProducts = 0;

          if (data.results) {
            Object.values(data.results).forEach((storeProducts: Record<string, unknown[]>) => {
              if (storeProducts && typeof storeProducts === 'object') {
                Object.entries(storeProducts).forEach(([storeName, products]) => {
                  storeSet.add(storeName);
                  if (Array.isArray(products)) {
                    totalProducts += products.length;
                  }
                });
              }
            });
          }

          const storeCount = storeSet.size;

          // Calculate savings
          let savingsInfo = '';
          if (hasResults && data.results) {
            const quickSubtotals: Record<string, number> = {};

            Object.entries(data.results).forEach(([itemName, storeProducts]) => {
              Object.entries(storeProducts || {}).forEach(([storeName, products]) => {
                if (Array.isArray(products) && products.length > 0) {
                  const selection = data.selections?.[itemName]?.[storeName];
                  const product = selection || products[0];
                  const priceStr = product?.price || '';
                  const price = parseFloat(priceStr.replace(/[^0-9.]/g, '') || '0');

                  if (price > 0) {
                    quickSubtotals[storeName] = (quickSubtotals[storeName] || 0) + price;
                  }
                }
              });
            });

            const stores = Object.entries(quickSubtotals)
              .filter(([, total]) => total > 0)
              .sort((a, b) => a[1] - b[1]);

            if (stores.length >= 2) {
              const [cheapestStore, cheapestTotal] = stores[0];
              const [, expensiveTotal] = stores[stores.length - 1];
              const savings = expensiveTotal - cheapestTotal;
              const savingsPercent = Math.round((savings / expensiveTotal) * 100);

              if (savings > 0) {
                savingsInfo = ` Save $${savings.toFixed(2)} (${savingsPercent}%) at ${formatStoreName(cheapestStore)}!`;
              }
            }
          }

          // Build description message
          let description = '';
          if (data.status === 'completed' && hasResults) {
            description = `Checked ${storeCount} store${storeCount !== 1 ? 's' : ''}, found ${totalProducts} products in ${elapsedSeconds}s.${savingsInfo}`;
          } else if (data.status === 'completed') {
            description = 'Search completed. Some items may not be available at selected stores.';
          } else {
            description = 'Search session ended. Check results or try again.';
          }

          toast({
            title: data.status === 'completed' ? 'Price Check Complete!' : 'Search Failed',
            description,
            variant: data.status === 'completed' ? 'default' : 'destructive',
          });

          // Save price comparison / savings data to database
          if (data.status === 'completed' && hasResults) {
            try {
              // Read the latest subtotals from the store (just calculated above)
              const latestState = useListStore.getState();
              const latestPriceData = latestState.listPriceDataMap[listId];
              const subtotals = latestPriceData?.storeSubtotals || {};

              const storeEntries = Object.entries(subtotals)
                .filter(([, d]) => d.total > 0)
                .map(([name, d]) => ({ name, total: d.total }));

              if (storeEntries.length >= 2) {
                const sorted = storeEntries.sort((a, b) => a.total - b.total);
                const cheapest = sorted[0];
                const mostExpensive = sorted[sorted.length - 1];
                const savingsAmount = mostExpensive.total - cheapest.total;
                const savingsPercent = mostExpensive.total > 0
                  ? (savingsAmount / mostExpensive.total) * 100
                  : 0;

                await updateGroceryListSavings(listId, {
                  savings_amount: parseFloat(savingsAmount.toFixed(2)),
                  savings_percent: parseFloat(savingsPercent.toFixed(4)),
                  most_expensive_store_name: mostExpensive.name,
                  most_expensive_store_price: parseFloat(mostExpensive.total.toFixed(2)),
                  least_expensive_store_name: cheapest.name,
                  least_expensive_store_price: parseFloat(cheapest.total.toFixed(2)),
                });

                // Update the list in store so UI reflects the saved data
                const updatedList = latestState.lists.find(l => l.id === listId);
                if (updatedList) {
                  latestState.addOrUpdateList({
                    ...updatedList,
                    savings_amount: parseFloat(savingsAmount.toFixed(2)),
                    savings_percent: parseFloat(savingsPercent.toFixed(4)),
                    most_expensive_store_name: mostExpensive.name,
                    most_expensive_store_price: parseFloat(mostExpensive.total.toFixed(2)),
                    least_expensive_store_name: cheapest.name,
                    least_expensive_store_price: parseFloat(cheapest.total.toFixed(2)),
                    price_comparison_updated_at: new Date().toISOString(),
                  });
                }

              }
            } catch (savingsError) {
              console.error('[usePriceCheck] Error saving price comparison data:', savingsError);
              // Non-critical — don't fail the whole flow
            }
          }

          options?.onComplete?.();
        } else if (pollCount >= maxPolls) {
          stopPolling();
        }
      } catch (err) {
        console.error('[usePriceCheck] Error fetching data:');
        // Don't stop polling on error - let it retry
      }
    }, 1000);
  }, [updateListPriceData, calculateStoreSubtotals, setSelectedStore, setIsPollingActive, stopPolling, toast, options]);

  // Start a price check
  const startPriceCheck = useCallback(
    async (list: SavedGroceryList) => {
      if (!list) {
        toast({ title: 'No list selected', variant: 'warning' });
        return;
      }

      setIsCheckingPrices(true);
      searchStartTimeRef.current = Date.now();

      // Track the list to use for price check (may be updated if we save a temp list)
      let listToUse = list;

      try {
        // If this is a temporary list (from chat), save it to the database first
        // The backend requires a real grocery_list_id due to foreign key constraints
        if (list.id.startsWith('temp-')) {
          try {
            const savedList = await saveGroceryList({
              name: list.name,
              items: list.items,
            });

            // Update the store with the saved list
            addOrUpdateList(savedList);
            // Select the new list so the UI updates
            selectList(savedList.id);

            // Use the saved list for price check
            listToUse = savedList;
          } catch (saveError) {
            console.error('[usePriceCheck] Failed to save temp list:', saveError);
            toast({
              title: 'Error Saving List',
              description: 'Failed to save the list before checking prices. Please try again.',
              variant: 'destructive',
            });
            setIsCheckingPrices(false);
            return { success: false };
          }
        }

        // Clear previous data for this list
        updateListPriceData(listToUse.id, {
          results: {},
          selections: {},
          storeSubtotals: {},
          status: 'pending',
          session_id: null,
          last_checked: null,
          dataSource: 'api',
        });

        // Fetch user's selected stores
        let storesToSearch: UserSelectedStore[] = [];
        try {
          storesToSearch = await storeService.getUserSelectedStores();
        } catch (e) {
          console.error('[usePriceCheck] Error fetching stores:');
          toast({ title: 'Error Fetching Stores', variant: 'destructive' });
          setIsCheckingPrices(false);
          return { success: false, needsStoreSelection: true };
        }

        if (!storesToSearch || storesToSearch.length === 0) {
          toast({
            title: 'No stores selected',
            description: 'Please select at least one store to check prices.',
            variant: 'warning',
          });
          setIsCheckingPrices(false);
          return { success: false, needsStoreSelection: true };
        }

        // Set searching stores immediately for UI feedback (shows store tabs with logos)
        // Keyed per-list so switching lists doesn't bleed tiles
        setPriceCheckListId(listToUse.id);
        setSearchingStores(listToUse.id, storesToSearch);

        // Initiate the backend search
        const itemNames = listToUse.items.map(item => item.name);
        const storesPayload = storesToSearch.map(s => ({
          store_name: s.store_name,
          postal_code: s.postal_code,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
          retailer_store_id: s.retailer_store_id,
          brand: s.brand,
        }));

        // Record the current session_id so polling skips stale data
        staleSessionIdRef.current = useListStore.getState().listPriceDataMap[listToUse.id]?.session_id || null;

        // Start polling FIRST — picks up results as backend processes each term
        startPolling(listToUse.id);

        // Fire POST without blocking — backend continues processing regardless
        checkPricesDirectly(storesPayload, itemNames, listToUse.id)
          .then(_checkResponse => {
          })
          .catch(error => {
            console.error('[usePriceCheck] Error in backend search:');
            if (!(error instanceof Error && error.message.includes('timeout'))) {
              // Real error (not timeout) — stop polling, show error
              stopPolling();
              toast({ title: 'Search error', description: 'Error starting search.', variant: 'warning' });
              options?.onError?.(error instanceof Error ? error : new Error('Unknown error'));
            }
            // Timeout is OK — backend continues processing, polling picks up results
          });

        return { success: true };
      } catch (err) {
        console.error('[usePriceCheck] Critical error:');
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
        setIsCheckingPrices(false);
        const activeListId = useListStore.getState().priceCheckListId;
        if (activeListId) {
          setSearchingStores(activeListId, []);
        }
        setPriceCheckListId(null);
        options?.onError?.(err instanceof Error ? err : new Error('Unknown error'));
        return { success: false };
      }
    },
    [toast, setIsCheckingPrices, setSearchingStores, setPriceCheckListId, updateListPriceData, startPolling, stopPolling, options, addOrUpdateList, selectList]
  );

  return {
    startPriceCheck,
    startPolling,
    stopPolling,
    isPollingActive,
    isCheckingPrices,
  };
}
