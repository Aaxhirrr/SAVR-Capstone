import { vi } from 'vitest';
import authService from '../services/authService';
import chatService from '../services/chatService';
import storeService from '../services/storeService';
import cartService from '../services/cartService';
import * as mocks from './mocks';

// Setup all API mocks for testing
export const setupMockServices = () => {
  // Auth Service
  vi.mock('../services/authService', () => ({
    default: {
      signup: vi.fn().mockImplementation(async (data) => {
        return Promise.resolve({
          id: 'new-user-id',
          email: data.email,
          phone: data.phone,
          is_active: true,
          created_at: new Date().toISOString()
        });
      }),
      login: vi.fn().mockImplementation(async () => {
        return Promise.resolve(mocks.mockToken);
      }),
      logout: vi.fn(),
      isLoggedIn: vi.fn().mockReturnValue(true),
      getProfile: vi.fn().mockResolvedValue(mocks.mockUser)
    }
  }));

  // Chat Service
  vi.mock('../services/chatService', () => ({
    default: {
      sendMessage: vi.fn().mockImplementation(async (data) => {
        return Promise.resolve({
          sessionId: data.sessionId || 'new-session-id',
          botResponse: 'This is a mock response from the assistant.',
          conversationHistory: [
            {
              id: 'msg-new-1',
              content: data.message,
              is_user: true,
              timestamp: new Date().toISOString()
            },
            {
              id: 'msg-new-2',
              content: 'This is a mock response from the assistant.',
              is_user: false,
              timestamp: new Date().toISOString()
            }
          ]
        });
      }),
      getChatHistory: vi.fn().mockResolvedValue(mocks.mockChatMessages),
      getChatSessions: vi.fn().mockResolvedValue(mocks.mockChatSessions)
    }
  }));

  // Store Service
  vi.mock('../services/storeService', () => ({
    default: {
      getNearbyStores: vi.fn().mockResolvedValue(mocks.mockNearbyStores),
      saveStoreCredentials: vi.fn().mockImplementation(async (data) => {
        return Promise.resolve({
          id: 'new-cred-id',
          store_id: data.store_id,
          username: data.username
        });
      }),
      getStoreCredentials: vi.fn().mockResolvedValue(mocks.mockStoreCredentials),
      deleteStoreCredentials: vi.fn().mockResolvedValue(undefined)
    }
  }));

  // Cart Service
  vi.mock('../services/cartService', () => ({
    default: {
      buildCarts: vi.fn().mockResolvedValue({
        processId: 'process-123',
        status: 'processing'
      }),
      getCartOptions: vi.fn().mockResolvedValue(mocks.mockCartOptions),
      confirmOrder: vi.fn().mockResolvedValue({
        orderId: 'new-order-id',
        status: 'processing',
        totalPrice: 14.72,
        deliveryMethod: 'delivery',
        stores: ['store-1', 'store-2'],
        message: 'Your order has been placed.'
      }),
      getOrders: vi.fn().mockResolvedValue(mocks.mockOrders),
      getOrder: vi.fn().mockImplementation(async (orderId) => {
        const order = mocks.mockOrders.find(o => o.id === orderId);
        return Promise.resolve(order || mocks.mockOrders[0]);
      }),
      cancelOrder: vi.fn().mockImplementation(async (orderId) => {
        const order = JSON.parse(JSON.stringify(
          mocks.mockOrders.find(o => o.id === orderId) || mocks.mockOrders[0]
        ));
        order.status = 'cancelled';
        return Promise.resolve(order);
      })
    }
  }));

  return {
    authService,
    chatService,
    storeService,
    cartService
  };
};

// Create mock error responses
export const mockApiError = (service: string, method: string, error: any) => {
  let serviceMock;
  
  switch (service) {
    case 'auth':
      serviceMock = vi.mocked(authService);
      break;
    case 'chat':
      serviceMock = vi.mocked(chatService);
      break;
    case 'store':
      serviceMock = vi.mocked(storeService);
      break;
    case 'cart':
      serviceMock = vi.mocked(cartService);
      break;
    default:
      throw new Error(`Unknown service: ${service}`);
  }
  
  if (serviceMock && method in serviceMock) {
    (serviceMock[method as keyof typeof serviceMock] as any).mockRejectedValueOnce(error);
  } else {
    throw new Error(`Unknown method: ${method} on service: ${service}`);
  }
}; 