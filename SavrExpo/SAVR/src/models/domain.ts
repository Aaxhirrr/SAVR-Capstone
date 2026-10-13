export type Session = { accessToken: string; userId: string };
export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dietary: string[];
  likedBrands: Record<string, string>;
  dislikedBrands: Record<string, string>;
};
export type GroceryItem = {
  name: string;
  quantity: string;
  category: string;
  meal: string;
  unit: string;
};
export type GroceryList = {
  id: string;
  name: string;
  items: GroceryItem[];
  createdAt: string;
  isActive: boolean;
  sessionId?: string;
  savings?: number;
  cheapestStore?: string;
  cheapestPrice?: number;
  priciestStore?: string;
  priciestPrice?: number;
};
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
};
export type Conversation = { sessionId?: string; messages: Message[] };
export type Deal = {
  id: string;
  storeBrand: string;
  name: string;
  brand: string;
  price: string;
  priceFloat?: number;
  imageUrl?: string;
  validFrom: string;
  validTo: string;
  saleStory: string;
  prePriceText: string;
  postPriceText: string;
  originalPrice?: number;
};
export type DealsPage = {
  deals: Deal[];
  total: number;
  page: number;
  pageSize: number;
};
export type SavedStore = {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  brand: string;
};
export type KnownStore = SavedStore & { latitude: number; longitude: number };
export type Signup = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postal: string;
};

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Unexpected server response. Please try again.');
  return value as Record<string, unknown>;
}
export function array(value: unknown): unknown[] {
  if (!Array.isArray(value))
    throw new Error('Unexpected server response. Please try again.');
  return value;
}
export const string = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : typeof value === 'number'
      ? String(value)
      : '';
const required = (value: unknown): string => {
  const result = string(value);
  if (!result)
    throw new Error('The server response is missing a required field.');
  return result;
};
const number = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const result = Number(value);
  return Number.isFinite(result) ? result : undefined;
};
const dictionary = (value: unknown): Record<string, string> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value).filter(([, v]) => typeof v === 'string'),
      )
    : {};

export function parseSession(value: unknown): Session {
  const v = object(value);
  return { accessToken: required(v.access_token), userId: required(v.user_id) };
}
export function parseProfile(value: unknown): Profile {
  const v = object(value);
  const brands = v.brand_preferences ? object(v.brand_preferences) : {};
  const address =
    typeof v.address === 'string'
      ? v.address
      : v.address
        ? string(object(v.address).street)
        : '';
  return {
    firstName: string(v.first_name),
    lastName: string(v.last_name),
    email: string(v.email ?? v.username),
    phone: string(v.phone),
    address,
    dietary: Array.isArray(v.dietary_restrictions)
      ? v.dietary_restrictions.filter((x): x is string => typeof x === 'string')
      : [],
    likedBrands: dictionary(brands.liked),
    dislikedBrands: dictionary(brands.disliked),
  };
}
export function parseList(value: unknown): GroceryList {
  const v = object(value);
  return {
    id: required(v.id),
    name: required(v.name),
    createdAt: string(v.createdAt ?? v.created_at),
    isActive: v.is_active === true,
    sessionId: string(v.session_id) || undefined,
    savings: number(v.savings_amount),
    cheapestStore: string(v.least_expensive_store_name) || undefined,
    cheapestPrice: number(v.least_expensive_store_price),
    priciestStore: string(v.most_expensive_store_name) || undefined,
    priciestPrice: number(v.most_expensive_store_price),
    items: array(v.items).map((item) => {
      const i = object(item);
      return {
        name: required(i.name),
        quantity: string(i.quantity),
        category: string(i.category),
        meal: string(i.meal),
        unit: string(i.unit),
      };
    }),
  };
}
export function parseChat(value: unknown) {
  const v = object(value);
  return {
    sessionId: required(v.sessionId ?? v.session_id),
    text: required(v.botResponse ?? v.bot_response),
  };
}
export function parseHistory(value: unknown): Message[] {
  return array(value).map((item) => {
    const v = object(item);
    return {
      id: required(v.id),
      text: required(v.content),
      role: v.is_user === true ? 'user' : 'assistant',
      timestamp: string(v.timestamp),
    };
  });
}
export function parseDeals(value: unknown): DealsPage {
  const v = object(value);
  return {
    total: number(v.total) ?? 0,
    page: number(v.page) ?? 1,
    pageSize: number(v.page_size) ?? 50,
    deals: array(v.deals).map((item) => {
      const d = object(item);
      return {
        id: required(d.id),
        storeBrand: string(d.store_brand),
        name: required(d.product_name),
        brand: string(d.brand),
        price: string(d.price),
        priceFloat: number(d.price_float),
        imageUrl: string(d.image_url) || undefined,
        validFrom: string(d.valid_from),
        validTo: string(d.valid_to),
        saleStory: string(d.sale_story),
        prePriceText: string(d.pre_price_text),
        postPriceText: string(d.post_price_text),
        originalPrice: number(d.original_price),
      };
    }),
  };
}
export function parseStores(value: unknown): SavedStore[] {
  return array(value).map((item) => {
    const v = object(item);
    return {
      id: required(v.id),
      name: required(v.store_name),
      address: string(v.address),
      postalCode: string(v.postal_code),
      brand: string(v.brand),
    };
  });
}
