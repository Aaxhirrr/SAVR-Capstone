import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import useCartStore from '@/stores/cartStore';
import storeService from '@/services/storeService';

const CartPage = () => {
  const navigate = useNavigate();
  const { 
    cartItems, 
    addItem, 
    removeItem, 
    updateItemQuantity,
    clearItems,
    createBuildoutRequest,
    startCartBuildout,
    buildoutProcess,
    buildoutStatus,
    cartOptions,
    getCartOptions,
    confirmOrder,
    isLoading,
    error
  } = useCartStore();
  
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1 });
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [selectedOption, setSelectedOption] = useState<'single_store' | 'itemized'>('single_store');
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  // Load stores
  useEffect(() => {
    const loadStores = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            if (latitude && longitude) {
              (async () => {
                try {
                  const storesList = await storeService.getNearbyStoresFromDB({ latitude, longitude });
                  setStores(storesList);
                  // Automatically select the first store if list is not empty
                  if (storesList.length > 0) {
                    setSelectedStore(storesList[0].id);
                  }
                } catch (err) {
                  console.error("Error loading stores:");
                }
              })();
            }
          });
        }
      } catch (error) {
        console.error("Error loading stores:");
      }
    };
    
    loadStores();
  }, [selectedStore]);

  // Poll for cart options if buildout is in progress
  useEffect(() => {
    if (buildoutProcess && buildoutStatus === 'processing') {
      const interval = window.setInterval(async () => {
        const options = await getCartOptions();
        if (options && options.status === 'completed') {
          clearInterval(interval);
          setPollingInterval(null);
        }
      }, 5000);
      
      setPollingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [buildoutProcess, buildoutStatus, getCartOptions]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  const handleAddItem = () => {
    if (!selectedStore || !newItem.name.trim()) return;
    
    addItem(selectedStore, { 
      name: newItem.name.trim(), 
      quantity: newItem.quantity 
    });
    
    setNewItem({ name: '', quantity: 1 });
  };

  const handleBuildCarts = async () => {
    createBuildoutRequest();
    await startCartBuildout();
  };

  const handleConfirmOrder = async () => {
    const response = await confirmOrder(selectedOption, deliveryMethod);
    if (response) {
      navigate(`/orders/${response.orderId}`);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
      
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {!buildoutProcess ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Item Input */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
              <CardDescription>
                Select a store and add items to your cart
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select Store</label>
                  <select 
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={selectedStore || ''}
                    onChange={(e) => setSelectedStore(e.target.value)}
                  >
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Item Name</label>
                  <Input
                    placeholder="e.g., Milk"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                
                <Button 
                  onClick={handleAddItem} 
                  className="w-full"
                  disabled={!selectedStore || !newItem.name.trim()}
                >
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Cart Items */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your Cart</CardTitle>
              <CardDescription>
                Items you've added to your cart
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(cartItems).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(cartItems).map(([storeId, items]) => {
                    const store = stores.find(s => s.id === storeId);
                    return (
                      <div key={storeId}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold">{store?.name || storeId}</h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => clearItems(storeId)}
                          >
                            Clear
                          </Button>
                        </div>
                        <ul className="space-y-2">
                          {items.map((item, index) => (
                            <li key={index} className="flex justify-between items-center border-b pb-2">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <div className="flex items-center mt-1">
                                  <button 
                                    className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center"
                                    onClick={() => updateItemQuantity(storeId, index, Math.max(1, item.quantity - 1))}
                                  >
                                    -
                                  </button>
                                  <span className="mx-2">{item.quantity}</span>
                                  <button 
                                    className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center"
                                    onClick={() => updateItemQuantity(storeId, index, item.quantity + 1)}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeItem(storeId, index)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => clearItems()}
                disabled={Object.keys(cartItems).length === 0}
              >
                Clear All
              </Button>
              <Button 
                onClick={handleBuildCarts}
                disabled={Object.keys(cartItems).length === 0 || isLoading}
              >
                {isLoading ? 'Processing...' : 'Compare Prices'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Cart Options */}
          <Card>
            <CardHeader>
              <CardTitle>Price Comparison</CardTitle>
              <CardDescription>
                {buildoutStatus === 'processing' ? 
                  'We are comparing prices across stores...' : 
                  'Choose your preferred option'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {buildoutStatus === 'processing' || !cartOptions ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">This may take a few minutes...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Single Store Option */}
                  {cartOptions.single_store && (
                    <div 
                      className={`border rounded-lg p-4 ${selectedOption === 'single_store' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => setSelectedOption('single_store')}
                    >
                      <div className="flex items-center mb-2">
                        <input 
                          type="radio" 
                          checked={selectedOption === 'single_store'} 
                          onChange={() => setSelectedOption('single_store')}
                          className="mr-2"
                        />
                        <h3 className="font-semibold text-lg">Single Store Option</h3>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        Get all items from a single store for convenience
                      </p>
                      
                      <div className="bg-card rounded p-3 mb-2">
                        <div className="flex justify-between mb-2">
                          <div className="font-medium">
                            {stores.find(s => s.id === cartOptions.single_store?.store_id)?.name || 
                              cartOptions.single_store?.store_id}
                          </div>
                          <div className="font-bold">
                            {formatPrice(cartOptions.single_store?.total_price || 0)}
                          </div>
                        </div>
                        <ul className="text-sm space-y-1">
                          {cartOptions.single_store?.items.map((item, index) => (
                            <li key={index} className="flex justify-between">
                              <span>{item.name} × {item.quantity}</span>
                              <span>{formatPrice((item.price || 0) * item.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Itemized Option */}
                  {cartOptions.itemized && (
                    <div 
                      className={`border rounded-lg p-4 ${selectedOption === 'itemized' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => setSelectedOption('itemized')}
                    >
                      <div className="flex items-center mb-2">
                        <input 
                          type="radio" 
                          checked={selectedOption === 'itemized'} 
                          onChange={() => setSelectedOption('itemized')}
                          className="mr-2"
                        />
                        <h3 className="font-semibold text-lg">Best Price Option</h3>
                        {(cartOptions?.savings?.itemized?.amount ?? 0) > 0 && (
                          <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                            Save {formatPrice(cartOptions?.savings?.itemized?.amount ?? 0)}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-4">
                        Get the best prices by shopping at multiple stores
                      </p>
                      
                      <div className="space-y-4">
                        {cartOptions.itemized.stores.map((store, index) => (
                          <div key={index} className="bg-card rounded p-3">
                            <div className="flex justify-between mb-2">
                              <div className="font-medium">
                                {stores.find(s => s.id === store.store_id)?.name || store.store_id}
                              </div>
                              <div className="font-bold">
                                {formatPrice(store.total_price)}
                              </div>
                            </div>
                            <ul className="text-sm space-y-1">
                              {store.items.map((item, itemIndex) => (
                                <li key={itemIndex} className="flex justify-between">
                                  <span>{item.name} × {item.quantity}</span>
                                  <span>{formatPrice((item.price || 0) * item.quantity)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        
                        <div className="flex justify-between font-bold pt-2 border-t">
                          <span>Total:</span>
                          <span>{formatPrice(cartOptions.itemized.total_price)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Delivery Options */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-4">Delivery Method</h3>
                    <div className="flex space-x-4">
                      <div 
                        className={`flex-1 border rounded-lg p-3 cursor-pointer ${deliveryMethod === 'pickup' ? 'border-primary bg-primary/5' : ''}`}
                        onClick={() => setDeliveryMethod('pickup')}
                      >
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            checked={deliveryMethod === 'pickup'} 
                            onChange={() => setDeliveryMethod('pickup')}
                            className="mr-2"
                          />
                          <div>
                            <h4 className="font-medium">Pickup</h4>
                            <p className="text-sm text-muted-foreground">Collect your order from the store</p>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`flex-1 border rounded-lg p-3 cursor-pointer ${deliveryMethod === 'delivery' ? 'border-primary bg-primary/5' : ''}`}
                        onClick={() => setDeliveryMethod('delivery')}
                      >
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            checked={deliveryMethod === 'delivery'} 
                            onChange={() => setDeliveryMethod('delivery')}
                            className="mr-2"
                          />
                          <div>
                            <h4 className="font-medium">Delivery</h4>
                            <p className="text-sm text-muted-foreground">Have it delivered to your door</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  // Clear buildout data without clearing cart
                  useCartStore.setState({
                    buildoutProcess: null,
                    buildoutStatus: null,
                    cartOptions: null
                  });
                }}
              >
                Back to Cart
              </Button>
              
              <Button 
                onClick={handleConfirmOrder}
                disabled={buildoutStatus === 'processing' || !cartOptions || isLoading}
              >
                {isLoading ? 'Processing...' : 'Place Order'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CartPage; 