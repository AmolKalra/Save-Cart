import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { PriceChart } from '@/components/ui/price-chart';
import { formatPrice, formatDate, formatTimeAgo, calculatePriceDifference } from '@/lib/utils';
import { openUrl } from '@/lib/chromeApi';
import {
  ChevronLeft,
  ExternalLink,
  Bell,
  Heart,
  Trash2,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Minus
} from 'lucide-react';
import type { Product, PriceHistory, Notification } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id, 10);
  const { toast } = useToast();
  
  // State
  const [showSetAlertDialog, setShowSetAlertDialog] = useState(false);
  const [alertPrice, setAlertPrice] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Queries
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: [`/api/products/${productId}`],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error('Failed to fetch product');
      return res.json();
    },
  });
  
  const { data: priceHistory = [], isLoading: isLoadingPriceHistory } = useQuery({
    queryKey: [`/api/price-history/${productId}`],
    queryFn: async () => {
      const res = await fetch(`/api/price-history/${productId}`);
      if (!res.ok) throw new Error('Failed to fetch price history');
      return res.json();
    },
    enabled: !!product,
  });
  
  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?userId=1');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
  });
  
  // Mutations
  const updateProductMutation = useMutation({
    mutationFn: async (updateData: Partial<Product>) => {
      await apiRequest('PUT', `/api/products/${productId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Product updated',
        description: 'Your changes have been saved',
      });
    },
    onError: (error) => {
      console.error('Failed to update product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      window.history.back();
      toast({
        title: 'Product deleted',
        description: 'The product has been removed from your cart',
      });
    },
    onError: (error) => {
      console.error('Failed to delete product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Event handlers
  const handleToggleFavorite = () => {
    if (!product) return;
    updateProductMutation.mutate({
      isFavorite: !product.isFavorite,
    });
  };
  
  const handleOpenSetAlertDialog = () => {
    if (!product) return;
    setAlertPrice(product.alertPrice?.toString() || product.currentPrice.toString());
    setShowSetAlertDialog(true);
  };
  
  const handleSetAlert = () => {
    if (!product || !alertPrice) return;
    
    updateProductMutation.mutate({
      isAlertSet: true,
      alertPrice: Number(alertPrice),
    });
    
    setShowSetAlertDialog(false);
    toast({
      title: 'Price alert set',
      description: "You'll be notified when the price drops to your target",
    });
  };
  
  const handleRemoveAlert = () => {
    if (!product) return;
    
    updateProductMutation.mutate({
      isAlertSet: false,
      alertPrice: null,
    });
    
    toast({
      title: 'Price alert removed',
      description: "You won't receive notifications for this product",
    });
  };
  
  const handleDeleteProduct = () => {
    setShowDeleteDialog(true);
  };
  
  const confirmDeleteProduct = () => {
    deleteProductMutation.mutate();
    setShowDeleteDialog(false);
  };
  
  const handleVisitStore = () => {
    if (!product) return;
    openUrl(product.productUrl);
  };
  
  // Determine price trend
  const getPriceTrend = () => {
    if (!product || !product.originalPrice) return null;
    
    const priceDiff = calculatePriceDifference(
      Number(product.currentPrice),
      Number(product.originalPrice)
    );
    
    if (priceDiff.percentChange < 1) return null;
    
    return {
      difference: priceDiff.difference,
      percentChange: priceDiff.percentChange,
      isIncrease: priceDiff.isIncrease,
    };
  };
  
  const priceTrend = getPriceTrend();
  
  // Get price extremes
  const getPriceExtremes = () => {
    if (!priceHistory || priceHistory.length < 2) return null;
    
    const prices = priceHistory.map(entry => Number(entry.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Get dates for min and max
    const minPriceEntry = priceHistory.find(entry => Number(entry.price) === minPrice);
    const maxPriceEntry = priceHistory.find(entry => Number(entry.price) === maxPrice);
    
    return {
      min: {
        price: minPrice,
        date: minPriceEntry ? new Date(minPriceEntry.date) : new Date(),
      },
      max: {
        price: maxPrice,
        date: maxPriceEntry ? new Date(maxPriceEntry.date) : new Date(),
      },
    };
  };
  
  const priceExtremes = getPriceExtremes();
  
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
          
          {isLoadingProduct ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Skeleton className="w-full aspect-square rounded-md" />
                <div className="mt-4 space-y-3">
                  <Skeleton className="w-full h-10" />
                  <Skeleton className="w-full h-10" />
                  <Skeleton className="w-full h-10" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-2">
                  <Skeleton className="w-3/4 h-8" />
                  <Skeleton className="w-1/2 h-6" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="w-full h-40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="w-full h-12" />
                  <Skeleton className="w-full h-12" />
                </div>
              </div>
            </div>
          ) : product ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.title} 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="text-gray-400">No Image Available</div>
                      )}
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <Button 
                        className="w-full flex items-center justify-center"
                        onClick={handleVisitStore}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit Store
                      </Button>
                      
                      <Button 
                        variant={product.isAlertSet ? "default" : "outline"}
                        className="w-full flex items-center justify-center"
                        onClick={handleOpenSetAlertDialog}
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        {product.isAlertSet ? "Update Price Alert" : "Set Price Alert"}
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className={`w-full flex items-center justify-center ${product.isFavorite ? 'text-rose-500 border-rose-200 hover:bg-rose-50' : ''}`}
                        onClick={handleToggleFavorite}
                      >
                        <Heart 
                          className="w-4 h-4 mr-2" 
                          fill={product.isFavorite ? 'currentColor' : 'none'} 
                        />
                        {product.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className="w-full flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                        onClick={handleDeleteProduct}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove from Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
                  <div className="flex items-center mt-2">
                    <span className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-700">{product.store}</span>
                    <span className="text-sm text-gray-500 ml-3 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Added {formatTimeAgo(product.createdAt)}
                    </span>
                  </div>
                </div>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-baseline">
                      <div className="text-3xl font-bold text-gray-900">
                        {formatPrice(product.currentPrice, product.currency)}
                      </div>
                      
                      {product.originalPrice && (
                        <div className="ml-4 flex items-center">
                          <span className={`text-lg ${priceTrend?.isIncrease ? 'text-red-500' : 'text-gray-500 line-through'}`}>
                            {formatPrice(product.originalPrice, product.currency)}
                          </span>
                          
                          {priceTrend && (
                            <span className={`ml-2 px-2 py-1 text-sm rounded-md flex items-center ${priceTrend.isIncrease ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {priceTrend.isIncrease ? (
                                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                              )}
                              {priceTrend.isIncrease ? '+' : '-'}{priceTrend.percentChange}%
                            </span>
                          )}
                        </div>
                      )}
                      
                      {!product.originalPrice && (
                        <div className="ml-4 flex items-center">
                          <span className="text-sm px-2 py-1 rounded-md bg-gray-100 text-gray-700 flex items-center">
                            <Minus className="w-3.5 h-3.5 mr-1" />
                            No change
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {product.alertPrice && product.isAlertSet && (
                      <div className="mt-2 flex items-center">
                        <Bell className="w-4 h-4 text-primary mr-1" />
                        <span className="text-sm text-primary">
                          Alert set at {formatPrice(product.alertPrice, product.currency)}
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-auto p-0 ml-2"
                            onClick={handleRemoveAlert}
                          >
                            Remove
                          </Button>
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Price History</h3>
                      
                      {isLoadingPriceHistory ? (
                        <Skeleton className="h-60 w-full" />
                      ) : priceHistory.length < 2 ? (
                        <div className="bg-gray-50 rounded-md p-6 text-center">
                          <p className="text-gray-500">Not enough price data to show history</p>
                          <p className="text-sm text-gray-400 mt-1">Price changes will appear here</p>
                        </div>
                      ) : (
                        <>
                          <div className="h-60">
                            <PriceChart priceHistory={priceHistory} height={240} showPriceLabels={true} />
                          </div>
                          
                          {priceExtremes && (
                            <div className="grid grid-cols-3 gap-4 mt-4">
                              <div className="bg-green-50 rounded-md p-3">
                                <div className="text-sm text-gray-500">Lowest Price</div>
                                <div className="text-lg font-medium text-green-700">
                                  {formatPrice(priceExtremes.min.price, product.currency)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatDate(priceExtremes.min.date)}
                                </div>
                              </div>
                              
                              <div className="bg-gray-50 rounded-md p-3">
                                <div className="text-sm text-gray-500">Current Price</div>
                                <div className="text-lg font-medium text-gray-700">
                                  {formatPrice(product.currentPrice, product.currency)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatDate(new Date(product.lastUpdated))}
                                </div>
                              </div>
                              
                              <div className="bg-red-50 rounded-md p-3">
                                <div className="text-sm text-gray-500">Highest Price</div>
                                <div className="text-lg font-medium text-red-700">
                                  {formatPrice(priceExtremes.max.price, product.currency)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatDate(priceExtremes.max.date)}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-bold text-gray-900">Product not found</h2>
                <p className="text-gray-500 mt-2">The product you're looking for doesn't exist or has been removed</p>
                <Link href="/">
                  <Button className="mt-4">
                    Back to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
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
              <Label htmlFor="current-price">Current Price</Label>
              <div id="current-price" className="text-sm font-medium">
                {product ? formatPrice(product.currentPrice, product.currency) : ''}
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
            <Button onClick={handleSetAlert}>
              Set Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Product</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to remove this product from your cart?</p>
            <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
