import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Store, ChevronDown, XCircle } from 'lucide-react';
import { SearchResultInDB, GroceryProduct } from '@/services/shoppingService';
import SkeletonBar from '@/components/SkeletonBar';
import {
  getProductImage,
  truncateName,
  formatPriceStrict,
  getProductTooltipFields,
  formatStoreName,
  isEqual,
} from '@/lib/storeUtils';

// Type alias for SearchResultInDB with image support
export type GroceryProductWithImage = SearchResultInDB;


export interface ProductDropdownProps {
  itemName: string;
  store: string;
  itemResults: SearchResultInDB[] | undefined;
  selection: SearchResultInDB | undefined;
  onSelectProduct: (itemName: string, product: GroceryProduct | SearchResultInDB, store: string) => void;
  isLoading: boolean;
  hasAnyResults: boolean; // Whether results object has any keys (to distinguish "no search yet" from "no results")
  compact?: boolean; // If true, render just a small chevron button (item details shown on parent card)
}

const ProductDropdownComponent: React.FC<ProductDropdownProps> = ({
  itemName,
  store,
  itemResults,
  selection,
  onSelectProduct,
  isLoading,
  hasAnyResults,
  compact = false,
}) => {
  const hasResults = itemResults && Array.isArray(itemResults) && itemResults.length > 0;
  const filteredResults = hasResults
    ? (itemResults as SearchResultInDB[]).filter((p: SearchResultInDB) => p.store === store)
    : [];

  // If we have results for this item/store, show the dropdown
  if (hasResults) {
    // Compact mode: just a small chevron button (parent shows item details)
    if (compact) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
            >
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[280px] w-[320px] max-h-[450px] overflow-y-auto"
            sideOffset={5}
            avoidCollisions
            side="top"
          >
            <div className="p-2 pt-3 pb-2 border-b border-border bg-background sticky top-0 z-10 text-xs shadow-sm">
              <div className="font-bold flex items-center gap-1">
                <Store className="h-3 w-3" /> {formatStoreName(store)}
              </div>
              <div className="text-sm mt-1 font-medium">{itemName}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {filteredResults.length} option{filteredResults.length !== 1 ? 's' : ''} available
              </div>
            </div>

            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                const nothingProduct: GroceryProduct = {
                  brand: "",
                  name: "Nothing",
                  price: "$0.00",
                  store: store,
                };
                onSelectProduct(itemName, nothingProduct, store);
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

            {filteredResults.map((product: GroceryProductWithImage, idx: number) => (
              <DropdownMenuItem
                key={product.id || idx}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onSelectProduct(itemName, product, store);
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
        </DropdownMenu>
      );
    }

    // Full mode: button with product details (legacy behavior)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`w-full justify-between text-sm h-8 sm:h-9 ${
              selection ? (
                selection.name === "Nothing" ?
                'border-gray-300 text-muted-foreground' :
                'border-green-500 bg-green-50'
              ) : ''
            }`}
          >
            {selection ? (
              selection.name === "Nothing" ? (
                <div className="flex items-center w-full min-w-0">
                  <span className="truncate mr-2">Nothing</span>
                  <span className="ml-auto font-medium text-muted-foreground text-right tabular-nums">$0.00</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </div>
              ) : (
                <>
                  <img
                    src={getProductImage(selection.imageUrl)}
                    alt={truncateName(selection.name)}
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded border bg-white flex-shrink-0 mr-1 sm:mr-2"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { (e.target as HTMLImageElement).src = '/assets/store-placeholder.png'; }}
                  />
                  <div className="flex items-center w-full min-w-0">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate mr-2">
                            {(() => { const sel = selection as GroceryProductWithImage; const f = getProductTooltipFields(sel); return f.brand ? `${f.brand} ${truncateName(sel.name)}` : truncateName(sel.name); })()}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start">
                          {(() => { const f = getProductTooltipFields(selection as GroceryProductWithImage); return (
                            <div className="text-white">
                              {f.brand && <div className="font-semibold">{f.brand}</div>}
                              {f.name && <div className="text-sm">{f.name}</div>}
                              {f.size && <div className="text-xs opacity-90 mt-0.5">{f.size}</div>}
                            </div>
                          ); })()}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {formatPriceStrict(selection.price) && (
                      <span className="ml-auto font-medium text-right tabular-nums">{formatPriceStrict(selection.price) as string}</span>
                    )}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </div>
                </>
              )
            ) : (
              <>
                <Store className="h-4 w-4 mr-2" />
                <div className="flex items-center w-full min-w-0">
                  <span className="truncate">Select Product</span>
                  <ChevronDown className="h-3 w-3 ml-auto" />
                </div>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[280px] w-[--radix-dropdown-menu-trigger-width] max-h-[450px] overflow-y-auto before:content-[''] before:block before:h-2 before:w-full before:bg-background before:sticky before:top-0 before:z-10"
          sideOffset={5}
          avoidCollisions
          side="top"
        >
          <div className="p-2 pt-3 pb-2 border-b border-border bg-background sticky top-0 z-10 text-xs shadow-sm">
            <div className="font-bold flex items-center gap-1">
              <Store className="h-3 w-3" /> {formatStoreName(store)}
            </div>
            <div className="text-sm mt-1">{itemName}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Found {filteredResults.length} products
            </div>
          </div>

          <DropdownMenuItem
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              const nothingProduct: GroceryProduct = {
                brand: "",
                name: "Nothing",
                price: "$0.00",
                store: store,
              };
              onSelectProduct(itemName, nothingProduct, store);
            }}
            className="flex flex-col items-start py-2 hover:bg-muted focus:bg-muted border-b border-border"
          >
            <div className="flex items-center w-full">
              <span className="font-medium text-sm">Nothing</span>
              <span className="ml-auto font-semibold text-muted-foreground text-right tabular-nums">$0.00</span>
            </div>
            <span className="text-xs text-muted-foreground mt-0.5">
              Skip this item (will not be included in subtotal)
            </span>
          </DropdownMenuItem>

          {filteredResults.map((product: GroceryProductWithImage, idx: number) => (
            <DropdownMenuItem
              key={product.id || idx}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onSelectProduct(itemName, product, store);
              }}
              className="flex flex-row items-center gap-3 py-2 hover:bg-muted focus:bg-muted"
            >
              <img
                src={getProductImage(product.imageUrl)}
                alt={truncateName(product.name)}
                className="w-14 h-14 object-contain rounded border bg-white flex-shrink-0"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { (e.target as HTMLImageElement).src = '/assets/store-placeholder.png'; }}
              />
              <div className="flex flex-col min-w-0 w-full">
                <div className="flex items-center w-full">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium text-sm truncate">
                          {(() => { const f = getProductTooltipFields(product); return f.brand || ''; })()}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="start">
                        {(() => { const f = getProductTooltipFields(product); return (
                          <div className="text-white">
                            {f.brand && <div className="font-semibold">{f.brand}</div>}
                            {f.name && <div className="text-sm">{f.name}</div>}
                            {f.size && <div className="text-xs opacity-90 mt-0.5">{f.size}</div>}
                          </div>
                        ); })()}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {formatPriceStrict(product.price) && (
                    <span className="ml-auto font-semibold text-primary text-right tabular-nums">{formatPriceStrict(product.price) as string}</span>
                  )}
                </div>
                {product.name && (
                  (() => { const f = getProductTooltipFields(product); return f.brand ? (
                    <span className="text-sm mt-0.5 truncate">{truncateName(product.name)}</span>
                  ) : (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm mt-0.5 truncate">{truncateName(product.name)}</span>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="start">
                          <div className="text-white">
                            {f.name && <div className="text-sm">{f.name}</div>}
                            {f.size && <div className="text-xs opacity-90 mt-0.5">{f.size}</div>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ); })()
                )}
                {product.size && (
                  <span className="text-xs text-muted-foreground mt-0.5">{product.size}</span>
                )}
                <div className="flex justify-between w-full text-xs mt-1">
                  {(() => {
                    const anyProduct = product as any;
                    const promoText: string | undefined = typeof anyProduct?.multiBuyText === 'string' ? (anyProduct.multiBuyText as string) : undefined;
                    const isMultiBuy: boolean = !!anyProduct?.isMultiBuy;
                    const makeDisplay = (text: string) => {
                      const truncated = text.length > 80 ? text.slice(0, 80) + '...' : text;
                      return (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded cursor-default">
                                {truncated}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start">
                              <div className="text-white">{text}</div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    };

                    if (product.pricePerUnit) {
                      const base = String(product.pricePerUnit).trim();
                      if (promoText && promoText.length > 0) {
                        return makeDisplay(`${base} · ${promoText}`);
                      }
                      if (!promoText && isMultiBuy) {
                        return makeDisplay(`${base} · multi-buy promo price`);
                      }
                      return (
                        <span className="text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{base}</span>
                      );
                    }

                    if (!product.pricePerUnit && promoText && promoText.length > 0) {
                      return makeDisplay(promoText);
                    }

                    return null;
                  })()}
                </div>
              </div>
            </DropdownMenuItem>
          ))}

          {filteredResults.length === 0 && (
            <div className="p-4 text-center">
              <XCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No products found for this item at {formatStoreName(store)}.</p>
              <p className="text-xs text-muted-foreground mt-1">Try searching with a different item name.</p>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // While searching, show a skeleton shimmer
  if (isLoading) {
    return (
      <div className="w-full">
        <SkeletonBar heightClass="h-9" seed={`${itemName}-${store}`} />
      </div>
    );
  }

  // No results and not loading - show appropriate message
  return (
    <div className="w-full p-2 text-center text-muted-foreground text-sm border rounded h-9 flex items-center justify-center">
      {!hasAnyResults ? 'Click "Check Prices" to search for products' : 'No matches found'}
    </div>
  );
};

// Memoized version with custom comparison
export const ProductDropdown = memo(ProductDropdownComponent, (prevProps, nextProps) => {
  // Only re-render if THIS dropdown's data has changed
  return (
    prevProps.itemName === nextProps.itemName &&
    prevProps.store === nextProps.store &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.hasAnyResults === nextProps.hasAnyResults &&
    prevProps.compact === nextProps.compact &&
    isEqual(prevProps.itemResults, nextProps.itemResults) &&
    isEqual(prevProps.selection, nextProps.selection)
  );
});

export default ProductDropdown;
