import type { Store } from '@/components/StoreSelectionModal';

interface StoreCacheEntry {
  userId: string | null;
  radius: number;
  timestamp: number;
  data: Store[];
}

let cache: StoreCacheEntry | null = null;

export function getCachedStores(userId: string | null, radius: number): Store[] | null {
  if (!cache) return null;
  if (cache.userId !== (userId || null)) return null;
  if (cache.radius !== radius) return null;
  return cache.data;
}

export function setCachedStores(userId: string | null, data: Store[], radius: number): void {
  cache = {
    userId: userId || null,
    radius,
    data,
    timestamp: Date.now(),
  };
}

export function clearStoreCache(): void {
  cache = null;
}


