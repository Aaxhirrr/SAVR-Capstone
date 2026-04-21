import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StoreSelectorLayout } from './StoreSelectorLayout';
import { StoreSelectorProps } from './types';
import { UserSelectedStore } from '@/services/storeService';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';

export function StoreSelectorDialog({ isOpen, onClose, onStoresUpdated, initialSelected = [] }: StoreSelectorProps) {
  // Local state for the selection session
  const [currentSelection, setCurrentSelection] = useState<UserSelectedStore[]>(initialSelected);
  // Counter to force remount of StoreSelectorLayout when modal opens
  const [mountKey, setMountKey] = useState(0);
  // Track previous isOpen state to detect open transition
  const wasOpenRef = useRef(false);

  // Reset selection only when modal OPENS (transitions from closed to open)
  // Do NOT reset when initialSelected changes while modal is already open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setCurrentSelection(initialSelected);
      setMountKey(k => k + 1); // Force remount to recalculate initial radius
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialSelected]);

  const handleConfirm = () => {
    onStoresUpdated(currentSelection);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[100svh] md:h-[90vh] p-0 flex flex-col overflow-hidden gap-0">
        <TooltipProvider>
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Select Stores to Compare</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden relative">
            <StoreSelectorLayout
              key={mountKey}
              selectedStores={currentSelection}
              onSelectionChange={setCurrentSelection}
            />
          </div>

          <div className="p-4 border-t bg-background flex justify-between items-center">
             <div className="text-sm text-muted-foreground">
               {currentSelection.length} / 3 stores selected
             </div>
             <div className="flex gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
                 onClick={onClose}
               >
                 Cancel
               </Button>
               <Button
                 size="sm"
                 className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
                 onClick={handleConfirm}
                 disabled={currentSelection.length === 0}
               >
                 <span className="sm:hidden">Confirm</span>
                 <span className="hidden sm:inline">Confirm Selection</span>
               </Button>
             </div>
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
