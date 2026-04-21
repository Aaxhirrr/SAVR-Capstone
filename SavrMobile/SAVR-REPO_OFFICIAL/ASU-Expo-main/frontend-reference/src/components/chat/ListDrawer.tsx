import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronUp,
  ChevronDown,
  ShoppingCart,
  Loader2,
  Store,
  Package,
  MapPin,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Share2,
  Link,
  Mail,
  Printer,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { ImCheckmark } from 'react-icons/im';
import { TiDelete } from 'react-icons/ti';
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from 'react-icons/ai';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import useListStore, { ListPriceData } from '@/stores/listStore';
import { SavedGroceryList, GroceryItem, getInstacartLink, getGroceryListFeatures } from '@/services/groceryListService';
import { SearchResultInDB, GroceryProduct } from '@/services/shoppingService';
import {
  formatStoreName,
  getStoreLogoPath,
  formatPriceStrict,
  parseStoreKey,
  extractBrandFromStoreName,
  getProductImage,
  truncateName,
  getProductTooltipFields,
  compareItemAcrossStores,
  PriceComparisonResult,
} from '@/lib/storeUtils';
import shareService from '@/services/shareService';
import { BiSolidBadgeDollar } from 'react-icons/bi';
import { FaPiggyBank } from 'react-icons/fa6';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Tooltip that also works on mobile via tap-to-toggle
const TapTooltip = ({ children, label }: { children: React.ReactNode; label: string }) => {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleTap = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setOpen(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(false), 2000);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <span onTouchStart={handleTap} className="inline-flex items-center text-green-600 dark:text-green-400">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span>{label}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ListDrawerProps {
  list: SavedGroceryList | null;
  onCheckPrices: () => void;
  onSelectStores: () => void; // Opens store selection modal
  onSelectProduct: (itemName: string, product: GroceryProduct | SearchResultInDB, store: string) => void;
  isCheckingPrices: boolean;
  inputAreaHeight?: number; // Dynamic height of the chat input area
  embedded?: boolean; // Use absolute positioning instead of fixed (for embedding in landing page)
}

// Compact store tab - flex item that grows to fill space
const StoreTab = React.memo(({
  storeKey,
  subtotal,
  itemCount,
  isSelected,
  isLowest,
  isSearching,
  onClick,
}: {
  storeKey: string;
  subtotal?: number;
  itemCount?: number;
  isSelected: boolean;
  isLowest: boolean;
  isSearching?: boolean;
  onClick: () => void;
}) => {
  const { address } = parseStoreKey(storeKey);
  const hasData = subtotal !== undefined && subtotal > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all flex-1 min-w-0 border-2',
        isSelected
          ? 'bg-white dark:bg-slate-700 shadow-lg border-green-500 dark:border-green-400'
          : 'bg-slate-50/80 dark:bg-slate-800/80 border-transparent hover:bg-white dark:hover:bg-slate-700 hover:shadow-md'
      )}
    >
      <img
        src={getStoreLogoPath(storeKey)}
        alt={formatStoreName(storeKey)}
        className="h-6 w-auto object-contain max-w-[80px]"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {address && (
        <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center px-1">
          {address.split(',')[0]}
        </span>
      )}
      <div className="flex items-center justify-center gap-1 mt-1">
        {isSearching && !hasData ? (
          <span className="text-xs text-green-600 dark:text-green-400 animate-pulse font-medium">
            Searching...
          </span>
        ) : hasData ? (
          <>
            <span className={cn(
              "text-base font-bold tabular-nums",
              isLowest ? "text-green-600 dark:text-green-400" : "text-slate-800 dark:text-white"
            )}>
              ${subtotal!.toFixed(2)}
            </span>
            {isLowest && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-semibold">
                Best
              </Badge>
            )}
          </>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </div>
      {hasData ? (
        <span className="text-[10px] text-muted-foreground">{itemCount} items</span>
      ) : isSearching ? (
        <div className="h-3 w-10 bg-slate-200 dark:bg-slate-600 rounded animate-pulse mt-0.5" />
      ) : (
        <span className="text-[10px] text-muted-foreground">0 items</span>
      )}
    </button>
  );
});

StoreTab.displayName = 'StoreTab';

// Item card component - shows item with selected product and price
// Entire card is clickable to open dropdown when multiple options available
const ItemCard = React.memo(({
  item,
  storeKey,
  results,
  selection,
  onSelectProduct,
  onDelete,
  isLoading,
  hasAnyResults,
  isLowestPrice,
  isBestValue,
  pricingMode,
}: {
  item: GroceryItem;
  storeKey: string;
  results: SearchResultInDB[] | undefined;
  selection: SearchResultInDB | undefined;
  onSelectProduct: (itemName: string, product: GroceryProduct | SearchResultInDB, store: string) => void;
  onDelete: () => void;
  isLoading: boolean;
  hasAnyResults: boolean;
  isLowestPrice: boolean;
  isBestValue: boolean;
  pricingMode: 'store' | '/ea';
}) => {
  const [showDelete, setShowDelete] = useState(false);
  // Use selection if available, otherwise fall back to first result
  const effectiveSelection = (selection && selection.name !== 'Nothing')
    ? selection
    : (results && results.length > 0 ? results[0] : undefined);

  const hasSelection = !!effectiveSelection && effectiveSelection.name !== 'Nothing';
  const hasOptions = results && results.length > 0;

  // Compute display price based on pricing mode
  const { displayPrice, displayUnit, isUnitPrice } = useMemo(() => {
    if (!hasSelection || !effectiveSelection) return { displayPrice: null, displayUnit: '', isUnitPrice: false };
    const p = effectiveSelection as any;
    if (pricingMode === '/ea' && p.pricePerEach != null) {
      return { displayPrice: `$${p.pricePerEach.toFixed(2)}`, displayUnit: '/ea', isUnitPrice: true };
    }
    return { displayPrice: formatPriceStrict(effectiveSelection.price), displayUnit: '', isUnitPrice: false };
  }, [hasSelection, effectiveSelection, pricingMode]);

  // Filter results to current store for dropdown
  const filteredResults = results
    ? results.filter((p: SearchResultInDB) => p.store === storeKey)
    : [];

  // Dropdown menu content (reusable)
  const dropdownContent = (
    <DropdownMenuContent
      align="end"
      className="min-w-[280px] w-[320px] max-h-[450px] overflow-y-auto"
      sideOffset={5}
      avoidCollisions
      side="top"
    >
      {/* Header */}
      <div className="p-2 pt-3 pb-2 border-b border-border bg-background sticky top-0 z-10 text-xs shadow-sm">
        <div className="font-bold flex items-center gap-1">
          <Store className="h-3 w-3" /> {formatStoreName(storeKey)}
        </div>
        <div className="text-sm mt-1 font-medium">{item.name}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {filteredResults.length} option{filteredResults.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {/* Skip option */}
      <DropdownMenuItem
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          const nothingProduct: GroceryProduct = {
            brand: "",
            name: "Nothing",
            price: "$0.00",
            store: storeKey,
          };
          onSelectProduct(item.name, nothingProduct, storeKey);
        }}
        className="flex flex-col items-start py-2 hover:bg-muted focus:bg-muted border-b border-border"
      >
        <div className="flex items-center w-full">
          <span className="font-medium text-sm">Skip this item</span>
          <span className="ml-auto font-semibold text-muted-foreground text-right tabular-nums">$0.00</span>
        </div>
        <span className="text-xs text-muted-foreground mt-0.5">
          Won't be included in subtotal
        </span>
      </DropdownMenuItem>

      {/* Product options */}
      {filteredResults.map((product: SearchResultInDB, idx: number) => (
        <DropdownMenuItem
          key={product.id || idx}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectProduct(item.name, product, storeKey);
          }}
          className="flex flex-row items-center gap-3 py-2.5 hover:bg-muted focus:bg-muted"
        >
          <img
            src={getProductImage(product.imageUrl)}
            alt={truncateName(product.name)}
            className="w-12 h-12 object-contain rounded border bg-white flex-shrink-0"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { (e.target as HTMLImageElement).src = '/assets/store-placeholder.png'; }}
          />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {(() => { const f = getProductTooltipFields(product); return f.brand ? (
                  <span className="font-medium text-sm block truncate">{f.brand}</span>
                ) : null; })()}
                <span className="text-sm text-slate-600 dark:text-slate-400 block truncate">{truncateName(product.name, 40)}</span>
              </div>
              {formatPriceStrict(product.price) && (
                <span className="font-bold text-sm text-primary tabular-nums flex-shrink-0">{formatPriceStrict(product.price) as string}</span>
              )}
            </div>
            {product.size && (
              <span className="text-xs text-muted-foreground mt-0.5">{product.size}</span>
            )}
          </div>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  );

  return (
    <div
      className="relative group/card"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onClick={() => setShowDelete(!showDelete)}
    >
      {/* Delete button - overlapping top left corner */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={cn(
          "absolute -top-1.5 -left-1.5 z-10 transition-all duration-150",
          "text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400",
          showDelete ? "opacity-100" : "opacity-0 pointer-events-none md:group-hover/card:opacity-100 md:group-hover/card:pointer-events-auto"
        )}
        title="Remove item"
      >
        <TiDelete className="w-5 h-5" />
      </button>
      <Card className="shadow-sm border-slate-200 dark:border-slate-700 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* Product image or placeholder */}
          <div className="flex-shrink-0 w-16 bg-white dark:bg-slate-800 flex items-center justify-center border-r border-slate-100 dark:border-slate-700">
            {hasSelection && effectiveSelection?.imageUrl ? (
              <img
                src={effectiveSelection.imageUrl}
                alt={effectiveSelection.name}
                className="w-14 h-14 object-contain p-1"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).src = '/assets/store-placeholder.png'; }}
              />
            ) : (
              <div className="w-14 h-14 flex items-center justify-center">
                <Package className="h-6 w-6 text-slate-300 dark:text-slate-600" />
              </div>
            )}
          </div>

          {/* Item details - center section */}
          <div className="flex-1 min-w-0 py-2.5 px-3">
            {/* Grocery list item name */}
            <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
              {item.name}
            </div>

            {/* Selected product details */}
            {hasSelection && effectiveSelection && (
              <>
                {/* Brand */}
                {effectiveSelection.brand && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
                    {effectiveSelection.brand}
                  </div>
                )}
                {/* Actual product name and size */}
                <div className="text-xs text-slate-500 dark:text-slate-500 truncate mt-0.5">
                  {effectiveSelection.name !== item.name && effectiveSelection.name}
                  {effectiveSelection.name !== item.name && effectiveSelection.size && ' '}
                  {effectiveSelection.size}
                </div>
              </>
            )}

            {/* Category | meal badges | price comparison badges */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {item.category && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {item.category}
                </Badge>
              )}
              {item.meal && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {item.meal}
                </Badge>
              )}
              {/* Lowest Price badge */}
              {isLowestPrice && hasSelection && (
                <TapTooltip label="Lowest price across your stores">
                  <BiSolidBadgeDollar className="h-4 w-4" />
                </TapTooltip>
              )}
              {/* Best Value badge */}
              {isBestValue && hasSelection && (
                <TapTooltip label="Best value per unit across your stores">
                  <FaPiggyBank className="h-4 w-4" />
                </TapTooltip>
              )}
            </div>
          </div>

          {/* Price and dropdown trigger - right section */}
          <div className="flex-shrink-0 flex items-center pr-2 gap-1">
            {hasAnyResults ? (
              <>
                {/* Price with optional unit label */}
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "font-bold text-base tabular-nums leading-tight",
                    hasSelection ? "text-slate-900 dark:text-white" : "text-slate-400"
                  )}>
                    {displayPrice || '—'}
                  </span>
                  {isUnitPrice && (
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-medium leading-tight">
                      {displayUnit}
                    </span>
                  )}
                </div>

                {/* Dropdown trigger - only the chevron is clickable */}
                {hasOptions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1.5 -mr-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>
                    {dropdownContent}
                  </DropdownMenu>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground px-2">
                {isLoading ? '...' : '—'}
              </span>
            )}
          </div>
        </div>
      </CardContent>
      </Card>
    </div>
  );
});

ItemCard.displayName = 'ItemCard';

// Simple item row for pre-search state with edit/delete functionality
const SimpleItemRow = React.memo(({
  item,
  isEditing,
  isSearching,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  item: GroceryItem;
  isEditing: boolean;
  isSearching: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (newName: string) => void;
  onDelete: () => void;
}) => {
  const [editValue, setEditValue] = useState(item.name);
  const [showIcons, setShowIcons] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when item name changes
  useEffect(() => {
    setEditValue(item.name);
  }, [item.name]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.name) {
      onSaveEdit(trimmed);
    } else {
      onCancelEdit();
    }
  }, [editValue, item.name, onSaveEdit, onCancelEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(item.name);
      onCancelEdit();
    }
  }, [handleSave, item.name, onCancelEdit]);

  // Edit mode UI
  if (isEditing) {
    return (
      <div className="flex items-center gap-2 py-2 px-1 border-b border-slate-100 dark:border-slate-700 last:border-0">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-8 text-sm flex-1"
          autoComplete="off"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditValue(item.name);
            onCancelEdit();
          }}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Normal display mode
  return (
    <div
      className="group flex items-center justify-between py-2 px-1 border-b border-slate-100 dark:border-slate-700 last:border-0 cursor-default"
      onClick={() => setShowIcons(!showIcons)}
      onMouseEnter={() => setShowIcons(true)}
      onMouseLeave={() => setShowIcons(false)}
    >
      <div className="flex items-center gap-2 min-w-0">
        <ImCheckmark className="w-3 h-3 text-green-500 flex-shrink-0" />
        <span className="text-sm text-slate-800 dark:text-slate-200 truncate" title={item.name}>
          {item.name}
        </span>
        {/* Edit/Delete icons - show on hover (desktop) or tap (mobile) */}
        {!isSearching && (
          <div
            className={cn(
              "flex items-center gap-0.5 transition-opacity duration-150 flex-shrink-0",
              showIcons ? "opacity-100" : "opacity-0 pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto"
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
              className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Rename item"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Delete item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.quantity && (
          <span className="text-xs text-slate-500">
            {item.quantity} {item.unit || ''}
          </span>
        )}
        {item.category && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            {item.category}
          </Badge>
        )}
      </div>
    </div>
  );
});

SimpleItemRow.displayName = 'SimpleItemRow';

// Skeleton item row for loading state during search
const SkeletonItemRow = React.memo(({ item }: { item: GroceryItem }) => (
  <Card className="shadow-sm border-slate-200 dark:border-slate-700 overflow-hidden">
    <CardContent className="p-0">
      <div className="flex items-stretch">
        {/* Skeleton image */}
        <div className="flex-shrink-0 w-16 bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-r border-slate-100 dark:border-slate-700">
          <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        {/* Item name and skeleton content */}
        <div className="flex-1 min-w-0 py-2.5 px-3">
          <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
            {item.name}
          </div>
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1.5" />
          <div className="flex items-center gap-1.5 mt-2">
            {item.category && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {item.category}
              </Badge>
            )}
          </div>
        </div>
        {/* Skeleton price */}
        <div className="flex-shrink-0 flex items-center pr-3">
          <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
    </CardContent>
  </Card>
));

SkeletonItemRow.displayName = 'SkeletonItemRow';

export function ListDrawer({
  list,
  onCheckPrices,
  onSelectStores,
  onSelectProduct,
  isCheckingPrices,
  inputAreaHeight = 64, // Default to mobile size
  embedded = false,
}: ListDrawerProps) {
  const {
    drawerState,
    setDrawerState,
    selectedStoreKey,
    setSelectedStore,
    listPriceDataMap,
    isPollingActive,
    searchingStores,
    updateItemName,
    deleteItem,
    renameList,
    pricingMode,
    setPricingMode,
  } = useListStore();

  const { toast } = useToast();

  // State for tracking which item is being edited
  const [editingItemName, setEditingItemName] = useState<string | null>(null);

  // State for inline list name editing (double-click)
  const [isRenamingList, setIsRenamingList] = useState(false);
  const [listRenameValue, setListRenameValue] = useState('');
  const listNameInputRef = useRef<HTMLInputElement>(null);
  const lastTapTimeRef = useRef<number>(0);

  const handleStartListRename = useCallback(() => {
    if (!list) return;
    setListRenameValue(list.name);
    setIsRenamingList(true);
  }, [list]);

  const handleSaveListRename = useCallback(async () => {
    if (!list) return;
    const trimmed = listRenameValue.trim();
    setIsRenamingList(false);
    if (trimmed && trimmed !== list.name) {
      try {
        await renameList(list.id, trimmed);
        toast({ description: 'List renamed', duration: 2000 });
      } catch {
        toast({ variant: 'destructive', description: 'Failed to rename list', duration: 3000 });
      }
    }
  }, [list, listRenameValue, renameList, toast]);

  useEffect(() => {
    if (isRenamingList && listNameInputRef.current) {
      listNameInputRef.current.focus();
      listNameInputRef.current.select();
    }
  }, [isRenamingList]);

  // Local state for grouping
  const [groupBy, setGroupBy] = useState<'all' | 'category' | 'meal'>('category');

  // Local state for sorting
  const [sortBy, setSortBy] = useState<'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'>('default');

  // Instacart integration
  const [instacartEnabled, setInstacartEnabled] = useState(false);
  const [instacartLoading, setInstacartLoading] = useState(false);

  useEffect(() => {
    getGroceryListFeatures()
      .then((f) => setInstacartEnabled(f.instacart_enabled))
      .catch(() => setInstacartEnabled(false));
  }, []);

  // Share state
  const [, setShareUrl] = useState<string | null>(null);
  const shareUrlRef = useRef<string | null>(null);
  const shareUrlStoreRef = useRef<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [copyLinkUrl, setCopyLinkUrl] = useState<string | null>(null);
  const [copyLinkCopied, setCopyLinkCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', update);
    // visualViewport handles mobile keyboard/toolbar changes
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);
  const copyLinkInputRef = useRef<HTMLInputElement>(null);

  const ensureShareUrl = useCallback(async (): Promise<string> => {
    // Invalidate cache if store changed since last fetch
    if (shareUrlRef.current && shareUrlStoreRef.current !== selectedStoreKey) {
      shareUrlRef.current = null;
      shareUrlStoreRef.current = null;
    }
    if (shareUrlRef.current) return shareUrlRef.current;
    if (!list || !selectedStoreKey) throw new Error('No list or store selected');
    const { url } = await shareService.createShareLink(list.id, selectedStoreKey);
    shareUrlRef.current = url;
    shareUrlStoreRef.current = selectedStoreKey;
    setShareUrl(url);
    return url;
  }, [list, selectedStoreKey]);

  // Pre-fetch share URL when dropdown opens
  const handleShareDropdownOpen = useCallback((open: boolean) => {
    if (open && !shareUrlRef.current && list && selectedStoreKey) {
      ensureShareUrl().catch(() => {});
    }
  }, [list, selectedStoreKey, ensureShareUrl]);

  // Copy link: on HTTPS use clipboard API, on HTTP show a dialog
  const handleCopyLink = useCallback(() => {
    const url = shareUrlRef.current;
    if (!url) {
      toast({ description: 'Preparing link, please try again', duration: 2000 });
      return;
    }
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

    if (window.isSecureContext && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        toast({ description: 'Link copied to clipboard', duration: 2000 });
      }).catch(() => {
        setCopyLinkUrl(fullUrl);
        setCopyLinkCopied(false);
      });
    } else {
      setCopyLinkUrl(fullUrl);
      setCopyLinkCopied(false);
    }
  }, [toast]);

  // Select all text when dialog opens
  useEffect(() => {
    if (copyLinkUrl && copyLinkInputRef.current) {
      copyLinkInputRef.current.focus();
      copyLinkInputRef.current.select();
    }
  }, [copyLinkUrl]);

  const handleCopyLinkFromDialog = useCallback(() => {
    if (!copyLinkUrl) return;
    const ta = document.createElement('textarea');
    ta.value = copyLinkUrl;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
    } catch { /* ignore */ }
    document.body.removeChild(ta);
    setCopyLinkCopied(true);
    setTimeout(() => setCopyLinkCopied(false), 2000);
  }, [copyLinkUrl]);

  const handleShareEmail = useCallback(async () => {
    try {
      const url = await ensureShareUrl();
      const subject = encodeURIComponent(`${list?.name || 'Grocery List'} - ${formatStoreName(selectedStoreKey || '')}`);
      const body = encodeURIComponent(`Check out my grocery list:\n${url}`);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
    } catch {
      toast({ variant: 'destructive', description: 'Failed to create share link', duration: 3000 });
    }
  }, [ensureShareUrl, list, selectedStoreKey, toast]);

  const handleShareWhatsApp = useCallback(async () => {
    try {
      const url = await ensureShareUrl();
      const text = encodeURIComponent(`${list?.name || 'Grocery List'}\n${url}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    } catch {
      toast({ variant: 'destructive', description: 'Failed to create share link', duration: 3000 });
    }
  }, [ensureShareUrl, list, toast]);

  const handleShareMessenger = useCallback(async () => {
    try {
      const url = await ensureShareUrl();
      const encoded = encodeURIComponent(url);
      window.open(`https://www.facebook.com/dialog/send?link=${encoded}&app_id=0&redirect_uri=${encodeURIComponent(window.location.href)}`, '_blank');
    } catch {
      toast({ variant: 'destructive', description: 'Failed to create share link', duration: 3000 });
    }
  }, [ensureShareUrl, toast]);

  const handleShareTwitter = useCallback(async () => {
    try {
      const url = await ensureShareUrl();
      const text = encodeURIComponent(list?.name || 'Grocery List');
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
    } catch {
      toast({ variant: 'destructive', description: 'Failed to create share link', duration: 3000 });
    }
  }, [ensureShareUrl, list, toast]);

  const handlePrint = useCallback(async () => {
    try {
      const url = await ensureShareUrl();
      const printUrl = `${url}&print=1`;
      console.log('[Share] Opening print URL:', printUrl);
      window.open(printUrl, '_blank');
    } catch (err) {
      console.error('[Share] handlePrint failed:', err);
      toast({ variant: 'destructive', description: 'Failed to create share link', duration: 3000 });
    }
  }, [ensureShareUrl, toast]);

  const handleDownloadPdf = useCallback(async () => {
    if (!list || !selectedStoreKey) return;
    console.log('[Share] handleDownloadPdf called, list:', list.id, 'store:', selectedStoreKey);
    setIsPdfGenerating(true);
    try {
      await shareService.downloadStorePdf(list.id, selectedStoreKey);
      console.log('[Share] PDF download completed');
    } catch (err) {
      console.error('[Share] PDF generation failed:', err);
      toast({ variant: 'destructive', description: 'Failed to generate PDF', duration: 3000 });
    } finally {
      setIsPdfGenerating(false);
    }
  }, [list, selectedStoreKey, toast]);

  const expandedContentRef = useRef<HTMLDivElement>(null);

  // Drag-to-resize state
  const [isDragging, setIsDragging] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);
  const dragDistance = useRef<number>(0);
  const lastPointerY = useRef<number>(0);
  const lastPointerTime = useRef<number>(0);
  const velocity = useRef<number>(0);
  const rafId = useRef<number>(0);
  const pointerDown = useRef(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const PEEK_HEIGHT = 60;
  const HEADER_HEIGHT = 56; // Mobile fixed header height from Layout.tsx
  const CLICK_THRESHOLD = 4;

  // Track if we've auto-selected a store for this search session
  // This prevents overriding user's manual selection during active search
  const hasAutoSelectedRef = useRef(false);


  // Track first appearance for animation
  const [isFirstAppearance, setIsFirstAppearance] = useState(false);
  const [showChevronGlow, setShowChevronGlow] = useState(false);
  const prevDrawerStateRef = useRef<string | null>(null);
  const listIdRef = useRef<string | null>(null);

  // Detect first appearance (collapsed/null -> peek transition for a new list)
  useEffect(() => {
    const currentListId = list?.id || null;
    const isNewList = currentListId !== listIdRef.current;
    const wasCollapsed = prevDrawerStateRef.current === 'collapsed' || prevDrawerStateRef.current === null;
    const nowPeek = drawerState === 'peek';

    // Trigger animation when:
    // 1. Transitioning from collapsed to peek
    // 2. AND it's a different list (new list created)
    if (wasCollapsed && nowPeek && isNewList && currentListId) {
      listIdRef.current = currentListId;
      prevDrawerStateRef.current = drawerState;
      setIsFirstAppearance(true);
      setShowChevronGlow(true);

      // Remove first appearance flag after animation completes
      const animTimer = setTimeout(() => {
        setIsFirstAppearance(false);
      }, 700);

      // Remove chevron glow after a longer delay
      const glowTimer = setTimeout(() => {
        setShowChevronGlow(false);
      }, 2500);

      return () => {
        clearTimeout(animTimer);
        clearTimeout(glowTimer);
      };
    }

    // Only update prevDrawerState here; delay listIdRef update until
    // we actually reach peek so the "new list" check isn't consumed
    // by an intermediate collapsed render.
    prevDrawerStateRef.current = drawerState;
    if (nowPeek || drawerState === 'expanded') {
      listIdRef.current = currentListId;
    }
  }, [drawerState, list?.id]);

  // Get price data for current list
  const priceData: ListPriceData | null = list ? listPriceDataMap[list.id] || null : null;
  const results = priceData?.results || {};
  const selections = priceData?.selections || {};
  const storeSubtotals = priceData?.storeSubtotals || {};
  const status = priceData?.status;
  const hasAnyResults = Object.keys(results).length > 0;
  const isCompleted = status === 'completed';

  // Eagerly pre-fetch share URL when results are available
  useEffect(() => {
    if (hasAnyResults && selectedStoreKey && list) {
      ensureShareUrl().catch(() => {});
    }
  }, [hasAnyResults, selectedStoreKey, list, ensureShareUrl]);
  const isSearching = isPollingActive || isCheckingPrices || status === 'pending' || status === 'in_progress';

  // Compute which items at which stores have lowest price / best value
  const priceComparisonMap = useMemo(() => {
    const map: Record<string, PriceComparisonResult> = {};
    if (!list) return map;

    for (const item of list.items) {
      const itemResults = results[item.name] || {};
      const itemSelections = selections[item.name] || {};
      map[item.name] = compareItemAcrossStores(itemResults, itemSelections);
    }
    return map;
  }, [list, results, selections]);

  // Get ordered store names sorted by price
  const orderedStoreNames = useMemo(() => {
    const storeEntries = Object.entries(storeSubtotals)
      .filter(([, data]) => data.total > 0)
      .sort((a, b) => a[1].total - b[1].total);
    return storeEntries.map(([name]) => name);
  }, [storeSubtotals]);

  // Generate store keys from searchingStores for immediate display
  // Uses extractBrandFromStoreName to properly extract brand from full store names
  // (e.g., "Loblaws - Loblaws Mclaughlin Road" -> "loblaws")
  const searchingStoreKeys = useMemo(() => {
    if (!isSearching || searchingStores.length === 0) return [];
    return searchingStores.map(s => {
      const canonical = extractBrandFromStoreName(s.store_name);
      return s.address ? `${canonical}::${s.address}` : canonical;
    });
  }, [isSearching, searchingStores]);

  // Combined store names - merge results with still-searching stores
  const storeNamesToDisplay = useMemo(() => {
    if (orderedStoreNames.length > 0) {
      // Merge: show stores with results, plus any still-searching stores not yet in results
      if (isSearching && searchingStoreKeys.length > 0) {
        const resultSet = new Set(orderedStoreNames);
        const stillSearching = searchingStoreKeys.filter(key => !resultSet.has(key));
        return [...orderedStoreNames, ...stillSearching];
      }
      return orderedStoreNames;
    }
    if (isSearching && searchingStoreKeys.length > 0) return searchingStoreKeys;
    return [];
  }, [orderedStoreNames, isSearching, searchingStoreKeys]);

  // Find lowest priced store
  const lowestStore = orderedStoreNames[0] || null;

  // Reset auto-selection tracking when search completes or list changes
  useEffect(() => {
    if (!isSearching) {
      hasAutoSelectedRef.current = false;
    }
  }, [isSearching]);

  // Auto-select first store when results complete
  useEffect(() => {
    if (isCompleted && orderedStoreNames.length > 0 && !selectedStoreKey) {
      setSelectedStore(orderedStoreNames[0]);
    }
  }, [isCompleted, orderedStoreNames, selectedStoreKey, setSelectedStore]);

  // Auto-select first searching store when search starts (enables skeleton items)
  // Only auto-select once per search session to avoid overriding user's manual selection
  useEffect(() => {
    if (isSearching && !selectedStoreKey && storeNamesToDisplay.length > 0 && !hasAutoSelectedRef.current) {
      setSelectedStore(storeNamesToDisplay[0]);
      hasAutoSelectedRef.current = true;
    }
  }, [isSearching, selectedStoreKey, storeNamesToDisplay, setSelectedStore]);

  // Get items grouped and sorted
  const groupedItems = useMemo(() => {
    if (!list) return {};

    // Helper to get item price at selected store
    const getItemPrice = (item: GroceryItem): number => {
      if (!selectedStoreKey) return Infinity;
      const itemSel = selections[item.name]?.[selectedStoreKey];
      const itemRes = results[item.name]?.[selectedStoreKey];
      const product = itemSel || (itemRes?.[0]);
      if (!product || product.name === 'Nothing') return Infinity;
      const priceStr = String(product.price).replace(/[^0-9.]/g, '');
      return parseFloat(priceStr) || Infinity;
    };

    // Sort function
    const sortItems = (items: GroceryItem[]): GroceryItem[] => {
      if (sortBy === 'default') return items;
      const sorted = [...items];
      switch (sortBy) {
        case 'name-asc':
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
          return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'price-asc':
          return sorted.sort((a, b) => getItemPrice(a) - getItemPrice(b));
        case 'price-desc':
          return sorted.sort((a, b) => getItemPrice(b) - getItemPrice(a));
        default:
          return items;
      }
    };

    // Group items
    let grouped: Record<string, GroceryItem[]>;
    if (groupBy === 'all') {
      grouped = { 'All Items': list.items };
    } else {
      grouped = list.items.reduce<Record<string, GroceryItem[]>>((acc, item) => {
        const key = groupBy === 'category'
          ? (item.category || 'Uncategorized')
          : (item.meal || 'Uncategorized');
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});
    }

    // Sort items within each group
    return Object.fromEntries(
      Object.entries(grouped).map(([key, items]) => [key, sortItems(items)])
    );
  }, [list, groupBy, sortBy, selectedStoreKey, results, selections]);

  // Handle drawer expand
  const handleExpand = useCallback(() => {
    setDrawerState('expanded');
  }, [setDrawerState]);

  // Compute max expanded height
  const getMaxExpandedHeight = useCallback(() => {
    const vh = window.innerHeight;
    const contentHeight = expandedContentRef.current?.scrollHeight || 400;
    return Math.min(contentHeight + 20, vh * 0.96);
  }, []);

  // Pointer handlers for drag-to-resize
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only primary button
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointerDown.current = true;
    dragStartY.current = e.clientY;
    dragDistance.current = 0;
    lastPointerY.current = e.clientY;
    lastPointerTime.current = e.timeStamp;
    velocity.current = 0;

    // Measure current drawer height
    const currentHeight = drawerRef.current?.offsetHeight || (drawerState === 'expanded' ? getMaxExpandedHeight() : PEEK_HEIGHT);
    dragStartHeight.current = currentHeight;
  }, [drawerState, getMaxExpandedHeight]);

  // Attach document-level pointermove/pointerup while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaY = dragStartY.current - e.clientY; // positive = drag up
      const newHeight = Math.max(20, Math.min(dragStartHeight.current + deltaY, getMaxExpandedHeight()));

      // Track velocity
      const now = e.timeStamp;
      const dt = now - lastPointerTime.current;
      if (dt > 0) {
        velocity.current = (lastPointerY.current - e.clientY) / dt; // px/ms, positive = up
      }
      lastPointerY.current = e.clientY;
      lastPointerTime.current = now;

      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        setDragHeight(newHeight);
      });
    };

    const handlePointerUp = () => {
      pointerDown.current = false;
      cancelAnimationFrame(rafId.current);
      setIsDragging(false);
      setDragHeight(null);

      if (dragDistance.current < CLICK_THRESHOLD) {
        // It was a click, not a drag — handle in pointerUp on the element
        return;
      }

      const finalHeight = dragStartHeight.current + (dragStartY.current - lastPointerY.current);
      const maxH = getMaxExpandedHeight();
      const mid = (PEEK_HEIGHT + maxH) / 2;
      const v = velocity.current; // px/ms

      // Velocity-based snapping (flick)
      if (Math.abs(v) > 0.5) {
        if (v > 0) {
          setDrawerState('expanded');
        } else {
          setDrawerState('peek');
        }
        return;
      }

      // Position-based snapping
      if (finalHeight < mid) {
        setDrawerState('peek');
      } else {
        setDrawerState('expanded');
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      cancelAnimationFrame(rafId.current);
    };
  }, [isDragging, getMaxExpandedHeight, setDrawerState]);

  // Start dragging after movement threshold exceeded — only if pointer is down
  const handlePointerMoveOnHandle = useCallback((e: React.PointerEvent) => {
    if (!pointerDown.current) return;
    const dist = Math.abs(e.clientY - dragStartY.current);
    dragDistance.current = dist;
    if (!isDragging && dist > CLICK_THRESHOLD) {
      setIsDragging(true);
      setDragHeight(dragStartHeight.current);
    }
  }, [isDragging]);

  const handlePointerUpOnHandle = useCallback(() => {
    pointerDown.current = false;
    if (dragDistance.current < CLICK_THRESHOLD) {
      // It was a click
      if (drawerState === 'peek') {
        handleExpand();
      } else if (drawerState === 'expanded') {
        setDrawerState('peek');
      }
    }
  }, [drawerState, handleExpand, setDrawerState]);

  // Handle item rename
  const handleRenameItem = useCallback(async (oldName: string, newName: string) => {
    if (!list) return;
    setEditingItemName(null);
    try {
      await updateItemName(list.id, oldName, newName);
      toast({
        description: 'Item updated',
        duration: 2000,
      });
    } catch {
      toast({
        variant: 'destructive',
        description: 'Failed to update item',
        duration: 3000,
      });
    }
  }, [list, updateItemName, toast]);

  // Handle item delete
  const handleDeleteItem = useCallback(async (itemName: string) => {
    if (!list) return;
    try {
      await deleteItem(list.id, itemName);
      toast({
        description: 'Item removed',
        duration: 2000,
      });
    } catch {
      toast({
        variant: 'destructive',
        description: 'Failed to remove item',
        duration: 3000,
      });
    }
  }, [list, deleteItem, toast]);

  // Don't render if no list or collapsed
  if (!list || drawerState === 'collapsed') {
    return null;
  }

  const itemCount = list.items?.length || 0;
  const currentSubtotal = selectedStoreKey && storeSubtotals[selectedStoreKey]
    ? storeSubtotals[selectedStoreKey].total
    : 0;

  return (
    <>
    {/* Copy Link Dialog for HTTP origins */}
    <Dialog open={!!copyLinkUrl} onOpenChange={(open) => { if (!open) setCopyLinkUrl(null); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-4 w-4 text-primary" />
            Share Link
          </DialogTitle>
          <DialogDescription>
            Copy the link below to share your grocery list.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1 group">
            <input
              ref={copyLinkInputRef}
              readOnly
              value={copyLinkUrl || ''}
              onFocus={(e) => e.target.select()}
              className="w-full h-10 rounded-lg border border-input bg-muted/50 px-3 pr-3 text-sm font-mono text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 truncate"
            />
          </div>
          <Button
            size="sm"
            className={cn(
              'h-10 px-4 gap-1.5 shrink-0 transition-all duration-200',
              copyLinkCopied
                ? 'bg-green-600 hover:bg-green-600 text-white'
                : ''
            )}
            onClick={handleCopyLinkFromDialog}
          >
            {copyLinkCopied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Select the link and press Ctrl+C if the copy button doesn't work.
        </p>
      </DialogContent>
    </Dialog>

    <div
      ref={drawerRef}
      className={cn(
        (embedded && !isFullscreen) ? 'absolute' : 'fixed',
        'bg-white dark:bg-slate-800 shadow-2xl',
        isFullscreen
          ? 'left-0 right-0 top-0 bottom-0 z-50'
          : cn(
              // Mobile/tablet: full width with top border and rounded top corners
              'left-0 right-0 border-t border-slate-200 dark:border-slate-700 rounded-t-2xl',
              // Desktop: narrower, right-justified with full border and rounded top corners (square bottom to tuck behind input)
              embedded ? '' : 'lg:left-auto lg:right-4 lg:max-w-xl xl:max-w-2xl lg:border lg:rounded-t-2xl lg:rounded-b-none',
              drawerState === 'peek' ? 'z-10' : 'z-[45]',
            ),
        isDragging ? '' : 'overflow-hidden',
        // Animation classes - disable transitions while dragging
        isDragging
          ? ''
          : isFirstAppearance
            ? 'animate-slide-up-from-input'
            : 'transition-all duration-300 ease-out'
      )}
      style={{
        bottom: isFullscreen ? 0 : `${inputAreaHeight}px`,
        ...(!isFullscreen && !isDragging ? { maxHeight: `${viewportHeight - inputAreaHeight - (embedded ? 0 : HEADER_HEIGHT)}px` } : {}),
        ...(isFullscreen ? { height: `${viewportHeight}px` } : {}),
        ...(isDragging && dragHeight != null
          ? { height: `${dragHeight}px`, transition: 'none', overflow: 'hidden' }
          : {}),
      }}
    >
      {/* Peek state: Single-line minimal header with drag handle */}
      {drawerState === 'peek' && (
        <div
          className="flex flex-col h-full"
        >
          {/* Drag handle */}
          <div
            className="flex justify-center pt-1.5 pb-0.5 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMoveOnHandle}
            onPointerUp={handlePointerUpOnHandle}
          >
            <div className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
          {/* Content row */}
          <div className="flex items-center justify-between px-4 flex-1">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {list.name}
              </h3>
              <span className="text-xs text-muted-foreground">
                · {itemCount} item{itemCount !== 1 ? 's' : ''}
              </span>
              {isSearching && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-green-500 ml-1" />
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleExpand(); }}
              className="p-1 -mr-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronUp
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  showChevronGlow
                    ? "text-green-500 dark:text-green-400 animate-chevron-glow"
                    : "text-slate-500 dark:text-slate-400"
                )}
              />
            </button>
          </div>
        </div>
      )}

      {/* Expanded state: Full header and content - using CSS Grid for smooth height animation */}
      <div
        className="grid"
        style={{
          gridTemplateRows: drawerState === 'expanded' ? '1fr' : '0fr',
          transition: 'grid-template-rows 300ms ease-out',
        }}
      >
        {/* This div MUST have overflow-hidden for CSS Grid animation to work */}
        <div className="overflow-hidden min-h-0">
          {/* Height lock container - constrains height once expanded, allows internal scrolling */}
          <div
            ref={expandedContentRef}
            className="flex flex-col"
            style={{
              maxHeight: isFullscreen ? `${viewportHeight}px` : `${viewportHeight - inputAreaHeight - (embedded ? 0 : HEADER_HEIGHT)}px`,
            }}
          >
            {/* Drag handle for expanded state */}
            <div
              className="flex justify-center pt-1.5 pb-0.5 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMoveOnHandle}
              onPointerUp={handlePointerUpOnHandle}
            >
              <div className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            </div>

            {/* Fixed header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <ShoppingCart className="h-5 w-5 text-green-600 flex-shrink-0" />
            {isRenamingList ? (
              <Input
                ref={listNameInputRef}
                value={listRenameValue}
                onChange={(e) => setListRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleSaveListRename(); }
                  if (e.key === 'Escape') { e.preventDefault(); setIsRenamingList(false); }
                }}
                onBlur={handleSaveListRename}
                className="h-7 text-base font-semibold flex-1 min-w-0"
                autoComplete="off"
              />
            ) : (
              <h3
                className="text-base font-semibold text-slate-900 dark:text-white truncate cursor-pointer"
                onDoubleClick={handleStartListRename}
                onTouchEnd={(e) => {
                  const now = Date.now();
                  if (now - lastTapTimeRef.current < 300) {
                    e.preventDefault();
                    handleStartListRename();
                  }
                  lastTapTimeRef.current = now;
                }}
                title="Double-click to rename"
              >
                {list.name}
              </h3>
            )}
            <span className="text-xs text-muted-foreground flex-shrink-0">
              · {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Share dropdown - shown when results exist for selected store */}
            {hasAnyResults && selectedStoreKey && !isSearching && (
              <DropdownMenu onOpenChange={handleShareDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5 border-slate-300 dark:border-slate-600">
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <div
                      className="flex items-center w-full"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        handleCopyLink();
                      }}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Copy Link
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareWhatsApp}>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareMessenger}>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z"/></svg>
                    Messenger
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareTwitter}>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X / Twitter
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPdf} disabled={isPdfGenerating}>
                    {isPdfGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <AiOutlineFullscreenExit className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              ) : (
                <AiOutlineFullscreen className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              )}
            </button>
            {/* Collapse button */}
            <Button variant="ghost" size="icon" onClick={() => { setIsFullscreen(false); setDrawerState('peek'); }} className="h-8 w-8">
              <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </Button>
          </div>
        </div>

            {/* Expanded state content - scrollable area */}
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Store selector - shows immediately when search starts */}
          {storeNamesToDisplay.length > 0 && (
            <div className="px-3 pt-2 pb-2 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div className={cn(
                "flex gap-2",
                storeNamesToDisplay.length <= 4 ? "justify-between" : "overflow-x-auto pb-1 scrollbar-hide"
              )}>
                {storeNamesToDisplay.map((storeKey) => {
                  const data = storeSubtotals[storeKey];
                  const hasStoreData = data && data.total > 0;
                  return (
                    <StoreTab
                      key={storeKey}
                      storeKey={storeKey}
                      subtotal={hasStoreData ? data.total : undefined}
                      itemCount={hasStoreData ? data.itemCount : undefined}
                      isSelected={selectedStoreKey === storeKey}
                      isLowest={storeKey === lowestStore}
                      isSearching={isSearching && !hasStoreData}
                      onClick={() => setSelectedStore(storeKey)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Group tabs and sort controls */}
          <div className="px-4 py-1.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              {/* Group tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 flex-1">
                <button
                  onClick={() => setGroupBy('all')}
                  className={cn(
                    'flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all',
                    groupBy === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setGroupBy('category')}
                  className={cn(
                    'flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all',
                    groupBy === 'category'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  Category
                </button>
                <button
                  onClick={() => setGroupBy('meal')}
                  className={cn(
                    'flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all',
                    groupBy === 'meal'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  Meal
                </button>
              </div>

              {/* Sort controls - only show when price data exists */}
              {hasAnyResults && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs text-muted-foreground mr-1">Sort:</span>
                  <button
                    onClick={() => setSortBy(sortBy === 'name-asc' ? 'name-desc' : 'name-asc')}
                    className={cn(
                      'h-7 px-2 text-xs font-medium rounded-md transition-all',
                      sortBy.startsWith('name')
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    )}
                  >
                    A-Z {sortBy === 'name-asc' ? '↑' : sortBy === 'name-desc' ? '↓' : ''}
                  </button>
                  <button
                    onClick={() => setSortBy(sortBy === 'price-asc' ? 'price-desc' : 'price-asc')}
                    className={cn(
                      'h-7 px-2 text-xs font-medium rounded-md transition-all',
                      sortBy.startsWith('price')
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    )}
                  >
                    $ {sortBy === 'price-asc' ? '↑' : sortBy === 'price-desc' ? '↓' : ''}
                  </button>

                </div>
              )}
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-2">
            {Object.entries(groupedItems).map(([groupName, items]) => (
              <div key={groupName} className="mb-4 last:mb-0">
                {groupBy !== 'all' && (
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">
                    {groupName}
                  </h4>
                )}
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    // If we have a selected store (either from results or searching)
                    if (selectedStoreKey) {
                      const itemResults = results[item.name]
                        ? results[item.name][selectedStoreKey]
                        : undefined;
                      const itemSelection = selections[item.name]
                        ? selections[item.name][selectedStoreKey]
                        : undefined;
                      const hasItemResults = Array.isArray(itemResults) && itemResults.length > 0;

                      // Show skeleton while searching and no results yet for this item
                      if (isSearching && !hasItemResults) {
                        return (
                          <SkeletonItemRow key={`${item.name}-${idx}`} item={item} />
                        );
                      }

                      // Show ItemCard when we have results
                      if (hasAnyResults) {
                        const comparison = priceComparisonMap[item.name];
                        return (
                          <ItemCard
                            key={`${item.name}-${idx}`}
                            item={item}
                            storeKey={selectedStoreKey}
                            results={itemResults}
                            selection={itemSelection}
                            onSelectProduct={onSelectProduct}
                            onDelete={() => handleDeleteItem(item.name)}
                            isLoading={isSearching}
                            hasAnyResults={hasAnyResults}
                            isLowestPrice={comparison?.lowestPriceStores?.includes(selectedStoreKey) ?? false}
                            isBestValue={comparison?.bestValueStores?.includes(selectedStoreKey) ?? false}
                            pricingMode={pricingMode}
                          />
                        );
                      }
                    }

                    // Pre-search: show simple item row with edit/delete
                    return (
                      <SimpleItemRow
                        key={`${item.name}-${idx}`}
                        item={item}
                        isEditing={editingItemName === item.name}
                        isSearching={isSearching}
                        onStartEdit={() => setEditingItemName(item.name)}
                        onCancelEdit={() => setEditingItemName(null)}
                        onSaveEdit={(newName) => handleRenameItem(item.name, newName)}
                        onDelete={() => handleDeleteItem(item.name)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer - subtotal with actions, or initial check prices buttons */}
          <div
            className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0"
          >
            {selectedStoreKey && currentSubtotal > 0 ? (
              /* Show subtotal with action buttons when we have results */
              <div className="flex flex-col gap-2">
                {/* Row 1: Store logo, pricing toggle, and subtotal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={getStoreLogoPath(selectedStoreKey)}
                      alt={formatStoreName(selectedStoreKey)}
                      className="h-5 w-auto object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {/* Pricing mode toggle: Store vs Per-Each */}
                    <div
                      className="relative flex bg-slate-200/80 dark:bg-slate-700 rounded-full p-0.5 cursor-pointer select-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPricingMode(pricingMode === 'store' ? '/ea' : 'store');
                      }}
                      title="Toggle between store prices and estimated per-each prices"
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 bottom-0.5 rounded-full bg-white dark:bg-slate-500 shadow-sm transition-all duration-200 ease-out",
                          pricingMode === 'store' ? "left-0.5 w-[calc(50%-2px)]" : "left-[50%] w-[calc(50%-2px)]"
                        )}
                      />
                      <span className={cn(
                        "relative z-10 text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-200",
                        pricingMode === 'store' ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-400"
                      )}>
                        Store
                      </span>
                      <span className={cn(
                        "relative z-10 text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-200",
                        pricingMode === '/ea' ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-400"
                      )}>
                        /Each
                      </span>
                    </div>
                  </div>
                  {/* Fixed-height price display — always reserves space for subtitle */}
                  <div className="text-right h-10 flex flex-col justify-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-white leading-tight tabular-nums">
                      {formatPriceStrict(currentSubtotal) || `$${currentSubtotal.toFixed(2)}`}
                    </span>
                    <span className={cn(
                      "text-[10px] leading-tight transition-opacity duration-200",
                      pricingMode === '/ea' ? "text-green-600 dark:text-green-400 opacity-100" : "opacity-0"
                    )}>
                      est. per-each
                    </span>
                  </div>
                </div>

                {/* Row 2: Action buttons - clickable to collapse */}
                <div
                  className="flex items-center justify-end gap-2 cursor-pointer pt-1"
                  onClick={() => setDrawerState('peek')}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStores();
                    }}
                    className="border-slate-300 dark:border-slate-600"
                  >
                    <MapPin className="h-4 w-4 mr-1.5" />
                    Select Stores
                  </Button>

                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCheckPrices();
                    }}
                    disabled={isCheckingPrices || itemCount === 0}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {isCheckingPrices ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                        Update Prices
                      </>
                    )}
                  </Button>
                </div>

                {/* Instacart order button */}
                {instacartEnabled && !isSearching && list && (
                  <div className="pt-1">
                    <Button
                      size="sm"
                      className="w-full text-white font-medium"
                      style={{ backgroundColor: '#FF7009' }}
                      disabled={instacartLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!list) return;
                        setInstacartLoading(true);
                        getInstacartLink(list.id)
                          .then(({ url }) => window.open(url, '_blank'))
                          .catch((err) => {
                            console.error('Instacart link error:', err);
                            toast({ title: 'Could not create Instacart link', variant: 'destructive' });
                          })
                          .finally(() => setInstacartLoading(false));
                      }}
                    >
                      {instacartLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                          Creating link...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-1.5" />
                          Order on Instacart
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : !hasAnyResults && !isSearching ? (
              /* Show select stores and check prices buttons - initial state */
              <div
                className="flex items-center justify-end gap-2 cursor-pointer"
                onClick={() => setDrawerState('peek')}
              >
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStores();
                  }}
                  className="border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Select Stores
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCheckPrices();
                  }}
                  disabled={isCheckingPrices || itemCount === 0}
                  className="bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md transition-all"
                >
                  {isCheckingPrices ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Store className="h-4 w-4 mr-2" />
                      Check Prices
                    </>
                  )}
                </Button>
              </div>
            ) : isSearching ? (
              /* Show searching indicator */
              <div
                className="flex items-center justify-center cursor-pointer"
                onClick={() => setDrawerState('peek')}
              >
                <Loader2 className="h-4 w-4 animate-spin text-green-500 mr-2" />
                <span className="text-sm text-muted-foreground">Searching for prices...</span>
              </div>
            ) : null}
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default ListDrawer;
