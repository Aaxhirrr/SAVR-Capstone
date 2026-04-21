import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import React from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  TableCell, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ShoppingCart,
  MoreVertical,
  Calendar,
  Trash2,
  Edit,
  Copy,
  Share2,
  Loader2,
  Store,
  ChevronDown,
  X,
  MessageSquarePlus
} from 'lucide-react';
import { ImCheckmark } from 'react-icons/im';
import { getUserGroceryLists, SavedGroceryList, GroceryItem, deleteGroceryList, updateGroceryListItems, updateGroceryListSavings, GroceryListSavingsUpdate, getSavingsSummary, SavingsSummary } from '@/services/groceryListService';
import {
  testShoppingRouter,
  checkPricesDirectly,

  // New imports
  getShoppingDataForList,
  saveProductSelection,
  ShoppingDataForList,
  SearchResultInDB,
  ProductSelectionCreate,
  GroceryProduct, // Keep if still used for 'Nothing' product or similar temporary uses
  // Store key helpers
  parseStoreKey,
  getStoreNameFromKey,
} from '@/services/shoppingService';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '@/services/authService';
import storeService, { UserSelectedStore } from '@/services/storeService';
import { formatDate } from '@/lib/utils'; // Import formatDate
import { resetChatStore } from '@/stores/chatStore';
import chatService from '@/services/chatService';
// import StoreSelectionModal from '@/components/StoreSelectionModal';
import { StoreSelectorDialog } from '@/components/store-selector/StoreSelectorDialog';
import '@/styles/carousel-scrollbar.css';
import ProductDropdown from '@/components/ProductDropdown';

import StoreShoppingModal from '@/components/StoreShoppingModal';

// Type definition for sorting state
type SortKey = 'name' | 'category' | 'meal' | 'quantity';
type SortDirection = 'asc' | 'desc';

type SortConfig =
  | { type: 'field'; key: SortKey; direction: SortDirection }
  | { type: 'storePrice'; storeName: string; direction: SortDirection };

// Extend GroceryProduct locally to allow imageUrl for type safety
// This might become SearchResultInDB directly if all products are from DB
// Exported for use by ProductDropdown component
export interface GroceryProductWithImage extends SearchResultInDB { // Changed from GroceryProduct
  // imageUrl is already in SearchResultInDB (via GroceryProduct)
}

// Interface for per-list price data - ALIGNED WITH ShoppingDataForList
interface ListPriceData extends ShoppingDataForList { // Now extends ShoppingDataForList
  // shoppingResults: ShoppingDataForList['results']; // Now inherited
  // selectedProducts: ShoppingDataForList['selections']; // Now inherited
  storeSubtotals: Record<string, {total: number, itemCount: number}>; // Keep this local calculation
  // lastChecked?: string; // Now inherited from ShoppingDataForList (optional)
  dataSource: 'api' | 'mock' | 'localStorage' | null; // 'localStorage' will be phased out
  // session_id?: string | null; // Now inherited from ShoppingDataForList
  // status?: string; // Now inherited from ShoppingDataForList
}

// Helper for image fallback - exported for ProductDropdown
export const getProductImage = (imageUrl?: string) => imageUrl || '/assets/store-placeholder.png';

// Add a helper function for truncating product names - exported for ProductDropdown
export const truncateName = (name: string, maxLength = 25) => {
  if (!name) return '';
  const trimmedName = name.trim();
  return trimmedName.length > maxLength ? trimmedName.slice(0, maxLength) + '…' : trimmedName;
};

// Strictly format prices: return "$X.XX" or null if invalid - exported for ProductDropdown
export const formatPriceStrict = (price: string | number | null | undefined): string | null => {
  try {
    if (price === null || price === undefined) return null;
    if (typeof price === 'number' && isFinite(price)) {
      return `$${price.toFixed(2)}`;
    }
    if (typeof price === 'string') {
      const trimmed = price.trim();
      // Accept only plain dollar amounts with optional leading $ and up to 2 decimals
      const match = trimmed.match(/^\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*$/);
      if (!match) return null;
      const numeric = parseFloat(match[1]);
      if (!isFinite(numeric)) return null;
      return `$${numeric.toFixed(2)}`;
    }
    return null;
  } catch {
    return null;
  }
};

// Prepare structured fields for tooltip display - exported for ProductDropdown
export const getProductTooltipFields = (product: Partial<GroceryProductWithImage> | Partial<GroceryProduct>): { brand: string; name: string; size: string } => {
  const brand = typeof (product as any)?.brand === 'string' ? ((product as any).brand as string).trim() : '';
  const name = typeof (product as any)?.name === 'string' ? ((product as any).name as string).trim() : '';
  const size = typeof (product as any)?.size === 'string' ? ((product as any).size as string).trim() : '';
  return { brand, name, size };
};

// Helper function to convert store names to proper title case - exported for ProductDropdown
// Now handles store_key format (e.g., "walmart::123 Main St") by extracting the canonical name
export const formatStoreName = (storeNameOrKey: string) => {
  if (!storeNameOrKey) return '';

  // Extract canonical store name if this is a store_key (contains "::")
  const canonicalName = getStoreNameFromKey(storeNameOrKey);

  // Handle special cases for known store names
  const specialCases: Record<string, string> = {
    'no frills': 'No Frills',
    'nofrills': 'No Frills',
    'food basics': 'Food Basics',
    'foodbasics': 'Food Basics',
    'loblaws': 'Loblaws',
    'metro': 'Metro',
    'sobeys': 'Sobeys',
    'safeway': 'Safeway',
    'walmart': 'Walmart',
    'costco': 'Costco',
    'superstore': 'Superstore',
    'atlanticsuperstore': 'Atlantic Superstore',
    'atlantic-superstore': 'Atlantic Superstore',
    'independent': 'Independent',
    'maxi': 'Maxi',
    'zehrs': 'Zehrs',
    'valuemart': 'Valu-Mart',
    'valumart': 'Valu-Mart',
    'fortinos': 'Fortinos',
    'farmboy': 'Farm Boy',
    'longos': "Longo's",
    'voila': 'Voilà',
  };

  // Check if it's a special case first
  const lowerStoreName = canonicalName.toLowerCase().trim();
  if (specialCases[lowerStoreName]) {
    return specialCases[lowerStoreName];
  }

  // Otherwise apply title case
  return canonicalName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to get a display-friendly store name that includes location info
// For store_keys with address, returns "StoreName (Location)"
export const formatStoreNameWithLocation = (storeKey: string): string => {
  if (!storeKey) return '';

  const { storeName: canonicalName, address } = parseStoreKey(storeKey);
  const formattedName = formatStoreName(canonicalName);

  if (address) {
    // Extract a short location identifier (first part of address, e.g., street number and name)
    const shortAddress = address.split(',')[0].trim();
    const truncatedAddress = shortAddress.length > 25 ? shortAddress.substring(0, 22) + '...' : shortAddress;
    return `${formattedName} (${truncatedAddress})`;
  }

  return formattedName;
};

// Helper function to get the path for a store's logo
// Now handles store_key format (e.g., "walmart::123 Main St") by extracting the canonical name
const getStoreLogoPath = (storeNameOrKey: string): string => {
  if (!storeNameOrKey) return '/assets/store_logos/default.svg'; // Fallback or placeholder

  // Extract canonical store name if this is a store_key
  const canonicalName = getStoreNameFromKey(storeNameOrKey);
  const formattedName = canonicalName.toLowerCase().replace(/\s+/g, '-');

  // Add specific mappings if filenames don't directly match formatted names
  const logoMappings: Record<string, string> = {
    'no-frills': 'nofrills.svg',
    'nofrills': 'nofrills.svg',
    'food-basics': 'foodbasics.svg',
    'foodbasics': 'foodbasics.svg',
    'loblaws': 'loblaws.svg',
    'metro': 'metro.svg',
    'walmart': 'walmart.svg',
    'superstore': 'superstore.svg',
    'atlanticsuperstore': 'atlantic-superstore.svg',
    'atlantic-superstore': 'atlantic-superstore.svg',
    'independent': 'independent.svg',
    'your-independent-grocer': 'independent.svg',
    'yourindependentgrocer': 'independent.svg',
    'independentgrocer': 'independent.svg',
    'independent-grocer': 'independent.svg',
    // New banners and special filename cases
    'valumart': 'valu-mart.svg',
    'valuemart': 'valu-mart.svg',
    'valu-mart': 'valu-mart.svg',
    'value-mart': 'valu-mart.svg',
    'zehrs': 'zehrs.svg',
    'maxi': 'maxi.svg',
    'fortinos': 'fortinos.svg',
    // Empire
    'sobeys': 'sobeys.svg',
    'safeway': 'safeway.svg',
    // Others
    'farmboy': 'farmboy.svg',
    'farm-boy': 'farmboy.svg',
    'longos': 'longos.svg',
    "longo's": 'longos.svg',
    'voila': 'voila.svg',
    'voilà': 'voila.svg',
    // T&T Supermarket
    'tnt': 'tandt.svg',
    't&t': 'tandt.svg',
    't&t-supermarket': 'tandt.svg',
    'tandt': 'tandt.svg',
  };

  // Check exact match first
  if (logoMappings[formattedName]) {
    return `/assets/store_logos/${logoMappings[formattedName]}`;
  }

  // Check partial matches for T&T (handles "tnt::address" format)
  const lowerName = storeNameOrKey.toLowerCase();
  if (lowerName.includes('t&t') || lowerName.includes('tnt') || lowerName.includes('tandt')) {
    return '/assets/store_logos/tandt.svg';
  }

  const fileName = `${formattedName}.svg`;
  return `/assets/store_logos/${fileName}`;
};

// Memoized Store Summary Row Component to prevent unnecessary re-renders
const StoreSummaryRow = memo(({ 
  orderedStoreNames, 
  storeSubtotals,
  onStoreClick,
  isCompleted
}: { 
  orderedStoreNames: string[], 
  storeSubtotals: Record<string, {total: number, itemCount: number}>,
  onStoreClick: (storeName: string) => void,
  isCompleted: boolean
}) => {
  const storeEntries = Object.entries(storeSubtotals).filter(([_, storeData]) => storeData.total > 0);
  const lowestStore = storeEntries.length > 0 ? storeEntries.reduce(
    (lowest, [name, storeData]) => 
      storeData.total < lowest.total ? {name, total: storeData.total} : lowest,
    {name: '', total: Infinity}
  ) : {name: '', total: Infinity};
  
  const highestStore = storeEntries.length > 0 ? storeEntries.reduce(
    (highest, [name, storeData]) => 
      storeData.total > highest.total ? {name, total: storeData.total} : highest,
    {name: '', total: 0}
  ) : {name: '', total: 0};

  return (
    <TableRow className="bg-muted/20 hover:bg-muted/20 border-b-2">
      <TableCell colSpan={4} className="font-semibold text-primary">
        Store Totals
      </TableCell>
      {orderedStoreNames.map((store: string) => {
        const data = storeSubtotals[store];
        const isLowestPrice = storeEntries.length > 1 && lowestStore.name === store && data && data.total > 0;
        const canOpen = isCompleted && data && data.itemCount > 0;
        
        // Calculate savings compared to most expensive store
        const savings = data && data.total > 0 && highestStore.total > data.total 
          ? highestStore.total - data.total 
          : 0;
        const savingsPercent = savings > 0 && highestStore.total > 0 
          ? Math.round((savings / highestStore.total) * 100) 
          : 0;
        
        return (
          <TableCell key={`summary-${store}`} className="w-[240px]">
            <div 
              className={`p-3 rounded-md border transition-all ${isLowestPrice ? 'border-green-500 bg-green-50 shadow-sm' : 'border-border bg-background'} ${canOpen ? 'cursor-pointer hover:shadow-md' : ''}`}
              onClick={() => { if (canOpen) onStoreClick(store); }}
              onKeyDown={(e) => { if (canOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onStoreClick(store); } }}
              role={canOpen ? 'button' : undefined}
              tabIndex={canOpen ? 0 : -1}
              title={canOpen ? 'Open store view' : undefined}
            >
              <div className="flex flex-col mb-2">
                <div className="flex items-center justify-between">
                  <img
                    src={getStoreLogoPath(store)}
                    alt={`${formatStoreName(store)} logo`}
                    className="h-5 w-auto object-contain"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                {/* Show location subtitle if this is a store_key with address */}
                {store.includes('::') && (
                  <span className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]" title={parseStoreKey(store).address}>
                    {parseStoreKey(store).address?.split(',')[0]}
                  </span>
                )}
              </div>
              {data && data.total > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {data.itemCount} item{data.itemCount !== 1 ? 's' : ''}
                    </span>
                    {isLowestPrice && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs font-medium">
                        Lowest Price
                      </Badge>
                    )}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    ${data.total.toFixed(2)}
                  </div>
                  {savings > 0 && (
                    <div className="text-xs text-green-600 mt-1 font-medium">
                      Save ${savings.toFixed(2)} ({savingsPercent}%) compared to {formatStoreName(highestStore.name)}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No items selected
                </div>
              )}
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
});

StoreSummaryRow.displayName = 'StoreSummaryRow';

// Memoized ListCard component with expand/collapse and organization tabs
const ListCard = memo(React.forwardRef<HTMLDivElement, {
  list: SavedGroceryList,
  isSelected: boolean,
  isPending: boolean,
  isSearching: boolean,
  onSelect: (list: SavedGroceryList) => void,
  onDeleteConfirm: (list: SavedGroceryList, e: React.MouseEvent) => void,
  onCheckPrices: () => void,
  onDeleteItem: (listId: string, itemName: string) => void
}>(({
  list,
  isSelected,
  isPending,
  isSearching,
  onSelect,
  onDeleteConfirm,
  onCheckPrices,
  onDeleteItem
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [groupBy, setGroupBy] = useState<'category' | 'meal'>('category');

  // Track item count changes for animation
  const prevItemCountRef = useRef(list.items.length);
  const [isItemCountAnimating, setIsItemCountAnimating] = useState(false);

  // Detect when items are added and trigger animation
  useEffect(() => {
    const currentCount = list.items.length;
    const prevCount = prevItemCountRef.current;

    if (currentCount > prevCount) {
      // Items were added - trigger animation
      setIsItemCountAnimating(true);
      const timer = setTimeout(() => setIsItemCountAnimating(false), 600);
      prevItemCountRef.current = currentCount;
      return () => clearTimeout(timer);
    }

    prevItemCountRef.current = currentCount;
  }, [list.items.length]);

  // Group items by category or meal
  const groupedItems = useMemo(() => {
    return list.items.reduce<Record<string, GroceryItem[]>>((acc, item) => {
      const key = groupBy === 'category'
        ? (item.category || 'Uncategorized')
        : (item.meal || 'No Meal');
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [list.items, groupBy]);

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleCheckPrices = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(list);
    onCheckPrices();
  };

  return (
    <Card
      ref={ref}
      className={`min-w-[280px] max-w-[320px] flex-shrink-0 overflow-hidden transition-all duration-300 ease-out ${
        isSelected || isPending
          ? 'ring-2 ring-primary shadow-lg'
          : 'border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {/* Card Header with Chevron */}
      <div className="flex items-stretch">
        {/* Main content area - clickable to select */}
        <div
          className="flex-1 cursor-pointer"
          onClick={() => onSelect(list)}
        >
          <CardHeader className="pb-2 pt-3 pr-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CardTitle className="text-base font-semibold truncate max-w-[180px] text-slate-900 dark:text-white">
                        {list.name}
                      </CardTitle>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start">
                      <p>{list.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <CardDescription className="flex items-center gap-1 text-xs mt-0.5">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(list.createdAt)}</span>
                  <span className="mx-1">·</span>
                  <span className={`font-medium text-slate-600 dark:text-slate-400 inline-block ${isItemCountAnimating ? 'animate-item-counter-pop' : ''}`}>{list.items.length} items</span>
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 -mt-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e: React.MouseEvent) => onDeleteConfirm(list, e)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
        </div>

        {/* Chevron toggle - vertically centered */}
        <button
          onClick={handleExpandToggle}
          className="flex items-center justify-center w-10 border-l border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          aria-label={isExpanded ? 'Collapse list' : 'Expand list'}
        >
          <ChevronDown
            className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Expandable Content - Smooth height animation using CSS Grid */}
      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 300ms ease-out',
        }}
      >
        <div className="overflow-hidden min-h-0">
          {/* Organization Tabs */}
          <div className="px-3 pt-2 pb-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); setGroupBy('category'); }}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                  groupBy === 'category'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Category
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setGroupBy('meal'); }}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                  groupBy === 'meal'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Meal
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="px-3 pb-2 max-h-[280px] overflow-y-auto">
            {Object.entries(groupedItems).map(([group, items]) => (
              <div key={group} className="mb-2 last:mb-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 px-1">
                  {group}
                </div>
                <div className="space-y-0.5">
                  {items.map((item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      className="group/item relative flex items-center justify-between py-1.5 px-2 pr-7 rounded bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ImCheckmark className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {item.name}
                        </span>
                      </div>
                      {item.quantity && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-2 flex-shrink-0">
                          {item.quantity} {item.unit || ''}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(list.id, item.name);
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full opacity-0 group-hover/item:opacity-100 active:opacity-100 transition-opacity text-slate-300 hover:text-red-500 hover:bg-red-50 dark:text-slate-600 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                        title="Remove item"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Check Prices Button - Bottom Center */}
          <div className="px-3 pb-3 pt-1">
            <Button
              onClick={handleCheckPrices}
              disabled={isSearching}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm"
              size="sm"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Check Prices at Your Stores
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}));

ListCard.displayName = 'ListCard';

const ListsPage = () => {
  console.log('ListsPage component rendering');
  const [lists, setLists] = useState<SavedGroceryList[]>([]);
  const [selectedList, setSelectedList] = useState<SavedGroceryList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listToDelete, setListToDelete] = useState<SavedGroceryList | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add state for table sorting
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  // Modal state for focused store view (route-backed)
  const [isStoreViewOpen, setIsStoreViewOpen] = useState(false);
  const [focusedStoreName, setFocusedStoreName] = useState<string | null>(null);
  const [modalSortConfig, setModalSortConfig] = useState<SortConfig | null>(null);
  
  // Shopping-related state - NOW PER-LIST
  const [isShoppingNow, setIsShoppingNow] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(false);
  
  // Add separate loading state for list data (won't affect carousel)
  const [isLoadingListData, setIsLoadingListData] = useState(false);
  
  // Store all price data per list ID
  const [listPriceDataMap, setListPriceDataMap] = useState<Record<string, ListPriceData>>({});
  
  // Cache size limit (keep data for last N lists)
  const MAX_CACHED_LISTS = 5;

  // Add state for selected stores
  const [selectedStores, setSelectedStores] = useState<UserSelectedStore[]>([]);

  // Track when stores are being saved to prevent race conditions with price check
  const [isSavingStores, setIsSavingStores] = useState(false);
  
  // Add state for savings summary
  const [savingsSummary, setSavingsSummary] = useState<SavingsSummary | null>(null);

  // Add state for creating new list
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);

  // Add state for store selection modal
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  // Carousel scrollbar visibility state
  const [showCarouselScrollbar, setShowCarouselScrollbar] = useState(false);
  const carouselScrollbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to track pending product selections to avoid duplicate API calls
  const pendingSelectionsRef = useRef(new Set<string>());

  // Refs for managing list selection and preventing cascading updates
  const currentListDataRef = useRef<ListPriceData | null>(null);
  const [currentListDataVersion, setCurrentListDataVersion] = useState(0);
  const listSelectionOrderRef = useRef<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingListSelection, setPendingListSelection] = useState<SavedGroceryList | null>(null);

  // Ref to store the signature of the last saved price comparison data
  const lastSavedPriceComparisonSignatureRef = useRef<string | null>(null);

  // Ref for the horizontal scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Refs for individual list cards
  const listCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Ref to track finalized store order after search completion (prevents constant reordering)
  const finalizedStoreOrderRef = useRef<string[] | null>(null);

  // Ref to track search start time for stats in completion toast
  const searchStartTimeRef = useRef<number | null>(null);

  const fetchSavingsSummary = async () => {
    try {
      const summary = await getSavingsSummary();
      setSavingsSummary(summary);
    } catch (error) {
      console.error('Error fetching savings summary:', error);
      // Don't show error toast for this - just silently fail
    }
  };

  // Helper function to get current list's price data
  const getCurrentListPriceData = useCallback((): ListPriceData | null => {
    if (!selectedList) return null;
    // Ensure a default structure if no data yet for the list
    return listPriceDataMap[selectedList.id] || {
      results: {},
      selections: {},
      storeSubtotals: {},
      dataSource: null,
      session_id: null,
      last_checked: null,
      status: undefined
    };
  }, [selectedList, listPriceDataMap]);

  // Update the stable reference only when current list's data meaningfully changes
  useEffect(() => {
    const newData = getCurrentListPriceData();
    const oldData = currentListDataRef.current;
    
    // Only update if there's a meaningful change for the current list
    if (!selectedList || !newData) {
      currentListDataRef.current = null;
      return;
    }
    
    // Check if this is actually different data
    const hasChanged = !oldData || 
      !isEqual(oldData.results, newData.results) ||
      !isEqual(oldData.selections, newData.selections) ||
      oldData.status !== newData.status ||
      oldData.session_id !== newData.session_id;
      
    if (hasChanged) {
      currentListDataRef.current = newData;
      setCurrentListDataVersion(v => v + 1); // Trigger dependent effects
    }
  }, [selectedList?.id, listPriceDataMap[selectedList?.id || ''], getCurrentListPriceData]);

  // Helper function to update price data for a specific list
  const updateListPriceData = useCallback((listId: string, data: Partial<ListPriceData>) => {
    setListPriceDataMap(prev => {
      // Update selection order
      listSelectionOrderRef.current = [
        listId,
        ...listSelectionOrderRef.current.filter(id => id !== listId)
      ].slice(0, MAX_CACHED_LISTS);
      
      const currentDataForList = prev[listId] || {
        results: {},
        selections: {},
        storeSubtotals: {},
        dataSource: null,
        session_id: null,
        last_checked: null,
        status: undefined
      };

      // Check if there's any actual change in the data that warrants an update
      let hasMeaningfulChange = false;
      if (data.results !== undefined && !isEqual(currentDataForList.results, data.results)) {
        hasMeaningfulChange = true;
      }
      if (data.selections !== undefined && !isEqual(currentDataForList.selections, data.selections)) {
        hasMeaningfulChange = true;
      }
      // Also consider status, session_id, and last_checked as meaningful changes
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
      // If storeSubtotals are passed, and they changed.
      if (data.storeSubtotals !== undefined && !isEqual(currentDataForList.storeSubtotals, data.storeSubtotals)) {
        hasMeaningfulChange = true;
      }


      if (!hasMeaningfulChange) {
        console.log(`[updateListPriceData] No meaningful change detected for list ${listId}. Skipping update.`);
        return prev; // Return previous state map, no re-render
      }
      
      console.log(`[updateListPriceData] Meaningful change detected for list ${listId}. Proceeding with update.`);
      const updatedData: ListPriceData = {
        ...currentDataForList,
        ...data,
        // Ensure results and selections are always defined objects if updated
        results: data.results !== undefined ? data.results : currentDataForList.results,
        selections: data.selections !== undefined ? data.selections : currentDataForList.selections,
        storeSubtotals: data.storeSubtotals !== undefined ? data.storeSubtotals : currentDataForList.storeSubtotals,
      };

      const newMap = {
        ...prev,
        [listId]: updatedData
      };
      
      // Evict based on selection order, not time
      const listIds = Object.keys(newMap);
      if (listIds.length > MAX_CACHED_LISTS) {
        const idsToKeep = new Set(listSelectionOrderRef.current);
        const idsToRemove = listIds.filter(id => !idsToKeep.has(id));
        idsToRemove.forEach(id => delete newMap[id]);
      }
      
      return newMap;
    });
  }, []);

  // Functional update helper for selections - avoids stale closure issues
  const updateSelectionFunctional = useCallback((listId: string, itemName: string, storeName: string, product: SearchResultInDB) => {
    setListPriceDataMap(prev => {
      // Update selection order
      listSelectionOrderRef.current = [
        listId,
        ...listSelectionOrderRef.current.filter(id => id !== listId)
      ].slice(0, MAX_CACHED_LISTS);

      const currentDataForList = prev[listId] || {
        results: {},
        selections: {},
        storeSubtotals: {},
        dataSource: null,
        session_id: null,
        last_checked: null,
        status: undefined
      };

      const latestSelections = currentDataForList.selections || {};
      const newSelections = {
        ...latestSelections,
        [itemName]: {
          ...(latestSelections[itemName] || {}),
          [storeName]: product,
        },
      };

      return {
        ...prev,
        [listId]: {
          ...currentDataForList,
          selections: newSelections,
        },
      };
    });
  }, []);

  // Get current list data for easy access
  const currentListData = getCurrentListPriceData();
  const results = currentListData?.results || {};
  const selections = currentListData?.selections || {};
  const storeSubtotals = currentListData?.storeSubtotals || {};
  // const dataSource = currentListData?.dataSource || null; // dataSource will now be managed by fetchAndSetShoppingDataForList

  // Memoized store subtotals to prevent flickering during rapid updates
  const memoizedStoreSubtotals = useMemo(() => {
    return storeSubtotals;
  }, [storeSubtotals]);

  // Helper: parse price string/number to a numeric value; returns null if not a valid price
  const parsePriceToNumber = useCallback((price: string | number | null | undefined): number | null => {
    try {
      if (price === null || price === undefined) return null;
      if (typeof price === 'number') {
        return isFinite(price) ? price : null;
      }
      if (typeof price === 'string') {
        const numericPart = price.replace(/[$£€]/g, '').trim();
        if (numericPart === '') return null;
        const value = parseFloat(numericPart);
        return isFinite(value) ? value : null;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Resolve a comparable price for an item at a given store
  // Priority: selected product (if not "Nothing") -> lowest price in results -> null if none
  const getComparablePrice = useCallback((item: GroceryItem, storeName: string): number | null => {
    const byItemSelections = selections[item.name];
    const selected = byItemSelections ? byItemSelections[storeName] : undefined;
    if (selected) {
      if (selected.name === 'Nothing') {
        // Treat "Nothing" as no price for sorting purposes
        return null;
      }
      const parsed = parsePriceToNumber(selected.price as any);
      if (parsed !== null) return parsed;
    }

    const byItemResults = results[item.name];
    const productsAtStore = byItemResults ? (byItemResults[storeName] as SearchResultInDB[] | undefined) : undefined;
    if (Array.isArray(productsAtStore) && productsAtStore.length > 0) {
      let lowest: number | null = null;
      for (const product of productsAtStore) {
        const val = parsePriceToNumber(product.price as any);
        if (val === null) continue;
        lowest = lowest === null ? val : Math.min(lowest, val);
      }
      return lowest;
    }

    return null;
  }, [results, selections, parsePriceToNumber]);

  // Memoized ordered list of stores - uses finalized order after search completes, otherwise alphabetical order
  // Once finalized, the order is LOCKED and won't change even if user changes selections
  const orderedStoreNames = useMemo<string[]>(() => {
    // If we have a finalized order (from completed search), ALWAYS use it - order is locked
    if (finalizedStoreOrderRef.current && finalizedStoreOrderRef.current.length > 0) {
      // Return the exact same array reference to prevent unnecessary re-renders
      return finalizedStoreOrderRef.current;
    }

    const seenStores = new Set<string>();

    // Collect stores from results
    Object.values(results).forEach(productsByStore => {
      if (productsByStore && typeof productsByStore === 'object') {
        Object.keys(productsByStore).forEach(store => {
          seenStores.add(store);
        });
      }
    });

    // Collect stores from selections
    Object.values(selections).forEach(storeSelections => {
      if (storeSelections && typeof storeSelections === 'object') {
        Object.keys(storeSelections).forEach(store => {
          seenStores.add(store);
        });
      }
    });

    // Sort alphabetically for stable order during search (before finalization)
    const orderedNames = Array.from(seenStores).sort((a, b) => a.localeCompare(b));
    return orderedNames;
  }, [results, selections]);

  // Function to calculate store subtotals
  const calculateStoreSubtotals = useCallback(() => {
    if (!selectedList) return;
    
    console.log("Calculating store subtotals...");
    
    const currentData = getCurrentListPriceData();
    if (!currentData || !currentData.selections || Object.keys(currentData.selections).length === 0) {
      console.log("No selected products to calculate subtotals for");
      // Only update if there's a change to prevent render loops
      if (currentData && Object.keys(currentData.storeSubtotals).length > 0) {
        updateListPriceData(selectedList.id, { storeSubtotals: {} });
      }
      return;
    }

    const totals: Record<string, {total: number, itemCount: number}> = {};
    
    // Loop through each item's selected products
    Object.entries(currentData.selections).forEach(([itemName, storeSelections]) => {
      if (!storeSelections) return; // Skip if storeSelections is undefined
      
      // Loop through each store's selection for this item
      Object.entries(storeSelections).forEach(([storeName, product]) => {
        if (!product) return; // Skip if product is undefined
        
        // Skip products with name "Nothing" or price "$0.00"
        if (product.name === "Nothing" || product.price === "$0.00") {
          console.log(`Skipping ${itemName} from ${storeName} (Nothing/zero price selection)`);
          return;
        }
        
        // Initialize store totals if not already present
        if (!totals[storeName]) {
          totals[storeName] = { total: 0, itemCount: 0 };
        }
        
        // Extract numeric price from the price string (e.g., "$3.99" -> 3.99)
        // Add null check for product.price
        const priceStr = product.price || "0";
        let priceValue = 0;
        
        try {
          if (typeof priceStr === 'string') {
            // Try to parse the numeric value from the price string
            const numericPart = priceStr.replace(/[$£€]/g, '').trim();
            priceValue = parseFloat(numericPart) || 0;
          } else if (typeof priceStr === 'number') {
            priceValue = priceStr;
          }
        } catch (error) {
          console.error(`Error parsing price "${priceStr}" for ${itemName} from ${storeName}:`, error);
          priceValue = 0;
        }
        
        // Add to the store total
        totals[storeName].total += priceValue;
        totals[storeName].itemCount += 1;
        
        console.log(`Added ${priceValue} for ${itemName} from ${storeName}, new total: $${totals[storeName].total.toFixed(2)}`);
      });
    });
    
    console.log("Final store subtotals:", totals);
    
    // Only update state if we have actual totals AND they're different from current state
    // This prevents unnecessary re-renders
    if (Object.keys(totals).length > 0) {
      // Check if totals are different from current state
      const needsUpdate = !isEqual(totals, currentData.storeSubtotals);
      
      if (needsUpdate) {
        console.log("Updating store subtotals state");
        updateListPriceData(selectedList.id, { storeSubtotals: totals });
      } else {
        console.log("Store subtotals unchanged, skipping update");
      }
    }
  }, [selectedList, getCurrentListPriceData, updateListPriceData]);

  // Helper function to compare objects
  function isEqual(obj1: any, obj2: any, epsilon = 0.00001): boolean {
    if (obj1 === obj2) return true; // Handles primitives and same object reference

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
      // If one is an object and the other isn't, or if they are different primitives (not caught by ===)
      // Check for floating point numbers if both are numbers
      if (typeof obj1 === 'number' && typeof obj2 === 'number' && Math.abs(obj1 - obj2) < epsilon) {
        return true;
      }
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false; // Make sure key exists in obj2

      const val1 = obj1[key];
      const val2 = obj2[key];

      const areObjects = typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null;

      if (areObjects) {
        if (!isEqual(val1, val2, epsilon)) return false;
      } else if (typeof val1 === 'number' && typeof val2 === 'number') {
        if (Math.abs(val1 - val2) >= epsilon) return false; // Floating point comparison
      } else {
        if (val1 !== val2) return false;
      }
    }
    return true;
  }

  // Calculate subtotals when relevant data changes, but with debouncing to prevent loops
  useEffect(() => {
    if (!selectedList?.id || !currentListDataRef.current) return;
    
    // Only calculate if we have selections for the current list
    const currentSelections = currentListDataRef.current.selections;
    if (!currentSelections || Object.keys(currentSelections).length === 0) return;
    
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    console.log("[SubtotalEffect] Selections changed, scheduling subtotal recalculation. Selections keys:", Object.keys(currentSelections));
    
    // Use RAF to batch DOM updates
    requestAnimationFrame(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        if (isMounted) {
          calculateStoreSubtotals();
        }
      }, 100); // Keep debounce
    });
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedList?.id, currentListDataVersion, calculateStoreSubtotals]);

  // Effect to finalize store order when search completes (sorts stores by price once)
  // This only runs ONCE when the search completes AND we have valid subtotals
  useEffect(() => {
    if (!selectedList?.id) return;

    const currentData = listPriceDataMap[selectedList.id];
    if (!currentData || currentData.status !== 'completed') return;

    // Only finalize if we haven't already for this search - order is LOCKED after this
    if (finalizedStoreOrderRef.current && finalizedStoreOrderRef.current.length > 0) {
      return; // Order already locked, never re-sort
    }

    const { storeSubtotals, results, selections } = currentData;

    // Wait until we have subtotals with actual values before finalizing
    const hasValidSubtotals = storeSubtotals &&
      Object.keys(storeSubtotals).length > 0 &&
      Object.values(storeSubtotals).some(s => s.total > 0);

    if (!hasValidSubtotals) {
      console.log('[FinalizeStoreOrder] Waiting for valid subtotals before finalizing...');
      return; // Wait for subtotals to be calculated
    }

    // Build store list from results and selections
    const seenStores = new Set<string>();
    const storeNames: string[] = [];

    Object.values(results || {}).forEach(productsByStore => {
      if (productsByStore && typeof productsByStore === 'object') {
        Object.keys(productsByStore).forEach(store => {
          if (!seenStores.has(store)) {
            seenStores.add(store);
            storeNames.push(store);
          }
        });
      }
    });

    Object.values(selections || {}).forEach(storeSelections => {
      if (storeSelections && typeof storeSelections === 'object') {
        Object.keys(storeSelections).forEach(store => {
          if (!seenStores.has(store)) {
            seenStores.add(store);
            storeNames.push(store);
          }
        });
      }
    });

    // Sort by cheapest first - this happens ONCE and order is then LOCKED
    const sortedStores = [...storeNames].sort((a, b) => {
      const totalA = storeSubtotals[a]?.total || 0;
      const totalB = storeSubtotals[b]?.total || 0;

      if (totalA > 0 && totalB > 0) {
        return totalA - totalB;
      }
      return 0;
    });

    console.log('[FinalizeStoreOrder] Search completed. LOCKING store order:', sortedStores);
    finalizedStoreOrderRef.current = sortedStores;

    // Force re-render to apply the finalized order
    setCurrentListDataVersion(v => v + 1);
  }, [selectedList?.id, listPriceDataMap]);

  // Function to calculate and save price comparison data to database
  const calculateAndSavePriceComparison = useCallback(async () => {
    if (!selectedList) return;
    
    const currentData = getCurrentListPriceData();
    if (!currentData || !currentData.storeSubtotals) return;
    
    // Get stores with valid totals
    const storeEntries = Object.entries(currentData.storeSubtotals)
      .filter(([_, data]) => data.total > 0)
      .map(([name, data]) => ({ name, ...data }));
    
    // Need at least 2 stores to calculate savings
    if (storeEntries.length < 2) {
      console.log("Not enough stores with prices to calculate savings");
      return;
    }
    
    // Find lowest and highest price stores
    const lowestStore = storeEntries.reduce((lowest, store) => 
      store.total < lowest.total ? store : lowest
    );
    
    const highestStore = storeEntries.reduce((highest, store) => 
      store.total > highest.total ? store : highest
    );
    
    // Calculate savings
    const savingsAmount = highestStore.total - lowestStore.total;
    const savingsPercent = (savingsAmount / highestStore.total) * 100;
    
    // Prepare savings data
    const savingsData: GroceryListSavingsUpdate = {
      savings_amount: savingsAmount,
      savings_percent: savingsPercent,
      most_expensive_store_name: highestStore.name,
      most_expensive_store_price: highestStore.total,
      least_expensive_store_name: lowestStore.name,
      least_expensive_store_price: lowestStore.total
    };

    // Generate a signature for the current comparison
    const currentSignature = JSON.stringify({
      listId: selectedList.id, // ensure list context is part of signature
      savingsAmount: savingsAmount.toFixed(2), // Use toFixed for consistent float string
      savingsPercent: savingsPercent.toFixed(2),
      mostExpensiveStoreName: highestStore.name,
      mostExpensiveStorePrice: highestStore.total.toFixed(2),
      leastExpensiveStoreName: lowestStore.name,
      leastExpensiveStorePrice: lowestStore.total.toFixed(2),
    });

    // Check against the last saved signature
    if (lastSavedPriceComparisonSignatureRef.current === currentSignature) {
      console.log("[AutoSave] Price comparison data is identical to the last saved version. Skipping save.", currentSignature);
      return; // Exit if data is the same
    }
    
    console.log("Calculated savings data (new or different):", savingsData);
    console.log("New signature:", currentSignature);
    console.log("Old signature:", lastSavedPriceComparisonSignatureRef.current);
    
    try {
      // Save to database
      const updatedList = await updateGroceryListSavings(selectedList.id, savingsData);
      
      // Update local state with the saved data
      setLists(prevLists => 
        prevLists.map(list => 
          list.id === selectedList.id ? updatedList : list
        )
      );
      
      // Update selected list as well
      if (selectedList.id === updatedList.id) {
        setSelectedList(updatedList);
      }

      // IMPORTANT: Update the signature ref AFTER successful save
      lastSavedPriceComparisonSignatureRef.current = currentSignature;
      
      console.log("Successfully saved price comparison data to database. Updated signature.");

      // Refresh savings summary
      fetchSavingsSummary();
    } catch (error) {
      console.error("Error saving price comparison data:", error);
      // Silent fail - don't show toast for background save operation
    }
  }, [selectedList, getCurrentListPriceData, updateGroceryListSavings, setLists]);

  // Memoized input signature for price comparison to make the auto-save effect more targeted
  const priceComparisonInputSignature = useMemo(() => {
    if (!selectedList?.id || !currentListDataRef.current?.storeSubtotals || currentListDataRef.current.status !== 'completed') {
      return null; // Not ready to save
    }
    const { storeSubtotals } = currentListDataRef.current;

    const sortedStoreNames = Object.keys(storeSubtotals).sort();
    const relevantSubtotals = sortedStoreNames.reduce((acc, storeName) => {
      if (storeSubtotals[storeName]?.total > 0) { // Only include stores with actual totals
        acc[storeName] = {
          total: storeSubtotals[storeName].total.toFixed(2), // Consistent formatting
          itemCount: storeSubtotals[storeName].itemCount
        };
      }
      return acc;
    }, {} as Record<string, {total: string, itemCount: number}>);

    if (Object.keys(relevantSubtotals).length < 2) return null; // Not enough data to compare

    return JSON.stringify({
      listId: selectedList.id,
      status: currentListDataRef.current.status,
      subtotals: relevantSubtotals,
    });
  }, [selectedList?.id, currentListDataVersion]);

  // Auto-save price comparison when store subtotals change (after user selections)
  useEffect(() => {
    // Use the memoized signature to decide if we should proceed
    if (!priceComparisonInputSignature) {
      console.log("[AutoSave Effect] Conditions not met for saving (priceComparisonInputSignature is null).");
      return;
    }
    
    // Debounce the save
    const timeoutId = setTimeout(() => {
      console.log("[AutoSave Effect] Conditions met, attempting to save price comparison. Signature:", priceComparisonInputSignature);
      calculateAndSavePriceComparison(); // This function now has its own internal check
    }, 2000); 
    
    return () => clearTimeout(timeoutId);
  }, [priceComparisonInputSignature, calculateAndSavePriceComparison]); // Dependency on the signature and the function itself

  // Test shopping router when component mounts
  useEffect(() => {
    const testShopping = async () => {
      try {
        console.log('Testing shopping router on page load...');
        const result = await testShoppingRouter();
        console.log('Shopping router is accessible:', result);
      } catch (error) {
        console.error('Shopping router is not accessible:', error);
      }
    };
    
    testShopping();
  }, []);

  // NEW: Function to fetch shopping data from API and update state
  const fetchAndSetShoppingDataForList = useCallback(async (listId: string) => {
    if (!listId) return;
    
    // Cancel any previous fetch for a different list
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    console.log(`Fetching API shopping data for list ${listId}`);
    setIsLoadingListData(true); // Use specific loading state for list data
    try {
      const apiData = await getShoppingDataForList(listId); // Note: API needs to support signal
      
      // Check if this request was aborted
      if (signal.aborted) {
        console.log(`Fetch aborted for list ${listId}`);
        return;
      }
      
      updateListPriceData(listId, {
        results: apiData.results || {},
        selections: apiData.selections || {},
        session_id: apiData.session_id || null,
        last_checked: apiData.last_checked || null,
        status: apiData.status,
        dataSource: 'api'
      });
      console.log(`Successfully fetched and set API data for list ${listId}`, apiData);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Fetch aborted for list ${listId}`);
        return;
      }
      console.error(`Error fetching shopping data for list ${listId} from API:`, error);
      toast({
        title: "Error Fetching Prices",
        description: `Could not load price data for the list. ${(error as Error).message}`,
        variant: "destructive",
      });
      // Optionally, clear data or set an error state for the list
      updateListPriceData(listId, {
        results: {},
        selections: {},
        dataSource: 'api', // Still API attempt, but failed
        status: 'error',
        storeSubtotals: {},
      });
    } finally {
      setIsLoadingListData(false); // Or the specific loading state
    }
  }, [updateListPriceData, toast]);

  // Function to create a new list (fresh chat session)
  const handleCreateNewList = async () => {
    setIsCreatingNewList(true);
    try {
      // Clear all localStorage items related to chat
      const { setUserScopedSessionId } = await import('@/stores/chatStore');
      setUserScopedSessionId(null);
      localStorage.removeItem('savr-chat-storage');
      
      // Clear the chat store state
      resetChatStore();
      
      // Get a fresh welcome message with new session
      const welcomeResponse = await chatService.getWelcomeMessage();
      
      // Set the new session ID
      if (welcomeResponse.session_id && !welcomeResponse.session_id.startsWith('error-')) {
        const { setUserScopedSessionId } = await import('@/stores/chatStore');
        setUserScopedSessionId(welcomeResponse.session_id);
      }
      
      // Navigate to chat page
      navigate('/chat');
      
      toast({
        title: "New List Started",
        description: "Ready to create your new grocery list!",
      });
    } catch (error) {
      console.error('Error creating new list:', error);
      toast({
        title: "Error Creating New List",
        description: "Could not start a new list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingNewList(false);
    }
  };

  // Function to fetch grocery lists
  const fetchGroceryLists = async (listIdToSelect?: string) => {
    try {
      console.log('Fetching grocery lists...');
      setIsLoading(true);
      
      // Fetch the lists from API
      const userLists = await getUserGroceryLists();
      console.log('Fetched grocery lists (raw):', userLists); // Log raw lists
      userLists.forEach(list => {
        console.log(`List ${list.id}: createdAt=${list.createdAt}, lastUpdated=${list.lastUpdated}`);
      });
      
      // Ensure we have unique lists by ID
      const uniqueLists = removeDuplicateListsById(userLists);
      
      // Sort lists by createdAt in descending order (newest first)
      const sortedLists = uniqueLists.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      
      if (sortedLists && sortedLists.length > 0) {
        console.log(`Found ${sortedLists.length} unique lists. Setting lists state.`);
        
        // Update the lists state
        setLists(sortedLists);
        
        // Select the specified list if provided, otherwise select the first list
        const listToSelect = listIdToSelect
          ? sortedLists.find(list => list.id === listIdToSelect)
          : sortedLists[0]; // Select first list by default

        // Update the selected list state
        if (listToSelect) {
          console.log(`Selecting list: ${listToSelect.id}`);
          console.log(`Selected list details: createdAt=${listToSelect.createdAt}, lastUpdated=${listToSelect.lastUpdated}`); // Log selected list dates
          setSelectedList(listToSelect);
          
          // Data fetching will now be handled by the useEffect hook observing selectedList
        } else {
          console.log('No list to select');
          setSelectedList(null);
        }
      } else {
        console.log('No lists found. Showing empty state.');
        setLists([]);
        setSelectedList(null);
      }
    } catch (error) {
      console.error('Error fetching grocery lists:', error);
      toast({
        title: "Failed to load lists",
        description: "There was an error fetching your grocery lists.",
        variant: "destructive"
      });
      setLists([]);
      setSelectedList(null);
    } finally {
      // Always mark loading as complete
      setIsLoading(false);
    }
  };

  const removeDuplicateListsById = (lists: SavedGroceryList[]): SavedGroceryList[] => {
    if (!lists) return [];
    
    const uniqueListMap = new Map<string, SavedGroceryList>();
    
    // Keep only the latest entry for each unique ID
    for (const list of lists) {
      uniqueListMap.set(list.id, list);
    }
    
    return Array.from(uniqueListMap.values());
  };

  // A single consolidated initialization effect that handles everything needed on mount
  useEffect(() => {
    console.log('ListsPage mounted - initializing component');
    
    // Check auth status
    const isLoggedIn = authService.isLoggedIn();
    console.log(`User login status: ${isLoggedIn}`);
    
    // Initialize the component by loading lists
    const loadInitialData = async () => {
      try {
        // Check if we should select a specific list from navigation state
      const listIdToSelect = location.state?.fromChatSave && location.state?.listId 
        ? location.state.listId 
        : undefined;
      
        // Fetch the lists
      await fetchGroceryLists(listIdToSelect);
      
        // Show save message if we navigated from chat page
      if (location.state?.fromChatSave) {
        toast({
          title: "List saved successfully",
          description: "Your grocery list has been saved.",
        });
        window.history.replaceState({}, document.title);
        }
      } catch (error) {
        console.error("Error during initial component load:", error);
        toast({
          title: "Loading Error",
          description: "Failed to load your grocery lists. Please try refreshing.",
          variant: "destructive"
        });
      }
    };
    
    // Start the initialization process
    loadInitialData();
    
    // Fetch savings summary
    fetchSavingsSummary();
    
    // For test API connectivity 
    const testShopping = async () => {
      try {
        const result = await testShoppingRouter();
        console.log('Shopping router is accessible:', result);
      } catch (error) {
        console.error('Shopping router is not accessible:', error);
      }
    };
    testShopping();
    
    // This effect should only run once on mount
  }, []);

  // Open/close modal based on URL param ?storeView=store and react to location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const storeView = params.get('storeView');
    const ready = currentListDataRef.current && currentListDataRef.current.status === 'completed';
    if (storeView && ready) {
      if (!isStoreViewOpen || focusedStoreName !== storeView) {
        setFocusedStoreName(storeView);
        setIsStoreViewOpen(true);
      }
    } else if (!storeView && isStoreViewOpen) {
      setIsStoreViewOpen(false);
    }
  }, [location.search, currentListDataVersion]);

  // Restore isListSelected function (referenced in the Card component)
  const isListSelected = (listId: string): boolean => {
    return pendingListSelection?.id === listId || selectedList?.id === listId;
  };

  // Restore confirmDeleteList function
  const confirmDeleteList = (list: SavedGroceryList, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the list when clicking delete
    setListToDelete(list);
  };

  // Restore handleDeleteList function
  const handleDeleteList = async () => {
    if (!listToDelete) return;
    
    try {
      setIsLoading(true);
      await deleteGroceryList(listToDelete.id);
      
      const updatedLists = lists.filter(list => list.id !== listToDelete.id);
      setLists(updatedLists);
      
      // If the selected list was deleted, select another list or clear selection
      if (selectedList && selectedList.id === listToDelete.id) {
        setSelectedList(updatedLists.length > 0 ? updatedLists[0] : null);
      }
      
      toast({
        title: "List deleted",
        description: `"${listToDelete.name}" has been deleted.`,
      });
      
      // Reset the listToDelete state
      setListToDelete(null);
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: "Error deleting list",
        description: "There was a problem deleting your list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch selected stores on mount (Restored)
  useEffect(() => {
    storeService.getUserSelectedStores()
      .then(setSelectedStores)
      .catch((e: any) => {
        console.error('Failed to fetch selected stores on mount', e);
        toast({
          title: "Store Load Error",
          description: "Could not load your saved store preferences.",
          variant: "default"
        });
      });
  }, [toast]); // Added toast to dependency array

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Polling function with better logging and error handling - MOVED BEFORE handleShopNow
  const startPollingForResults = useCallback((listId: string) => {
    console.log(`[Polling] Starting polling for list ${listId}`);
    setIsPollingActive(true); // Set polling active
    
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    let pollCount = 0;
    const maxPolls = 240; // Poll for up to 10 minutes (240 * 2.5s)
    
    // Start polling
    pollingIntervalRef.current = setInterval(async () => {
      pollCount++;
      try {
        console.log(`[Polling] Fetching data for list ${listId} (poll #${pollCount})`);
        const data = await getShoppingDataForList(listId);
        
        // Log raw status from API
        console.log(`[Polling] Raw data from API:`, data);
        console.log(`[Polling] Received status: '${data.status}'`);

        const hasResults = Object.keys(data.results || {}).length > 0;
        
        console.log(`[Polling] Received data details:`, {
          resultsCount: Object.keys(data.results || {}).length,
          selectionsCount: Object.keys(data.selections || {}).length,
          status: data.status,
          sessionId: data.session_id,
          hasResults
        });

        const payloadForUpdate: Partial<ListPriceData> = {
          dataSource: 'api',
          status: data.status, // Always update status
          session_id: data.session_id !== undefined ? data.session_id : null, // Preserve null if explicitly undefined
          last_checked: data.last_checked !== undefined ? data.last_checked : null, // Preserve null if explicitly undefined
        };

        // Handle 'results':
        // Only include 'results' in the payload if:
        // 1. New results are provided and are non-empty.
        // 2. OR the session is terminal (completed/failed) - in this case, we take whatever results API sent (even if empty or undefined, which updateListPriceData will default to {}).
        if (data.results && Object.keys(data.results).length > 0) {
          payloadForUpdate.results = data.results;
        } else if (data.status === 'completed' || data.status === 'failed') {
          payloadForUpdate.results = data.results; // Will be handled by updateListPriceData (defaults to {} if undefined)
        }
        // If neither of these conditions is met (e.g., in_progress and data.results is empty/undefined),
        // payloadForUpdate.results remains undefined. The updateListPriceData function will then preserve
        // the existing results for the list, preventing them from being cleared.

        // Handle 'selections' with the same logic:
        if (data.selections && Object.keys(data.selections).length > 0) {
          payloadForUpdate.selections = data.selections;
        } else if (data.status === 'completed' || data.status === 'failed') {
          payloadForUpdate.selections = data.selections; // Will be handled by updateListPriceData
        }
        // If selections remain undefined in payload, updateListPriceData preserves existing.
        
        console.log(`[Polling] Payload for updateListPriceData:`, payloadForUpdate);
        updateListPriceData(listId, payloadForUpdate);
        
        // REVISED Stop polling condition:
        // Stop if backend reports session is completed or failed.
        const sessionOver = data.status === 'completed' || data.status === 'failed';
        console.log(`[Polling] Checking stop conditions: sessionOver=${sessionOver} (status: ${data.status}), pollCount=${pollCount}, maxPolls=${maxPolls}`);

        if (sessionOver) {
          console.log(`[Polling] Stopping - Search session status: '${data.status}'.`);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsPollingActive(false);
          setIsShoppingNow(false); // Also set isShoppingNow to false

          // Calculate search stats for the completion toast
          const elapsedMs = searchStartTimeRef.current ? Date.now() - searchStartTimeRef.current : 0;
          const elapsedSeconds = Math.round(elapsedMs / 1000);

          // Count stores and products from results
          const storeSet = new Set<string>();
          let totalProducts = 0;

          if (data.results) {
            Object.values(data.results).forEach((storeProducts: any) => {
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

          // Calculate savings from the results
          let savingsInfo = '';
          if (hasResults && data.results) {
            const quickSubtotals: Record<string, number> = {};

            Object.entries(data.results).forEach(([itemName, storeProducts]: [string, any]) => {
              Object.entries(storeProducts || {}).forEach(([storeName, products]: [string, any]) => {
                if (Array.isArray(products) && products.length > 0) {
                  // Use selection if available, otherwise first product
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
              .filter(([_, total]) => total > 0)
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
            title: data.status === 'completed' ? "Price Check Complete!" : "Search Failed",
            description,
            variant: data.status === 'completed' ? "default" : "destructive"
          });

          // Reset search start time
          searchStartTimeRef.current = null;

          // If search completed successfully, calculate and save price comparison
          if (data.status === 'completed' && hasResults) {
            // Wait a bit for store subtotals to be calculated
            setTimeout(() => {
              calculateAndSavePriceComparison();
            }, 500);
          }
        } else if (pollCount >= maxPolls) {
          console.log(`[Polling] Stopping - max polls reached (${maxPolls}). Current status: ${data.status}`);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsPollingActive(false);
          setIsShoppingNow(false);
          // No toast here - results may still appear, don't alarm the user
        }
      } catch (err) {
        console.error('[Polling] Error fetching data:', err);
        // Don't stop polling on error - let it retry
      }
    }, 2500); // Poll every 2.5 seconds
  }, [updateListPriceData, toast, calculateAndSavePriceComparison]);

  // UPDATED handleSelectProduct function
  const handleSelectProduct = async (itemName: string, product: SearchResultInDB | GroceryProduct, storeName: string) => {
    if (!selectedList || !selectedList.id) {
      toast({ title: "Error", description: "No list selected for saving choice.", variant: "destructive" });
      return;
    }

    const selectionKey = `${itemName}_${storeName}`;
    if (pendingSelectionsRef.current.has(selectionKey)) {
      console.log(`[HandleSelectProduct] Selection for ${selectionKey} already pending. Skipping.`);
      toast({
        title: "Selection In Progress",
        description: `Selection for ${itemName} at ${formatStoreName(storeName)} is already being saved.`,
        variant: "default"
      });
      return;
    }

    const currentData = getCurrentListPriceData();
    const currentSessionId = currentData?.session_id;

    if (!currentSessionId) {
      toast({
        title: "Cannot Save Selection",
        description: "There is no active search session ID. Please perform a price check first.",
        variant: "default",
      });
      return;
    }

    pendingSelectionsRef.current.add(selectionKey);

    const isNothingProduct = product.name === "Nothing";
    // The product object for "Nothing" won't have a real DB id, so selected_product_id is null.
    // For real products, product.id comes from SearchResultInDB.id
    const selectedProductId = !isNothingProduct ? (product as SearchResultInDB).id : null;

    const selectionPayload: ProductSelectionCreate = {
      item_name: itemName,
      store_name: storeName, // Use the passed storeName
      selected_product_id: selectedProductId,
      is_nothing: isNothingProduct,
      session_id: currentSessionId,
    };

    // Optimistic update using functional pattern to avoid stale closures
    updateSelectionFunctional(selectedList.id, itemName, storeName, product as SearchResultInDB);

    try {
      // API Call
      const savedSelection = await saveProductSelection(selectedList.id, selectionPayload);
      console.log('Product selection saved to DB:', savedSelection);

      // Optimistic update already applied - no need to update again on success
      // The selection is already in state from updateSelectionFunctional call above
      // No toast here - selections are saved silently
    } catch (error) {
      console.error('Error saving product selection to API:', error);
      // Revert only THIS selection using functional update to avoid clobbering concurrent changes
      setListPriceDataMap(prev => {
        const currentDataForList = prev[selectedList.id];
        if (!currentDataForList) return prev;

        const latestSelections = { ...currentDataForList.selections };
        if (latestSelections[itemName]) {
          const { [storeName]: _, ...restStoreSelections } = latestSelections[itemName];
          if (Object.keys(restStoreSelections).length === 0) {
            const { [itemName]: __, ...restItemSelections } = latestSelections;
            return {
              ...prev,
              [selectedList.id]: { ...currentDataForList, selections: restItemSelections },
            };
          } else {
            return {
              ...prev,
              [selectedList.id]: {
                ...currentDataForList,
                selections: { ...latestSelections, [itemName]: restStoreSelections }
              },
            };
          }
        }
        return prev;
      });
      toast({
        title: "Save Failed",
        description: `Could not save selection for ${itemName}. ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      pendingSelectionsRef.current.delete(selectionKey);
    }
  };

  // MODIFIED handleShopNow function - ensure polling starts reliably
  const handleShopNow = async () => {
    console.log('[HandleShopNow] Function called');

    if (!selectedList) {
      console.log('[HandleShopNow] No selected list, returning');
      toast({ title: "No List Selected", variant: "destructive" });
      return;
    }

    // Wait if stores are being saved (prevents race condition)
    if (isSavingStores) {
      console.log('[HandleShopNow] Stores are being saved, waiting...');
      toast({ title: "Please wait", description: "Saving your store selection..." });
      // Wait up to 5 seconds for stores to finish saving
      let waitCount = 0;
      while (isSavingStores && waitCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
      if (isSavingStores) {
        console.log('[HandleShopNow] Timeout waiting for store save');
        toast({ title: "Please try again", description: "Store selection is taking longer than expected.", variant: "destructive" });
        return;
      }
      console.log('[HandleShopNow] Store save completed, proceeding');
    }

    // Set loading state immediately to provide visual feedback
    setIsShoppingNow(true);

    // Record search start time for stats in completion toast
    searchStartTimeRef.current = Date.now();

    try {
      console.log('[HandleShopNow] Selected list:', selectedList.id);

      // --- BEGIN MODIFICATION: Clear old data ---
      console.log(`[HandleShopNow] Clearing previous data for list ${selectedList.id}`);

      // Clear finalized store order so new search gets fresh ordering
      finalizedStoreOrderRef.current = null;

      updateListPriceData(selectedList.id, {
        results: {},
        selections: {},
        storeSubtotals: {},
        status: 'pending', // Set status to pending to reflect a new search starting
        session_id: null,  // Clear old session ID
        last_checked: null, // Clear old last_checked timestamp
        dataSource: 'api' // Or null, depending on desired initial state before polling
      });
      // --- END MODIFICATION ---

      let storesToSearch: UserSelectedStore[] = [];
      try {
        console.log('[HandleShopNow] Fetching stores from API...');
        console.log('[HandleShopNow] Current UI selectedStores state:', selectedStores.map(s => ({
          id: s.id,
          store_name: s.store_name,
          address: s.address,
          lat: s.latitude,
          lon: s.longitude
        })));
        storesToSearch = await storeService.getUserSelectedStores();
        console.log('[HandleShopNow] Stores fetched from API:', storesToSearch.map(s => ({
          id: s.id,
          store_name: s.store_name,
          address: s.address,
          postal_code: s.postal_code,
          lat: s.latitude,
          lon: s.longitude
        })));

        // Log comparison between UI state and API response
        const uiStoreNames = selectedStores.map(s => s.store_name).sort().join(', ');
        const apiStoreNames = storesToSearch.map(s => s.store_name).sort().join(', ');
        if (uiStoreNames !== apiStoreNames) {
          console.warn('[HandleShopNow] MISMATCH: UI stores vs API stores differ!', {
            ui: selectedStores.map(s => s.store_name),
            api: storesToSearch.map(s => s.store_name)
          });
        } else {
          console.log('[HandleShopNow] Store lists match (UI and API)');
        }
      } catch (e: any) {
        console.log('[HandleShopNow] Error fetching stores:', e);
        toast({ title: "Error Fetching Stores", variant: "destructive" });
        setIsShoppingNow(false);
        return;
      }
      
      // Single-store test mode via URL flag ?singleStore=1
      try {
        const params = new URLSearchParams(window.location.search);
        const singleStoreFlag = params.get('singleStore');
        if (singleStoreFlag && storesToSearch && storesToSearch.length > 0) {
          const originalCount = storesToSearch.length;
          storesToSearch = storesToSearch.slice(0, 1);
          console.log(`[HandleShopNow] Single-store test mode enabled via URL. Limiting stores from ${originalCount} to ${storesToSearch.length}.`);
        }
      } catch (err) {
        console.warn('[HandleShopNow] Unable to parse URL params for singleStore flag:', err);
      }

      if (!storesToSearch || !storesToSearch.length) {
        console.log('[HandleShopNow] No stores selected, opening store selector');
        toast({ 
          title: "No Stores Selected", 
          description: "Please select at least one store to check prices.",
          action: (
            <Button variant="outline" size="sm" onClick={() => setIsStoreModalOpen(true)}>
              Select Stores
            </Button>
          ),
        });
        // Automatically open the modal as a convenience
        setIsStoreModalOpen(true);
        setIsShoppingNow(false);
        return;
      }

      console.log('[HandleShopNow] Stores valid. Proceeding to search.');

      console.log('[HandleShopNow] Showing toast');
      toast({
        title: "Price Check Started",
        description: "Checking store websites for the latest pricing and availability. This may take a few minutes."
      });

      // Initiate the backend search FIRST, then start polling AFTER session is created
      // This ensures polling doesn't fetch stale data from the old session
      console.log('[HandleShopNow] Starting backend search');
      const itemNames = selectedList.items.map(item => item.name);
      const storesPayload = storesToSearch.map(s => ({
        store_name: s.store_name,
        postal_code: s.postal_code,
        address: s.address,  // Include address for unique store identification
        latitude: s.latitude,
        longitude: s.longitude,
      }));

      try {
        console.log('[HandleShopNow] Calling checkPricesDirectly with:', { storesPayload, itemNames, listId: selectedList.id });
        const checkResponse = await checkPricesDirectly(storesPayload, itemNames, selectedList.id);
        console.log("[HandleShopNow] Response from checkPricesDirectly:", checkResponse);

        // NOW start polling - after the new session has been created on the backend
        // This prevents polling from fetching stale data from the old session
        console.log('[HandleShopNow] Backend session created, now starting polling for list:', selectedList.id);
        try {
          startPollingForResults(selectedList.id);
          console.log('[HandleShopNow] startPollingForResults called successfully');
        } catch (pollErr) {
          console.error('[HandleShopNow] Error calling startPollingForResults:', pollErr);
        }

        if (checkResponse.message) toast({ title: "Search Update", description: checkResponse.message });
      } catch (error) {
        console.error('[HandleShopNow] Error in backend search:', error);
        if (error instanceof Error && error.message.includes('timeout')) {
          toast({ title: "Search in Progress", description: "Search continues in background." });
          // Still start polling even on timeout - the backend may still be processing
          startPollingForResults(selectedList.id);
        } else {
          toast({ title: "Search Error", description: "Error starting search.", variant: "default" });
          setIsShoppingNow(false);
        }
      }
      
      console.log('[HandleShopNow] Function completed');
    } catch (err) {
      console.error('[HandleShopNow] Critical error:', err);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
      setIsShoppingNow(false);
    }
  };
  
  // Add back the handleSelectList function and the effect to handle selected list changes
  const handleDeleteItem = useCallback(async (listId: string, itemName: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const updatedItems = list.items.filter(item => item.name !== itemName);
    // Optimistic update
    setLists(prev => prev.map(l => l.id === listId ? { ...l, items: updatedItems } : l));
    if (selectedList?.id === listId) {
      setSelectedList(prev => prev ? { ...prev, items: updatedItems } : prev);
    }

    try {
      await updateGroceryListItems(listId, updatedItems);
      toast({ description: 'Item removed', duration: 2000 });
    } catch {
      // Rollback
      setLists(prev => prev.map(l => l.id === listId ? list : l));
      if (selectedList?.id === listId) {
        setSelectedList(list);
      }
      toast({ variant: 'destructive', description: 'Failed to remove item', duration: 3000 });
    }
  }, [lists, selectedList, toast]);

  const handleSelectList = (list: SavedGroceryList) => {
    // Clear any pending selection
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // Clear finalized store order when switching lists
    finalizedStoreOrderRef.current = null;

    // Show immediate visual feedback
    setPendingListSelection(list);
    
    // Debounce the actual selection
    selectionTimeoutRef.current = setTimeout(() => {
      console.log(`Selecting list with ID: ${list.id}`);
      const listFromState = lists.find(l => l.id === list.id);
      if (listFromState) {
        console.log(`Selected list from state: createdAt=${listFromState.createdAt}, lastUpdated=${listFromState.lastUpdated}`);
      } else if (list) {
        console.log(`Selected list (direct param): createdAt=${list.createdAt}, lastUpdated=${list.lastUpdated}`);
      }
      setSelectedList(listFromState || list);
      setPendingListSelection(null);
      
      // Scroll the selected card into view
      setTimeout(() => {
        const cardRef = listCardRefs.current[list.id];
        if (cardRef && scrollContainerRef.current) {
          // Calculate if the card is fully visible
          const containerRect = scrollContainerRef.current.getBoundingClientRect();
          const cardRect = cardRef.getBoundingClientRect();
          
          // Check if card is not fully visible
          if (cardRect.left < containerRect.left || cardRect.right > containerRect.right) {
            cardRef.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center'
            });
          }
        }
      }, 100); // Small delay to ensure DOM is updated
    }, 150); // 150ms debounce - fast enough to feel snappy, slow enough to skip intermediate selections
  };

  // A separate effect for handling selected list changes
  useEffect(() => {
    if (selectedList && selectedList.id) {
      console.log(`Selected list changed to: ${selectedList.id}`);
      
      // Check if we already have data for this list in memory from API
      const existingData = listPriceDataMap[selectedList.id];
      if (existingData && existingData.dataSource === 'api') {
        console.log(`Using cached API price data for list ${selectedList.id}`);
        // Data is already in state from API, no need to re-fetch unless explicitly requested
      } else {
        // Fetch data from API if not present or not from API
        console.log(`No API data in cache for list ${selectedList.id}, fetching...`);
        fetchAndSetShoppingDataForList(selectedList.id);
      }
    }
  }, [selectedList, listPriceDataMap, fetchAndSetShoppingDataForList]); // Added fetchAndSetShoppingDataForList to dependencies

  // Function to sort items based on current sortConfig
  const getSortedItems = useCallback((): GroceryItem[] => {
    if (!selectedList) return [];
    let sortableItems = [...selectedList.items];

    if (sortConfig !== null) {
      if (sortConfig.type === 'field') {
        const { key, direction } = sortConfig;
        sortableItems.sort((a, b) => {
          let aValue: string | number | null = (a as any)[key] ?? '';
          let bValue: string | number | null = (b as any)[key] ?? '';

          if (key === 'quantity') {
            aValue = parseFloat(a.quantity || '0');
            bValue = parseFloat(b.quantity || '0');
          }

          if (aValue === null || aValue === undefined) aValue = '';
          if (bValue === null || bValue === undefined) bValue = '';

          if (aValue < bValue) {
            return direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      } else if (sortConfig.type === 'storePrice') {
        const { storeName, direction } = sortConfig;
        sortableItems.sort((a, b) => {
          const aPrice = getComparablePrice(a, storeName);
          const bPrice = getComparablePrice(b, storeName);

          // Nulls always at the end regardless of direction
          const aNull = aPrice === null;
          const bNull = bPrice === null;
          if (aNull && !bNull) return 1;
          if (!aNull && bNull) return -1;
          if (aNull && bNull) {
            // Tie-breaker: name ascending
            const aName = (a.name || '').toString();
            const bName = (b.name || '').toString();
            return aName.localeCompare(bName);
          }

          // Both numbers present
          if (aPrice! === bPrice!) {
            // Tie-breaker: name ascending
            const aName = (a.name || '').toString();
            const bName = (b.name || '').toString();
            return aName.localeCompare(bName);
          }
          return direction === 'asc' ? (aPrice! - bPrice!) : (bPrice! - aPrice!);
        });
      }
    }
    return sortableItems;
  }, [selectedList, sortConfig]);

  // Sorting request helpers


  // Log state before rendering
  console.log('[Render] isLoading:', isLoading);
  console.log('[Render] selectedList:', selectedList ? selectedList.id : null);
  console.log('[Render] isShoppingNow:', isShoppingNow);
  // console.log('[Render] shoppingResults:', shoppingResults); // shoppingResults is derived
  // console.log('[Render] storeSubtotals:', storeSubtotals); // storeSubtotals is derived
  // console.log('[Render] dataSource:', dataSource); // dataSource is derived

  // useEffect for auto-selecting first product for each item/store as soon as products are available
  useEffect(() => {
    if (!selectedList || !selectedList.id) return;
    if (!currentListDataRef.current) return;
    
    const { results, selections, session_id } = currentListDataRef.current;
    
    // Don't require session_id for auto-selection - results might arrive before session_id
    console.log(`[AutoSelect] Checking for auto-selection opportunities. Results keys: ${Object.keys(results || {}).length}, Selections keys: ${Object.keys(selections || {}).length}`);

    Object.entries(results || {}).forEach(([itemName, storesObj]) => {
      Object.entries(storesObj || {}).forEach(([storeName, productsArr]) => {
        const selectionKey = `${itemName}_${storeName}`;
        if (
          Array.isArray(productsArr) &&
          productsArr.length > 0 &&
          (!selections || !selections[itemName] || !selections[itemName][storeName]) &&
          !pendingSelectionsRef.current.has(selectionKey) // Check pending selections here
        ) {
          // No selection yet for this item/store, auto-select first product
          if (!session_id) {
            console.log(`[AutoSelect] Would select first product for ${itemName} at ${storeName}, but waiting for session_id`);
          } else {
            console.log(`[AutoSelect] Selecting first product for ${itemName} at ${storeName}. Product:`, productsArr[0]);
            handleSelectProduct(itemName, productsArr[0], storeName);
          }
        }
      });
    });
  }, [selectedList?.id, currentListDataVersion, handleSelectProduct]); // Now depends on version, not the whole map

  // Clean up polling on unmount or list change
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        console.log('[Polling] Cleaning up polling interval on unmount or list change for:', selectedList?.id);
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        // Only set these to false if truly stopping for this list context
        // If another effect is meant to resume, it will set them back.
        // setIsPollingActive(false); // Avoid race conditions, let new effect handle this
        // setIsShoppingNow(false);  // Avoid race conditions
      }
    };
  }, [selectedList]);

  // New useEffect to resume polling if necessary when list data indicates an active search
  useEffect(() => {
    let didResumePolling = false;
    if (selectedList && selectedList.id && !isPollingActive) { // Only attempt to resume if not already polling
      const currentData = listPriceDataMap[selectedList.id];
      if (currentData && (currentData.status === 'in_progress' || currentData.status === 'pending') && currentData.session_id) {
        console.log(`[ResumePollingEffect] List ${selectedList.id} has status '${currentData.status}' and session ID. Resuming polling.`);
        setIsShoppingNow(true); // Show loading indicator
        // startPollingForResults will set isPollingActive to true internally
        startPollingForResults(selectedList.id);
        didResumePolling = true;
      }
    }

    // If polling was not resumed by the logic above (e.g. status is 'completed' or no session_id)
    // and the component thought it was shopping (e.g. from a quick nav away/back before first poll after clicking "Check Prices"),
    // then we might need to turn off the spinner if the status is actually terminal.
    if (!didResumePolling && selectedList && selectedList.id) {
        const currentData = listPriceDataMap[selectedList.id];
        if (currentData && (currentData.status === 'completed' || currentData.status === 'failed' || currentData.status === 'error')) {
            if(isShoppingNow || isPollingActive) { // Only if they were true
                console.log(`[ResumePollingEffect] List ${selectedList.id} has terminal status '${currentData.status}'. Ensuring spinner is off.`);
                setIsShoppingNow(false);
                setIsPollingActive(false); // Ensure polling is marked as inactive
                if (pollingIntervalRef.current) { // Defensive: clear interval if somehow active
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
            }
        }
    }
  }, [selectedList, listPriceDataMap, startPollingForResults, isPollingActive, isShoppingNow]);

  // Clean up selection timeout on unmount
  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Carousel scrollbar visibility handlers
  const showScrollbarWithTimer = useCallback(() => {
    setShowCarouselScrollbar(true);
    
    // Clear existing timer
    if (carouselScrollbarTimeoutRef.current) {
      clearTimeout(carouselScrollbarTimeoutRef.current);
    }
    
    // Set auto-hide timer (3 seconds)
    carouselScrollbarTimeoutRef.current = setTimeout(() => {
      setShowCarouselScrollbar(false);
    }, 3000);
  }, []);

  const hideScrollbarImmediate = useCallback(() => {
    if (carouselScrollbarTimeoutRef.current) {
      clearTimeout(carouselScrollbarTimeoutRef.current);
    }
    setShowCarouselScrollbar(false);
  }, []);

  const handleCarouselMouseEnter = useCallback(() => {
    showScrollbarWithTimer();
  }, [showScrollbarWithTimer]);

  const handleCarouselMouseLeave = useCallback(() => {
    hideScrollbarImmediate();
  }, [hideScrollbarImmediate]);

  const handleCarouselFocus = useCallback(() => {
    showScrollbarWithTimer();
  }, [showScrollbarWithTimer]);

  const handleCarouselBlur = useCallback(() => {
    hideScrollbarImmediate();
  }, [hideScrollbarImmediate]);

  const handleCarouselScroll = useCallback(() => {
    // Show scrollbar when user is actively scrolling
    showScrollbarWithTimer();
  }, [showScrollbarWithTimer]);

  const handleCarouselTouchStart = useCallback(() => {
    showScrollbarWithTimer();
  }, [showScrollbarWithTimer]);

  // Clean up carousel scrollbar timer on unmount
  useEffect(() => {
    return () => {
      if (carouselScrollbarTimeoutRef.current) {
        clearTimeout(carouselScrollbarTimeoutRef.current);
      }
    };
  }, []);

  // Apply fixed gradient background to body while this page is mounted
  useEffect(() => {
    const className = 'app-gradient-bg';
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900">
      <div className="container-fluid max-w-screen-2xl mx-auto py-6 sm:py-6 px-3 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 pt-4 sm:pt-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold whitespace-nowrap">My Grocery Lists</h1>
        <div className="flex flex-row gap-3 sm:gap-4 items-center">
          <Button size="sm" onClick={handleCreateNewList} variant="outline" disabled={isCreatingNewList} className="whitespace-nowrap">
            {isCreatingNewList ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MessageSquarePlus className="h-4 w-4 mr-2" />
            )}
            {isCreatingNewList ? 'Creating...' : 'New List'}
          </Button>
          {/* Savings Metrics: Combined into one with Tooltip */}
          {savingsSummary && savingsSummary.total_saved > 0 && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 ease-in-out whitespace-nowrap"
                  >
                    Saved: <span className="font-bold">${savingsSummary.total_saved.toFixed(2)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center" className="bg-gray-800 text-white rounded-md shadow-lg text-xs">
                  <div className="p-2">
                    {savingsSummary.saved_this_month > 0 && (
                      <p>This month: ${savingsSummary.saved_this_month.toFixed(2)}</p>
                    )}
                    <p>All time: ${savingsSummary.total_saved.toFixed(2)}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Horizontal scrollable list row */}
      <div className="list-carousel-wrapper mb-4 sm:mb-6">
        <div 
          className={`list-carousel-inner w-full px-2 sm:px-4 py-3 sm:py-4 transition-all duration-300 ease-in-out ${
            showCarouselScrollbar ? 'list-carousel-visible' : 'list-carousel-hidden'
          }`}
          ref={scrollContainerRef}
          onMouseEnter={handleCarouselMouseEnter}
          onMouseLeave={handleCarouselMouseLeave}
          onFocus={handleCarouselFocus}
          onBlur={handleCarouselBlur}
          onScroll={handleCarouselScroll}
          onTouchStart={handleCarouselTouchStart}
          tabIndex={0}
          role="region"
          aria-label="Grocery lists carousel"
        >
          <div className="flex flex-row gap-3 sm:gap-4 items-start" style={{ minWidth: 0 }}>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading lists...</span>
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground mb-4">You don't have any grocery lists yet.</p>
                <Button onClick={() => navigate('/chat')}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Your First List
                </Button>
              </div>
            ) : (
              lists.map((list) => (
                <ListCard
                  key={list.id}
                  ref={(el) => { listCardRefs.current[list.id] = el; }}
                  list={list}
                  isSelected={isListSelected(list.id)}
                  isPending={pendingListSelection?.id === list.id}
                  isSearching={isShoppingNow || isPollingActive}
                  onSelect={handleSelectList}
                  onDeleteConfirm={confirmDeleteList}
                  onCheckPrices={handleShopNow}
                  onDeleteItem={handleDeleteItem}
                />
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Main list viewer (takes full width now) */}
      <div className="w-full">
        {selectedList ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 mb-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl">Price Comparison</CardTitle>
                <CardDescription className="text-sm">
                  Compare prices across selected stores
                </CardDescription>
              </div>
              <div className="flex flex-row gap-2 items-center">
                {/* Selected Stores Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center justify-between flex-1 sm:w-auto whitespace-nowrap" style={{ minWidth: 'auto' }}>
                      <span className="text-sm truncate">Selected Stores ({selectedStores.length})</span>
                      <ChevronDown className="ml-2 h-4 w-4 opacity-70 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[260px]">
                    <DropdownMenuItem
                      className="flex items-center gap-2 font-medium text-primary cursor-pointer hover:bg-muted"
                      onClick={() => setIsStoreModalOpen(true)}
                    >
                      <Store className="h-4 w-4" />
                      Add or Edit Stores
                    </DropdownMenuItem>
                    {selectedStores.length === 0 ? (
                      <div className="p-3 text-muted-foreground text-sm">No stores selected.</div>
                    ) : (
                      selectedStores.map(sel => (
                        <DropdownMenuItem key={sel.id} className="flex items-center justify-between">
                          <span className="truncate max-w-[245px]">{formatStoreName(sel.store_name)} <span className="text-xs text-muted-foreground">{sel.postal_code}</span></span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-2"
                            title="Unselect store"
                            onClick={async (e: React.MouseEvent) => {
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
                <Button 
                  onClick={() => { 
                    console.log('[UI] Check Prices button clicked'); 
                    handleShopNow(); 
                  }} 
                  size="sm"
                  disabled={isShoppingNow || isPollingActive}
                  className="flex-1 sm:w-auto whitespace-nowrap"
                >
                  {(isShoppingNow || isPollingActive) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="text-sm">Searching...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      <span className="text-sm">Check Prices</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div>
              {isLoadingListData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                  <span>Loading list data...</span>
                </div>
              ) : orderedStoreNames.length > 0 ? (
                <div className="store-carousel-wrapper">
                  <div 
                    className={`store-carousel-inner px-2 sm:px-4 py-3 sm:py-4 transition-all duration-300 ease-in-out ${
                      showCarouselScrollbar ? 'store-carousel-visible' : 'store-carousel-hidden'
                    }`}
                    style={{ 
                      overflowX: 'auto', 
                      overflowY: 'visible',
                      width: '100%',
                      minWidth: 0
                    }}
                    onMouseEnter={handleCarouselMouseEnter}
                    onMouseLeave={handleCarouselMouseLeave}
                    onFocus={handleCarouselFocus}
                    onBlur={handleCarouselBlur}
                    onScroll={handleCarouselScroll}
                    onTouchStart={handleCarouselTouchStart}
                    tabIndex={0}
                    role="region"
                    aria-label="Store grocery lists carousel"
                  >
                    <div className="flex flex-row gap-4 sm:gap-6" style={{ width: 'max-content', minWidth: '100%', alignItems: 'flex-start' }}>
                      {orderedStoreNames.map((store: string) => {
                        // Only calculate cheapest/savings when search is complete
                        const isSearchComplete = currentListData?.status === 'completed';

                        // Calculate if this store has the cheapest total
                        const storeTotal = memoizedStoreSubtotals[store]?.total || 0;
                        const allStoreTotals = orderedStoreNames
                          .map(s => memoizedStoreSubtotals[s]?.total || 0)
                          .filter(total => total > 0);
                        const minTotal = allStoreTotals.length > 0 ? Math.min(...allStoreTotals) : 0;
                        const maxTotal = allStoreTotals.length > 0 ? Math.max(...allStoreTotals) : 0;

                        // Only mark as cheapest if search is complete AND there's actual price differentiation
                        const hasPriceDifferentiation = maxTotal > minTotal;
                        const isCheapest = isSearchComplete && allStoreTotals.length > 1 && storeTotal === minTotal && storeTotal > 0 && hasPriceDifferentiation;

                        // Calculate savings only if this is the cheapest AND search is complete
                        const savingsPercent = isCheapest
                          ? Math.round(((maxTotal - minTotal) / maxTotal) * 100)
                          : 0;
                        
                        return (
                        <div
                          key={store}
                          className="flex-shrink-0 w-80 sm:w-88 md:w-[420px] lg:w-96 xl:w-[440px]"
                        >
                          {/* Grocery List Card (Receipt Style) */}
                          <div className={`bg-white dark:bg-slate-800 rounded-lg overflow-visible ${
                            isCheapest
                              ? 'border-2 border-green-500 dark:border-green-400 shadow-[0_0_10px_2px_rgba(34,197,94,0.3)]'
                              : 'border border-slate-300 dark:border-slate-600'
                          }`}>
                            <div className="relative z-10 px-4 sm:px-6 py-3 sm:py-4">
                              {/* Store Header */}
                              <div className="text-center mb-3 sm:mb-4">
                                <div className="flex items-center justify-between mb-1 sm:mb-2 h-5">
                                  <span className="text-xs text-slate-400 tracking-widest select-none">GROCERY LIST</span>
                                  <span className={`px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full animate-glow-pulse ${isCheapest ? 'visible' : 'invisible'}`}>
                                    Lowest Price
                                  </span>
                                </div>
                                <div className="flex flex-col items-center justify-center py-2 sm:py-3 mb-1">
                                  <img
                                    src={getStoreLogoPath(store)}
                                    alt={`${formatStoreName(parseStoreKey(store).storeName)} logo`}
                                    className="h-9 sm:h-10 w-auto object-contain"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                      console.error(`[Logo Error] Failed to load logo for store: "${store}", path: "${getStoreLogoPath(store)}", canonical: "${getStoreNameFromKey(store)}"`);
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  {/* Always show street address for all stores */}
                                  {parseStoreKey(store).address && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[200px] text-center" title={parseStoreKey(store).address}>
                                      {parseStoreKey(store).address?.split(',')[0]}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">
                                  {memoizedStoreSubtotals[store]?.itemCount ?? 0} items • {Object.keys(memoizedStoreSubtotals).length > 0 && memoizedStoreSubtotals[store] ? `$${memoizedStoreSubtotals[store].total.toFixed(2)}` : 'Calculating...'}
                                  {isCheapest && savingsPercent > 0 && (
                                    <><span> • </span><span className="font-semibold text-green-600 dark:text-green-400">Save {savingsPercent}%</span></>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const params = new URLSearchParams(location.search);
                                    params.set('storeView', store);
                                    const nextUrl = `${location.pathname}?${params.toString()}`;
                                    navigate(nextUrl, { replace: false });
                                    setFocusedStoreName(store);
                                    setIsStoreViewOpen(true);
                                    setModalSortConfig(sortConfig);
                                  }}
                                  className="w-full mb-3 sm:mb-4 text-xs sm:text-sm"
                                >
                                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  Shop Here
                                </Button>
                              </div>

                              {/* Items List */}
                              <div className="space-y-3 sm:space-y-4">
                                {getSortedItems().length > 0 ? getSortedItems().map((item) => (
                                  <div
                                    key={`${item.id || item.name}-${store}`}
                                    className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded border transition-all bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700"
                                  >
                                    {/* Item Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200">
                                        {item.name}
                                      </div>
                                      <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2">
                                        {item.meal ? `${item.meal} • ` : ''}{item.category}
                                      </div>

                                      {/* Product Selection - Memoized component to prevent unnecessary re-renders */}
                                      <div className="w-full pt-1">
                                        <ProductDropdown
                                          itemName={item.name}
                                          store={store}
                                          itemResults={results[item.name]?.[store]}
                                          selection={selections[item.name]?.[store]}
                                          onSelectProduct={handleSelectProduct}
                                          isLoading={isShoppingNow || isPollingActive || currentListData?.status === 'pending' || currentListData?.status === 'in_progress'}
                                          hasAnyResults={Object.keys(results).length > 0}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )) : (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <div className="text-sm">No items in this list</div>
                                  </div>
                                )}
                              </div>

                              {/* Total */}
                              <div className="mt-3 sm:mt-4 pt-2 border-t border-solid border-slate-300 dark:border-slate-600 flex justify-between text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                <span>TOTAL</span>
                                <span>{Object.keys(memoizedStoreSubtotals).length > 0 && memoizedStoreSubtotals[store] ? `$${memoizedStoreSubtotals[store].total.toFixed(2)}` : 'Calculating...'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-8">
                  <div className="max-w-md text-center space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No Price Check Yet</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                        Ready to compare prices across stores? Select your preferred stores and check prices to see the best deals for your grocery list.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2 px-4 sm:px-0">
                      <Button 
                        onClick={() => setIsStoreModalOpen(true)}
                        variant="outline"
                        size="lg"
                        className="flex-1 py-4 sm:py-2"
                      >
                        <Store className="h-5 w-5 mr-2" />
                        Select Stores
                      </Button>
                      <Button 
                        onClick={() => { 
                          console.log('[UI] Check Prices button clicked'); 
                          handleShopNow(); 
                        }} 
                        size="lg"
                        disabled={isShoppingNow || isPollingActive}
                        className="flex-1 py-4 sm:py-2"
                      >
                        {(isShoppingNow || isPollingActive) ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Check Prices
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          !isLoading && lists.length > 0 && (
            <div className="flex items-center justify-center h-full min-h-[200px] border rounded-lg bg-muted/20 text-center p-4">
              <p className="text-muted-foreground">Select a list from the left to view its details.</p>
            </div>
          )
        )}
      </div>

      <AlertDialog open={!!listToDelete} onOpenChange={(open: boolean) => !open && setListToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grocery List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{listToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteList} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Store Selection Modal - REPLACED
      <StoreSelectionModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onStoresUpdated={(updatedStores) => {
          setSelectedStores(updatedStores);
        }}
      /> */}
      
      <StoreSelectorDialog
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onStoresUpdated={async (updatedStores) => {
          // 1. Optimistically update UI and mark as saving
          setSelectedStores(updatedStores);
          setIsSavingStores(true);

          console.log('[StoreUpdate] Starting store sync. UI selection:', updatedStores.map(s => ({
            store_name: s.store_name,
            address: s.address,
            hasId: !!s.id,
            lat: s.latitude,
            lon: s.longitude
          })));

          try {
            // 2. Calculate diffs against the server state (or reliable local state)
            // We use the 'selectedStores' state which contains the persisted stores with IDs
            // const currentIds = new Set(selectedStores.map(s => s.id).filter(id => id !== undefined));
            const updatedIds = new Set(updatedStores.map(s => s.id).filter(id => id !== undefined));

            // Stores to remove: Present in current (with ID) but not in updated (by ID)
            const toRemove = selectedStores.filter(s => s.id && !updatedIds.has(s.id));

            // Stores to add: Present in updated but have no ID (new selections)
            const toAdd = updatedStores.filter(s => !s.id);

            console.log('[StoreUpdate] Syncing stores:', {
              removing: toRemove.map(s => ({ name: s.store_name, id: s.id })),
              adding: toAdd.map(s => ({ name: s.store_name, address: s.address, lat: s.latitude, lon: s.longitude }))
            });

            // 3. Execute removals
            await Promise.all(toRemove.map(store =>
              store.id ? storeService.removeUserSelectedStore(store.id) : Promise.resolve()
            ));

            // 4. Execute additions
            const addResults = await Promise.all(toAdd.map(store =>
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
            console.log('[StoreUpdate] Add results:', addResults.map(s => ({
              id: s.id,
              store_name: s.store_name,
              address: s.address
            })));

            // 5. Final sync with server to get assigned IDs
            const finalStores = await storeService.getUserSelectedStores();
            console.log('[StoreUpdate] Final stores from server:', finalStores.map(s => ({
              id: s.id,
              store_name: s.store_name,
              address: s.address,
              postal_code: s.postal_code,
              lat: s.latitude,
              lon: s.longitude
            })));
            setSelectedStores(finalStores);
            // No toast - store selection saves silently
          } catch (err) {
            console.error('[StoreUpdate] Failed to sync stores:', err);
            // Silent fail - don't show toast for background save operation
            // Revert to server state
            try {
              const reverted = await storeService.getUserSelectedStores();
              setSelectedStores(reverted);
            } catch (e) {
              console.error('Critical failure reverting stores', e);
            }
          } finally {
            setIsSavingStores(false);
            console.log('[StoreUpdate] Store sync completed');
          }
        }}
        initialSelected={selectedStores}
      />
      {/* Store-focused fullscreen shopping modal */}
      <StoreShoppingModal
        isOpen={isStoreViewOpen}
        onClose={() => {
          const params = new URLSearchParams(location.search);
          if (params.has('storeView')) {
            params.delete('storeView');
            const nextUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
            navigate(nextUrl, { replace: false });
          }
          setIsStoreViewOpen(false);
        }}
        list={selectedList}
        storeName={focusedStoreName}
        selectionsByItem={currentListData?.selections}
        sortConfig={modalSortConfig || sortConfig}
        onSortChange={(next) => { setModalSortConfig(next); setSortConfig(next); }}
      />
      </div>
    </div>
  );
};

export default ListsPage; 