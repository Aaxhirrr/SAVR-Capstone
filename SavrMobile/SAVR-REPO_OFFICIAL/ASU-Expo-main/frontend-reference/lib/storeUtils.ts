/**
 * Store-related utility functions extracted from ListsPage
 * for use across the application
 */

import { parseStoreKey, getStoreNameFromKey } from '@/services/shoppingService';

// Re-export these functions from shoppingService for convenience
export { parseStoreKey, getStoreNameFromKey } from '@/services/shoppingService';

/**
 * Known store brands for extraction from full store names.
 * Sorted by length descending to match longer brands first (e.g., "atlantic superstore" before "superstore").
 */
const KNOWN_BRANDS = [
  'real canadian superstore',
  'real atlantic superstore',
  'atlantic superstore',
  't&t supermarket',
  'food basics',
  'your independent grocer',
  'independent grocer',
  'giant tiger',
  'no frills',
  'valu-mart',
  'superstore',
  'independent',
  'foodbasics',
  'atlanticsuperstore',
  'nofrills',
  'valuemart',
  'valumart',
  'fortinos',
  'loblaws',
  'walmart',
  'safeway',
  'sobeys',
  'freshco',
  'foodland',
  'metro',
  'maxi',
  'zehrs',
  't&t',
  'tnt',
  'tandt',
  'gianttiger',
  'iga',
];

/**
 * Extract the canonical brand name from a full store name.
 * Store names often have formats like "Loblaws - Loblaws Mclaughlin Road" or "No Frills - No Frills Earl Grey".
 * This extracts just the brand (e.g., "loblaws", "nofrills") for logo display.
 */
export const extractBrandFromStoreName = (storeName: string): string => {
  if (!storeName) return '';

  const lowerName = storeName.toLowerCase().trim();

  // Check if the store name starts with a known brand
  for (const brand of KNOWN_BRANDS) {
    if (lowerName.startsWith(brand)) {
      const normalized = brand.replace(/[\s-]+/g, '');
      // Normalize to match backend canonical_store_key()
      if (normalized === 'yourindependentgrocer' || normalized === 'independentgrocer') {
        return 'independent';
      }
      // Normalize T&T variants to match backend canonical key ("tnt")
      if (normalized === 't&tsupermarket' || normalized === 't&t' || normalized === 'tandt') {
        return 'tnt';
      }
      if (normalized === 'realcanadiansuperstore') {
        return 'superstore';
      }
      if (normalized === 'realatlanticsuperstore') {
        return 'atlanticsuperstore';
      }
      // "valu-mart" strips to "valumart" but backend canonical key is "valuemart"
      if (normalized === 'valumart') {
        return 'valuemart';
      }
      return normalized;
    }
  }

  // Fallback: if store name has " - " pattern (e.g., "Brand - Brand Location"),
  // extract the part before the dash
  const dashIndex = storeName.indexOf(' - ');
  if (dashIndex > 0) {
    const prefix = storeName.substring(0, dashIndex).toLowerCase().trim();
    return prefix.replace(/[\s-]+/g, '');
  }

  // Last fallback: just normalize the whole name
  return lowerName.replace(/[\s-]+/g, '');
};

/**
 * Check if a category string indicates a meat/protein product.
 * Uses case-insensitive substring match to handle LLM variations like "Meat & Poultry", "Fresh Seafood", etc.
 */
const MEAT_CATEGORY_KEYWORDS = ['meat', 'poultry', 'seafood', 'deli'];

export const isMeatCategory = (category: string | undefined | null): boolean => {
  if (!category) return false;
  const lower = category.toLowerCase();
  return MEAT_CATEGORY_KEYWORDS.some(kw => lower.includes(kw));
};

/**
 * Check if a category represents packaged goods where per-each pricing is meaningless
 * (it's just the package price). These categories should show /kg or /lb instead.
 */
const PACKAGED_CATEGORY_KEYWORDS = ['pantry', 'frozen', 'bakery', 'beverages', 'household', 'dairy', 'egg', 'cereal'];

export const isPackagedCategory = (category: string | undefined | null): boolean => {
  if (!category) return false;
  const lower = category.toLowerCase();
  return PACKAGED_CATEGORY_KEYWORDS.some(kw => lower.includes(kw));
};

/**
 * Check if a category represents produce where per-each pricing makes sense
 * (e.g., individual apples, bananas, avocados sold by unit).
 */
const PRODUCE_CATEGORY_KEYWORDS = ['produce', 'fruit', 'vegetable'];

export const isProduceCategory = (category: string | undefined | null): boolean => {
  if (!category) return false;
  const lower = category.toLowerCase();
  return PRODUCE_CATEGORY_KEYWORDS.some(kw => lower.includes(kw));
};

/**
 * Extract the street portion of an address (before the city).
 * Handles French-style addresses where number and street are separated by a comma:
 *   "110, rue Brassard, St-Michel-des-Saints, QC" → "110, rue Brassard"
 *   "50, av. Mont-Royal O, Montréal, QC" → "50, av. Mont-Royal O"
 * English addresses work as before:
 *   "123 Main St, Toronto, ON" → "123 Main St"
 */
export const extractStreetFromAddress = (address: string): string => {
  const parts = address.split(',');
  const first = parts[0].trim();
  // If the first comma-separated segment is just a number, the street name is in the next segment
  if (/^\d+$/.test(first) && parts.length > 1) {
    return `${first} ${parts[1].trim()}`;
  }
  return first;
};

/**
 * Helper function to convert store names to proper title case
 * Handles store_key format (e.g., "walmart::123 Main St") by extracting the canonical name
 */
export const formatStoreName = (storeNameOrKey: string): string => {
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
    'freshco': 'Freshco',
    'foodland': 'Foodland',
    'tnt': 'T&T Supermarket',
    't&t': 'T&T Supermarket',
    'tandt': 'T&T Supermarket',
    't&t supermarket': 'T&T Supermarket',
    'gianttiger': 'Giant Tiger',
    'giant tiger': 'Giant Tiger',
    'iga': 'IGA',
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

/**
 * Helper function to get a display-friendly store name that includes location info
 * For store_keys with address, returns "StoreName (Location)"
 */
export const formatStoreNameWithLocation = (storeKey: string): string => {
  if (!storeKey) return '';

  const { storeName: canonicalName, address } = parseStoreKey(storeKey);
  const formattedName = formatStoreName(canonicalName);

  if (address) {
    // Extract a short location identifier (first part of address, e.g., street number and name)
    const shortAddress = extractStreetFromAddress(address);
    const truncatedAddress = shortAddress.length > 25 ? shortAddress.substring(0, 22) + '...' : shortAddress;
    return `${formattedName} (${truncatedAddress})`;
  }

  return formattedName;
};

/**
 * Helper function to get the path for a store's logo
 * Handles store_key format (e.g., "walmart::123 Main St") by extracting the canonical name
 */
export const getStoreLogoPath = (storeNameOrKey: string): string => {
  if (!storeNameOrKey) return '/assets/store_logos/default.svg';

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
    'valumart': 'valu-mart.svg',
    'valuemart': 'valu-mart.svg',
    'valu-mart': 'valu-mart.svg',
    'value-mart': 'valu-mart.svg',
    'zehrs': 'zehrs.svg',
    'maxi': 'maxi.svg',
    'fortinos': 'fortinos.svg',
    'sobeys': 'sobeys.svg',
    'safeway': 'safeway.svg',
    'farmboy': 'farmboy.svg',
    'farm-boy': 'farmboy.svg',
    'longos': 'longos.svg',
    "longo's": 'longos.svg',
    'voila': 'voila.svg',
    'voilà': 'voila.svg',
    'freshco': 'freshco.svg',
    'foodland': 'foodland.svg',
    'tnt': 'tandt.svg',
    't&t': 'tandt.svg',
    't&t-supermarket': 'tandt.svg',
    'tandt': 'tandt.svg',
    'gianttiger': 'giant-tiger.svg',
    'giant-tiger': 'giant-tiger.svg',
    'iga': 'iga.svg',
  };

  // Check exact match first
  if (logoMappings[formattedName]) {
    return `/assets/store_logos/${logoMappings[formattedName]}`;
  }

  // Check partial matches (handles "tnt::address" / "gianttiger::address" formats)
  const lowerName = storeNameOrKey.toLowerCase();
  if (lowerName.includes('t&t') || lowerName.includes('tnt') || lowerName.includes('tandt')) {
    return '/assets/store_logos/tandt.svg';
  }
  if (lowerName.includes('giant') && lowerName.includes('tiger')) {
    return '/assets/store_logos/giant-tiger.svg';
  }
  if (lowerName === 'iga' || lowerName.startsWith('iga ') || lowerName.startsWith('iga::')) {
    return '/assets/store_logos/iga.svg';
  }

  const fileName = `${formattedName}.svg`;
  return `/assets/store_logos/${fileName}`;
};

/**
 * Strictly format prices: return "$X.XX" or null if invalid
 */
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

/**
 * Parse price string/number to a numeric value; returns null if not a valid price
 */
export const parsePriceToNumber = (price: string | number | null | undefined): number | null => {
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
};

/**
 * Helper for image fallback
 */
export const getProductImage = (imageUrl?: string): string =>
  imageUrl || '/assets/store-placeholder.png';

/**
 * Parse size string to normalized grams or ml
 * Handles: "500g", "1kg", "500ml", "1L", "1.5L", "100 g", etc.
 * Returns { value: number, unit: 'g' | 'ml' } or null for unparseable formats
 */
export const parseSize = (size: string | undefined): { value: number; unit: 'g' | 'ml' } | null => {
  if (!size) return null;

  const normalized = size.toLowerCase().replace(/\s+/g, '');

  // Match number (possibly with decimal) followed by unit
  const match = normalized.match(/^([\d.]+)(kg|g|l|ml|litre|liter)$/);
  if (!match) return null;

  const value = parseFloat(match[1]);
  if (!isFinite(value) || value <= 0) return null;

  const unit = match[2];

  switch (unit) {
    case 'kg':
      return { value: value * 1000, unit: 'g' };
    case 'g':
      return { value, unit: 'g' };
    case 'l':
    case 'litre':
    case 'liter':
      return { value: value * 1000, unit: 'ml' };
    case 'ml':
      return { value, unit: 'ml' };
    default:
      return null;
  }
};

/**
 * Parse price-per-unit string to a normalized number (per 100g/100ml)
 * Handles formats like: "$0.50/100g", "$/100ml", "$1.20/kg", "$/lb", "$0.80/100 g"
 * Returns null if can't parse
 */
export const parsePricePerUnit = (pricePerUnit: string | undefined): { value: number; unit: 'g' | 'ml' } | null => {
  if (!pricePerUnit) return null;

  const normalized = pricePerUnit.toLowerCase().replace(/\s+/g, '');

  // Match price followed by unit: "$0.50/100g", "$1.20/kg", etc.
  const match = normalized.match(/\$?([\d.]+)\/?(?:per)?(100g|100ml|kg|g|lb|l|ml)/);
  if (!match) return null;

  const price = parseFloat(match[1]);
  if (!isFinite(price) || price <= 0) return null;

  const unit = match[2];

  // Normalize to per-100g or per-100ml
  switch (unit) {
    case '100g':
      return { value: price, unit: 'g' };
    case '100ml':
      return { value: price, unit: 'ml' };
    case 'kg':
      // $X/kg -> $X/1000g -> $(X/10)/100g
      return { value: price / 10, unit: 'g' };
    case 'g':
      // $X/g -> $(X*100)/100g
      return { value: price * 100, unit: 'g' };
    case 'lb':
      // $X/lb -> ~$X/453.6g -> $(X/4.536)/100g
      return { value: price / 4.536, unit: 'g' };
    case 'l':
      // $X/L -> $X/1000ml -> $(X/10)/100ml
      return { value: price / 10, unit: 'ml' };
    case 'ml':
      // $X/ml -> $(X*100)/100ml
      return { value: price * 100, unit: 'ml' };
    default:
      return null;
  }
};

/**
 * Calculate unit price from price and size
 * Returns price per 100g or 100ml, or null if can't calculate
 */
export const calculateUnitPrice = (
  price: string | number | undefined,
  size: string | undefined
): { value: number; unit: 'g' | 'ml' } | null => {
  const priceNum = parsePriceToNumber(price);
  const sizeInfo = parseSize(size);

  if (!priceNum || !sizeInfo) return null;

  // Calculate price per 100 units
  const pricePer100 = (priceNum / sizeInfo.value) * 100;

  if (!isFinite(pricePer100) || pricePer100 <= 0) return null;

  return { value: pricePer100, unit: sizeInfo.unit };
};

/**
 * Result of comparing prices for an item across stores
 */
export interface PriceComparisonResult {
  lowestPriceStores: string[];        // storeKeys with lowest absolute price (may have ties)
  lowestPriceValue: number | null;
  bestValueStores: string[];          // storeKeys with lowest unit price (may have ties)
  bestValuePricePerUnit: number | null;
}

/**
 * Compare prices for an item across all stores and return winners
 * @param itemResults - results[itemName] - Record<storeKey, SearchResultInDB[]>
 * @param itemSelections - selections[itemName] - Record<storeKey, SearchResultInDB>
 */
export const compareItemAcrossStores = (
  itemResults: Record<string, { price?: string | number; pricePerUnit?: string; size?: string; name?: string }[]> | undefined,
  itemSelections: Record<string, { price?: string | number; pricePerUnit?: string; size?: string; name?: string }> | undefined
): PriceComparisonResult => {
  const result: PriceComparisonResult = {
    lowestPriceStores: [],
    lowestPriceValue: null,
    bestValueStores: [],
    bestValuePricePerUnit: null,
  };

  if (!itemResults) return result;

  const storeKeys = Object.keys(itemResults);

  // Need at least 2 stores to compare
  if (storeKeys.length < 2) return result;

  // Track price data per store
  const storePrices: { storeKey: string; price: number }[] = [];
  const storeUnitPrices: { storeKey: string; unitPrice: number; unit: 'g' | 'ml' }[] = [];

  for (const storeKey of storeKeys) {
    // Get the selected product or first result
    const selection = itemSelections?.[storeKey];
    const firstResult = itemResults[storeKey]?.[0];
    const product = (selection && selection.name !== 'Nothing') ? selection : firstResult;

    if (!product || product.name === 'Nothing') continue;

    // Get absolute price
    const price = parsePriceToNumber(product.price);
    if (price !== null && price > 0) {
      storePrices.push({ storeKey, price });
    }

    // Get unit price - try pricePerUnit first, then calculate from price/size
    let unitPriceInfo = parsePricePerUnit(product.pricePerUnit);
    if (!unitPriceInfo) {
      unitPriceInfo = calculateUnitPrice(product.price, product.size);
    }

    if (unitPriceInfo) {
      storeUnitPrices.push({ storeKey, unitPrice: unitPriceInfo.value, unit: unitPriceInfo.unit });
    }
  }

  // Find lowest absolute price (with ties)
  if (storePrices.length >= 2) {
    const minPrice = Math.min(...storePrices.map(s => s.price));
    const epsilon = 0.001; // Allow tiny floating point differences
    result.lowestPriceStores = storePrices
      .filter(s => Math.abs(s.price - minPrice) < epsilon)
      .map(s => s.storeKey);
    result.lowestPriceValue = minPrice;
  }

  // Find best value (lowest unit price) - only compare same unit types
  if (storeUnitPrices.length >= 2) {
    // Group by unit type and find the group with most entries
    const byWeight = storeUnitPrices.filter(s => s.unit === 'g');
    const byVolume = storeUnitPrices.filter(s => s.unit === 'ml');

    // Use the larger group for comparison (more meaningful)
    const compareGroup = byWeight.length >= byVolume.length && byWeight.length >= 2
      ? byWeight
      : byVolume.length >= 2 ? byVolume : null;

    if (compareGroup && compareGroup.length >= 2) {
      const minUnitPrice = Math.min(...compareGroup.map(s => s.unitPrice));
      const epsilon = 0.001;
      result.bestValueStores = compareGroup
        .filter(s => Math.abs(s.unitPrice - minUnitPrice) < epsilon)
        .map(s => s.storeKey);
      result.bestValuePricePerUnit = minUnitPrice;
    }
  }

  return result;
};

/**
 * Decode HTML entities (e.g. &#39; → ', &amp; → &) in scraped product text.
 */
let _decodeEl: HTMLTextAreaElement | null = null;
export const decodeHTMLEntities = (text: string): string => {
  if (!text || (!text.includes('&') && !text.includes('&#'))) return text;
  if (!_decodeEl) _decodeEl = document.createElement('textarea');
  _decodeEl.innerHTML = text;
  return _decodeEl.value;
};

/**
 * Helper function for truncating product names
 */
export const truncateName = (name: string, maxLength = 25): string => {
  if (!name) return '';
  const decoded = decodeHTMLEntities(name);
  const trimmedName = decoded.trim();
  return trimmedName.length > maxLength ? trimmedName.slice(0, maxLength) + '…' : trimmedName;
};

/**
 * Prepare structured fields for tooltip display
 */
export const getProductTooltipFields = (product: { brand?: string; name?: string; size?: string } | Record<string, unknown>): { brand: string; name: string; size: string } => {
  const brand = typeof product?.brand === 'string' ? decodeHTMLEntities((product.brand as string).trim()) : '';
  const name = typeof product?.name === 'string' ? decodeHTMLEntities((product.name as string).trim()) : '';
  const size = typeof product?.size === 'string' ? (product.size as string).trim() : '';
  return { brand, name, size };
};

/**
 * Deep equality comparison for objects
 */
export function isEqual(obj1: unknown, obj2: unknown, epsilon = 0.00001): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    if (typeof obj1 === 'number' && typeof obj2 === 'number' && Math.abs(obj1 - obj2) < epsilon) {
      return true;
    }
    return false;
  }

  const keys1 = Object.keys(obj1 as object);
  const keys2 = Object.keys(obj2 as object);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;

    const val1 = (obj1 as Record<string, unknown>)[key];
    const val2 = (obj2 as Record<string, unknown>)[key];

    const areObjects = typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null;

    if (areObjects) {
      if (!isEqual(val1, val2, epsilon)) return false;
    } else if (typeof val1 === 'number' && typeof val2 === 'number') {
      if (Math.abs(val1 - val2) >= epsilon) return false;
    } else {
      if (val1 !== val2) return false;
    }
  }
  return true;
}
