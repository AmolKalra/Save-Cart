import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, truncateText } from '@/lib/utils';
import type { ProductInfo } from '@/types';
import { PlusCircle } from 'lucide-react';

interface CurrentProductCardProps {
  product: ProductInfo | null;
  isLoading: boolean;
  onSave: (product: ProductInfo) => void;
}

export function CurrentProductCard({
  product,
  isLoading,
  onSave
}: CurrentProductCardProps) {
  if (isLoading) {
    return (
      <div className="p-4 bg-neutral-light border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-500">CURRENT PAGE PRODUCT</h2>
          <div className="bg-gray-200 animate-pulse w-16 h-6 rounded"></div>
        </div>
        <Card className="shadow-sm">
          <CardContent className="pt-6 pb-4 px-4">
            <div className="flex animate-pulse space-x-3">
              <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4 mt-3"></div>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-9 bg-gray-200 rounded w-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="p-4 bg-neutral-light border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-500">CURRENT PAGE PRODUCT</h2>
        </div>
        <Card className="shadow-sm">
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No product detected on this page.</p>
            <p className="text-sm text-gray-400 mt-2">Visit an e-commerce product page to auto-detect product information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { title, imageUrl, currentPrice, originalPrice, currency, store } = product;
  
  return (
    <div className="p-4 bg-neutral-light border-b border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-500">CURRENT PAGE PRODUCT</h2>
        <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">{store}</span>
      </div>
      <Card className="shadow-sm">
        <CardContent className="pt-6 p-3">
          <div className="flex space-x-3">
            <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/128x128?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium line-clamp-2">
                {truncateText(title, 100)}
              </h3>
              <div className="flex items-baseline mt-1">
                <span className="text-base font-semibold text-gray-900">
                  {formatPrice(currentPrice, currency)}
                </span>
                {originalPrice && (
                  <span className="ml-2 text-sm text-success line-through">
                    {formatPrice(originalPrice, currency)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Button 
              className="w-full flex items-center justify-center"
              onClick={() => onSave(product)}
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Save to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
