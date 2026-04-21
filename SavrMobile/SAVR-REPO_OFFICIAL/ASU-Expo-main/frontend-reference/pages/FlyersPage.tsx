import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, ArrowUpDown, Loader2, Newspaper, Tag, Calendar, X, Plus, ListPlus, Check, Store, LayoutGrid, List } from 'lucide-react';
import storeService, { UserSelectedStore } from '@/services/storeService';
import flyerService, { FlyerDeal, FlyerDealPage } from '@/services/flyerService';
import { getUserGroceryLists, SavedGroceryList } from '@/services/groceryListService';
import useListStore from '@/stores/listStore';
import { getStoreLogo } from '@/utils/storeBrandAssets';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { extractStreetFromAddress } from '@/lib/storeUtils';
import { StoreSelectorDialog } from '@/components/store-selector/StoreSelectorDialog';

const PAGE_SIZE = 50;

/** Derive a brand key from store_name (e.g. "No Frills Kanata" -> "nofrills") */
function storeBrandKey(storeName: string): string {
  const n = storeName.toLowerCase();
  if (n.includes('no frills') || n.includes('nofrills')) return 'nofrills';
  if (n.includes('food basics') || n.includes('foodbasics')) return 'foodbasics';
  if (n.includes('atlantic') && n.includes('superstore')) return 'atlanticsuperstore';
  if (n.includes('superstore')) return 'superstore';
  if (n.includes('loblaw')) return 'loblaws';
  if (n.includes('independent')) return 'independent';
  if (n.includes('giant') && n.includes('tiger')) return 'gianttiger';
  if (n.includes('metro')) return 'metro';
  if (n.includes('iga')) return 'iga';
  if (n.includes('sobey')) return 'sobeys';
  if (n.includes('safeway')) return 'safeway';
  if (n.includes('walmart')) return 'walmart';
  if (n.includes('zehrs')) return 'zehrs';
  if (n.includes('fortinos')) return 'fortinos';
  if (n.includes('maxi')) return 'maxi';
  if (n.includes('valu') || n.includes('value')) return 'valumart';
  if (n.includes('freshco')) return 'freshco';
  if (n.includes('foodland')) return 'foodland';
  if (n.includes('t&t') || n.includes('tnt')) return 'tnt';
  return storeName.toLowerCase().replace(/\s+/g, '');
}

/** Format price ensuring $ prefix and 2 decimal places */
function fmtPrice(price: string): string {
  if (!price) return '';
  const num = parseFloat(price.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return price;
  return `$${num.toFixed(2)}`;
}

type SortField = 'product_name' | 'brand' | 'price' | 'sale_story' | 'valid_to';
type SortDir = 'asc' | 'desc';
type ViewMode = 'list' | 'card';

export default function FlyersPage() {
  const [stores, setStores] = useState<UserSelectedStore[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('product_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deals, setDeals] = useState<FlyerDeal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Map<string, string>>(new Map());
  const [isAdding, setIsAdding] = useState(false);
  const [showListPicker, setShowListPicker] = useState(false);
  const [userLists, setUserLists] = useState<SavedGroceryList[]>([]);
  const [newListName, setNewListName] = useState('');
  const [showNewListInput, setShowNewListInput] = useState(false);

  const { toast } = useToast();
  const fetchLists = useListStore((s) => s.fetchLists);

  // Keep a ref of selectedIds so async callbacks never read stale closures
  const selectedIdsRef = useRef<Map<string, string>>(selectedIds);
  selectedIdsRef.current = selectedIds;


  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Function to refresh stores
  const refreshStores = useCallback(async () => {
    try {
      const s = await storeService.getUserSelectedStores();
      setStores(s);
      if (s.length > 0 && !selectedBrand) {
        setSelectedBrand(storeBrandKey(s[0].store_name));
      }
      setInitialLoad(false);
    } catch (error) {
      setInitialLoad(false);
    }
  }, [selectedBrand]);

  // Load user's selected stores
  useEffect(() => {
    refreshStores();
  }, [refreshStores]);

  // Refresh stores periodically and when page becomes visible
  useEffect(() => {
    // Refresh stores every 5 seconds when page is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        refreshStores();
      }
    }, 5000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshStores();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshStores]);

  // Clear selection when brand changes
  useEffect(() => {
    setSelectedIds(new Map());
  }, [selectedBrand]);

  // Fetch deals when brand/search/sort changes (reset to page 1)
  const fetchDeals = useCallback(async (append = false) => {
    if (!selectedBrand) return;
    const p = append ? page : 1;
    if (!append) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const data: FlyerDealPage = await flyerService.getFlyers({
        store_brand: selectedBrand,
        search: debouncedSearch || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        page: p,
        page_size: PAGE_SIZE,
      });
      if (append) {
        setDeals((prev) => [...prev, ...data.deals]);
      } else {
        setDeals(data.deals);
      }
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch flyers:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedBrand, debouncedSearch, sortBy, sortDir, page]);

  // When brand/search/sort changes, fetch fresh
  useEffect(() => {
    if (selectedBrand) {
      fetchDeals(false);
    }
  }, [selectedBrand, debouncedSearch, sortBy, sortDir]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && deals.length < total) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, deals.length, total]);

  // Load more when page increments
  useEffect(() => {
    if (page > 1) {
      fetchDeals(true);
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  };

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        const deal = deals.find((d) => d.id === id);
        if (deal) next.set(id, deal.product_name);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === deals.length) {
      setSelectedIds(new Map());
    } else {
      setSelectedIds(new Map(deals.map((d) => [d.id, d.product_name])));
    }
  };

  const getSelectedNames = () => {
    return Array.from(selectedIdsRef.current.values());
  };

  // Add to list actions
  const handleNewList = async () => {
    const name = newListName.trim();
    if (!name) return;
    const names = getSelectedNames();
    if (names.length === 0) return;
    setIsAdding(true);
    try {
      const result = await flyerService.addToList({ item_names: names, new_list_name: name });
      const skipMsg = result.items_skipped > 0 ? ` (${result.items_skipped} duplicates skipped)` : '';
      toast({ title: 'List Created', description: `Created "${result.list_name}" with ${result.items_added} items${skipMsg}` });
      setSelectedIds(new Map());
      setShowNewListInput(false);
      setNewListName('');
      fetchLists();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create list', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToExisting = async (listId: string, listName: string) => {
    const names = getSelectedNames();
    if (names.length === 0) return;
    setIsAdding(true);
    setShowListPicker(false);
    try {
      const result = await flyerService.addToList({ item_names: names, list_id: listId });
      const skipMsg = result.items_skipped > 0 ? ` (${result.items_skipped} duplicates skipped)` : '';
      toast({ title: 'Items Added', description: `Added ${result.items_added} items to "${listName}"${skipMsg}` });
      setSelectedIds(new Map());
      fetchLists();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add items', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const openListPicker = async () => {
    try {
      const lists = await getUserGroceryLists();
      setUserLists(lists.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
    } catch {
      setUserLists([]);
    }
    setShowListPicker(true);
  };

  // Build per-brand store info (first matching store for address display)
  const brandStoreMap = new Map<string, UserSelectedStore>();
  for (const s of stores) {
    const key = storeBrandKey(s.store_name);
    if (!brandStoreMap.has(key)) brandStoreMap.set(key, s);
  }
  const uniqueBrands = Array.from(brandStoreMap.keys());

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
        <Newspaper className="h-12 w-12 mb-4 opacity-40" />
        <h2 className="text-lg font-semibold mb-2">No Stores Selected</h2>
        <p className="text-sm">Select stores in your profile to browse their flyers.</p>
      </div>
    );
  }

  const allSelected = deals.length > 0 && selectedIds.size === deals.length;

  return (
    <div className="flex flex-col h-full pt-0 sm:pt-0">
      {/* Image lightbox dialog */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Product"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Store selector dialog */}
      <StoreSelectorDialog
        isOpen={showStoreSelector}
        onClose={() => setShowStoreSelector(false)}
        onStoresUpdated={async (updatedStores) => {
          // Optimistically update UI
          setStores(updatedStores);
          setSelectedBrand(null);
          setDeals([]);
          setTotal(0);
          setPage(1);

          try {
            // Calculate diffs
            const updatedIds = new Set(updatedStores.map(s => s.id).filter(id => id !== undefined));
            const toRemove = stores.filter(s => s.id && !updatedIds.has(s.id));
            const toAdd = updatedStores.filter(s => !s.id);

            // Execute removals
            await Promise.all(toRemove.map(store =>
              store.id ? storeService.removeUserSelectedStore(store.id) : Promise.resolve()
            ));

            // Execute additions
            await Promise.all(toAdd.map(store =>
              storeService.addUserSelectedStore({
                store_name: store.store_name,
                address: store.address,
                postal_code: store.postal_code,
                image_url: store.image_url,
                place_id: store.place_id,
                distance: store.distance,
                latitude: store.latitude,
                longitude: store.longitude
              })
            ));

            // Final sync with server to get assigned IDs
            const finalStores = await storeService.getUserSelectedStores();
            setStores(finalStores);
            if (finalStores.length > 0) {
              setSelectedBrand(storeBrandKey(finalStores[0].store_name));
            }
          } catch (err) {
            console.error('[FlyersPage] Failed to sync stores:', err);
            // Revert to server state
            try {
              const reverted = await storeService.getUserSelectedStores();
              setStores(reverted);
              if (reverted.length > 0) {
                setSelectedBrand(storeBrandKey(reverted[0].store_name));
              }
            } catch (e) {
              console.error('[FlyersPage] Critical failure reverting stores');
            }
          }
        }}
        initialSelected={stores}
      />

      {/* List picker popover */}
      {showListPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowListPicker(false)}>
          <div className="bg-white rounded-xl shadow-xl w-80 max-h-96 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-100 font-medium text-sm text-slate-700">Add to existing list</div>
            <div className="overflow-y-auto max-h-72">
              {userLists.length === 0 ? (
                <p className="p-4 text-sm text-slate-400 text-center">No lists yet</p>
              ) : (
                userLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleAddToExisting(list.id, list.name)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <span className="font-medium text-slate-700">{list.name}</span>
                    <span className="text-xs text-slate-400 ml-2">{list.items?.length || 0} items</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Store brand tabs - Sticky under header */}
      <div className="sticky  sm:top-0 z-40 bg-white border-b border-slate-200 px-3 pt-1 pb-3 space-y-3">
        <div className={cn(
          "flex gap-2",
          uniqueBrands.length <= 4 ? "justify-between" : "overflow-x-auto pb-1 scrollbar-hide"
        )}>
          {uniqueBrands.map((brand) => {
            const store = brandStoreMap.get(brand)!;
            const logo = getStoreLogo(brand);
            const shortAddress = store.address ? extractStreetFromAddress(store.address) : '';
            const isSelected = selectedBrand === brand;
            return (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={cn(
                  'flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition-all flex-1 min-w-0 border-2',
                  isSelected
                    ? 'bg-white dark:bg-slate-700 shadow-lg border-green-500 dark:border-green-400'
                    : 'bg-slate-50/80 dark:bg-slate-800/80 border-transparent hover:bg-white dark:hover:bg-slate-700 hover:shadow-md'
                )}
              >
                <img
                  src={logo}
                  alt={brand}
                  className="h-7 w-auto object-contain max-w-[90px]"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {shortAddress && (
                  <span className="text-[10px] text-muted-foreground mt-1.5 truncate w-full text-center px-1">
                    {shortAddress}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + sort controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>
          
          {/* Store selection button */}
          <button
            onClick={() => setShowStoreSelector(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Change stores"
          >
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Stores</span>
          </button>

          {/* View mode toggle */}
          <button
            onClick={() => setViewMode((m) => (m === 'list' ? 'card' : 'list'))}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title={viewMode === 'list' ? 'List view (tap to switch)' : 'Card view (tap to switch)'}
            aria-label={viewMode === 'list' ? 'List view (tap to switch)' : 'Card view (tap to switch)'}
          >
            {viewMode === 'list' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            <span className="hidden sm:inline">{viewMode === 'list' ? 'List' : 'Cards'}</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-1">
            {([
              ['product_name', 'Name'],
              ['brand', 'Brand'],
              ['price', 'Price'],
              ['sale_story', 'Sale'],
              ['valid_to', 'Expiry'],
            ] as [SortField, string][]).map(([field, label]) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  sortBy === field
                    ? 'bg-green-50 text-green-700'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {label}
                {sortBy === field && (
                  <ArrowUpDown className="h-3 w-3" />
                )}
              </button>
            ))}
          </div>
          {/* Mobile sort dropdown */}
          <select
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => {
              const [f, d] = e.target.value.split('-') as [SortField, SortDir];
              setSortBy(f);
              setSortDir(d);
            }}
            className="sm:hidden text-xs border border-slate-200 rounded-lg px-2 py-2 focus:outline-none"
          >
            <option value="product_name-asc">Name A-Z</option>
            <option value="product_name-desc">Name Z-A</option>
            <option value="brand-asc">Brand A-Z</option>
            <option value="brand-desc">Brand Z-A</option>
            <option value="price-asc">Price Low</option>
            <option value="price-desc">Price High</option>
            <option value="sale_story-asc">Sale A-Z</option>
            <option value="sale_story-desc">Sale Z-A</option>
            <option value="valid_to-asc">Expiring Soon</option>
            <option value="valid_to-desc">Expiring Last</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-green-500" />
          </div>
        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Newspaper className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No deals found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}</p>
          </div>
        ) : (
          <>
            <p className="px-4 pt-3 pb-1 text-xs text-slate-400">
              {total} deal{total !== 1 ? 's' : ''}
            </p>

            {viewMode === 'card' ? (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {deals.map((deal) => (
                    <DealGridCard
                      key={deal.id}
                      deal={deal}
                      formatDate={formatDate}
                      onImageClick={setLightboxUrl}
                      selected={selectedIds.has(deal.id)}
                      onToggle={() => toggleSelect(deal.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Mobile: Card layout */}
                <div className="sm:hidden px-4 pb-4 space-y-3">
                  {deals.map((deal) => (
                    <DealListCard
                      key={deal.id}
                      deal={deal}
                      formatDate={formatDate}
                      onImageClick={setLightboxUrl}
                      selected={selectedIds.has(deal.id)}
                      onToggle={() => toggleSelect(deal.id)}
                    />
                  ))}
                </div>

                {/* Desktop: Table layout */}
                <div className="hidden sm:block px-4 pb-4">
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col className="w-[36px]" />
                      <col className="w-[38%]" />
                      <col className="w-[14%]" />
                      <col className="w-[12%]" />
                      <col className="w-[17%]" />
                      <col className="w-[13%]" />
                    </colgroup>
                    <thead>
                      <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                        <th className="py-2 pl-1">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                          />
                        </th>
                        {([
                          ['product_name', 'Product', 'pl-2'],
                          ['brand', 'Brand', ''],
                          ['price', 'Price', ''],
                          ['sale_story', 'Sale', ''],
                          ['valid_to', 'Valid', ''],
                        ] as [SortField, string, string][]).map(([field, label, extra]) => (
                          <th
                            key={field}
                            className={cn('py-2 font-medium cursor-pointer select-none hover:text-slate-600 transition-colors', extra)}
                            onClick={() => toggleSort(field)}
                          >
                            {label}
                            {sortBy === field && (
                              <ArrowUpDown className="inline h-3 w-3 ml-1" />
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {deals.map((deal) => (
                        <tr
                          key={deal.id}
                          className={cn(
                            'border-b border-slate-50 hover:bg-slate-50 transition-colors',
                            selectedIds.has(deal.id) && 'bg-green-50/50'
                          )}
                        >
                          <td className="py-2.5 pl-1">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(deal.id)}
                              onChange={() => toggleSelect(deal.id)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 pl-2">
                            <div className="flex items-center gap-3 min-w-0">
                              {deal.image_url && (
                                <img
                                  src={deal.image_url}
                                  alt=""
                                  className="h-10 w-10 rounded object-contain bg-slate-50 cursor-pointer hover:ring-2 hover:ring-green-400 transition-shadow flex-shrink-0"
                                  loading="lazy"
                                  onClick={() => setLightboxUrl(deal.image_url)}
                                />
                              )}
                              <span className="font-medium text-slate-800 truncate" title={deal.product_name}>{deal.product_name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-slate-500 truncate" title={deal.brand || ''}>{deal.brand || '-'}</td>
                          <td className="py-2.5">
                            <span className="font-semibold text-slate-800">{fmtPrice(deal.price)}</span>
                            {deal.post_price_text && (
                              <span className="text-xs text-slate-400 ml-0.5">{deal.post_price_text}</span>
                            )}
                            {deal.original_price != null && (
                              <div className="text-xs text-slate-400 line-through">${deal.original_price.toFixed(2)}</div>
                            )}
                          </td>
                          <td className="py-2.5">
                            {deal.sale_story && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-medium max-w-full">
                                <Tag className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{deal.sale_story}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-xs text-slate-400 whitespace-nowrap">
                            {formatDate(deal.valid_from)} - {formatDate(deal.valid_to)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-8" />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-green-500" />
              </div>
            )}

            {/* Extra bottom padding when action bar visible */}
            {selectedIds.size > 0 && <div className="h-20" />}
          </>
        )}
      </div>

      {/* Floating action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white rounded-2xl shadow-xl border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 max-w-md w-[calc(100%-2rem)]">
          {isAdding ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 w-full justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding items...
            </div>
          ) : showNewListInput ? (
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNewList(); if (e.key === 'Escape') setShowNewListInput(false); }}
                placeholder="List name..."
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
              <button
                onClick={handleNewList}
                disabled={!newListName.trim()}
                className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setShowNewListInput(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          ) : (
            <>
              <span className="text-xs sm:text-sm font-medium text-slate-700 whitespace-nowrap">
                {selectedIds.size} selected
              </span>
              <div className="flex-1" />
              <button
                onClick={() => setShowNewListInput(true)}
                className="flex flex-shrink-0 items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                New List
              </button>
              <button
                onClick={openListPicker}
                className="flex flex-shrink-0 items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ListPlus className="h-3.5 w-3.5" />
                Add to List
              </button>
              <button
                onClick={() => setSelectedIds(new Map())}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Card view tile */
function DealGridCard({
  deal,
  formatDate,
  onImageClick,
  selected,
  onToggle,
}: {
  deal: FlyerDeal;
  formatDate: (s: string) => string;
  onImageClick: (url: string) => void;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border p-2.5 lg:p-2 bg-white shadow-sm transition-all',
      selected
        ? 'border-green-500 bg-green-50/40 shadow-[0_10px_24px_rgba(113,194,120,0.25)]'
        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
    )}>
      <div className="absolute top-2 right-2 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
        />
      </div>
      <div className="space-y-2 lg:space-y-0 lg:flex lg:items-start lg:gap-3">
        <div className="h-28 sm:h-24 lg:h-20 w-full lg:w-24 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden lg:flex-shrink-0">
          {deal.image_url ? (
            <img
              src={deal.image_url}
              alt=""
              className="h-full w-full object-contain cursor-pointer hover:scale-[1.02] transition-transform"
              loading="lazy"
              onClick={() => onImageClick(deal.image_url!)}
            />
          ) : (
            <Newspaper className="h-8 w-8 text-slate-300" />
          )}
        </div>

        <div className="space-y-1 lg:flex-1 lg:min-w-0">
          <p className="pr-6 text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 min-h-[2.25rem] lg:min-h-0">
            {deal.product_name}
          </p>
          {deal.brand && <p className="text-[10px] sm:text-xs text-slate-400 truncate">{deal.brand}</p>}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-slate-900">{fmtPrice(deal.price)}</span>
            {deal.post_price_text && <span className="text-[10px] sm:text-xs text-slate-400">{deal.post_price_text}</span>}
            {deal.original_price != null && (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through">${deal.original_price.toFixed(2)}</span>
            )}
          </div>
          <div className="space-y-1.5 lg:space-y-1">
            {deal.sale_story && (
              <span className="inline-flex max-w-full items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] sm:text-xs font-medium">
                <Tag className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{deal.sale_story}</span>
              </span>
            )}
            <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{formatDate(deal.valid_from)} - {formatDate(deal.valid_to)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Original list-view card */
function DealListCard({
  deal,
  formatDate,
  onImageClick,
  selected,
  onToggle,
}: {
  deal: FlyerDeal;
  formatDate: (s: string) => string;
  onImageClick: (url: string) => void;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={cn(
      'relative flex gap-3 p-3 bg-white rounded-xl border shadow-sm transition-colors',
      selected ? 'border-green-400 bg-green-50/30' : 'border-slate-100'
    )}>
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
        />
      </div>
      {deal.image_url && (
        <img
          src={deal.image_url}
          alt=""
          className="h-20 w-20 rounded-lg object-contain bg-slate-50 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-green-400 transition-shadow ml-5"
          loading="lazy"
          onClick={() => onImageClick(deal.image_url!)}
        />
      )}
      <div className={cn('flex-1 min-w-0', !deal.image_url && 'ml-5')}>
        <p className="text-sm font-medium text-slate-800 line-clamp-2">{deal.product_name}</p>
        {deal.brand && <p className="text-xs text-slate-400 mt-0.5">{deal.brand}</p>}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-base font-bold text-slate-900">{fmtPrice(deal.price)}</span>
          {deal.post_price_text && <span className="text-xs text-slate-400">{deal.post_price_text}</span>}
          {deal.original_price != null && (
            <span className="text-xs text-slate-400 line-through">${deal.original_price.toFixed(2)}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {deal.sale_story && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-medium">
              <Tag className="h-3 w-3" />
              {deal.sale_story}
            </span>
          )}
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(deal.valid_from)} - {formatDate(deal.valid_to)}
          </span>
        </div>
      </div>
    </div>
  );
}
