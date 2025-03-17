import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatPrice, truncateText } from '@/lib/utils';
import { openUrl } from '@/lib/chromeApi';
import {
  ChevronLeft,
  ExternalLink,
  Bell,
  BellOff,
  Search,
  ArrowUpDown,
  Eye,
} from 'lucide-react';
import type { Product, Notification } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function PriceAlerts() {
  const { toast } = useToast();
  
  // State
  const [showSetAlertDialog, setShowSetAlertDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [alertPrice, setAlertPrice] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'title' | 'currentPrice' | 'alertPrice'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Queries
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const res = await fetch('/api/products?userId=1');
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });
  
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?userId=1');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
  });
  
  // Mutations
  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, isAlertSet, alertPrice }: { id: number; isAlertSet: boolean; alertPrice?: number }) => {
      await apiRequest('PUT', `/api/products/${id}`, {
        isAlertSet,
        alertPrice,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Price alert updated',
        description: 'Your price alert has been updated',
      });
    },
    onError: (error) => {
      console.error('Failed to update price alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to update price alert. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    return products
      .filter(product => 
        product.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        let aValue, bValue;
        
        switch (sortField) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'currentPrice':
            aValue = Number(a.currentPrice);
            bValue = Number(b.currentPrice);
            break;
          case 'alertPrice':
            aValue = a.alertPrice ? Number(a.alertPrice) : Number.MAX_VALUE;
            bValue = b.alertPrice ? Number(b.alertPrice) : Number.MAX_VALUE;
            break;
          default:
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
        }
        
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [products, searchQuery, sortField, sortDirection]);
  
  // Products with alerts
  const productsWithAlerts = React.useMemo(() => {
    return filteredProducts.filter(product => product.isAlertSet);
  }, [filteredProducts]);
  
  // Event handlers
  const handleSort = (field: 'title' | 'currentPrice' | 'alertPrice') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleOpenSetAlertDialog = (product: Product) => {
    setCurrentProduct(product);
    setAlertPrice(product.alertPrice?.toString() || product.currentPrice.toString());
    setShowSetAlertDialog(true);
  };
  
  const handleSaveAlert = () => {
    if (!currentProduct || !alertPrice) return;
    
    updateAlertMutation.mutate({
      id: currentProduct.id,
      isAlertSet: true,
      alertPrice: Number(alertPrice),
    });
    
    setShowSetAlertDialog(false);
  };
  
  const handleRemoveAlert = (productId: number) => {
    updateAlertMutation.mutate({
      id: productId,
      isAlertSet: false,
    });
  };
  
  const handleVisitProduct = (productUrl: string) => {
    openUrl(productUrl);
  };
  
  // Unread notifications count
  const unreadNotificationsCount = notifications.filter(
    (notification: Notification) => !notification.isRead
  ).length;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader 
        notificationCount={unreadNotificationsCount}
        onNotificationsClick={() => {}}
      />
      
      <main className="p-6 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="pl-0 hover:bg-transparent">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Price Alerts</h1>
            <div className="relative w-64">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Price Alerts</CardTitle>
              <CardDescription>
                You'll be notified when prices drop to or below your target price
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : productsWithAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No active price alerts</h3>
                  <p className="text-gray-500 mt-1 max-w-md mx-auto">
                    You haven't set any price alerts yet. Set alerts to get notified when prices drop.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="p-0 h-auto font-medium" onClick={() => handleSort('title')}>
                          Product
                          {sortField === 'title' && (
                            <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="p-0 h-auto font-medium" onClick={() => handleSort('currentPrice')}>
                          Current Price
                          {sortField === 'currentPrice' && (
                            <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="p-0 h-auto font-medium" onClick={() => handleSort('alertPrice')}>
                          Alert Price
                          {sortField === 'alertPrice' && (
                            <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsWithAlerts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-md mr-3 overflow-hidden flex-shrink-0">
                              {product.imageUrl && (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.title} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=No+Image';
                                  }}
                                />
                              )}
                            </div>
                            <Link href={`/product/${product.id}`}>
                              <span className="text-primary hover:underline cursor-pointer max-w-xs inline-block">
                                {truncateText(product.title, 50)}
                              </span>
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatPrice(product.currentPrice, product.currency)}
                        </TableCell>
                        <TableCell>
                          {product.alertPrice 
                            ? formatPrice(product.alertPrice, product.currency)
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{product.store}</TableCell>
                        <TableCell>
                          {product.alertPrice && Number(product.currentPrice) <= Number(product.alertPrice) ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Reached</span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Waiting</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenSetAlertDialog(product)}>
                            <Bell className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveAlert(product.id)}>
                            <BellOff className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleVisitProduct(product.productUrl)}>
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Visit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Products Without Alerts</CardTitle>
              <CardDescription>
                Set price alerts for these products to get notified about price drops
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : filteredProducts.filter(p => !p.isAlertSet).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {searchQuery ? 'No products match your search' : 'No products without alerts'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.filter(p => !p.isAlertSet).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-md mr-3 overflow-hidden flex-shrink-0">
                              {product.imageUrl && (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.title} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=No+Image';
                                  }}
                                />
                              )}
                            </div>
                            <Link href={`/product/${product.id}`}>
                              <span className="text-primary hover:underline cursor-pointer max-w-xs inline-block">
                                {truncateText(product.title, 50)}
                              </span>
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatPrice(product.currentPrice, product.currency)}
                        </TableCell>
                        <TableCell>{product.store}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenSetAlertDialog(product)}>
                            <Bell className="w-4 h-4 mr-1" />
                            Set Alert
                          </Button>
                          <Link href={`/product/${product.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Set Alert Dialog */}
      <Dialog 
        open={showSetAlertDialog} 
        onOpenChange={setShowSetAlertDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Price Alert</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product</Label>
              <div id="product-name" className="text-sm font-medium">
                {currentProduct?.title}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current-price">Current Price</Label>
              <div id="current-price" className="text-sm font-medium">
                {currentProduct ? formatPrice(currentProduct.currentPrice, currentProduct.currency) : ''}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alert-price">Alert me when price drops to</Label>
              <Input
                id="alert-price"
                type="number"
                step="0.01"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetAlertDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAlert}>
              Set Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
