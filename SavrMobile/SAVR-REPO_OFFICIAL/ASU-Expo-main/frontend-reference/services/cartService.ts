import api from './api';

export interface CartItem {
  name: string;
  quantity: number;
  price?: number;
}

export interface StoreCartRequest {
  store_id: string;
  url: string;
  credentials?: {
    username: string;
    password: string;
  };
  items: CartItem[];
}

export interface CartBuildoutRequest {
  stores: StoreCartRequest[];
}

export interface CartBuildoutResponse {
  processId: string;
  status: string;
}

export interface StoreCartResult {
  store_id: string;
  status: string;
  total_price: number;
  items: CartItem[];
}

export interface CartOptionsResponse {
  status: string;
  message?: string;
  single_store?: {
    store_id: string;
    total_price: number;
    items: CartItem[];
  };
  itemized?: {
    total_price: number;
    stores: {
      store_id: string;
      items: CartItem[];
      total_price: number;
    }[];
  };
  all_stores?: StoreCartResult[];
  savings?: {
    single_store: {
      amount: number;
      percentage: number;
    };
    itemized: {
      amount: number;
      percentage: number;
    };
  };
}

export interface OrderConfirmRequest {
  processId: string;
  optionType: 'single_store' | 'itemized';
  deliveryMethod: 'pickup' | 'delivery' | 'in_store';
}

export interface OrderConfirmResponse {
  orderId: string;
  status: string;
  totalPrice: number;
  deliveryMethod: string;
  stores: string[];
  message: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_price: number;
  status: string;
  delivery_method: string;
  created_at: string;
  updated_at: string;
  items: {
    id: string;
    store_id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
}

// --- PCX Store Cart Building ---

export interface BuildStoreCartRequest {
  grocery_list_id: string;
  session_id: string;
  store_key: string;
  verification_code?: string;
  item_quantities?: Record<string, number>;
}

export interface StoreCartItem {
  product_code: string;
  name: string;
  brand: string;
  quantity: number;
  price: number;
  web_link: string;
  availability: string;
}

export interface BuildStoreCartResponse {
  success: boolean;
  needs_verification?: boolean;
  voila_job_id?: string;
  metro_job_id?: string;
  cart_id?: string;
  store_name: string;
  store_address: string;
  items_added: number;
  items_requested: number;
  items: StoreCartItem[];
  unavailable_items: string[];
  subtotal: number;
  estimated_total: number;
  site_url: string;
  cart_review_url: string;
  error?: string;
}

export interface VoilaJobStatus {
  status: string;
  message?: string;
  error?: string;
  result?: BuildStoreCartResponse;
}

export interface MetroJobStatus {
  status: string;
  error?: string;
  result?: BuildStoreCartResponse;
}

export interface SupportedStore {
  store_key: string;
  banner: string;
  site_url: string;
  requires_credentials?: boolean;
}

export interface StoreCredentialStatus {
  has_credentials: boolean;
  required: boolean;
  store_id: string | null;
}

const cartService = {
  /**
   * Start cart buildout process
   */
  buildCarts: async (data: CartBuildoutRequest): Promise<CartBuildoutResponse> => {
    const response = await api.post<CartBuildoutResponse>('/agent/cart-buildout', data);
    return response.data;
  },

  /**
   * Get cart options for a process
   */
  getCartOptions: async (processId: string): Promise<CartOptionsResponse> => {
    const response = await api.get<CartOptionsResponse>(`/agent/options/${processId}`);
    return response.data;
  },

  /**
   * Confirm an order
   */
  confirmOrder: async (data: OrderConfirmRequest): Promise<OrderConfirmResponse> => {
    const response = await api.post<OrderConfirmResponse>('/agent/confirm-order', data);
    return response.data;
  },

  /**
   * Get all orders for a user
   */
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders');
    return response.data;
  },

  /**
   * Get an order by ID
   */
  getOrder: async (orderId: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Cancel an order
   */
  cancelOrder: async (orderId: string): Promise<Order> => {
    const response = await api.put<Order>(`/orders/${orderId}/cancel`);
    return response.data;
  },

  // --- PCX Store Cart Building ---

  /**
   * Build a cart on a store's website from price check selections.
   * Returns a cart_review_url with forceCartId for direct redirect.
   */
  buildStoreCart: async (data: BuildStoreCartRequest): Promise<BuildStoreCartResponse> => {
    const response = await api.post<BuildStoreCartResponse>('/cart/build', data, { timeout: 120000 });
    return response.data;
  },

  /**
   * Get list of stores that support direct cart building.
   */
  getSupportedCartStores: async (): Promise<SupportedStore[]> => {
    const response = await api.get<{ stores: SupportedStore[] }>('/cart/supported-stores');
    return response.data.stores;
  },

  /**
   * Check if the user has saved credentials for a store that requires them.
   */
  hasStoreCredentials: async (storeKey: string): Promise<StoreCredentialStatus> => {
    const response = await api.get<StoreCredentialStatus>(`/cart/has-credentials/${storeKey}`);
    return response.data;
  },

  /**
   * Save store credentials (delegates to stores endpoint).
   */
  saveStoreCredentials: async (storeId: string, username: string, password: string) => {
    const response = await api.post('/stores/credentials', {
      store_id: storeId,
      username,
      password,
    });
    return response.data;
  },

  // --- Voila Background Job ---

  /**
   * Poll the status of a Voila cart build job.
   */
  getVoilaJobStatus: async (jobId: string): Promise<VoilaJobStatus> => {
    const response = await api.get<VoilaJobStatus>(`/cart/voila-status/${jobId}`);
    return response.data;
  },

  /**
   * Submit a TFA verification code for a Voila cart build job.
   */
  submitVoilaCode: async (jobId: string, code: string) => {
    const response = await api.post(`/cart/voila-code/${jobId}`, { code });
    return response.data;
  },

  /**
   * Check if a PCX store supports online ordering (pickup-locations API).
   * Returns true if online ordering is available, false otherwise.
   */
  checkOnlineOrdering: async (storeKey: string, retailerStoreId: string): Promise<boolean> => {
    try {
      const response = await api.get<{ online_ordering: boolean }>('/cart/check-online-ordering', {
        params: { store_key: storeKey, retailer_store_id: retailerStoreId },
      });
      return response.data.online_ordering;
    } catch {
      return true; // fail open
    }
  },

  // --- Metro Background Job ---

  /**
   * Poll the status of a Metro cart build job.
   */
  getMetroJobStatus: async (jobId: string): Promise<MetroJobStatus> => {
    const response = await api.get<MetroJobStatus>(`/cart/metro-status/${jobId}`);
    return response.data;
  },
};

export default cartService;