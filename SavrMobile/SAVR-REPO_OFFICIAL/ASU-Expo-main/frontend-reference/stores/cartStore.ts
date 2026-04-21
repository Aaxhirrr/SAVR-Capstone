import { create } from 'zustand';
import cartService, { 
  CartItem, 
  CartOptionsResponse,
  OrderConfirmResponse,
  Order,
  StoreCartRequest
} from '@/services/cartService';

interface CartState {
  // Cart building process
  buildoutProcess: string | null;
  buildoutStatus: string | null;
  cartItems: Record<string, CartItem[]>; // store_id -> CartItem[]
  storeRequests: StoreCartRequest[];
  
  // Cart options (price comparison)
  cartOptions: CartOptionsResponse | null;
  
  // Orders
  orders: Order[];
  currentOrder: Order | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addItem: (storeId: string, item: CartItem) => void;
  removeItem: (storeId: string, itemIndex: number) => void;
  updateItemQuantity: (storeId: string, itemIndex: number, quantity: number) => void;
  clearItems: (storeId?: string) => void;
  
  createBuildoutRequest: () => void;
  startCartBuildout: () => Promise<string | null>;
  getCartOptions: (processId?: string) => Promise<CartOptionsResponse | null>;
  confirmOrder: (optionType: 'single_store' | 'itemized', deliveryMethod: 'pickup' | 'delivery' | 'in_store') => Promise<OrderConfirmResponse | null>;
  
  getOrders: () => Promise<void>;
  getOrder: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
}

const useCartStore = create<CartState>((set, get) => ({
  buildoutProcess: null,
  buildoutStatus: null,
  cartItems: {},
  storeRequests: [],
  cartOptions: null,
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  
  // Cart item management
  addItem: (storeId: string, item: CartItem) => {
    set((state) => {
      const storeItems = state.cartItems[storeId] || [];
      return {
        cartItems: {
          ...state.cartItems,
          [storeId]: [...storeItems, item],
        },
      };
    });
  },
  
  removeItem: (storeId: string, itemIndex: number) => {
    set((state) => {
      const storeItems = [...(state.cartItems[storeId] || [])];
      storeItems.splice(itemIndex, 1);
      return {
        cartItems: {
          ...state.cartItems,
          [storeId]: storeItems,
        },
      };
    });
  },
  
  updateItemQuantity: (storeId: string, itemIndex: number, quantity: number) => {
    set((state) => {
      const storeItems = [...(state.cartItems[storeId] || [])];
      if (storeItems[itemIndex]) {
        storeItems[itemIndex] = { ...storeItems[itemIndex], quantity };
      }
      return {
        cartItems: {
          ...state.cartItems,
          [storeId]: storeItems,
        },
      };
    });
  },
  
  clearItems: (storeId?: string) => {
    set((state) => {
      if (storeId) {
        const newCartItems = { ...state.cartItems };
        delete newCartItems[storeId];
        return { cartItems: newCartItems };
      } else {
        return { cartItems: {} };
      }
    });
  },
  
  // Cart buildout process
  createBuildoutRequest: () => {
    const { cartItems } = get();
    
    // Convert cartItems to StoreCartRequest format
    const storeRequests = Object.entries(cartItems).map(([storeId, items]) => ({
      store_id: storeId,
      url: '', // URL will be filled in by API based on store ID
      items,
    }));
    
    set({ storeRequests });
  },
  
  startCartBuildout: async () => {
    set({ isLoading: true, error: null });
    try {
      const { storeRequests } = get();
      
      if (storeRequests.length === 0) {
        set({ error: 'No items in cart', isLoading: false });
        return null;
      }
      
      const response = await cartService.buildCarts({ stores: storeRequests });
      set({ 
        buildoutProcess: response.processId,
        buildoutStatus: response.status,
        isLoading: false 
      });
      
      return response.processId;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to start cart buildout', 
        isLoading: false 
      });
      return null;
    }
  },
  
  getCartOptions: async (processId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const processIdToUse = processId || get().buildoutProcess;
      
      if (!processIdToUse) {
        set({ error: 'No buildout process ID', isLoading: false });
        return null;
      }
      
      const options = await cartService.getCartOptions(processIdToUse);
      set({ cartOptions: options, isLoading: false });
      
      return options;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get cart options', 
        isLoading: false 
      });
      return null;
    }
  },
  
  confirmOrder: async (optionType: 'single_store' | 'itemized', deliveryMethod: 'pickup' | 'delivery' | 'in_store') => {
    set({ isLoading: true, error: null });
    try {
      const { buildoutProcess } = get();
      
      if (!buildoutProcess) {
        set({ error: 'No buildout process ID', isLoading: false });
        return null;
      }
      
      const response = await cartService.confirmOrder({
        processId: buildoutProcess,
        optionType,
        deliveryMethod,
      });
      
      // Clear cart after successful order
      set({ 
        cartItems: {},
        storeRequests: [],
        buildoutProcess: null,
        buildoutStatus: null,
        isLoading: false 
      });
      
      // Get the newly created order
      await get().getOrder(response.orderId);
      
      return response;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to confirm order', 
        isLoading: false 
      });
      return null;
    }
  },
  
  // Order management
  getOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await cartService.getOrders();
      set({ orders, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get orders', 
        isLoading: false 
      });
    }
  },
  
  getOrder: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const order = await cartService.getOrder(orderId);
      set({ currentOrder: order, isLoading: false });
      
      // Update the order in the orders list if it exists
      set((state) => ({
        orders: state.orders.map(o => 
          o.id === orderId ? order : o
        ),
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get order', 
        isLoading: false 
      });
    }
  },
  
  cancelOrder: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const order = await cartService.cancelOrder(orderId);
      
      // Update the order in state
      set((state) => ({
        currentOrder: state.currentOrder?.id === orderId ? order : state.currentOrder,
        orders: state.orders.map(o => 
          o.id === orderId ? order : o
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to cancel order', 
        isLoading: false 
      });
    }
  },
}));

export default useCartStore; 