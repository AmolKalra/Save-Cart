import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPrice, formatTimeAgo } from '@/lib/utils';
import { openUrl } from '@/lib/chromeApi';
import { ChevronLeft, ExternalLink, Heart, Check, X } from 'lucide-react';
import type { Product, PriceHistory, Notification } from '@/types';

export default function Compare() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Parse product IDs from URL
  const params = new URLSearchParams(location.split('?')[1]);
  const productIdsParam = params.get('ids');
  const productIds = productIdsParam ? productIdsParam.split(',').map(Number) : [];
  
  // Queries
  const { data: allProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const res = await fetch('/api/products?userId=1');
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });
  
  const { data: priceHistoryMap = {}, isLoading: isLoadingPriceHistory } = useQuery({
    queryKey: ['/api/price-history', productIds],
    queryFn: async () => {
      if (!productIds.length) return {};
      
      // Fetch price history for all selected products
      const historyMap: Record<number, PriceHistory[]> = {};
      
      await Promise.all(productIds.map(async (productId) => {
        const res = await fetch(`/api/price-history/${productId}`);
        if (res.ok) {
          const history = await res.json();
          historyMap[productId] = history;
        }
      }));
      
      return historyMap;
    },
    enabled: productIds.length > 0,
  });
  
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?userId=1');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
  });
  
  // Filter products to only those selected for comparison
  const selectedProducts = React.useMemo(() => {
    if (isLoadingProducts) return [];
    return allProducts.filter((product: Product) => productIds.includes(product.id));
  }, [allProducts, productIds, isLoadingProducts]);
  
  // Calculate price ranges
  const priceRanges = React.useMemo(() => {
    if (isLoadingPriceHistory || !selectedProducts.length) return {};
    
    const ranges: Record<number, { min: number; max: number; current: number }> = {};
    
    selectedProducts.forEach(product => {
      const history = priceHistoryMap[product.id] || [];
      if (history.length < 2) {
        ranges[product.id] = {
          min: Number(product.currentPrice),
          max: Number(product.currentPrice),
          current: Number(product.currentPrice)
        };
        return;
      }
      
      const prices = history.map(entry => Number(entry.price));
      ranges[product.id] = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        current: Number(product.currentPrice)
      };
    });
    
    return ranges;
  }, [selectedProducts, priceHistoryMap, isLoadingPriceHistory]);
  
  // Price difference between products
  const getPriceDifference = (productA: Product, productB: Product) => {
    const priceA = Number(productA.currentPrice);
    const priceB = Number(productB.currentPrice);
    const difference = priceA - priceB;
    const percentage = (difference / priceB) * 100;
    
    return {
      difference,
      percentage: Math.abs(Math.round(percentage * 10) / 10),
      isMoreExpensive: difference > 0
    };
  };
  
  // Handle visit store
  const handleVisitStore = (productUrl: string) => {
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
          
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Product Comparison</h1>
          
          {isLoadingProducts || isLoadingPriceHistory ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : selectedProducts.length < 2 ? (
            <Card>
              <CardHeader>
                <CardTitle>Select Products to Compare</CardTitle>
                <CardDescription>
                  You need to select at least 2 products to compare
                </CardDescription>
              </CardHeader>
              <CardContent className="py-6 text-center">
                <p className="text-gray-500 mb-4">
                  Go back to the dashboard and select products to compare
                </p>
                <Link href="/">
                  <Button>
                    Go to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Product Image and Basic Info */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: `repeat(${selectedProducts.length}, 1fr)` }}>
                    {selectedProducts.map((product) => (
                      <div key={product.id} className="flex flex-col items-center text-center">
                        <div className="bg-white border border-gray-200 rounded-md p-4 w-40 h-40 flex items-center justify-center">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.title} 
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/160x160?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="text-gray-400 text-sm">No Image</div>
                          )}
                        </div>
                        <h3 className="font-medium text-sm mt-4 line-clamp-2">{product.title}</h3>
                        <div className="text-lg font-bold mt-2">
                          {formatPrice(product.currentPrice, product.currency)}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          From {product.store}
                        </div>
                        <div className="mt-4 flex justify-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVisitStore(product.productUrl)}
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            Visit
                          </Button>
                          <Link href={`/product/${product.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Price Comparison */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Price Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Comparison</TableHead>
                        {selectedProducts.map((product) => (
                          <TableHead key={product.id}>{product.store}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Current Price</TableCell>
                        {selectedProducts.map((product) => (
                          <TableCell key={product.id}>
                            {formatPrice(product.currentPrice, product.currency)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Original Price</TableCell>
                        {selectedProducts.map((product) => (
                          <TableCell key={product.id}>
                            {product.originalPrice 
                              ? formatPrice(product.originalPrice, product.currency)
                              : 'N/A'
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Lowest Recorded Price</TableCell>
                        {selectedProducts.map((product) => (
                          <TableCell key={product.id}>
                            {priceRanges[product.id]
                              ? formatPrice(priceRanges[product.id].min, product.currency)
                              : 'N/A'
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Highest Recorded Price</TableCell>
                        {selectedProducts.map((product) => (
                          <TableCell key={product.id}>
                            {priceRanges[product.id]
                              ? formatPrice(priceRanges[product.id].max, product.currency)
                              : 'N/A'
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Price Alert Set</TableCell>
                        {selectedProducts.map((product) => (
                          <TableCell key={product.id}>
                            {product.isAlertSet ? (
                              <div className="flex items-center">
                                <Check className="w-4 h-4 text-green-500 mr-1" />
                                <span>
                                  {product.alertPrice 
                                    ? formatPrice(product.alertPrice, product.currency)
                                    : 'Yes'
                                  }
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <X className="w-4 h-4 text-red-500 mr-1" />
                                <span>No</span>
                              </div>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Is Favorite</TableCell>
                        {selectedProducts.map((product) => (
                          <TableCell key={product.id}>
                            {product.isFavorite ? (
                              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                            ) : (
                              <Heart className="w-4 h-4 text-gray-400" />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Last Updated</TableCell>
                        {selectedProducts.map((product) => (
                          <TableCell key={product.id}>
                            {formatTimeAgo(product.lastUpdated)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              {/* Price Difference Analysis */}
              {selectedProducts.length === 2 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Price Difference Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const product1 = selectedProducts[0];
                      const product2 = selectedProducts[1];
                      const priceDiff = getPriceDifference(product1, product2);
                      
                      return (
                        <div className="p-4 rounded-md bg-gray-50">
                          <div className="text-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900">
                              {priceDiff.isMoreExpensive
                                ? `${product1.store} is more expensive than ${product2.store}`
                                : priceDiff.difference === 0
                                ? `${product1.store} and ${product2.store} have the same price`
                                : `${product1.store} is cheaper than ${product2.store}`
                              }
                            </h3>
                            {priceDiff.difference !== 0 && (
                              <p className="text-sm text-gray-500 mt-1">
                                Price difference: {formatPrice(Math.abs(priceDiff.difference), product1.currency)} ({priceDiff.percentage}%)
                              </p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
                            <div className={`p-4 rounded-md ${priceDiff.isMoreExpensive ? 'bg-red-50' : priceDiff.difference === 0 ? 'bg-gray-100' : 'bg-green-50'}`}>
                              <div className="text-center">
                                <h4 className="font-medium">{product1.store}</h4>
                                <div className={`text-xl font-bold mt-2 ${priceDiff.isMoreExpensive ? 'text-red-600' : priceDiff.difference === 0 ? 'text-gray-800' : 'text-green-600'}`}>
                                  {formatPrice(product1.currentPrice, product1.currency)}
                                </div>
                              </div>
                            </div>
                            
                            <div className={`p-4 rounded-md ${!priceDiff.isMoreExpensive && priceDiff.difference !== 0 ? 'bg-red-50' : priceDiff.difference === 0 ? 'bg-gray-100' : 'bg-green-50'}`}>
                              <div className="text-center">
                                <h4 className="font-medium">{product2.store}</h4>
                                <div className={`text-xl font-bold mt-2 ${!priceDiff.isMoreExpensive && priceDiff.difference !== 0 ? 'text-red-600' : priceDiff.difference === 0 ? 'text-gray-800' : 'text-green-600'}`}>
                                  {formatPrice(product2.currentPrice, product2.currency)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                              {priceDiff.difference === 0
                                ? "Both products are currently priced the same. Compare features to make your decision."
                                : priceDiff.isMoreExpensive
                                ? `You'll save ${formatPrice(Math.abs(priceDiff.difference), product1.currency)} by purchasing from ${product2.store}.`
                                : `You'll save ${formatPrice(Math.abs(priceDiff.difference), product1.currency)} by purchasing from ${product1.store}.`
                              }
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
              
              {/* Features Comparison (simplified) */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        {selectedProducts.map((product) => (
                          <TableHead key={product.id}>{product.store}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Product URL</TableCell>
                        {selectedProducts.map((product) => (
                          <TableCell key={product.id}>
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-primary"
                              onClick={() => handleVisitStore(product.productUrl)}
                            >
                              Visit Store
                              <ExternalLink className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Date Added</TableCell>
                        {selectedProducts.map((product) => (
                          <TableCell key={product.id}>
                            {new Date(product.createdAt).toLocaleDateString()}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
