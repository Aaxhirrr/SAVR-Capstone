import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Printer, Share2, Download, Store, ArrowUpDown, Loader2 } from 'lucide-react';
import { formatStoreName as fmtStoreName, getStoreLogoPath as logoPath } from '@/lib/stores';
import { SavedGroceryList, GroceryItem } from '@/services/groceryListService';
import { SearchResultInDB, parseStoreKey } from '@/services/shoppingService';
import { useToast } from '@/components/ui/use-toast';
import shareService from '@/services/shareService';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog as UIDialog, DialogContent as UIDialogContent, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';

interface StoreShoppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: SavedGroceryList | null;
  storeName: string | null;
  selectionsByItem: Record<string, Record<string, SearchResultInDB>> | undefined;
  sortConfig: any;
  onSortChange?: (next: any) => void;
}

const formatStoreName = fmtStoreName;
const getStoreLogoPath = logoPath;

// Extract just the street address (first part before city/province/postal)
const getStreetAddress = (fullAddress: string | undefined): string => {
  if (!fullAddress) return '';
  // Split by comma and take just the first part (street address)
  const parts = fullAddress.split(',');
  return parts[0]?.trim() || fullAddress;
};

type VirtualizedRow = { item: GroceryItem; selection: SearchResultInDB | undefined };
interface VirtualizedListProps {
  rows: VirtualizedRow[];
  dense: boolean;
  storeName: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

const VirtualizedList: React.FC<VirtualizedListProps> = ({ rows, dense, storeName, containerRef }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeight = dense ? 68 : 96;
  const [viewportHeight, setViewportHeight] = useState<number>(typeof window !== 'undefined' ? window.innerHeight : 600);

  useEffect(() => {
    const el = containerRef?.current;
    const onScroll = () => setScrollTop((el?.scrollTop) || 0);
    const onResize = () => setViewportHeight((el?.clientHeight) || window.innerHeight);
    if (el) {
      el.addEventListener('scroll', onScroll, { passive: true });
      setViewportHeight(el.clientHeight);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
      setViewportHeight(window.innerHeight);
    }
    return () => {
      if (el) el.removeEventListener('scroll', onScroll as any);
      else if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', onScroll as any);
        window.removeEventListener('resize', onResize as any);
      }
    };
  }, [containerRef]);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 3);
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + 6;
  const endIndex = Math.min(rows.length, startIndex + visibleCount);
  const visible = rows.slice(startIndex, endIndex);
  const topOffset = startIndex * itemHeight;
  const totalHeight = rows.length * itemHeight;

  return (
    <div style={{ height: totalHeight }} className="relative">
      <div style={{ transform: `translateY(${topOffset}px)` }} className="absolute inset-x-0">
        <div className="space-y-3">
          {visible.map(({ item, selection }) => (
            <Card key={item.id || `${item.name}-${storeName}`} className={`shadow-sm ${dense ? 'py-1' : ''}`}>
              <CardContent className={dense ? 'py-2' : 'py-3'}>
                <div className="flex items-center gap-3">
                  {selection?.imageUrl ? (
                    <img
                      src={selection.imageUrl}
                      alt={selection.name}
                      className="w-14 h-14 object-contain rounded border bg-white flex-shrink-0"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/store-placeholder.png'; }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={`font-medium ${item.checked ? 'line-through text-gray-400' : ''} truncate sm:whitespace-normal sm:break-words`}>{item.name}</div>
                    <div className="text-xs text-muted-foreground truncate sm:whitespace-normal sm:break-words">
                      {selection?.brand && <>{selection.brand} · </>}
                      {selection?.size}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      {item.category && <Badge variant="outline" className="max-w-[40vw] truncate">{item.category}</Badge>}
                      {item.meal && <Badge variant="secondary" className="max-w-[40vw] truncate">{item.meal}</Badge>}
                      <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-semibold">{selection?.price || '$0.00'}</div>
                    {selection?.pricePerUnit && (
                      <div className="text-xs text-muted-foreground">{selection.pricePerUnit}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const StoreShoppingModal: React.FC<StoreShoppingModalProps> = ({
  isOpen,
  onClose,
  list,
  storeName,
  selectionsByItem,
  sortConfig,
  onSortChange,
}) => {
  const [hideNothing, _setHideNothing] = useState(true);
  const [hideChecked, _setHideChecked] = useState(false);
  const [onlySelections, _setOnlySelections] = useState(true);
  const [, setGroupByCategory] = useState(true);
  const [groupMode, setGroupMode] = useState<'category' | 'meal' | 'none'>('category');
  const [dense, _setDense] = useState(false);
  // Silence unused prop warning until parent wiring is added
  void onSortChange;
  // Sorting controls
  const [localSort, setLocalSort] = useState<{ key: 'name' | 'price'; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });
  useEffect(() => {
    // initialize from parent sort if provided
    if (sortConfig && sortConfig.type === 'field' && (sortConfig.key === 'name')) {
      setLocalSort({ key: 'name', dir: sortConfig.direction });
    }
  }, []);
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  // no-op touch trackers (kept for potential future gestures)
  const [/*touchStartY*/, /*setTouchStartY*/] = useState<number | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const shareInputRef = useRef<HTMLInputElement | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [showCloseHighlight, setShowCloseHighlight] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      _setHideNothing(true);
      _setHideChecked(false);
      _setOnlySelections(true);
      setShareUrl(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setShowCloseHighlight(true);
      const t = setTimeout(() => setShowCloseHighlight(false), 1200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const itemsForStore: Array<{ item: GroceryItem; selection: SearchResultInDB | undefined }>= useMemo(() => {
    if (!list || !storeName) return [] as any;
    return (list.items || []).map(item => {
      const byStore = selectionsByItem?.[item.name];
      const sel = byStore ? byStore[storeName] : undefined;
      return { item, selection: sel };
    }).filter(({ item, selection }) => {
      if (hideChecked && item.checked) return false;
      if (onlySelections && !selection) return false;
      if (hideNothing && selection && selection.name === 'Nothing') return false;
      return true;
    }).sort((a, b) => {
      if (localSort.key === 'name') {
        const an = (a.item.name || '').toString();
        const bn = (b.item.name || '').toString();
        return localSort.dir === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an);
      }
      // price sort
      const ap = (a.selection?.price && parseFloat(String(a.selection.price).replace(/[$£€]/g, ''))) || Infinity;
      const bp = (b.selection?.price && parseFloat(String(b.selection.price).replace(/[$£€]/g, ''))) || Infinity;
      return localSort.dir === 'asc' ? ap - bp : bp - ap;
    });
  }, [list, storeName, selectionsByItem, hideNothing, hideChecked, onlySelections, localSort]);

  const subtotal = useMemo(() => {
    return itemsForStore.reduce((sum, { selection }) => {
      if (!selection) return sum;
      if (selection.name === 'Nothing') return sum;
      const priceStr = (selection.price as any) || '0';
      let value = 0;
      try {
        if (typeof priceStr === 'string') {
          const numericPart = priceStr.replace(/[$£€]/g, '').trim();
          value = parseFloat(numericPart) || 0;
        } else if (typeof priceStr === 'number') {
          value = priceStr;
        }
      } catch {
        value = 0;
      }
      return sum + value;
    }, 0);
  }, [itemsForStore]);

  const handlePrint = () => {
    try {
      setIsPrinting(true);
      document.body.classList.add('is-printing');
      // Allow React to render print-friendly content before opening dialog
      setTimeout(() => {
        window.print();
      }, 30);
    } catch (e) {
      console.error('Print failed', e);
      // Best-effort cleanup
      setIsPrinting(false);
      document.body.classList.remove('is-printing');
    }
  };

  useEffect(() => {
    const onAfterPrint = () => {
      setIsPrinting(false);
      document.body.classList.remove('is-printing');
    };
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  const handlePdf = async () => {
    try {
      if (!list || !list.id || !storeName) return;
      setIsPdfGenerating(true);
      toast({ title: 'Generating PDF…' });
      await shareService.downloadStorePdf(list.id, storeName);
      toast({ title: 'PDF downloaded' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Download failed', description: e?.message || 'Unable to generate PDF', variant: 'destructive' });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Parse the store_key to separate store name and address
  const { storeName: canonicalStoreName, address: storeAddress } = useMemo(() => {
    if (!storeName) return { storeName: '', address: undefined };
    return parseStoreKey(storeName);
  }, [storeName]);
  const title = canonicalStoreName ? formatStoreName(canonicalStoreName) : '';
  const displayAddress = getStreetAddress(storeAddress);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scrollTick, setScrollTick] = useState(0); void scrollTick;

  const handleCopyLink = async () => {
    const url = await ensureShareUrl();
    if (!url) return;
    const ok = syncCopy(url);
    if (ok) {
      toast({ title: 'Link copied' });
    } else {
      // Last resort: show dialog with the URL for manual copy
      setIsShareDialogOpen(true);
    }
  };

  // Synchronous copy helper (works best with direct user gesture in Chrome/Incognito)
  const syncCopy = (text: string): boolean => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch (e) {
      console.error('syncCopy failed', e);
      return false;
    }
  };

  // keep for possible future share flows; noop reference attached
  // removed unused copy helper

  const ensureShareUrl = async (): Promise<string | null> => {
    if (shareUrl) return shareUrl;
    if (!list?.id || !storeName) return null;
    try {
      const result = await shareService.createShareLink(list.id, storeName);
      setShareUrl(result.url);
      return result.url;
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Share failed', description: e?.message || 'Unable to create share link', variant: 'destructive' });
      return null;
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key.toLowerCase() === 'p') handlePrint();
      if (e.key.toLowerCase() === 'd' && list?.id && storeName) {
        shareService.downloadStorePdf(list.id, storeName).catch(() => {});
      }
      if (e.key.toLowerCase() === 's') {
        if (navigator.share && shareUrl) {
          navigator.share({ title: `${title} · ${list?.name}`, text: 'My grocery list', url: shareUrl }).catch(() => {});
        }
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, shareUrl, list?.id, storeName, title, onClose]);

  useEffect(() => {
    if (isShareDialogOpen && shareInputRef.current) {
      // Autofocus and select for immediate Ctrl+C
      const el = shareInputRef.current;
      el.focus();
      el.select();
    }
  }, [isShareDialogOpen]);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="print-container fixed inset-0 left-0 top-0 p-0 max-w-none w-screen h-screen overflow-hidden flex flex-col translate-x-0 translate-y-0 rounded-none duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex flex-col h-full overflow-hidden print-body">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-white z-10 print:hidden flex-shrink-0">
            {/* Row 1: identity */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {canonicalStoreName ? (
                  <img
                    src={getStoreLogoPath(canonicalStoreName)}
                    alt={`${title} logo`}
                    className="h-6 sm:h-7 md:h-8 w-auto object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Store className="h-5 w-5" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold truncate max-w-[55vw] sm:max-w-none">{title}</div>
                  <div className="text-xs text-muted-foreground whitespace-normal leading-snug line-clamp-2 sm:line-clamp-1 sm:truncate max-w-[65vw] sm:max-w-none">{displayAddress || list?.name}</div>
                </div>
              </div>
              {/* Actions - icon-only on <=768, labeled on desktop */}
              <div className="flex items-center gap-2">
                {/* ≤480: collapse to Actions menu */}
                <div className="block sm:hidden">
                  <DropdownMenu onOpenChange={(open) => { if (open) ensureShareUrl(); }}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[220px]">
                      <DropdownMenuItem onClick={handlePrint}>Print</DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePdf} disabled={isPdfGenerating}>{isPdfGenerating ? 'Generating…' : 'Download PDF'}</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyLink}>Copy Link</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { if (!shareUrl) return; window.location.href = `mailto:?subject=${encodeURIComponent(`Grocery list for ${title}`)}&body=${encodeURIComponent(shareUrl)}`; }}>Email</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { if (!shareUrl) return; window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener'); }}>WhatsApp</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { if (!shareUrl) return; const deepLink = `fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`; const webLink = `https://www.messenger.com/share?link=${encodeURIComponent(shareUrl)}`; try { window.location.href = deepLink; setTimeout(() => { window.open(webLink, '_blank', 'noopener'); }, 400); } catch { window.open(webLink, '_blank', 'noopener'); } }}>Messenger</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { if (!shareUrl) return; window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Grocery list for ${title}`)}`, '_blank', 'noopener'); }}>X / Twitter</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* 481–768: icon-only; ≥769: labeled */}
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="outline" size="sm" className="sm:px-2 md:px-3" onClick={handlePrint}>
                    <Printer className="h-4 w-4 sm:mr-0 md:mr-2" />
                    <span className="hidden md:inline">Print</span>
                  </Button>
                  <Button variant="outline" size="sm" className="sm:px-2 md:px-3" onClick={handlePdf} disabled={isPdfGenerating}>
                    {isPdfGenerating ? <Loader2 className="h-4 w-4 animate-spin sm:mr-0 md:mr-2" /> : <Download className="h-4 w-4 sm:mr-0 md:mr-2" />}
                    <span className="hidden md:inline">{isPdfGenerating ? 'Working…' : 'PDF'}</span>
                  </Button>
                  <DropdownMenu onOpenChange={(open) => { if (open) ensureShareUrl(); }}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="sm:px-2 md:px-3">
                        <Share2 className="h-4 w-4 sm:mr-0 md:mr-2" />
                        <span className="hidden md:inline">Share</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[220px]">
                      <DropdownMenuItem onClick={handleCopyLink}>Copy Link</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { if (!shareUrl) return; window.location.href = `mailto:?subject=${encodeURIComponent(`Grocery list for ${title}`)}&body=${encodeURIComponent(shareUrl)}`; }}>Email</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { if (!shareUrl) return; window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener'); }}>WhatsApp</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { if (!shareUrl) return; const deepLink = `fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`; const webLink = `https://www.messenger.com/share?link=${encodeURIComponent(shareUrl)}`; try { window.location.href = deepLink; setTimeout(() => { window.open(webLink, '_blank', 'noopener'); }, 400); } catch { window.open(webLink, '_blank', 'noopener'); } }}>Messenger</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { if (!shareUrl) return; window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Grocery list for ${title}`)}`, '_blank', 'noopener'); }}>X / Twitter</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className={`${showCloseHighlight ? 'ring-2 ring-primary/60 ring-offset-2 animate-pulse' : ''}`}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {/* Row 2: badges and subtotal (visible on tablet/desktop; optional on mobile) */}
            <div className="mt-2 hidden sm:flex items-center gap-2">
              <Badge variant="secondary">{itemsForStore.length} items</Badge>
              <div className="ml-2 font-bold">${subtotal.toFixed(2)}</div>
            </div>
          </div>

          {/* Single toolbar: Group (segmented) + Sort headers */}
          <div className="px-4 py-2 border-b print:hidden flex-shrink-0">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {/* Segmented grouping control */}
              <div className="inline-flex rounded-md border overflow-hidden">
                <button
                  className={`px-3 py-1 ${groupMode === 'category' ? 'bg-muted' : 'bg-background'}`}
                  onClick={() => { setGroupMode('category'); setGroupByCategory(true); }}
                >
                  Category
                </button>
                <button
                  className={`px-3 py-1 border-l ${groupMode === 'meal' ? 'bg-muted' : 'bg-background'}`}
                  onClick={() => { setGroupMode('meal'); setGroupByCategory(true); }}
                >
                  Meal
                </button>
                <button
                  className={`px-3 py-1 border-l ${groupMode === 'none' ? 'bg-muted' : 'bg-background'}`}
                  onClick={() => { setGroupMode('none'); setGroupByCategory(false); }}
                >
                  All
                </button>
              </div>
              {/* Sort headers on the right */}
              <div className="ml-auto flex items-center gap-4 text-xs font-medium text-muted-foreground">
                <button
                  className="flex items-center gap-2"
                  onClick={() => setLocalSort(s => ({ key: 'name', dir: s.key === 'name' && s.dir === 'asc' ? 'desc' : 'asc' }))}
                  aria-label="Sort by product name"
                >
                  <span>Product Name</span>
                  <ArrowUpDown className={`h-3 w-3 ${localSort.key === 'name' ? 'text-primary' : 'opacity-40'}`} />
                </button>
                <button
                  className="flex items-center gap-2"
                  onClick={() => setLocalSort(s => ({ key: 'price', dir: s.key === 'price' && s.dir === 'asc' ? 'desc' : 'asc' }))}
                  aria-label="Sort by price"
                >
                  <span>Price</span>
                  <ArrowUpDown className={`h-3 w-3 ${localSort.key === 'price' ? 'text-primary' : 'opacity-40'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div
            className="flex-1 min-h-0 overflow-y-auto px-4 py-3 print:p-0 overscroll-contain touch-pan-y print-scroll"
            ref={contentRef}
            onScroll={() => setScrollTick(t => t + 1)}
            style={{ WebkitOverflowScrolling: 'touch' as any }}
          >
            {groupMode === 'none' && (
              <>
                {/* Screen-only virtualized list */}
                <div className="print:hidden">
                  <VirtualizedList rows={itemsForStore} dense={dense} storeName={storeName || ''} containerRef={contentRef} />
                </div>
                {/* Print-only full list (non-virtualized) */}
                <div className={`${isPrinting ? 'block' : 'hidden'} print:block space-y-3`}>
                  {itemsForStore.map(({ item, selection }) => (
                    <Card key={item.id || `${item.name}-${storeName}`} className={`shadow-sm print-item ${dense ? 'py-1' : ''}`}>
                      <CardContent className={dense ? 'py-2' : 'py-3'}>
                        <div className="flex items-center gap-3">
                          {selection?.imageUrl ? (
                            <img
                              src={selection.imageUrl}
                              alt={selection.name}
                              className="w-14 h-14 object-contain rounded border bg-white flex-shrink-0"
                              loading="lazy"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/store-placeholder.png'; }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className={`font-medium ${item.checked ? 'line-through text-gray-400' : ''} truncate sm:whitespace-normal sm:break-words`}>{item.name}</div>
                            <div className="text-xs text-muted-foreground truncate sm:whitespace-normal sm:break-words">
                              {selection?.brand && <>{selection.brand} · </>}
                              {selection?.size}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs">
                              {item.category && <Badge variant="outline" className="max-w-[40vw] truncate">{item.category}</Badge>}
                              {item.meal && <Badge variant="secondary" className="max-w-[40vw] truncate">{item.meal}</Badge>}
                              <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                            </div>
                          </div>
                          <div className="ml-auto text-right">
                            <div className="font-semibold">{selection?.price || '$0.00'}</div>
                            {selection?.pricePerUnit && (
                              <div className="text-xs text-muted-foreground">{selection.pricePerUnit}</div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
            {groupMode !== 'none' && (
              <div className="space-y-4">
                {(() => {
                  const groups = new Map<string, Array<{ item: GroceryItem; selection: SearchResultInDB | undefined }>>();
                  for (const row of itemsForStore) {
                    const key = groupMode === 'meal' ? (row.item.meal || 'Other') : (row.item.category || 'Other');
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key)!.push(row);
                  }
                  return Array.from(groups.entries()).map(([category, rows]) => (
                    <div key={category}>
                      <div className="bg-muted/50 px-2 py-1 rounded-sm mb-2 print-group-header">
                        <span className="text-xs font-semibold text-muted-foreground">{category}</span>
                      </div>
                      <div className="mt-2 space-y-3">
                        {rows.map(({ item, selection }) => (
                          <Card key={item.id || `${item.name}-${storeName}`} className={`shadow-sm print-item ${dense ? 'py-1' : ''}`}>
                            <CardContent className={dense ? 'py-2' : 'py-3'}>
                              <div className="flex items-center gap-3">
                                {selection?.imageUrl ? (
                                  <img
                                    src={selection.imageUrl}
                                    alt={selection.name}
                                    className="w-14 h-14 object-contain rounded border bg-white flex-shrink-0"
                                    loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/store-placeholder.png'; }}
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className={`font-medium ${item.checked ? 'line-through text-gray-400' : ''} truncate`}>{item.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {selection?.brand && <>{selection.brand} · </>}
                                    {selection?.size}
                                  </div>
                                  <div className="mt-1 flex items-center gap-2 text-xs">
                                    {item.meal && <Badge variant="secondary">{item.meal}</Badge>}
                                    <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                                  </div>
                                </div>
                                <div className="ml-auto text-right">
                                  <div className="font-semibold">{selection?.price || '$0.00'}</div>
                                  {selection?.pricePerUnit && (
                                    <div className="text-xs text-muted-foreground">{selection.pricePerUnit}</div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t bg-white print:hidden flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{itemsForStore.filter(x => !x.item.checked).length} remaining</div>
              <div className="font-bold">Subtotal: ${subtotal.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg">{title}</div>
              {displayAddress && <div className="text-sm text-muted-foreground">{displayAddress}</div>}
            </div>
            <div className="font-bold">${subtotal.toFixed(2)}</div>
          </div>
        </div>
        {/* Removed secondary print subtotal */}
      </DialogContent>
    </Dialog>

    {/* Share Link Dialog */}
    <UIDialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
      <UIDialogContent className="max-w-lg">
        <UIDialogHeader>
          <UIDialogTitle>Copy shareable link</UIDialogTitle>
        </UIDialogHeader>
        <div className="space-y-3">
          <input
            ref={shareInputRef}
            type="text"
            readOnly
            className="w-full rounded border px-3 py-2 text-sm"
            value={shareUrl || ''}
            onFocus={(e) => e.currentTarget.select()}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Close</Button>
            <Button onClick={() => {
              const link = shareUrl || '';
              const ok = syncCopy(link);
              if (ok) { toast({ title: 'Link copied' }); setIsShareDialogOpen(false); }
              else { try { prompt('Copy this link:', link); } catch {} }
            }}>Copy</Button>
          </div>
        </div>
      </UIDialogContent>
    </UIDialog>
    </>
  );
};

export default StoreShoppingModal;


