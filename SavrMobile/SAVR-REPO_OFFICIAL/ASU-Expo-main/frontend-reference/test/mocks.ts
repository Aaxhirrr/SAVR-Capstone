// Mock data for testing various components and services

// User data
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  phone: '1234567890',
  is_active: true,
  created_at: '2023-01-01T12:00:00Z'
};

// Authentication
export const mockToken = {
  access_token: 'mock-jwt-token',
  token_type: 'bearer'
};

// Chat sessions
export const mockChatSessions = [
  {
    id: 'session-1',
    user_id: 'user-123',
    created_at: '2023-08-01T10:00:00Z',
    updated_at: '2023-08-01T10:30:00Z'
  },
  {
    id: 'session-2',
    user_id: 'user-123',
    created_at: '2023-08-02T14:00:00Z',
    updated_at: '2023-08-02T14:45:00Z'
  }
];

// Chat messages
export const mockChatMessages = [
  {
    id: 'msg-1',
    content: 'Hello, I need help with my grocery list.',
    is_user: true,
    timestamp: '2023-08-01T10:00:00Z'
  },
  {
    id: 'msg-2',
    content: 'Hi there! I can help you with your grocery list. What items do you need?',
    is_user: false,
    timestamp: '2023-08-01T10:01:00Z'
  },
  {
    id: 'msg-3',
    content: 'I need milk, eggs, bread, and some vegetables.',
    is_user: true,
    timestamp: '2023-08-01T10:02:00Z'
  }
];

// Stores
export const mockNearbyStores = [
  {
    storeId: 'store-1',
    name: 'Grocery Mart',
    distance: 1.2,
    url: 'https://www.grocerymart.com'
  },
  {
    storeId: 'store-2',
    name: 'Fresh Foods',
    distance: 2.3,
    url: 'https://www.freshfoods.com'
  },
  {
    storeId: 'store-3',
    name: 'Value Supermarket',
    distance: 3.5,
    url: 'https://www.valuesupermarket.com'
  }
];

export const mockStoreCredentials = [
  {
    id: 'cred-1',
    store_id: 'store-1',
    username: 'user1'
  },
  {
    id: 'cred-2',
    store_id: 'store-2',
    username: 'user2'
  }
];

// Cart items
export const mockCartItems = {
  'store-1': [
    { name: 'Milk', quantity: 1, price: 3.99 },
    { name: 'Eggs', quantity: 2, price: 2.49 }
  ],
  'store-2': [
    { name: 'Bread', quantity: 1, price: 2.99 },
    { name: 'Apples', quantity: 4, price: 1.25 }
  ]
};

// Cart options
export const mockCartOptions = {
  status: 'completed',
  single_store: {
    store_id: 'store-1',
    total_price: 16.94,
    items: [
      { name: 'Milk', quantity: 1, price: 3.99 },
      { name: 'Eggs', quantity: 2, price: 2.49 },
      { name: 'Bread', quantity: 1, price: 3.49 },
      { name: 'Apples', quantity: 4, price: 1.12 }
    ]
  },
  itemized: {
    total_price: 14.72,
    stores: [
      {
        store_id: 'store-1',
        items: [
          { name: 'Milk', quantity: 1, price: 3.99 },
          { name: 'Eggs', quantity: 2, price: 2.49 }
        ],
        total_price: 8.97
      },
      {
        store_id: 'store-2',
        items: [
          { name: 'Bread', quantity: 1, price: 2.99 },
          { name: 'Apples', quantity: 4, price: 0.69 }
        ],
        total_price: 5.75
      }
    ]
  },
  savings: {
    single_store: {
      amount: 2.22,
      percentage: 13.1
    },
    itemized: {
      amount: 0,
      percentage: 0
    }
  }
};

// Orders
export const mockOrders = [
  {
    id: 'order-1',
    user_id: 'user-123',
    total_price: 14.72,
    status: 'processing',
    delivery_method: 'delivery',
    created_at: '2023-08-05T09:30:00Z',
    updated_at: '2023-08-05T09:30:00Z',
    items: [
      {
        id: 'item-1',
        store_id: 'store-1',
        name: 'Milk',
        quantity: 1,
        price: 3.99
      },
      {
        id: 'item-2',
        store_id: 'store-1',
        name: 'Eggs',
        quantity: 2,
        price: 2.49
      },
      {
        id: 'item-3',
        store_id: 'store-2',
        name: 'Bread',
        quantity: 1,
        price: 2.99
      },
      {
        id: 'item-4',
        store_id: 'store-2',
        name: 'Apples',
        quantity: 4,
        price: 0.69
      }
    ]
  },
  {
    id: 'order-2',
    user_id: 'user-123',
    total_price: 22.45,
    status: 'completed',
    delivery_method: 'pickup',
    created_at: '2023-07-28T14:20:00Z',
    updated_at: '2023-07-28T16:30:00Z',
    items: [
      {
        id: 'item-5',
        store_id: 'store-1',
        name: 'Chicken Breast',
        quantity: 2,
        price: 7.99
      },
      {
        id: 'item-6',
        store_id: 'store-1',
        name: 'Rice',
        quantity: 1,
        price: 3.49
      },
      {
        id: 'item-7',
        store_id: 'store-1',
        name: 'Broccoli',
        quantity: 1,
        price: 2.99
      }
    ]
  }
]; 