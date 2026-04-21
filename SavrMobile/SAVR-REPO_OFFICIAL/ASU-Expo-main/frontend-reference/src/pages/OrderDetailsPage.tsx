import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import cartService, { Order } from '@/services/cartService';
import storeService from '@/services/storeService';
import { byDistanceAsc } from '@/lib/stores';

const OrderDetailsPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await cartService.getOrder(orderId);
        setOrder(data);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load order details');
        setIsLoading(false);
      }
    };
    
    const fetchStores = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const storesList = await storeService.getNearbyStores({ latitude, longitude, provider: 'mapbox' });
            const sortedStores = [...storesList].sort(byDistanceAsc);
            
            // Create a map of store IDs to store objects
            const storeMap: Record<string, any> = {};
            sortedStores.forEach(store => {
              storeMap[store.id] = store;
            });
            
            setStores(storeMap);
          });
        }
      } catch (error) {
        console.error("Error loading stores:", error);
      }
    };
    
    fetchOrder();
    fetchStores();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!order) return;
    
    setIsCancelling(true);
    
    try {
      const updatedOrder = await cartService.cancelOrder(order.id);
      setOrder(updatedOrder);
      setIsCancelling(false);
    } catch (err) {
      setError('Failed to cancel order');
      setIsCancelling(false);
    }
  };

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
    return stores[storeId]?.name || storeId;
  };
  
  const groupItemsByStore = (order: Order) => {
    const stores: Record<string, {
      storeId: string,
      items: typeof order.items,
      total: number
    }> = {};
    
    order.items.forEach(item => {
      if (!stores[item.store_id]) {
        stores[item.store_id] = {
          storeId: item.store_id,
          items: [],
          total: 0
        };
      }
      
      stores[item.store_id].items.push(item);
      stores[item.store_id].total += item.price * item.quantity;
    });
    
    return Object.values(stores);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto max-w-5xl py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <h3 className="font-medium text-lg mb-2">Error</h3>
              <p className="text-muted-foreground mb-4">
                {error || "Order not found"}
              </p>
              <Button onClick={() => navigate('/orders')}>Return to Orders</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const storeGroups = groupItemsByStore(order);

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/orders')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-1">Order #{order.id.slice(0, 8)}</CardTitle>
              <CardDescription>
                Placed on {formatDate(order.created_at)}
              </CardDescription>
            </div>
            <div>{getOrderStatusBadge(order.status)}</div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <dt className="font-medium mb-1">Delivery Method</dt>
              <dd className="capitalize">{order.delivery_method}</dd>
            </div>
            <div>
              <dt className="font-medium mb-1">Status</dt>
              <dd className="capitalize">{order.status}</dd>
            </div>
            <div>
              <dt className="font-medium mb-1">Order Date</dt>
              <dd>{formatDate(order.created_at)}</dd>
            </div>
            {order.updated_at !== order.created_at && (
              <div>
                <dt className="font-medium mb-1">Last Updated</dt>
                <dd>{formatDate(order.updated_at)}</dd>
              </div>
            )}
          </dl>
        </CardContent>
        {order.status === 'processing' && (
          <CardFooter className="border-t pt-4">
            <Button 
              variant="destructive" 
              onClick={handleCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </CardFooter>
        )}
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {storeGroups.map((storeGroup) => (
            <Card key={storeGroup.storeId}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{getStoreName(storeGroup.storeId)}</CardTitle>
                  {stores[storeGroup.storeId]?.url && (
                    <a 
                      href={stores[storeGroup.storeId].url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center"
                    >
                      Visit Store
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {storeGroup.items.map((item) => (
                    <li key={item.id} className="py-3 flex justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>{formatPrice(storeGroup.total)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium">{formatPrice(order.total_price)}</dd>
                </div>
                {/* You can add tax, delivery fee, etc. here if available */}
                <div className="border-t pt-4 flex justify-between font-bold">
                  <dt>Total</dt>
                  <dd>{formatPrice(order.total_price)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage; 