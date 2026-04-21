export const getStoreLogo = (storeName: string): string => {
  const name = storeName.toLowerCase();
  
  if (name.includes('no frills') || name.includes('nofrills')) return '/assets/store_logos/nofrills.svg';
  if (name.includes('loblaw')) return '/assets/store_logos/loblaws.svg';
  if (name.includes('atlantic') && name.includes('superstore')) return '/assets/store_logos/atlantic-superstore.svg';
  if (name.includes('superstore')) return '/assets/store_logos/superstore.svg';
  if (name.includes('independent')) return '/assets/store_logos/independent.svg';
  if (name.includes('metro')) return '/assets/store_logos/metro.svg';
  if (name.includes('sobey')) return '/assets/store_logos/sobeys.svg';
  if (name.includes('walmart') || name.includes('wal-mart')) return '/assets/store_logos/walmart.svg';
  if (name.includes('food basics') || name.includes('foodbasics')) return '/assets/store_logos/foodbasics.svg';
  if (name.includes('zehrs')) return '/assets/store_logos/zehrs.svg';
  if (name.includes('fortinos')) return '/assets/store_logos/fortinos.svg';
  if (name.includes('maxi')) return '/assets/store_logos/maxi.svg';
  if (name.includes('safeway')) return '/assets/store_logos/safeway.svg';
  if (name.includes('valu-mart') || name.includes('valumart')) return '/assets/store_logos/valu-mart.svg';
  if (name.includes('freshco') || name.includes('fresh co')) return '/assets/store_logos/freshco.svg';
  if (name.includes('foodland') || name.includes('food land')) return '/assets/store_logos/foodland.svg';
  if (name.includes('t&t') || name.includes('tnt') || name.includes('tandt')) return '/assets/store_logos/tandt.svg';

  // Fallback to a generic icon or null if you prefer
  return '/assets/store_logos/loblaws.svg'; // Defaulting to loblaws or maybe a generic placeholder would be better
};

