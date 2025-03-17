import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { CurrentProductCard } from '@/components/CurrentProductCard';
import { SavedProductsList } from '@/components/SavedProductsList';
import { Footer } from '@/components/Footer';
import { extractProductInfo, openUrl, showNotification } from '@/lib/chromeApi';
import type { Product, ProductInfo, Notification } from '@/types';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function Popup() {
  const { toast } = useToast();
  
  // State
  const [currentProductInfo, setCurrentProductInfo] = useState<ProductInfo | null>(null);
  const [isExtracting, setIsExtracting] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [arePriceAlertsEnabled, setArePriceAlertsEnabled] = useState(true);
  
  // Fetch current product info on load
  useEffect(() => {
    async function loadCurrentProduct() {
      try {
        const productInfo = await extractProductInfo();
        setCurrentProductInfo(productInfo);
      } catch (error) {
        console.error('Error extracting product info:', error);
      } finally {
        setIsExtracting(false);
      }
    }
    
    loadCurrentProduct();
  }, []);
  
  // Queries
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      // In a real app, we would use the current user's ID
      const res = await fetch('/api/products?userId=1');
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });
  
  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      // In a real app, we would use the current user's ID
      const res = await fetch('/api/notifications?userId=1');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    }
  });
  
  // Mutations
  const saveProductMutation = useMutation({
    mutationFn: async (productInfo: ProductInfo) => {
      // In a real app, we would include the user ID in the request
      await apiRequest('POST', '/api/products', {
        ...productInfo,
        userId: 1, // Hardcoded for demo
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Product saved',
        description: 'The product has been added to your cart',
      });
    },
    onError: (error) => {
      console.error('Failed to save product:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest('DELETE', `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Product removed',
        description: 'The product has been removed from your cart',
      });
    },
    onError: (error) => {
      console.error('Failed to delete product:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove product. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Event handlers
  const handleSaveProduct = (product: ProductInfo) => {
    saveProductMutation.mutate(product);
  };
  
  const handleRemoveProduct = (id: number) => {
    setProductToDelete(id);
  };
  
  const confirmDeleteProduct = () => {
    if (productToDelete !== null) {
      deleteProductMutation.mutate(productToDelete);
      setProductToDelete(null);
    }
  };
  
  const handleTogglePriceAlerts = () => {
    setArePriceAlertsEnabled(!arePriceAlertsEnabled);
    toast({
      title: arePriceAlertsEnabled ? 'Price alerts disabled' : 'Price alerts enabled',
    });
  };
  
  const handleSyncProducts = async () => {
    setIsSyncing(true);
    
    // Simulate a sync process
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: 'Sync complete',
        description: 'Your product list has been updated',
      });
    }, 1500);
  };
  
  const handleOpenDashboard = () => {
    openUrl(chrome.runtime.getURL('index.html'));
  };
  
  // Unread notifications count
  const unreadNotificationsCount = notifications.filter(
    (notification: Notification) => !notification.isRead
  ).length;
  
  return (
    <div className="flex flex-col h-[480px] w-[360px] overflow-hidden">
      <Header 
        notificationCount={unreadNotificationsCount}
        onNotificationsClick={() => setShowNotifications(true)}
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <CurrentProductCard
        product={currentProductInfo}
        isLoading={isExtracting}
        onSave={handleSaveProduct}
      />
      
      <SavedProductsList
        products={products}
        isLoading={isLoadingProducts}
        onRemove={handleRemoveProduct}
      />
      
      <Footer
        onTogglePriceAlerts={handleTogglePriceAlerts}
        onSyncProducts={handleSyncProducts}
        arePriceAlertsEnabled={arePriceAlertsEnabled}
        isSyncing={isSyncing}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={productToDelete !== null} 
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this product from your cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteProduct}
              className="bg-error hover:bg-error/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Notifications Dialog */}
      <Dialog 
        open={showNotifications} 
        onOpenChange={setShowNotifications}
      >
        <DialogContent className="max-w-[320px]">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[300px] overflow-y-auto">
            {isLoadingNotifications ? (
              <div className="space-y-2 py-2">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse p-3 rounded-md bg-gray-100">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No notifications</p>
                <p className="text-sm text-gray-400 mt-1">
                  Your price alerts will appear here
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
            <button className="text-xs text-primary hover:underline">
              View All
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Settings Dialog */}
      <Dialog 
        open={showSettings} 
        onOpenChange={setShowSettings}
      >
        <DialogContent className="max-w-[320px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure your SaveCart extension preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Email Notifications
              </label>
              <input
                type="checkbox"
                className="toggle"
                checked={true}
                onChange={() => {}}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Browser Notifications
              </label>
              <input
                type="checkbox"
                className="toggle"
                checked={true}
                onChange={() => {}}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Auto-detect Products
              </label>
              <input
                type="checkbox"
                className="toggle"
                checked={true}
                onChange={() => {}}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">
                Price Drop Threshold
              </label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                <option>5% or more</option>
                <option>10% or more</option>
                <option>15% or more</option>
                <option>20% or more</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all">
              Save Settings
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
