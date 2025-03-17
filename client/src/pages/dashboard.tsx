import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardStats } from '@/components/DashboardStats';
import { ProductFilters } from '@/components/ProductFilters';
import { ProductGrid } from '@/components/ProductGrid';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { 
  Product, 
  PriceHistory, 
  Notification, 
  ProductFilters as ProductFiltersType,
  DashboardStats as DashboardStatsType
} from '@/types';
import { useLocation } from 'wouter';

export default function Dashboard() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // State
  const [filters, setFilters] = useState<ProductFiltersType>({});
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToSetAlert, setProductToSetAlert] = useState<Product | null>(null);
  const [alertPrice, setAlertPrice] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Queries
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products', filters],
    queryFn: async ({ queryKey }) => {
      // In a real application, we would construct URL params from filters
      // For now, we'll just fetch all products
      const res = await fetch('/api/products?userId=1');
      if (!res.ok) throw new Error('Failed to fetch products');
      const allProducts = await res.json();
      
      // Apply filters client-side
      return filterProducts(allProducts, filters);
    }
  });
  
  const { data: priceHistoryMap = {}, isLoading: isLoadingPriceHistory } = useQuery({
    queryKey: ['/api/price-history', products?.map(p => p.id)],
    queryFn: async () => {
      if (!products.length) return {};
      
      // Fetch price history for all products
      const historyMap: Record<number, PriceHistory[]> = {};
      
      await Promise.all(products.map(async (product) => {
        const res = await fetch(`/api/price-history/${product.id}`);
        if (res.ok) {
          const history = await res.json();
          historyMap[product.id] = history;
        }
      }));
      
      return historyMap;
    },
    enabled: products.length > 0,
  });
  
  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?userId=1');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    }
  });
  
  // Calculate stats
  const stats: DashboardStatsType = React.useMemo(() => {
    if (isLoadingProducts) {
      return {
        savedProducts: 0,
        priceDrops: 0,
        priceIncreases: 0,
        moneySaved: 0
      };
    }
    
    let priceDrops = 0;
    let priceIncreases = 0;
    let moneySaved = 0;
    
    products.forEach(product => {
      if (product.originalPrice) {
        const originalPrice = Number(product.originalPrice);
        const currentPrice = Number(product.currentPrice);
        
        if (currentPrice < originalPrice) {
          priceDrops++;
          moneySaved += (originalPrice - currentPrice);
        } else if (currentPrice > originalPrice) {
          priceIncreases++;
        }
      }
    });
    
    return {
      savedProducts: products.length,
      priceDrops,
      priceIncreases,
      moneySaved
    };
  }, [products, isLoadingProducts]);
  
  // Store options for filters
  const storeOptions = React.useMemo(() => {
    if (!products.length) return [];
    return [...new Set(products.map(p => p.store))];
  }, [products]);
  
  // Category options would come from a real categorization system
  const categoryOptions = ['Electronics', 'Clothing', 'Home', 'Beauty', 'Books'];
  
  // Mutations
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest('DELETE', `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
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
  
  const setAlertMutation = useMutation({
    mutationFn: async ({ id, price }: { id: number, price: number }) => {
      await apiRequest('PUT', `/api/products/${id}`, {
        isAlertSet: true,
        alertPrice: price,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Price alert set',
        description: "You'll be notified when the price drops to your target",
      });
    },
    onError: (error) => {
      console.error('Failed to set price alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to set price alert. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: number, isFavorite: boolean }) => {
      await apiRequest('PUT', `/api/products/${id}`, {
        isFavorite,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error) => {
      console.error('Failed to update favorite status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorite status. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Event handlers
  const handleRemoveProduct = (id: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setProductToDelete(product);
    }
  };
  
  const confirmDeleteProduct = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id);
      setProductToDelete(null);
    }
  };
  
  const handleSetAlert = (id: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setProductToSetAlert(product);
      setAlertPrice(product.alertPrice?.toString() || product.currentPrice.toString());
    }
  };
  
  const confirmSetAlert = () => {
    if (productToSetAlert && alertPrice) {
      setAlertMutation.mutate({
        id: productToSetAlert.id,
        price: Number(alertPrice),
      });
      setProductToSetAlert(null);
    }
  };
  
  const handleToggleFavorite = (id: number, isFavorite: boolean) => {
    toggleFavoriteMutation.mutate({ id, isFavorite });
  };
  
  const handleProductSelect = (id: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedProductIds(prev => [...prev, id]);
    } else {
      setSelectedProductIds(prev => prev.filter(productId => productId !== id));
    }
  };
  
  const handleCompareSelected = () => {
    if (selectedProductIds.length < 2) {
      toast({
        title: 'Select products',
        description: 'Please select at least 2 products to compare',
      });
      return;
    }
    
    // In a real app, we would pass these IDs to the compare page
    navigate(`/compare?ids=${selectedProductIds.join(',')}`);
  };
  
  const handleFiltersChange = (newFilters: ProductFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Filter products client-side
  function filterProducts(allProducts: Product[], filters: ProductFiltersType): Product[] {
    return allProducts.filter(product => {
      if (filters.store && product.store !== filters.store) return false;
      if (filters.minPrice && Number(product.currentPrice) < filters.minPrice) return false;
      if (filters.maxPrice && Number(product.currentPrice) > filters.maxPrice) return false;
      if (filters.search && !product.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }
  
  // Pagination
  const ITEMS_PER_PAGE = 9;
  const paginatedProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  
  // Unread notifications count
  const unreadNotificationsCount = notifications.filter(
    (notification: Notification) => !notification.isRead
  ).length;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader 
        notificationCount={unreadNotificationsCount}
        onNotificationsClick={() => setShowNotifications(true)}
      />
      
      <main className="p-6 flex-1">
        <DashboardStats 
          stats={stats} 
          isLoading={isLoadingProducts} 
        />
        
        <ProductFilters
          filters={filters}
          storeOptions={storeOptions}
          categoryOptions={categoryOptions}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onCompareSelected={handleCompareSelected}
          selectedCount={selectedProductIds.length}
        />
        
        <ProductGrid
          products={paginatedProducts}
          priceHistoryMap={priceHistoryMap}
          isLoading={isLoadingProducts || isLoadingPriceHistory}
          selectedProductIds={selectedProductIds}
          onProductSelect={handleProductSelect}
          onRemoveProduct={handleRemoveProduct}
          onSetAlert={handleSetAlert}
          onToggleFavorite={handleToggleFavorite}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!productToDelete} 
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{productToDelete?.title}" from your cart?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteProduct}
              className="bg-error hover:bg-error/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Set Alert Dialog */}
      <Dialog 
        open={!!productToSetAlert} 
        onOpenChange={(open) => !open && setProductToSetAlert(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Price Alert</DialogTitle>
            <DialogDescription>
              We'll notify you when the price drops to or below your target price.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product</Label>
              <div id="product-name" className="text-sm font-medium">{productToSetAlert?.title}</div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current-price">Current Price</Label>
              <div id="current-price" className="text-sm font-medium">
                {productToSetAlert?.currentPrice.toString()}
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
            <Button variant="outline" onClick={() => setProductToSetAlert(null)}>
              Cancel
            </Button>
            <Button onClick={confirmSetAlert}>
              Set Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Notifications Dialog */}
      <Dialog 
        open={showNotifications} 
        onOpenChange={setShowNotifications}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoadingNotifications ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-3 rounded-md bg-gray-100">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Set price alerts to get notified about price drops
                </p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-md ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-primary'}`}
                  >
                    <p className="text-sm font-medium">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotifications(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
