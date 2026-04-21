import { Store } from '@/components/StoreSelectionModal';
import { UserSelectedStore } from '@/services/storeService';

export type { Store };

export interface StoreSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onStoresUpdated: (stores: UserSelectedStore[]) => void;
  initialSelected?: UserSelectedStore[];
}

export interface StoreSelectorState {
  viewMode: 'list' | 'map';
  searchRadius: number;
  searchQuery: string;
}

