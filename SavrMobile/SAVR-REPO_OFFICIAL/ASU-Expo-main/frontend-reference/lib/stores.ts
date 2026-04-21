export const formatStoreName = (storeName: string) => {
  if (!storeName) return '';
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
    'independent': 'Independent',
    // New banners and common variants
    'valu-mart': 'Valumart',
    'value mart': 'Valumart',
    'valumart': 'Valumart',
    'valuemart': 'Valumart',
    'zehrs': 'Zehrs',
    'maxi': 'Maxi',
    'fortinos': 'Fortinos',
    'atlantic superstore': 'Atlantic Superstore',
    'atlanticsuperstore': 'Atlantic Superstore',
    'freshco': 'Freshco',
    'foodland': 'Foodland',
    'tnt': 'T&T Supermarket',
    't&t': 'T&T Supermarket',
    't&t supermarket': 'T&T Supermarket',
    'tandt': 'T&T Supermarket',
    'iga': 'IGA',
  };
  const lower = storeName.toLowerCase().trim();
  if (specialCases[lower]) return specialCases[lower];
  return storeName
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const getStoreLogoPath = (storeName: string): string => {
  if (!storeName) return '/assets/store_logos/default.svg';
  const formattedName = storeName.toLowerCase().trim();
  const logoMappings: Record<string, string> = {
    'no frills': 'nofrills.svg',
    'nofrills': 'nofrills.svg',
    'no-frills': 'nofrills.svg',
    'food basics': 'foodbasics.svg',
    'food-basics': 'foodbasics.svg',
    'foodbasics': 'foodbasics.svg',
    'metro': 'metro.svg',
    'loblaws': "loblaws.svg",
    'walmart': 'walmart.svg',
    'superstore': 'superstore.svg',
    'real canadian superstore': 'superstore.svg',
    'independent': 'independent.svg',
    'independent grocer': 'independent.svg',
    'your independent': 'independent.svg',
    'yig': 'independent.svg',
    'valu-mart': 'valu-mart.svg',
    'value mart': 'valu-mart.svg',
    'valuemart': 'valu-mart.svg',
    'valumart': 'valu-mart.svg',
    'zehrs': 'zehrs.svg',
    'maxi': 'maxi.svg',
    'fortinos': 'fortinos.svg',
    'sobeys': 'sobeys.svg',
    "sobey's": 'sobeys.svg',
    'safeway': 'safeway.svg',
    'atlantic superstore': 'atlantic-superstore.svg',
    'atlanticsuperstore': 'atlantic-superstore.svg',
    'freshco': 'freshco.svg',
    'foodland': 'foodland.svg',
    'tnt': 'tandt.svg',
    't&t': 'tandt.svg',
    't&t supermarket': 'tandt.svg',
    'tandt': 'tandt.svg',
    'iga': 'iga.svg',
  };

  // Check for exact match first
  if (logoMappings[formattedName]) {
    return `/assets/store_logos/${logoMappings[formattedName]}`;
  }

  // Check for partial matches (for store names with locations like "T&T Supermarket Ottawa")
  if (formattedName.includes('t&t') || formattedName.includes('tnt') || formattedName.includes('tandt')) {
    return '/assets/store_logos/tandt.svg';
  }
  if (formattedName.includes('no frills') || formattedName.includes('nofrills')) {
    return '/assets/store_logos/nofrills.svg';
  }
  if (formattedName.includes('food basics') || formattedName.includes('foodbasics')) {
    return '/assets/store_logos/foodbasics.svg';
  }
  if (formattedName.includes('atlantic') && formattedName.includes('superstore')) {
    return '/assets/store_logos/atlantic-superstore.svg';
  }
  if (formattedName.includes('superstore')) {
    return '/assets/store_logos/superstore.svg';
  }
  if (formattedName.includes('independent')) {
    return '/assets/store_logos/independent.svg';
  }
  if (formattedName.includes('sobey')) {
    return '/assets/store_logos/sobeys.svg';
  }
  if (formattedName.includes('safeway')) {
    return '/assets/store_logos/safeway.svg';
  }
  if (formattedName.includes('freshco')) {
    return '/assets/store_logos/freshco.svg';
  }
  if (formattedName.includes('foodland')) {
    return '/assets/store_logos/foodland.svg';
  }
  if (formattedName.includes('metro')) {
    return '/assets/store_logos/metro.svg';
  }
  if (formattedName.includes('walmart')) {
    return '/assets/store_logos/walmart.svg';
  }
  if (formattedName.includes('loblaw')) {
    return '/assets/store_logos/loblaws.svg';
  }
  if (formattedName.includes('zehrs')) {
    return '/assets/store_logos/zehrs.svg';
  }
  if (formattedName.includes('maxi')) {
    return '/assets/store_logos/maxi.svg';
  }
  if (formattedName.includes('fortinos')) {
    return '/assets/store_logos/fortinos.svg';
  }
  if (formattedName.includes('valu-mart') || formattedName.includes('valumart')) {
    return '/assets/store_logos/valu-mart.svg';
  }
  if (formattedName === 'iga' || formattedName.startsWith('iga ')) {
    return '/assets/store_logos/iga.svg';
  }

  // Fallback: generate filename from store name
  const fileName = `${formattedName.replace(/\s+/g, '-')}.svg`;
  return `/assets/store_logos/${fileName}`;
};

export type HasDistance = { distance?: number | string | null };

const toNumberOrInfinity = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
  const n = Number(value as any);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
};

export const byDistanceAsc = <T extends HasDistance>(a: T, b: T): number => {
  const da = toNumberOrInfinity(a.distance);
  const db = toNumberOrInfinity(b.distance);
  return da - db;
};

// ============================================================================
// Store Matching Utilities
// These provide consistent matching logic across all store selection components
// ============================================================================

/** Normalize postal code for comparison (removes whitespace, uppercase) */
export const normalizePostal = (postal?: string | null): string =>
  (postal || '').replace(/\s+/g, '').toUpperCase();

/** Extract postal code from an address string (Canadian format) */
export const extractPostalFromAddress = (address: string): string => {
  const match = address?.match(/[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d/);
  return match ? match[0].replace(/\s+/g, '') : '';
};

/**
 * Get normalized postal code from a store object.
 * Checks explicit postal_code field first, falls back to address extraction.
 */
export const getStorePostal = (store: { postal_code?: string; address?: string }): string => {
  const explicit = (store as any).postal_code;
  if (explicit) return normalizePostal(explicit);
  return normalizePostal(extractPostalFromAddress(store.address || ''));
};

/**
 * Three-tier store matching with consistent logic:
 * 1. place_id match (strongest - unique identifier)
 * 2. Case-insensitive name + normalized postal code match
 * 3. Case-insensitive name + address fallback (when postal codes unavailable)
 */
export const matchesStore = (
  store: { name: string; address: string; place_id?: string; postal_code?: string },
  selected: { store_name: string; address: string; place_id?: string; postal_code?: string }
): boolean => {
  // Priority 1: place_id match (most reliable)
  if (store.place_id && selected.place_id && store.place_id === selected.place_id) {
    return true;
  }

  // Priority 2 & 3: name-based matching (case-insensitive)
  if (selected.store_name.toLowerCase() === store.name.toLowerCase()) {
    const selPostal = normalizePostal(selected.postal_code);
    const storePostal = getStorePostal(store);

    // If both have postal codes, they must match
    if (selPostal && storePostal) {
      return selPostal === storePostal;
    }

    // Fallback: if postal codes unavailable, match by address
    if (!selPostal && !storePostal) {
      return selected.address === store.address;
    }

    // One has postal, one doesn't - try address match as fallback
    // This handles edge cases where postal extraction differs
    if (selected.address === store.address) {
      return true;
    }
  }

  return false;
};

/**
 * Check if a store is in a list of selected stores.
 * Uses the robust three-tier matching logic.
 */
export const isStoreInSelection = (
  store: { name: string; address: string; place_id?: string; postal_code?: string },
  selectedStores: Array<{ store_name: string; address: string; place_id?: string; postal_code?: string }>
): boolean => {
  return selectedStores.some(sel => matchesStore(store, sel));
};
