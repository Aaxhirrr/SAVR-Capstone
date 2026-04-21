import { useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import useListStore from '@/stores/listStore';
import {
  checkPricesDirectly,
  getShoppingDataForList,
} from '@/services/shoppingService';
import storeService, { UserSelectedStore } from '@/services/storeService';
import { SavedGroceryList, saveGroceryList } from '@/services/groceryListService';
import { formatStoreName } from '@/lib/storeUtils';

export interface UsePriceCheckOptions {
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function usePriceCheck(options?: UsePriceCheckOptions) {
  const { toast } = useToast();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchStartTimeRef = useRef<number | null>(null);

  const {
    updateListPriceData,
    calculateStoreSubtotals,
    setSelectedStore,
    setIsPollingActive,
    setIsCheckingPrices,
    setSearchingStores,
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
    setIsPollingActive(false);
    setIsCheckingPrices(false);
    setSearchingStores([]);
    searchStartTimeRef.current = null;
  }, [setIsPollingActive, setIsCheckingPrices, setSearchingStores]);

  // Start polling for results
  const startPolling = useCallback((listId: string) => {
    console.log(`[usePriceCheck] Starting polling for list ${listId}`);
    setIsPollingActive(true);

    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    let pollCount = 0;
    const maxPolls = 240; // Poll for up to 10 minutes (240 * 2.5s)

    pollingIntervalRef.current = setInterval(async () => {
      pollCount++;
      try {
        console.log(`[usePriceCheck] Fetching data for list ${listId} (poll #${pollCount})`);
        const data = await getShoppingDataForList(listId);

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

          // Auto-select cheapest store if none selected
          // Use getState() to read the latest value, not the stale closure value
          if (!useListStore.getState().selectedStoreKey) {
            const state = useListStore.getState();
            const priceData = state.listPriceDataMap[listId];
            if (priceData?.storeSubtotals) {
              const sortedStores = Object.entries(priceData.storeSubtotals)
                .filter(([, d]) => d.total > 0)
                .sort((a, b) => a[1].total - b[1].total);
              if (sortedStores.length > 0) {
                setSelectedStore(sortedStores[0][0]);
              }
            }
          }
        }

        // Check if we should stop polling
        const sessionOver = data.status === 'completed' || data.status === 'failed';

        if (sessionOver) {
          console.log(`[usePriceCheck] Stopping - Search session status: '${data.status}'`);
          stopPolling();

          // Calculate search stats
          const elapsedMs = searchStartTimeRef.current ? Date.now() - searchStartTimeRef.current : 0;
          const elapsedSeconds = Math.round(elapsedMs / 1000);

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

          options?.onComplete?.();
        } else if (pollCount >= maxPolls) {
          console.log(`[usePriceCheck] Stopping - max polls reached (${maxPolls})`);
          stopPolling();
        }
      } catch (err) {
        console.error('[usePriceCheck] Error fetching data:', err);
        // Don't stop polling on error - let it retry
      }
    }, 2500);
  }, [updateListPriceData, calculateStoreSubtotals, setSelectedStore, setIsPollingActive, stopPolling, toast, options]);

  // Start a price check
  const startPriceCheck = useCallback(
    async (list: SavedGroceryList) => {
      if (!list) {
        toast({ title: 'No List Selected', variant: 'destructive' });
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
          console.log('[usePriceCheck] Saving temp list to database before price check...');
          try {
            const savedList = await saveGroceryList({
              name: list.name,
              items: list.items,
            });
            console.log('[usePriceCheck] Temp list saved with ID:', savedList.id);

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
          console.error('[usePriceCheck] Error fetching stores:', e);
          toast({ title: 'Error Fetching Stores', variant: 'destructive' });
          setIsCheckingPrices(false);
          return { success: false, needsStoreSelection: true };
        }

        if (!storesToSearch || storesToSearch.length === 0) {
          toast({
            title: 'No Stores Selected',
            description: 'Please select at least one store to check prices.',
          });
          setIsCheckingPrices(false);
          return { success: false, needsStoreSelection: true };
        }

        // Set searching stores immediately for UI feedback (shows store tabs with logos)
        setSearchingStores(storesToSearch);

        toast({
          title: 'Price Check Started',
          description: 'Checking store websites for the latest pricing and availability. This may take a few minutes.',
        });

        // Initiate the backend search
        const itemNames = listToUse.items.map(item => item.name);
        const storesPayload = storesToSearch.map(s => ({
          store_name: s.store_name,
          postal_code: s.postal_code,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
        }));

        try {
          const checkResponse = await checkPricesDirectly(storesPayload, itemNames, listToUse.id);
          console.log('[usePriceCheck] Response from checkPricesDirectly:', checkResponse);

          // Start polling after backend session is created
          startPolling(listToUse.id);

          if (checkResponse.message) {
            toast({ title: 'Search Update', description: checkResponse.message });
          }

          return { success: true };
        } catch (error) {
          console.error('[usePriceCheck] Error in backend search:', error);
          if (error instanceof Error && error.message.includes('timeout')) {
            toast({ title: 'Search in Progress', description: 'Search continues in background.' });
            startPolling(listToUse.id);
            return { success: true };
          } else {
            toast({ title: 'Search Error', description: 'Error starting search.', variant: 'default' });
            setIsCheckingPrices(false);
            setSearchingStores([]);
            options?.onError?.(error instanceof Error ? error : new Error('Unknown error'));
            return { success: false };
          }
        }
      } catch (err) {
        console.error('[usePriceCheck] Critical error:', err);
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
        setIsCheckingPrices(false);
        setSearchingStores([]);
        options?.onError?.(err instanceof Error ? err : new Error('Unknown error'));
        return { success: false };
      }
    },
    [toast, setIsCheckingPrices, setSearchingStores, updateListPriceData, startPolling, options, addOrUpdateList, selectList]
  );

  return {
    startPriceCheck,
    startPolling,
    stopPolling,
    isPollingActive,
    isCheckingPrices,
  };
}
