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
};

export default cartService; 