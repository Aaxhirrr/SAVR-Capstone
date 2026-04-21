import React, {
  useMemo,
  useCallback,
  useEffect,
  useState,
  useRef,
  useDeferredValue,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ShoppingCart,
  Loader2,
  Store,
  Package,
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
  Plus,
  Minus,
  HelpCircle,
  ArrowUpDown,
} from "lucide-react";
import { ImCheckmark } from "react-icons/im";
import { MdShoppingCartCheckout } from 'react-icons/md';
// TiDelete removed — delete is now via hold-to-delete on quantity stepper
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import useListStore, { ListPriceData } from "@/stores/listStore";
import {
  SavedGroceryList,
  GroceryItem,
  getInstacartLink,
} from "@/services/groceryListService";
import { SearchResultInDB, GroceryProduct } from "@/services/shoppingService";
import {
  formatStoreName,
  getStoreLogoPath,
  formatPriceStrict,
  parseStoreKey,
  extractBrandFromStoreName,
  extractStreetFromAddress,
  getProductImage,
  truncateName,
  getProductTooltipFields,
  compareItemAcrossStores,
  PriceComparisonResult,
  isMeatCategory,
  isProduceCategory,
  decodeHTMLEntities,
} from "@/lib/storeUtils";
import shareService from "@/services/shareService";
import cartService from '@/services/cartService';
import storeService from '@/services/storeService';
import BuildCartModal from '@/components/BuildCartModal';
import { BiSolidBadgeDollar } from "react-icons/bi";
import { FaPiggyBank } from "react-icons/fa6";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Tooltip that also works on mobile via tap-to-toggle
const TapTooltip = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => {
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
          <span
            onTouchStart={handleTap}
            className="inline-flex items-center text-green-600 dark:text-green-400">
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
  onSelectProduct: (
    itemName: string,
    product: GroceryProduct | SearchResultInDB,
    store: string,
  ) => void;
  isCheckingPrices: boolean;
  inputAreaHeight?: number; // Dynamic height of the chat input area
  embedded?: boolean; // Use absolute positioning instead of fixed (for embedding in landing page)
}

// Compact store tab - flex item that grows to fill space
const StoreTab = React.memo(
  ({
    storeKey,
    subtotal,
    itemCount,
    isSelected,
    isLowest,
    isSearching,
    searchComplete,
    onClick,
  }: {
    storeKey: string;
    subtotal?: number;
    itemCount?: number;
    isSelected: boolean;
    isLowest: boolean;
    isSearching?: boolean;
    searchComplete?: boolean;
    onClick: () => void;
  }) => {
    const { address } = parseStoreKey(storeKey);
    const hasData = subtotal !== undefined && subtotal > 0;

    return (
      <button
        onClick={onClick}
        className={cn(
          "flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all flex-1 min-w-0 border-2",
          isSelected
            ? "bg-white dark:bg-slate-700 shadow-lg border-green-500 dark:border-green-400"
            : "bg-slate-50/80 dark:bg-slate-800/80 border-transparent hover:bg-white dark:hover:bg-slate-700 hover:shadow-md",
        )}>
        <img
          src={getStoreLogoPath(storeKey)}
          alt={formatStoreName(storeKey)}
          className="h-6 w-auto object-contain max-w-[80px]"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {address && (
          <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center px-1">
            {extractStreetFromAddress(address)}
          </span>
        )}
        <div className="flex items-center justify-center gap-1 mt-1">
          {isSearching && !hasData ? (
            <span className="text-xs text-green-600 dark:text-green-400 animate-pulse font-medium">
              Searching...
            </span>
          ) : hasData ? (
            <>
              <span
                className={cn(
                  "text-base font-bold tabular-nums transition-colors duration-500",
                  isLowest && searchComplete
                    ? "text-green-600 dark:text-green-400"
                    : "text-slate-800 dark:text-white",
                )}>
                ${subtotal!.toFixed(2)}
              </span>
              {isLowest && searchComplete && (
                <Badge
                  variant="secondary"
                  className="text-[9px] px-1.5 py-0 h-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-semibold animate-best-badge-pop">
                  Best
                </Badge>
              )}
            </>
          ) : (
            <span className="text-sm text-slate-400">—</span>
          )}
        </div>
        {hasData ? (
          <span className="text-[10px] text-muted-foreground">
            {itemCount} items
          </span>
        ) : isSearching ? (
          <div className="h-3 w-10 rounded skeleton-shine mt-0.5" />
        ) : (
          <span className="text-[10px] text-muted-foreground">0 items</span>
        )}
      </button>
    );
  },
);

StoreTab.displayName = "StoreTab";

// Item card component - shows item with selected product and price
// Entire card is clickable to open dropdown when multiple options available
const ItemCard = React.memo(({
  item,
  storeKey,
  results,
  selection,
  onSelectProduct,
  onDelete,
  onQuantityChange,
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
  onQuantityChange: (itemName: string, newQuantity: number) => void;
  isLoading: boolean;
  hasAnyResults: boolean;
  isLowestPrice: boolean;
  isBestValue: boolean;
  pricingMode: 'store' | '/ea';
}) => {
  const [showControls, setShowControls] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const deleteTimerRef = useRef<ReturnType<typeof setInterval>>();
  const deleteStartRef = useRef<number>(0);
  const isHoldingDeleteRef = useRef(false);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout>>();
  const quantity = item.priceQty ?? 1;

  const DELETE_HOLD_MS = 750;

  const openWithTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(autoCloseRef.current);
    autoCloseRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const bumpAutoClose = useCallback(() => {
    clearTimeout(autoCloseRef.current);
    autoCloseRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const handleRemove = useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => onDelete(), 250);
  }, [onDelete]);

  const startDeleteHold = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    isHoldingDeleteRef.current = true;
    deleteStartRef.current = Date.now();
    setDeleteProgress(0);

    deleteTimerRef.current = setInterval(() => {
      if (!isHoldingDeleteRef.current) return;
      const elapsed = Date.now() - deleteStartRef.current;
      const progress = Math.min(elapsed / DELETE_HOLD_MS, 1);
      setDeleteProgress(progress);

      if (progress >= 0.8 && elapsed - DELETE_HOLD_MS * 0.8 < 20) {
        navigator.vibrate?.(15);
      }

      if (progress >= 1) {
        isHoldingDeleteRef.current = false;
        clearInterval(deleteTimerRef.current);
        setDeleteProgress(0);
        navigator.vibrate?.(30);
        handleRemove();
      }
    }, 16);
  }, [handleRemove]);

  const cancelDeleteHold = useCallback(() => {
    isHoldingDeleteRef.current = false;
    clearInterval(deleteTimerRef.current);
    setDeleteProgress(0);
  }, []);

  useEffect(() => () => { clearInterval(deleteTimerRef.current); clearTimeout(autoCloseRef.current); }, []);
  const isNothingSelected = !!(selection && selection.name === 'Nothing');

  // Use selection if available, otherwise fall back to first result
  // BUT: if user explicitly chose "Nothing", don't fall back — show skipped state
  const effectiveSelection = isNothingSelected
    ? undefined
    : (selection && selection.name !== 'Nothing')
      ? selection
      : (results && results.length > 0 ? results[0] : undefined);

  const hasSelection = !!effectiveSelection && effectiveSelection.name !== 'Nothing';
  const hasOptions = results && results.length > 0;

  // Compute display price based on pricing mode, multiplied by quantity
  const { displayPrice, displayUnit, isUnitPrice } = useMemo(() => {
    if (!hasSelection || !effectiveSelection) return { displayPrice: null, displayUnit: '', isUnitPrice: false };
    const p = effectiveSelection as any;
    if (pricingMode === '/ea') {
      // Meat: use pricePer100g
      if (isMeatCategory(item.category) && p.pricePer100g != null) {
        const total = p.pricePer100g * quantity;
        return { displayPrice: `$${total.toFixed(2)}`, displayUnit: quantity > 1 ? '' : '/100g', isUnitPrice: quantity <= 1 };
      }
      // Produce only: use pricePerEach
      if (isProduceCategory(item.category) && p.pricePerEach != null) {
        const total = p.pricePerEach * quantity;
        return { displayPrice: `$${total.toFixed(2)}`, displayUnit: quantity > 1 ? '' : '/ea', isUnitPrice: quantity <= 1 };
      }
    }
    // Store mode: parse price string and multiply
    const rawPrice = formatPriceStrict(effectiveSelection.price);
    if (quantity > 1 && rawPrice) {
      const numericPart = parseFloat(String(rawPrice).replace(/[$£€]/g, '').trim());
      if (!isNaN(numericPart)) {
        return { displayPrice: `$${(numericPart * quantity).toFixed(2)}`, displayUnit: '', isUnitPrice: false };
      }
    }
    return { displayPrice: rawPrice, displayUnit: '', isUnitPrice: false };
  }, [hasSelection, effectiveSelection, pricingMode, item.category, quantity]);

  // Clean size: strip leaked price-per-unit strings like "$4.41/1kg"
  const cleanSize = useMemo(() => {
    const raw = effectiveSelection?.size || '';
    return raw.replace(/\$[\d.,]+\s*\/\s*\d*\s*(?:kg|lb|100\s*g|ea)\b/gi, '').trim();
  }, [effectiveSelection?.size]);

  // Filter results to current store for dropdown
  const filteredResults = useMemo(() =>
    results
      ? results.filter((p: SearchResultInDB) => p.store === storeKey)
      : [],
    [results, storeKey]);

  // Track dropdown open state so we only build the heavy content when visible
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Dropdown menu content — only rendered when open (lazy)
  const dropdownContent = dropdownOpen ? (
    <DropdownMenuContent
      align="end"
      side="bottom"
      sideOffset={6}
      avoidCollisions
      collisionPadding={12}
      sticky="always"
      className="z-[120] p-0 min-w-[280px] w-[320px] overflow-y-auto max-h-[calc(var(--radix-popper-available-height)-24px)] sm:max-h-[450px] shadow-2xl border-2 border-slate-200 dark:border-slate-700"
    >
      {/* Header */}
      <div className="p-2 pt-1 pb-2 border-b border-border bg-background sticky top-0 z-10 text-xs md:shadow-sm">
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
  ) : null;

  // Derive card animation styles from deleteProgress (0 → 1)
  const deleteAnimStyle = deleteProgress > 0 ? {
    transform: `translateX(${deleteProgress * 60}px)`,
    opacity: 1 - deleteProgress * 0.6,
    transition: 'none',
  } : undefined;

  return (
    <div
      className={cn(
        "relative group/card flex items-stretch overflow-hidden drawer-press",
        isRemoving && "opacity-0 translate-x-16 max-h-0 mb-0 scale-y-95 origin-top"
      )}
      style={isRemoving
        ? { maxHeight: 0, marginBottom: 0, transition: 'all 250ms ease-in-out' }
        : {
            maxHeight: '200px',
            transition: deleteProgress > 0 ? 'none' : 'all 250ms ease-in-out',
            ...(deleteAnimStyle || {}),
          }
      }
    >
      {/* Red tint overlay during hold-to-delete */}
      {deleteProgress > 0 && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none z-10"
          style={{
            background: `rgba(239, 68, 68, ${deleteProgress * 0.15})`,
            transition: 'none',
          }}
        />
      )}
      {/* Quantity stepper gutter — left of card */}
      <div
        className="flex-shrink-0 w-11 md:w-9 flex flex-col items-center justify-center relative"
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') { setShowControls(true); clearTimeout(autoCloseRef.current); } }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') { setShowControls(false); clearTimeout(autoCloseRef.current); } }}
        onClick={(e) => {
          e.stopPropagation();
          if ((e.target as HTMLElement).closest('[data-stepper]')) return;
          if (showControls) { setShowControls(false); clearTimeout(autoCloseRef.current); } else { openWithTimer(); }
        }}
      >
        {/* Active: full vertical stepper [+] qty [-] */}
        <div
          className={cn("flex flex-col items-center gap-1", !showControls && "pointer-events-none")}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            data-stepper
            onPointerDown={(e) => { e.stopPropagation(); onQuantityChange(item.name, quantity + 1); bumpAutoClose(); }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "w-9 h-9 md:w-7 md:h-7 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-600 dark:hover:text-white active:bg-slate-200 shadow-sm select-none",
              "transition-[opacity,transform] duration-150 ease-out",
              showControls
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-3 scale-75 pointer-events-none"
            )}
            disabled={quantity >= 99}
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
          </button>
          <span
            className={cn(
              "text-xs font-bold text-slate-700 dark:text-slate-200 leading-none tabular-nums",
              "transition-[opacity,transform] duration-150 ease-out delay-[40ms]",
              showControls
                ? "opacity-100 scale-100"
                : "opacity-0 scale-50 pointer-events-none"
            )}
          >
            {quantity}
          </span>
          <button
            data-stepper
            onPointerDown={(e) => {
              e.stopPropagation();
              if (quantity > 1) {
                onQuantityChange(item.name, quantity - 1);
                bumpAutoClose();
              } else {
                startDeleteHold(e);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerUp={cancelDeleteHold}
            onPointerLeave={cancelDeleteHold}
            onPointerCancel={cancelDeleteHold}
            className={cn(
              "w-9 h-9 md:w-7 md:h-7 flex items-center justify-center rounded-full border shadow-sm touch-none select-none",
              "transition-[opacity,transform] duration-150 ease-out delay-[80ms]",
              quantity <= 1
                ? cn(
                    deleteProgress > 0
                      ? "border-red-300 dark:border-red-500/50 bg-red-500 text-white scale-110"
                      : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-600 dark:hover:text-slate-200 active:bg-slate-200"
                  )
                : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-600 dark:hover:text-slate-200 active:bg-slate-200",
              showControls
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-3 scale-75 pointer-events-none"
            )}
          >
            {quantity <= 1 ? <Trash2 className="w-4.5 h-4.5 md:w-3.5 md:h-3.5" /> : <Minus className="w-5 h-5 md:w-4 md:h-4" />}
          </button>
        </div>

        {/* Resting: quantity badge (qty > 1) */}
        {quantity > 1 && (
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center pointer-events-none",
              "transition-all duration-200 ease-out",
              showControls ? "opacity-0 scale-50" : "opacity-100 scale-100"
            )}
          >
            <span className="bg-green-600 text-white text-xs md:text-[11px] font-bold rounded-full w-9 h-9 md:w-7 md:h-7 flex items-center justify-center leading-none shadow-sm">
              {quantity}
            </span>
          </span>
        )}

        {/* Resting: subtle + button (qty = 1) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuantityChange(item.name, quantity + 1);
            openWithTimer();
          }}
          className={cn(
            "absolute inset-0 m-auto w-9 h-9 md:w-7 md:h-7 flex items-center justify-center rounded-full",
            "bg-white/80 dark:bg-slate-700/80 border border-slate-200/80 dark:border-slate-600/60",
            "text-slate-400 dark:text-slate-400",
            "hover:bg-slate-100 hover:text-slate-600 hover:border-slate-300",
            "dark:hover:bg-slate-600 dark:hover:text-slate-200",
            "shadow-sm",
            "transition-all duration-200 ease-out",
            (showControls || quantity > 1) ? "opacity-0 scale-50 pointer-events-none" : "opacity-100 scale-100"
          )}
        >
          <Plus className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </div>

      {/* Card */}
      <div className="relative flex-1 min-w-0">
        <Card className={cn("shadow-sm overflow-hidden", isNothingSelected ? "border-slate-300 dark:border-slate-600 opacity-60" : "border-slate-200 dark:border-slate-700")}>
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Product image */}
            <div className="relative flex-shrink-0 w-16 bg-white dark:bg-slate-800 flex items-center justify-center border-r border-slate-100 dark:border-slate-700 p-1 overflow-hidden">
              {isNothingSelected ? (
                <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              ) : hasSelection && effectiveSelection?.imageUrl ? (
                <img
                  src={effectiveSelection.imageUrl}
                  alt={effectiveSelection.name}
                  className="w-14 h-14 object-contain"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/store-placeholder.png'; }}
                />
              ) : (
                <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              )}
            </div>

            {/* Item details - center section */}
            <div className="flex-1 min-w-0 py-2.5 px-2.5">
              <div className={cn("font-semibold text-sm truncate", isNothingSelected ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-white")}>
                {item.name}
              </div>

              {isNothingSelected && (
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Skipped
                </div>
              )}

              {!isNothingSelected && hasSelection && effectiveSelection && (
                <>
                  {effectiveSelection.brand && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
                      {decodeHTMLEntities(effectiveSelection.brand)}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 dark:text-slate-500 truncate mt-0.5">
                    {effectiveSelection.name !== item.name && decodeHTMLEntities(effectiveSelection.name)}
                    {effectiveSelection.name !== item.name && cleanSize && ' '}
                    {cleanSize}
                  </div>
                </>
              )}

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
                {isLowestPrice && hasSelection && (
                  <TapTooltip label="Lowest price across your stores">
                    <BiSolidBadgeDollar className="h-4 w-4" />
                  </TapTooltip>
                )}
                {isBestValue && hasSelection && (
                  <TapTooltip label="Best value per unit across your stores">
                    <FaPiggyBank className="h-4 w-4" />
                  </TapTooltip>
                )}
              </div>
            </div>

            {/* Price and dropdown trigger - right section */}
            <div className="flex-shrink-0 flex items-center pr-2 gap-1">
              {isNothingSelected ? (
                <>
                  <span className="font-bold text-base tabular-nums leading-tight text-slate-400">$0.00</span>
                  {hasOptions && (
                    <DropdownMenu onOpenChange={setDropdownOpen}>
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
              ) : hasAnyResults ? (
                <>
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
                    {!isUnitPrice && hasSelection && (effectiveSelection as any)?.pricePer100g != null && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight tabular-nums">
                        ${(effectiveSelection as any).pricePer100g.toFixed(2)}/100g
                      </span>
                    )}
                  </div>
                  {hasOptions && (
                    <DropdownMenu onOpenChange={setDropdownOpen}>
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
    </div>
  );
});

ItemCard.displayName = 'ItemCard';

// Simple item row for pre-search state with edit/delete functionality
const SimpleItemRow = React.memo(
  ({
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

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSave();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setEditValue(item.name);
          onCancelEdit();
        }
      },
      [handleSave, item.name, onCancelEdit],
    );

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
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
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
        onMouseLeave={() => setShowIcons(false)}>
        <div className="flex items-center gap-2 min-w-0">
          <ImCheckmark className="w-3 h-3 text-green-500 flex-shrink-0" />
          <span
            className="text-sm text-slate-800 dark:text-slate-200 truncate"
            title={item.name}>
            {item.name}
          </span>
          {/* Edit/Delete icons - show on hover (desktop) or tap (mobile) */}
          {!isSearching && (
            <div
              className={cn(
                "flex items-center gap-0.5 transition-opacity duration-150 flex-shrink-0",
                showIcons
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto",
              )}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit();
                }}
                className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                title="Rename item">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                title="Delete item">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.quantity && (
            <span className="text-xs text-slate-500">
              {item.quantity} {item.unit || ""}
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
  },
);

SimpleItemRow.displayName = "SimpleItemRow";

// Skeleton item row for loading state during search
const SkeletonItemRow = React.memo(({ item }: { item: GroceryItem }) => (
  <Card className="md:shadow-sm border-slate-200 dark:border-slate-700 overflow-hidden">
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
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
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

SkeletonItemRow.displayName = "SkeletonItemRow";

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
    searchingStoresMap,
    updateItemName,
    updateItemQuantity,
    deleteItem,
    renameList,
    pricingMode,
    setPricingMode,
  } = useListStore();

  // Deferred store key: tabs highlight instantly via selectedStoreKey,
  // but the expensive item list re-render uses this deferred value,
  // which React can interrupt/skip on rapid tab switching.
  const deferredStoreKey = useDeferredValue(selectedStoreKey);
  const isStoreTransitioning = deferredStoreKey !== selectedStoreKey;

  const searchingStores = list?.id ? (searchingStoresMap[list.id] || []) : [];

  const { toast } = useToast();

  // State for tracking which item is being edited
  const [editingItemName, setEditingItemName] = useState<string | null>(null);

  // State for inline list name editing (double-click)
  const [isRenamingList, setIsRenamingList] = useState(false);
  const [listRenameValue, setListRenameValue] = useState("");
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
        toast({ description: "List renamed", duration: 2000 });
      } catch {
        toast({
          variant: "destructive",
          description: "Failed to rename list",
          duration: 3000,
        });
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
  const [groupBy, setGroupBy] = useState<"all" | "category" | "meal">(
    "category",
  );

  // Local state for sorting
  const [sortBy, setSortBy] = useState<
    "default" | "name-asc" | "name-desc" | "price-asc" | "price-desc"
  >("default");

  // Instacart integration (hidden for now — re-enable in future update)
  const instacartEnabled = false;
  const [instacartLoading, setInstacartLoading] = useState(false);

  // Cart integration (PCX stores only — Voila/Metro buttons are only in ListsPage)
  const PCX_STORES = useMemo(() => ['loblaws','nofrills','superstore','independent','zehrs','fortinos','maxi','valuemart','atlanticsuperstore'], []);
  const [buildCartOpen, setBuildCartOpen] = useState(false);
  const selectedStoreIsPcx = useMemo(() => {
    if (!selectedStoreKey) return false;
    return PCX_STORES.includes(parseStoreKey(selectedStoreKey).storeName.toLowerCase());
  }, [selectedStoreKey, PCX_STORES]);
  // null = still loading, true/false = resolved
  const [selectedStoreOnlineOrdering, setSelectedStoreOnlineOrdering] = useState<boolean | null>(null);
  const onlineOrderingCacheRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (!selectedStoreIsPcx || !selectedStoreKey) { setSelectedStoreOnlineOrdering(null); return; }
    const canonical = parseStoreKey(selectedStoreKey).storeName.toLowerCase();
    const cacheKey = selectedStoreKey;
    if (onlineOrderingCacheRef.current.has(cacheKey)) {
      setSelectedStoreOnlineOrdering(onlineOrderingCacheRef.current.get(cacheKey)!);
      return;
    }
    setSelectedStoreOnlineOrdering(null); // loading
    let cancelled = false;
    (async () => {
      try {
        const stores = await storeService.getUserSelectedStores();
        const match = stores.find(s => extractBrandFromStoreName(s.store_name) === canonical);
        if (!match?.retailer_store_id) { if (!cancelled) { setSelectedStoreOnlineOrdering(true); onlineOrderingCacheRef.current.set(cacheKey, true); } return; }
        const result = await cartService.checkOnlineOrdering(canonical, match.retailer_store_id);
        if (!cancelled) { setSelectedStoreOnlineOrdering(result); onlineOrderingCacheRef.current.set(cacheKey, result); }
      } catch { if (!cancelled) { setSelectedStoreOnlineOrdering(true); onlineOrderingCacheRef.current.set(cacheKey, true); } }
    })();
    return () => { cancelled = true; };
  }, [selectedStoreKey, selectedStoreIsPcx]);

  // Share state
  const [, setShareUrl] = useState<string | null>(null);
  const shareUrlRef = useRef<string | null>(null);
  const shareUrlStoreRef = useRef<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [copyLinkUrl, setCopyLinkUrl] = useState<string | null>(null);
  const [copyLinkCopied, setCopyLinkCopied] = useState(false);
  const [isFullscreen, setIsFullscreenRaw] = useState(false);
  const suppressTransitionRef = useRef(false);
  const setIsFullscreen = useCallback((val: boolean) => {
    // Suppress transitions for one frame when toggling fullscreen
    suppressTransitionRef.current = true;
    setIsFullscreenRaw(val);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { suppressTransitionRef.current = false; });
    });
  }, []);
  const [helpGlow, setHelpGlow] = useState(false);
  const [helpTooltipOpen, setHelpTooltipOpen] = useState(false);
  const helpTooltipTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-dismiss help tooltip after 4 seconds
  useEffect(() => {
    clearTimeout(helpTooltipTimerRef.current);
    if (helpTooltipOpen) {
      helpTooltipTimerRef.current = setTimeout(() => setHelpTooltipOpen(false), 4000);
    }
    return () => clearTimeout(helpTooltipTimerRef.current);
  }, [helpTooltipOpen]);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", update);
    // visualViewport handles mobile keyboard/toolbar changes
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
  
    const appRoot = document.getElementById("root"); // adjust if your root id is different
    if (!appRoot) return;
  
    // Disable interaction with the rest of the app
    appRoot.style.pointerEvents = "none";
  
    return () => {
      // Re-enable interaction when exiting fullscreen
      appRoot.style.pointerEvents = "";
    };
  }, [isFullscreen]);
  const copyLinkInputRef = useRef<HTMLInputElement>(null);

  const ensureShareUrl = useCallback(async (): Promise<string> => {
    // Invalidate cache if store changed since last fetch
    if (shareUrlRef.current && shareUrlStoreRef.current !== selectedStoreKey) {
      shareUrlRef.current = null;
      shareUrlStoreRef.current = null;
    }
    if (shareUrlRef.current) return shareUrlRef.current;
    if (!list || !selectedStoreKey)
      throw new Error("No list or store selected");
    const { url } = await shareService.createShareLink(
      list.id,
      selectedStoreKey,
    );
    shareUrlRef.current = url;
    shareUrlStoreRef.current = selectedStoreKey;
    setShareUrl(url);
    return url;
  }, [list, selectedStoreKey]);

  // Pre-fetch share URL when dropdown opens
  const handleShareDropdownOpen = useCallback(
    (open: boolean) => {
      if (open && !shareUrlRef.current && list && selectedStoreKey) {
        ensureShareUrl().catch(() => {});
      }
    },
    [list, selectedStoreKey, ensureShareUrl],
  );

  // Copy link: on HTTPS use clipboard API, on HTTP show a dialog
  const handleCopyLink = useCallback(() => {
    const url = shareUrlRef.current;
    if (!url) {
      toast({
        description: "Preparing link, please try again",
        duration: 2000,
      });
      return;
    }
    const fullUrl = url.startsWith("http")
      ? url
      : `${window.location.origin}${url}`;

    if (window.isSecureContext && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(fullUrl)
        .then(() => {
          toast({ description: "Link copied to clipboard", duration: 2000 });
        })
        .catch(() => {
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
    const ta = document.createElement("textarea");
    ta.value = copyLinkUrl;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      /* ignore */
    }
    document.body.removeChild(ta);
    setCopyLinkCopied(true);
    setTimeout(() => setCopyLinkCopied(false), 2000);
  }, [copyLinkUrl]);

  const handleShareEmail = useCallback(async () => {
    try {
      const url = await ensureShareUrl();
      const subject = encodeURIComponent(
        `${list?.name || "Grocery List"} - ${formatStoreName(selectedStoreKey || "")}`,
      );
      const body = encodeURIComponent(`Check out my grocery list:\n${url}`);
      window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
    } catch {
      toast({
        variant: "destructive",
        description: "Failed to create share link",
        duration: 3000,
      });
    }
  }, [ensureShareUrl, list, selectedStoreKey, toast]);

  const handleShareWhatsApp = useCallback(async () => {
    try {
      const url = await ensureShareUrl();
      const text = encodeURIComponent(
        `${list?.name || "Grocery List"}\n${url}`,
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    } catch {
      toast({
        variant: "destructive",
        description: "Failed to create share link",
        duration: 3000,
      });
    }
  }, [ensureShareUrl, list, toast]);

  const handleShareMessenger = useCallback(async () => {
    try {
      const url = await ensureShareUrl();
      const encoded = encodeURIComponent(url);
      window.open(
        `https://www.facebook.com/dialog/send?link=${encoded}&app_id=0&redirect_uri=${encodeURIComponent(window.location.href)}`,
        "_blank",
      );
    } catch {
      toast({
        variant: "destructive",
        description: "Failed to create share link",
        duration: 3000,
      });
    }
  }, [ensureShareUrl, toast]);

  const handleShareTwitter = useCallback(async () => {
    try {
      const url = await ensureShareUrl();
      const text = encodeURIComponent(list?.name || "Grocery List");
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`,
        "_blank",
      );
    } catch {
      toast({
        variant: "destructive",
        description: "Failed to create share link",
        duration: 3000,
      });
    }
  }, [ensureShareUrl, list, toast]);

  const handlePrint = useCallback(async () => {
    try {
      const url = await ensureShareUrl();
      const printUrl = `${url}&print=1`;
      console.log("[Share] Opening print URL:", printUrl);
      window.open(printUrl, "_blank");
    } catch (err) {
      console.error("[Share] handlePrint failed:", err);
      toast({
        variant: "destructive",
        description: "Failed to create share link",
        duration: 3000,
      });
    }
  }, [ensureShareUrl, toast]);

  const handleDownloadPdf = useCallback(async () => {
    if (!list || !selectedStoreKey) return;
    console.log(
      "[Share] handleDownloadPdf called, list:",
      list.id,
      "store:",
      selectedStoreKey,
    );
    setIsPdfGenerating(true);
    try {
      await shareService.downloadStorePdf(list.id, selectedStoreKey);
      console.log("[Share] PDF download completed");
    } catch (err) {
      console.error("[Share] PDF generation failed:", err);
      toast({
        variant: "destructive",
        description: "Failed to generate PDF",
        duration: 3000,
      });
    } finally {
      setIsPdfGenerating(false);
    }
  }, [list, selectedStoreKey, toast]);

  const expandedContentRef = useRef<HTMLDivElement>(null);

  // Track tap cycle direction: after entering fullscreen, next tap from expanded goes down to peek
  const lastWasFullscreen = useRef(false);

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
  const TOP_PERFORATION_OVERHANG_PX = 12; // zigzag2.png is 12px tall and sits above the drawer edge
  const CLICK_THRESHOLD = 4;
  const FULLSCREEN_DRAG_THRESHOLD = 40; // px of upward drag past expanded to trigger fullscreen

  // Track if we've auto-selected a store for this search session
  // This prevents overriding user's manual selection during active search
  const prevCompletedRef = useRef(false);


  // Get price data for current list
  const priceData: ListPriceData | null = list
    ? listPriceDataMap[list.id] || null
    : null;
  const results = priceData?.results || {};
  const selections = priceData?.selections || {};
  const storeSubtotals = priceData?.storeSubtotals || {};
  const status = priceData?.status;
  const hasAnyResults = Object.keys(results).length > 0;
  const isCompleted = status === "completed";

  // Eagerly pre-fetch share URL when results are available
  useEffect(() => {
    if (hasAnyResults && selectedStoreKey && list) {
      ensureShareUrl().catch(() => {});
    }
  }, [hasAnyResults, selectedStoreKey, list, ensureShareUrl]);
  const isSearching =
    isPollingActive ||
    isCheckingPrices ||
    status === "pending" ||
    status === "in_progress";

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

  // Get store names that have results (no price sorting - keep selection order)
  const storesWithResults = useMemo(() => {
    return Object.entries(storeSubtotals)
      .filter(([, data]) => data.total > 0)
      .map(([name]) => name);
  }, [storeSubtotals]);

  // Generate store keys from searchingStores for immediate display
  // Uses extractBrandFromStoreName to properly extract brand from full store names
  // (e.g., "Loblaws - Loblaws Mclaughlin Road" -> "loblaws")
  const searchingStoreKeys = useMemo(() => {
    if (searchingStores.length === 0) return [];
    return searchingStores.map(s => {
      // Prefer brand field (normalized DB key like 'gianttiger') over extracting
      // from store_name — Giant Tiger stores have location-based names (e.g. "Camrose, Alberta")
      // that don't contain the brand, causing logo mismatches and duplicate tabs.
      const canonical = s.brand || extractBrandFromStoreName(s.store_name);
      return s.address ? `${canonical}::${s.address}` : canonical;
    });
  }, [searchingStores]);

  // Combined store names - use searchingStoreKeys order (user's selection order) as stable base
  const storeNamesToDisplay = useMemo(() => {
    if (searchingStoreKeys.length > 0) {
      // Start with the user's selection order, then append any result stores not already listed
      const keySet = new Set(searchingStoreKeys);
      const extraFromResults = storesWithResults.filter(key => !keySet.has(key));
      return [...searchingStoreKeys, ...extraFromResults];
    }
    if (storesWithResults.length > 0) return storesWithResults;
    return [];
  }, [storesWithResults, searchingStoreKeys]);

  // Find lowest priced store
  const lowestStore = useMemo(() => {
    let lowest: string | null = null;
    let lowestTotal = Infinity;
    for (const [name, data] of Object.entries(storeSubtotals)) {
      if (data.total > 0 && data.total < lowestTotal) {
        lowestTotal = data.total;
        lowest = name;
      }
    }
    return lowest;
  }, [storeSubtotals]);

  // Auto-select cheapest store when search completes (transition: not-completed → completed)
  useEffect(() => {
    if (!prevCompletedRef.current && isCompleted && lowestStore) {
      setSelectedStore(lowestStore);
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted, lowestStore, setSelectedStore]);

  // Safety net: whenever results exist but no valid store is selected, pick the cheapest
  useEffect(() => {
    if (!isSearching && hasAnyResults && (!selectedStoreKey || !storeSubtotals[selectedStoreKey])) {
      if (lowestStore) setSelectedStore(lowestStore);
    }
  }, [isSearching, hasAnyResults, selectedStoreKey, storeSubtotals, setSelectedStore, lowestStore]);

  // Auto-select first store when stores appear and none is selected (enables skeleton items during search)
  useEffect(() => {
    if (!selectedStoreKey && storeNamesToDisplay.length > 0) {
      setSelectedStore(storeNamesToDisplay[0]);
    }
  }, [selectedStoreKey, storeNamesToDisplay, setSelectedStore]);

  // Get items grouped and sorted
  const groupedItems = useMemo(() => {
    if (!list) return {};

    // Helper to get item price at selected store (uses deferred key for responsiveness)
    const getItemPrice = (item: GroceryItem): number => {
      if (!deferredStoreKey) return Infinity;
      const itemSel = selections[item.name]?.[deferredStoreKey];
      const itemRes = results[item.name]?.[deferredStoreKey];
      const product = itemSel || itemRes?.[0];
      if (!product || product.name === "Nothing") return Infinity;
      const priceStr = String(product.price).replace(/[^0-9.]/g, "");
      return parseFloat(priceStr) || Infinity;
    };

    // Sort function
    const sortItems = (items: GroceryItem[]): GroceryItem[] => {
      if (sortBy === "default") return items;
      const sorted = [...items];
      switch (sortBy) {
        case "name-asc":
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case "name-desc":
          return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case "price-asc":
          return sorted.sort((a, b) => getItemPrice(a) - getItemPrice(b));
        case "price-desc":
          return sorted.sort((a, b) => getItemPrice(b) - getItemPrice(a));
        default:
          return items;
      }
    };

    // Group items
    let grouped: Record<string, GroceryItem[]>;
    if (groupBy === "all") {
      grouped = { "All Items": list.items };
    } else {
      grouped = list.items.reduce<Record<string, GroceryItem[]>>(
        (acc, item) => {
          const key =
            groupBy === "category"
              ? item.category || "Uncategorized"
              : item.meal || "Uncategorized";
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        },
        {},
      );
    }

    // Sort items within each group
    return Object.fromEntries(
      Object.entries(grouped).map(([key, items]) => [key, sortItems(items)]),
    );
  }, [list, groupBy, sortBy, deferredStoreKey, results, selections]);

  // Handle drawer expand
  const handleExpand = useCallback(() => {
    setDrawerState("expanded");
  }, [setDrawerState]);

  // Desktop: never allow peek state — auto-correct to expanded
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1280 && drawerState === "peek") {
      setDrawerState("expanded");
    }
  }, [drawerState, setDrawerState]);

  // Compute max expanded height
  const getMaxExpandedHeight = useCallback(() => {
    const vh = window.innerHeight;
    const contentHeight = expandedContentRef.current?.scrollHeight || 400;
    return Math.min(contentHeight + 20, vh * 0.96);
  }, []);

  // Pointer handlers for drag-to-resize
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Disable drag on desktop (unless fullscreen, which isn't gesture-driven on desktop)
      if (window.innerWidth >= 1280) return;

      if (e.button !== 0) return; // Only primary button
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      pointerDown.current = true;
      dragStartY.current = e.clientY;
      dragDistance.current = 0;
      lastPointerY.current = e.clientY;
      lastPointerTime.current = e.timeStamp;
      velocity.current = 0;

      // Measure current drawer height
      const currentHeight =
        isFullscreen
          ? window.innerHeight
          : drawerRef.current?.offsetHeight ||
            (drawerState === "expanded" ? getMaxExpandedHeight() : PEEK_HEIGHT);
      dragStartHeight.current = currentHeight;
    },
    [drawerState, isFullscreen, getMaxExpandedHeight],
  );

  // Attach document-level pointermove/pointerup while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaY = dragStartY.current - e.clientY; // positive = drag up

      // Track velocity
      const now = e.timeStamp;
      const dt = now - lastPointerTime.current;
      if (dt > 0) {
        velocity.current = (lastPointerY.current - e.clientY) / dt; // px/ms, positive = up
      }
      lastPointerY.current = e.clientY;
      lastPointerTime.current = now;

      // In fullscreen: translate the drawer downward (top retracts, bottom stays anchored)
      if (isFullscreen) {
        const downOffset = Math.max(0, e.clientY - dragStartY.current); // only allow downward
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          setDragHeight(downOffset); // repurposed: stores translateY offset in fullscreen
        });
        return;
      }

      const maxH = getMaxExpandedHeight();
      // Allow dragging slightly past maxH so we can detect the over-drag into fullscreen
      const ceiling = maxH + FULLSCREEN_DRAG_THRESHOLD + 20;
      const newHeight = Math.max(
        20,
        Math.min(dragStartHeight.current + deltaY, ceiling),
      );

      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        setDragHeight(Math.min(newHeight, maxH)); // visual height capped at maxH
      });
    };

    const handlePointerUp = () => {
      pointerDown.current = false;
      cancelAnimationFrame(rafId.current);
      const wasDraggingFromFullscreen = isFullscreen;

      if (dragDistance.current < CLICK_THRESHOLD) {
        // It was a click, not a drag — handle in pointerUp on the element
        setIsDragging(false);
        setDragHeight(null);
        return;
      }

      const deltaY = dragStartY.current - lastPointerY.current; // positive = dragged up
      const finalHeight =
        dragStartHeight.current + deltaY;
      const maxH = getMaxExpandedHeight();
      const mid = (PEEK_HEIGHT + maxH) / 2;
      const v = velocity.current; // px/ms, positive = up

      // Determine target state
      let targetState: "peek" | "expanded" = "expanded";
      let targetFullscreen = isFullscreen;

      // --- Fullscreen exit (from fullscreen → expanded or peek) ---
      if (wasDraggingFromFullscreen) {
        if (v < -0.25 || deltaY < -40) {
          targetFullscreen = false;
          targetState = v < -1.2 ? "peek" : "expanded";
        }
        // else stay fullscreen
      }
      // --- Fullscreen entry (from expanded, drag/flick up) ---
      else if (drawerState === "expanded" && (v > 0.3 || finalHeight > maxH + FULLSCREEN_DRAG_THRESHOLD)) {
        targetFullscreen = true;
      }
      // --- Normal two-state snapping (peek ↔ expanded) ---
      else {
        if (Math.abs(v) > 0.5) {
          targetState = v > 0 ? "expanded" : "peek";
        } else {
          targetState = finalHeight < mid ? "peek" : "expanded";
        }
      }

      // Stop dragging but keep dragHeight for one frame so the browser
      // renders at the current drag position. Then on the next frame,
      // clear dragHeight and set target state — the CSS transition
      // animates smoothly from the drag position to the final state.
      setIsDragging(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDragHeight(null);
          if (targetFullscreen !== isFullscreen) setIsFullscreen(targetFullscreen);
          setDrawerState(targetState);
        });
      });
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      cancelAnimationFrame(rafId.current);
    };
  }, [isDragging, isFullscreen, getMaxExpandedHeight, setDrawerState, setIsFullscreen, drawerState]);

  // Start dragging after movement threshold exceeded — only if pointer is down
  const handlePointerMoveOnHandle = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerDown.current) return;
      const dist = Math.abs(e.clientY - dragStartY.current);
      dragDistance.current = dist;
      if (!isDragging && dist > CLICK_THRESHOLD) {
        setIsDragging(true);
        setDragHeight(dragStartHeight.current);
      }
    },
    [isDragging],
  );

  const handlePointerUpOnHandle = useCallback(() => {
    pointerDown.current = false;
    if (dragDistance.current < CLICK_THRESHOLD) {
      // It was a click — only handle on mobile
      if (window.innerWidth >= 1280) return;
      // Tap cycle: peek → expanded → fullscreen → expanded → peek → ...
      if (isFullscreen) {
        // Fullscreen → expanded (heading down)
        lastWasFullscreen.current = true;
        setIsFullscreen(false);
        setDrawerState("expanded");
      } else if (drawerState === "expanded") {
        if (lastWasFullscreen.current) {
          // Coming down from fullscreen → peek
          lastWasFullscreen.current = false;
          setDrawerState("peek");
        } else {
          // Coming up from peek → fullscreen
          setDrawerState("expanded");
          setIsFullscreen(true);
        }
      } else if (drawerState === "peek") {
        // Peek → expanded (heading up)
        lastWasFullscreen.current = false;
        handleExpand();
      }
    }
  }, [drawerState, isFullscreen, handleExpand, setDrawerState, setIsFullscreen]);

  // Handle item rename
  const handleRenameItem = useCallback(
    async (oldName: string, newName: string) => {
      if (!list) return;
      setEditingItemName(null);
      try {
        await updateItemName(list.id, oldName, newName);
        toast({
          description: "Item updated",
          duration: 2000,
        });
      } catch {
        toast({
          variant: "destructive",
          description: "Failed to update item",
          duration: 3000,
        });
      }
    },
    [list, updateItemName, toast],
  );

  // Handle quantity change
  const handleQuantityChange = useCallback((itemName: string, newQuantity: number) => {
    if (!list) return;
    updateItemQuantity(list.id, itemName, newQuantity);
  }, [list, updateItemQuantity]);

  // Handle item delete
  const handleDeleteItem = useCallback(
    async (itemName: string) => {
      if (!list) return;
      try {
        await deleteItem(list.id, itemName);
        toast({
          description: "Item removed",
          duration: 2000,
        });
      } catch {
        toast({
          variant: "destructive",
          description: "Failed to remove item",
          duration: 3000,
        });
      }
    },
    [list, deleteItem, toast],
  );

  // Don't render if no list or collapsed
  if (!list || drawerState === "collapsed") {
    return null;
  }

  const itemCount = list.items?.length || 0;
  const currentSubtotal =
    selectedStoreKey && storeSubtotals[selectedStoreKey]
      ? storeSubtotals[selectedStoreKey].total
      : 0;

  // Shared dialog component
  const copyLinkDialog = (
    <Dialog
      open={!!copyLinkUrl}
      onOpenChange={(open) => {
        if (!open) setCopyLinkUrl(null);
      }}>
      <DialogContent hideOverlay className="sm:max-w-md z-[130]">
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
              value={copyLinkUrl || ""}
              onFocus={(e) => e.target.select()}
              className="w-full h-10 rounded-lg border border-input bg-muted/50 px-3 pr-3 text-sm font-mono text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 truncate"
            />
          </div>
          <Button
            size="sm"
            className={cn(
              "h-10 px-4 gap-1.5 shrink-0 transition-all duration-200",
              copyLinkCopied
                ? "bg-green-600 hover:bg-green-600 text-white"
                : "",
            )}
            onClick={handleCopyLinkFromDialog}>
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
  );

  // Main drawer content
  const drawerContent = (
    <div
        ref={drawerRef}
        className={cn(
          embedded && !isFullscreen ? "absolute" : "fixed",
          "bg-white dark:bg-slate-800",
          !isFullscreen &&
            (drawerState === "expanded"
              ? "shadow-[0_-20px_40px_rgba(0,0,0,0.16),0_-8px_20px_rgba(0,0,0,0.10)] md:shadow-[0_14px_40px_rgba(0,0,0,0.14),0_6px_16px_rgba(0,0,0,0.10)]"
              : "shadow-[0_-20px_40px_rgba(0,0,0,0.16),0_-8px_20px_rgba(0,0,0,0.10)] md:shadow-[0_14px_40px_rgba(0,0,0,0.14),0_6px_16px_rgba(0,0,0,0.10)]"),

            isFullscreen
  ? "left-0 right-0 top-0 bottom-0 z-[110] pointer-events-auto"
            : cn(
                // Mobile: full width above input, Desktop: left side vertically centered and wider
                "left-0 right-0",
                // Desktop: left side, vertically centered, wider
                embedded
                  ? "xl:w-full xl:h-full xl:relative xl:left-auto xl:right-auto xl:top-auto xl:bottom-auto xl:transform-none"
                  : "xl:left-64 xl:top-1/2 xl:-translate-y-1/2 xl:bottom-auto xl:ml-[2.75rem] xl:w-[calc(70vw-8rem)] xl:max-w-[1200px]",
                drawerState === "peek" ? "z-[40]" : "z-[40]"
              ),
          isDragging ? "" : "overflow-visible",
          // Side borders for receipt effect
          !isFullscreen && "border-slate-300 dark:border-slate-600",
          // Animation classes - disable transitions while dragging
          isDragging || isFullscreen || suppressTransitionRef.current
            ? ""
            : "transition-all duration-300 ease-out",
        )}
        style={{
          // Mobile: position above input area, Desktop: centered (no bottom positioning)
          ...(typeof window !== "undefined" && window.innerWidth < 1280
            ? {
                bottom: isFullscreen ? 0 : `${Math.max(inputAreaHeight, 64)}px`,
              }
            : {}),
          ...(!isFullscreen && !isDragging
            ? {
                maxHeight: typeof window !== "undefined" && window.innerWidth >= 1280
                  ? (embedded ? "90svh" : "95vh") // Desktop: max height with scrolling
                  : `${viewportHeight - inputAreaHeight - (embedded ? 60 : HEADER_HEIGHT) - (drawerState === "expanded" ? TOP_PERFORATION_OVERHANG_PX : 0)}px`, // Mobile: dynamic with close button space (+ zigzag clearance)
                minHeight: typeof window !== "undefined" && window.innerWidth >= 1280 && embedded
                  ? "300px" // Desktop embedded: minimum height
                  : undefined,
              }
            : {}),
          ...(isFullscreen
            ? {
                height: `${viewportHeight}px`,
                // During fullscreen drag, slide the drawer down from the top
                ...(isDragging && dragHeight != null && dragHeight > 0
                  ? { transform: `translateY(${dragHeight}px)`, transition: "none" }
                  : {}),
              }
            : {}),
          ...(!isFullscreen && isDragging && dragHeight != null
            ? {
                height: `${dragHeight}px`,
                transition: "none",
                overflow: "hidden",
              }
            : {}),
        }}>
        {/* Top perforated edge outline - all states except fullscreen */}
        {!isFullscreen && (
          <img
            src="/zigzag2.png"
            alt=""
            aria-hidden="true"
            className="absolute -top-[11px] left-0 w-full h-[12px] pointer-events-none z-30"
            draggable={false}
          />
        )}
        {/* Bottom perforated edge outline - large desktop only */}
        {drawerState === "expanded" && !isFullscreen && (
          <img
            src="/zigzag2.png"
            alt=""
            aria-hidden="true"
            className="absolute -bottom-[11px] left-0 w-full h-[12px] pointer-events-none z-30 transform scale-y-[-1] hidden lg:block"
            draggable={false}
          />
        )}

        {/* Peek state: Single-line minimal header with drag handle (mobile only) */}
        {drawerState === "peek" && !isDragging && !isFullscreen && (
          <div
            className="flex flex-col h-full cursor-grab active:cursor-grabbing touch-none xl:hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMoveOnHandle}
            onPointerUp={handlePointerUpOnHandle}
          >
            {/* Drag handle pill - visual only */}
            <div className="flex justify-center pt-1.5 pb-0.5">
              <div className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            </div>
            {/* Content row */}
            <div className="flex items-center justify-between px-4 py-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100 shadow-sm ring-1 ring-green-200 dark:bg-green-500/20 dark:ring-green-500/30">
                  <ShoppingCart className="h-4 w-4 text-green-700 dark:text-green-300" />
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {list.name} List
                </h3>
                <span className="text-xs text-muted-foreground">
                  · {itemCount} item{itemCount !== 1 ? "s" : ""}
                </span>
                {isSearching && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-green-500 ml-1" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expanded state: Full header and content - using CSS Grid for smooth height animation */}
        <div
          className="grid"
          style={{
            gridTemplateRows: (drawerState === "expanded" || isDragging || isFullscreen) ? "1fr" : "0fr",
            transition: isDragging || isFullscreen || suppressTransitionRef.current ? "none" : "grid-template-rows 300ms ease-out",
          }}>
          {/* This div MUST have overflow-hidden for CSS Grid animation to work */}
          <div className="overflow-hidden min-h-0">
            {/* Height lock container - constrains height once expanded, allows internal scrolling */}
            <div
              ref={expandedContentRef}
              className="flex flex-col"
              style={{
                maxHeight: isFullscreen
                  ? `${viewportHeight}px`
                  : typeof window !== "undefined" && window.innerWidth >= 1280 && embedded
                    ? "calc(90svh - 120px)" // Desktop embedded: dynamic with max height minus header/footer space
                    : `${viewportHeight - inputAreaHeight - (embedded ? 60 : HEADER_HEIGHT) - (drawerState === "expanded" ? TOP_PERFORATION_OVERHANG_PX : 0)}px`,
              }}>
              {/* Draggable header zone - pill + header bar (mobile only) */}
              <div
                className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none xl:cursor-default xl:touch-auto"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMoveOnHandle}
                onPointerUp={handlePointerUpOnHandle}
              >
              {/* Drag handle pill - visual only, mobile only */}
              <div className="flex justify-center pt-1.5 pb-0.5 xl:hidden">
                <div className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
              </div>

              {/* Fixed header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 shadow-sm ring-1 ring-green-200 dark:bg-green-500/20 dark:ring-green-500/30 flex-shrink-0">
                    <ShoppingCart className="h-[18px] w-[18px] text-green-700 dark:text-green-300" />
                  </span>
                  {isRenamingList ? (
                    <Input
                      ref={listNameInputRef}
                      value={listRenameValue}
                      onChange={(e) => setListRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveListRename();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          setIsRenamingList(false);
                        }
                      }}
                      onBlur={handleSaveListRename}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="h-7 text-base font-semibold flex-1 min-w-0"
                      autoComplete="off"
                    />
                  ) : (
                    <h3
                      className="text-base font-semibold text-slate-900 dark:text-white truncate cursor-pointer"
                      onPointerDown={(e) => e.stopPropagation()}
                      onDoubleClick={handleStartListRename}
                      onTouchEnd={(e) => {
                        const now = Date.now();
                        if (now - lastTapTimeRef.current < 300) {
                          e.preventDefault();
                          handleStartListRename();
                        }
                        lastTapTimeRef.current = now;
                      }}
                      title="Double-click to rename">
                      {list.name}
                    </h3>
                  )}
                  <span className={cn("text-xs text-muted-foreground flex-shrink-0 mr-2 sm:mr-0", isFullscreen && "hidden")}>
                    · {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Fullscreen toggle - desktop only (mobile uses swipe gesture) */}
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isFullscreen) setDrawerState("expanded");
                            setIsFullscreen(!isFullscreen);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          onPointerUp={(e) => e.stopPropagation()}
                          className="hidden xl:flex p-2.5 -m-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors items-center justify-center">
                          {isFullscreen ? (
                            <AiOutlineFullscreenExit className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                          ) : (
                            <AiOutlineFullscreen className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent><p>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              </div>{/* End draggable header zone */}

              {/* Expanded state content - sticky headers with scrollable items */}
              <div className="flex flex-col flex-1 min-h-0">
                {/* Store selector - sticky at top */}
                {storeNamesToDisplay.length > 0 && (
                  <div className={cn(
                    "border-b border-slate-200 dark:border-slate-700 flex-shrink-0 sticky top-0 bg-white dark:bg-slate-800 z-10",
                    isFullscreen ? "px-4 py-1.5" : "px-3 pt-2 pb-2",
                  )}>
                    {isFullscreen && selectedStoreKey ? (
                      /* Fullscreen: compact dropdown to switch stores */
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center justify-between w-full hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg px-1 py-0.5 -mx-1 transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={getStoreLogoPath(selectedStoreKey)}
                                alt={formatStoreName(selectedStoreKey)}
                                className="h-5 w-auto object-contain flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                              {(() => {
                                const { address } = parseStoreKey(selectedStoreKey);
                                return address ? (
                                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                                    {extractStreetFromAddress(address)}
                                  </span>
                                ) : null;
                              })()}
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" strokeWidth={3} />
                            </div>
                            <div className="flex items-center gap-2 ml-auto pl-2 flex-shrink-0">
                              {storeSubtotals[selectedStoreKey]?.itemCount != null && (
                                <span className="text-xs text-muted-foreground">
                                  {storeSubtotals[selectedStoreKey].itemCount} items
                                </span>
                              )}
                              {currentSubtotal > 0 && (
                                <span className={cn(
                                  "text-base font-bold tabular-nums",
                                  selectedStoreKey === lowestStore && !isSearching
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-slate-900 dark:text-white",
                                )}>
                                  ${currentSubtotal.toFixed(2)}
                                </span>
                              )}
                              {selectedStoreKey === lowestStore && !isSearching && currentSubtotal > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 h-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-semibold">
                                  Best
                                </Badge>
                              )}
                            </div>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-[400px] z-[120] p-1">
                          {storeNamesToDisplay.map((storeKey) => {
                            const data = storeSubtotals[storeKey];
                            const hasStoreData = data && data.total > 0;
                            const isSelected = selectedStoreKey === storeKey;
                            const { address } = parseStoreKey(storeKey);
                            return (
                              <DropdownMenuItem
                                key={storeKey}
                                onClick={() => setSelectedStore(storeKey)}
                                className={cn(
                                  "flex items-center justify-between gap-3 py-2.5 px-3 rounded-md cursor-pointer",
                                  isSelected && "bg-green-50 dark:bg-green-900/20",
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={getStoreLogoPath(storeKey)}
                                    alt={formatStoreName(storeKey)}
                                    className="h-5 w-auto object-contain max-w-[80px] flex-shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                  {address && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      {extractStreetFromAddress(address)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {hasStoreData && (
                                    <span className="text-xs text-muted-foreground">
                                      {data.itemCount} items
                                    </span>
                                  )}
                                  {hasStoreData ? (
                                    <span className={cn(
                                      "text-sm font-bold tabular-nums",
                                      storeKey === lowestStore && !isSearching
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-slate-800 dark:text-white",
                                    )}>
                                      ${data.total.toFixed(2)}
                                    </span>
                                  ) : isSearching ? (
                                    <span className="text-xs text-green-600 dark:text-green-400 animate-pulse">
                                      Searching...
                                    </span>
                                  ) : (
                                    <span className="text-sm text-slate-400">—</span>
                                  )}
                                  {storeKey === lowestStore && !isSearching && hasStoreData && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[9px] px-1.5 py-0 h-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-semibold">
                                      Best
                                    </Badge>
                                  )}
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  )}
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      /* Normal: multi-store tab selector */
                      <div
                        className={cn(
                          "flex gap-2",
                          storeNamesToDisplay.length <= 4
                            ? "justify-between"
                            : "overflow-x-auto pb-1 scrollbar-hide",
                        )}>
                        {storeNamesToDisplay.map((storeKey) => {
                          const data = storeSubtotals[storeKey];
                          const hasStoreData = data && data.total > 0;
                          return (
                            <StoreTab
                              key={storeKey}
                              storeKey={storeKey}
                              subtotal={hasStoreData ? data.total : undefined}
                              itemCount={
                                hasStoreData ? data.itemCount : undefined
                              }
                              isSelected={selectedStoreKey === storeKey}
                              isLowest={storeKey === lowestStore}
                              isSearching={isSearching && !hasStoreData}
                              searchComplete={!isSearching}
                              onClick={() => setSelectedStore(storeKey)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Group tabs and sort controls - sticky below store selector */}
                <div className="px-4 py-1.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 sticky bg-white dark:bg-slate-800 z-10" style={{ top: storeNamesToDisplay.length > 0 ? (isFullscreen ? '38px' : '72px') : '0px' }}>
                  <div className="flex items-center justify-between gap-2">
                    {/* Group tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 flex-1">
                      <button
                        onClick={() => setGroupBy("all")}
                        className={cn(
                          "flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all",
                          groupBy === "all"
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                        )}>
                        All
                      </button>
                      <button
                        onClick={() => setGroupBy("category")}
                        className={cn(
                          "flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all",
                          groupBy === "category"
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                        )}>
                        Category
                      </button>
                      <button
                        onClick={() => setGroupBy("meal")}
                        className={cn(
                          "flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all",
                          groupBy === "meal"
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                        )}>
                        Meal
                      </button>
                    </div>

                    {/* Sort dropdown - only show when price data exists */}
                    {hasAnyResults && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              'relative h-8 w-8 flex items-center justify-center rounded-lg transition-all flex-shrink-0',
                              sortBy !== 'default'
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                            )}
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 z-[120]">
                          <DropdownMenuItem onClick={() => setSortBy('default')} className="flex items-center justify-between">
                            Default order
                            {sortBy === 'default' && <Check className="h-3.5 w-3.5 text-green-600" />}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSortBy('name-asc')} className="flex items-center justify-between">
                            Name A &rarr; Z
                            {sortBy === 'name-asc' && <Check className="h-3.5 w-3.5 text-green-600" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy('name-desc')} className="flex items-center justify-between">
                            Name Z &rarr; A
                            {sortBy === 'name-desc' && <Check className="h-3.5 w-3.5 text-green-600" />}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSortBy('price-asc')} className="flex items-center justify-between">
                            Price low &rarr; high
                            {sortBy === 'price-asc' && <Check className="h-3.5 w-3.5 text-green-600" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy('price-desc')} className="flex items-center justify-between">
                            Price high &rarr; low
                            {sortBy === 'price-desc' && <Check className="h-3.5 w-3.5 text-green-600" />}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Items list - scrollable area only */}
                {/* Uses deferredStoreKey so tab highlights update instantly while items re-render in background */}
                <div className={cn(
                  "flex-1 overflow-y-auto scrollbar-hide px-4 py-2 transition-opacity duration-150",
                  isStoreTransitioning && "opacity-80",
                )}>
                  {Object.entries(groupedItems).map(([groupName, items]) => (
                    <div key={groupName} className="mb-4 last:mb-0">
                      {groupBy !== "all" && (
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">
                          {groupName}
                        </h4>
                      )}
                      <div className="space-y-2">
                        {items.map((item, idx) => {
                          // If we have a selected store (either from results or searching)
                          // Use deferredStoreKey for items so tab switching stays responsive
                          if (deferredStoreKey) {
                            const itemResults = results[item.name]
                              ? results[item.name][deferredStoreKey]
                              : undefined;
                            const itemSelection = selections[item.name]
                              ? selections[item.name][deferredStoreKey]
                              : undefined;
                            const hasItemResults =
                              Array.isArray(itemResults) &&
                              itemResults.length > 0;

                            // Show skeleton while searching and no results yet for this item
                            if (isSearching && !hasItemResults) {
                              return (
                                <SkeletonItemRow
                                  key={`${item.name}-${idx}`}
                                  item={item}
                                />
                              );
                            }

                            // Show ItemCard when we have results
                            if (hasAnyResults) {
                              const comparison = priceComparisonMap[item.name];
                              return (
                                <ItemCard
                                  key={`${item.name}-${idx}`}
                                  item={item}
                                  storeKey={deferredStoreKey}
                                  results={itemResults}
                                  selection={itemSelection}
                                  onSelectProduct={onSelectProduct}
                                  onDelete={() => handleDeleteItem(item.name)}
                                  onQuantityChange={handleQuantityChange}
                                  isLoading={isSearching}
                                  hasAnyResults={hasAnyResults}
                                  isLowestPrice={
                                    comparison?.lowestPriceStores?.includes(
                                      deferredStoreKey,
                                    ) ?? false
                                  }
                                  isBestValue={
                                    comparison?.bestValueStores?.includes(
                                      deferredStoreKey,
                                    ) ?? false
                                  }
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
                              onSaveEdit={(newName) =>
                                handleRenameItem(item.name, newName)
                              }
                              onDelete={() => handleDeleteItem(item.name)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Footer - subtotal with actions, or initial check prices buttons - hidden in fullscreen */}
                <div className={cn("px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex-shrink-0", isFullscreen && "hidden")}>
                  {selectedStoreKey && currentSubtotal > 0 ? (
                    /* Show subtotal with action buttons when we have results */
                    <div className="flex flex-col gap-2">
                      {/* Row 1: Store logo, pricing toggle, and subtotal */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={getStoreLogoPath(selectedStoreKey)}
                            alt={formatStoreName(selectedStoreKey)}
                            className="h-5 w-auto max-w-[76px] object-contain flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                          {/* Pricing mode toggle: Store vs Per-Each */}
                          <div
                            className="relative flex bg-slate-200/80 dark:bg-slate-700 rounded-full p-0.5 cursor-pointer select-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = pricingMode === "store" ? "/ea" : "store";
                              setPricingMode(next);
                              if (next === "/ea") {
                                setHelpGlow(false);
                                requestAnimationFrame(() => setHelpGlow(true));
                              }
                            }}
                            title="Toggle between store prices and estimated per-each prices">
                            <div
                              className={cn(
                                "absolute top-0.5 bottom-0.5 rounded-full bg-white dark:bg-slate-500 shadow-sm transition-all duration-200 ease-out",
                                pricingMode === "store"
                                  ? "left-0.5 w-[calc(55%-2px)]"
                                  : "left-[55%] w-[calc(45%-2px)]",
                              )}
                            />
                            <span
                              className={cn(
                                "relative z-10 text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-200",
                                pricingMode === "store"
                                  ? "text-slate-800 dark:text-white"
                                  : "text-slate-400 dark:text-slate-400",
                              )}>
                              Shelf Price{'\u00A0'}
                            </span>
                            <span
                              className={cn(
                                "relative z-10 text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-200",
                                pricingMode === "/ea"
                                  ? "text-slate-800 dark:text-white"
                                  : "text-slate-400 dark:text-slate-400",
                              )}>
                              Unit Price
                            </span>
                          </div>
                          <TooltipProvider delayDuration={200}>
                            <Tooltip open={helpTooltipOpen} onOpenChange={setHelpTooltipOpen}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHelpTooltipOpen((v) => !v);
                                  }}
                                  onTouchStart={(e) => {
                                    e.stopPropagation();
                                    setHelpTooltipOpen((v) => !v);
                                  }}
                                  className={cn(
                                    "p-2.5 -m-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors",
                                    helpGlow && "animate-help-glow",
                                  )}
                                  onAnimationEnd={() => setHelpGlow(false)}
                                >
                                  <HelpCircle className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[280px] text-center text-sm sm:text-xs">
                                <p><strong>Shelf Price</strong> shows the price on the label (with per 100g shown where available). <strong>Unit Price</strong> uses the per 100g price for meat and estimates the price per item for produce based on weight. The total updates to reflect this.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {/* Fixed-height price display — always reserves space for subtitle */}
                        <div className="text-right h-10 flex flex-col justify-center">
                          <span className="text-lg font-bold text-slate-900 dark:text-white leading-tight tabular-nums">
                            {formatPriceStrict(currentSubtotal) ||
                              `$${currentSubtotal.toFixed(2)}`}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] leading-tight transition-opacity duration-200",
                              pricingMode === "/ea"
                                ? "text-green-600 dark:text-green-400 opacity-100"
                                : "opacity-0",
                            )}>
                            unit pricing
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Action buttons - all on same row, clickable to collapse on mobile only */}
                      <div
                        className="flex items-center justify-end gap-2 pt-1 xl:cursor-default cursor-pointer"
                        onClick={(_e) => {
                          // Only allow collapse on mobile
                          if (window.innerWidth < 1280) {
                            setDrawerState("peek");
                          }
                        }}>
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectStores();
                                }}
                                className="border-slate-300 dark:border-slate-600"
                              >
                                <Store className="h-4 w-4 mr-1.5" />
                                Stores
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Select Stores</p></TooltipContent>
                          </Tooltip>

                          {selectedStoreIsPcx && !isSearching && list && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-300 dark:border-slate-600"
                                    disabled={selectedStoreOnlineOrdering === false}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBuildCartOpen(true);
                                    }}
                                  >
                                    <MdShoppingCartCheckout className="h-4 w-4 mr-1.5" />
                                    Order
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{selectedStoreOnlineOrdering === false ? 'Online ordering unavailable at this location' : `Order on ${formatStoreName(selectedStoreKey || '')}`}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {instacartEnabled && !isSearching && list && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-300 dark:border-slate-600"
                                  disabled={instacartLoading}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!list) return;
                                    setInstacartLoading(true);
                                    getInstacartLink(list.id, selectedStoreKey || undefined)
                                      .then(({ url }) => window.open(url, "_blank"))
                                      .catch((_err) => {
                                        console.error("Instacart link error:");
                                        toast({
                                          title: "Could not create Instacart link",
                                          variant: "destructive",
                                        });
                                      })
                                      .finally(() => setInstacartLoading(false));
                                  }}>
                                  {instacartLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <img src="/assets/store_logos/Instacart_Carrot.svg" alt="Instacart" className="h-4 w-4 sm:hidden" />
                                      <img src="/assets/store_logos/Instacart_Logo_Kale.svg" alt="Instacart" className="hidden sm:block h-4" />
                                    </>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Order on Instacart</p></TooltipContent>
                            </Tooltip>
                          )}

                          {hasAnyResults && selectedStoreKey && !isSearching && (
                            <DropdownMenu onOpenChange={handleShareDropdownOpen}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                  className="border-slate-300 dark:border-slate-600">
                                  <Share2 className="h-4 w-4 mr-1.5" />
                                  Share
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 z-[120]">
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <div
                                    className="flex items-center w-full"
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      handleCopyLink();
                                    }}>
                                    <Link className="h-4 w-4 mr-2" />
                                    Copy Link
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleShareEmail}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleShareWhatsApp}>
                                  <svg
                                    className="h-4 w-4 mr-2"
                                    viewBox="0 0 24 24"
                                    fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                  </svg>
                                  WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleShareMessenger}>
                                  <svg
                                    className="h-4 w-4 mr-2"
                                    viewBox="0 0 24 24"
                                    fill="currentColor">
                                    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z" />
                                  </svg>
                                  Messenger
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleShareTwitter}>
                                  <svg
                                    className="h-4 w-4 mr-2"
                                    viewBox="0 0 24 24"
                                    fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                  </svg>
                                  X / Twitter
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handlePrint}>
                                  <Printer className="h-4 w-4 mr-2" />
                                  Print
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={handleDownloadPdf}
                                  disabled={isPdfGenerating}>
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

                          <Tooltip>
                            <TooltipTrigger asChild>
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
                                    Update
                                  </>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Update prices</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ) : !hasAnyResults && !isSearching ? (
                    /* Show select stores and check prices buttons - initial state */
                    <div
                      className="flex items-center justify-end gap-2 xl:cursor-default cursor-pointer"
                      onClick={(_e) => {
                        // Only allow collapse on mobile
                        if (window.innerWidth < 1280) {
                          setDrawerState("peek");
                        }
                      }}>
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectStores();
                              }}
                              className="border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500">
                              <Store className="h-4 w-4 mr-2" />
                              Stores
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Select Stores</p></TooltipContent>
                        </Tooltip>

                        {instacartEnabled && list && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                className="border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
                                disabled={instacartLoading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!list) return;
                                  setInstacartLoading(true);
                                  getInstacartLink(list.id, selectedStoreKey || undefined)
                                    .then(({ url }) => window.open(url, "_blank"))
                                    .catch((_err) => {
                                      console.error("Instacart link error:");
                                      toast({
                                        title: "Could not create Instacart link",
                                        variant: "destructive",
                                      });
                                    })
                                    .finally(() => setInstacartLoading(false));
                                }}>
                                {instacartLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <img src="/assets/store_logos/Instacart_Carrot.svg" alt="Instacart" className="h-4 w-4 sm:hidden" />
                                    <img src="/assets/store_logos/Instacart_Logo_Kale.svg" alt="Instacart" className="hidden sm:block h-4" />
                                  </>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Order on Instacart</p></TooltipContent>
                          </Tooltip>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCheckPrices();
                              }}
                              disabled={isCheckingPrices || itemCount === 0}
                              className="bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md transition-all">
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
                          </TooltipTrigger>
                          <TooltipContent><p>Check Prices</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : isSearching ? (
                    /* Show searching indicator */
                    <div
                      className="flex items-center justify-center xl:cursor-default cursor-pointer"
                      onClick={(_e) => {
                        // Only allow collapse on mobile
                        if (window.innerWidth < 1280) {
                          setDrawerState("peek");
                        }
                      }}>
                      <Loader2 className="h-4 w-4 animate-spin text-green-500 mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Searching for prices...
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  const buildCartModal = list && selectedStoreKey && priceData?.session_id ? (
    <BuildCartModal
      open={buildCartOpen}
      onClose={() => setBuildCartOpen(false)}
      groceryListId={list.id}
      sessionId={priceData.session_id}
      storeKey={selectedStoreKey}
      storeName={formatStoreName(selectedStoreKey)}
      itemQuantities={Object.fromEntries(
        list.items.map(item => [item.name.toLowerCase(), item.priceQty ?? 1])
      )}
    />
  ) : null;

  // Return with conditional portal for fullscreen
  if (isFullscreen) {
    return (
      <>
        {copyLinkDialog}
        {buildCartModal}
        {createPortal(drawerContent, document.body)}
      </>
    );
  }

  return (
    <>
      {copyLinkDialog}
      {buildCartModal}
      {drawerContent}
    </>
  );
}

export default ListDrawer;
