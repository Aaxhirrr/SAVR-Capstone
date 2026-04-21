import { Store } from '@/components/StoreSelectionModal';
// import { UserSelectedStore } from '@/services/storeService';
import { getStoreLogo } from '@/utils/storeBrandAssets';
import { Card } from '@/components/ui/card';
import { Check, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface StoreCardProps {
  store: Store;
  isSelected: boolean;
  onSelect: () => void;
  highlight?: boolean;
  isMaxReached?: boolean;
}

export function StoreCard({ store, isSelected, onSelect, highlight, isMaxReached }: StoreCardProps) {
  const logo = getStoreLogo(store.brand || store.name);
  const isDisabled = !isSelected && isMaxReached;

  const cardContent = (
    <Card
      className={cn(
        "p-3 transition-all border-2",
        isSelected ? "border-primary bg-primary/5 cursor-pointer hover:shadow-md" :
          isDisabled ? "border-transparent cursor-not-allowed opacity-60" : "border-transparent hover:border-border cursor-pointer hover:shadow-md",
        highlight && "animate-store-highlight ring-2 ring-primary/30"
      )}
      onClick={isDisabled ? undefined : onSelect}
    >
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-16 h-11 flex-shrink-0 bg-white rounded-full border shadow-sm flex items-center justify-center p-1.5">
          <img src={logo} alt={store.name} className="w-full h-full object-contain" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{store.name}</h4>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate">{store.address}</span>
          </div>
          <div className="text-xs font-medium text-primary mt-1">
            {store.distance < 1
              ? `${(store.distance * 1000).toFixed(0)}m away`
              : `${store.distance.toFixed(1)}km away`
            }
          </div>
        </div>

        {/* Selection Indicator */}
        <div className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
          isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
        )}>
          {isSelected && <Check className="w-4 h-4" />}
        </div>
      </div>
    </Card>
  );

  if (isDisabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {cardContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-primary text-primary-foreground">
          Max 3 stores. Uncheck one to add this store.
        </TooltipContent>
      </Tooltip>
    );
  }

  return cardContent;
}
