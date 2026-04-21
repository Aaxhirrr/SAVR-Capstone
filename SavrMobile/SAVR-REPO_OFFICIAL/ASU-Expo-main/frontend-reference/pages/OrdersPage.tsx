import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatPrice } from '@/lib/utils';
import cartService, { Order } from '@/services/cartService';
import storeService from '@/services/storeService';

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await cartService.getOrders();
        setOrders(data);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load orders');
        setIsLoading(false);
      }
    };
    
    const fetchStores = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const storesList = await storeService.getNearbyStoresFromDB({ latitude, longitude });

            // Create a map of store IDs to store names
            const storeMap: Record<string, string> = {};
            storesList.forEach(store => {
              storeMap[store.id] = store.name;
            });
            
            setStores(storeMap);
          });
        }
      } catch (error) {
        console.error("Error loading stores:");
      }
    };
    
    fetchOrders();
    fetchStores();
  }, []);

  const getOrderStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStoreName = (storeId: string) => {
    return stores[storeId] || storeId;
  };
  
  const getUniqueStores = (order: Order) => {
    const uniqueStores = new Set<string>();
    order.items.forEach(item => uniqueStores.add(item.store_id));
    return Array.from(uniqueStores);
  };

  return (
    <div className="container mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
      
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <h3 className="font-medium text-lg mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't placed any orders yet.
              </p>
              <Link to="/cart">
                <Button>Start Shopping</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="mb-1">Order #{order.id.slice(0, 8)}</CardTitle>
                    <div className="flex space-x-2 text-sm text-muted-foreground">
                      <span>{formatDate(order.created_at)}</span>
                      <span>•</span>
                      <span>{getOrderStatusBadge(order.status)}</span>
                      <span>•</span>
                      <span className="capitalize">{order.delivery_method}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatPrice(order.total_price)}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.length} items from {getUniqueStores(order).length} store(s)
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-t pt-4 mt-2">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {getUniqueStores(order).map((storeId) => (
                      <div key={storeId} className="text-sm bg-secondary rounded-full px-3 py-1">
                        {getStoreName(storeId)}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="text-sm">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-muted-foreground">
                          {item.quantity} × {formatPrice(item.price)}
                        </div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-sm text-muted-foreground col-span-full">
                        +{order.items.length - 3} more items
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage; 