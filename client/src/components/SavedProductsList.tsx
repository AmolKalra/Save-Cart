import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { formatPrice, formatTimeAgo, truncateText } from '@/lib/utils';
import type { Product } from '@/types';
import { X as XIcon } from 'lucide-react';

interface SavedProductsListProps {
  products: Product[];
  isLoading: boolean;
  onRemove: (id: number) => void;
}

export function SavedProductsList({
  products,
  isLoading,
  onRemove
}: SavedProductsListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500">SAVED PRODUCTS</h2>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <div className="flex space-x-3">
                <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (products.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500">SAVED PRODUCTS (0)</h2>
        </div>
        
        <div className="text-center py-10">
          <p className="text-gray-500">No products saved yet.</p>
          <p className="text-sm text-gray-400 mt-2">Browse e-commerce sites and save products to track prices.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500">
          SAVED PRODUCTS ({products.length})
        </h2>
        <div>
          <Link href="/">
            <Button variant="link" size="sm" className="text-xs text-primary-dark h-auto p-0">
              View All
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="space-y-3">
        {products.map((product) => (
          <Card
            key={product.id}
            className="hover:border-gray-300 transition-all"
          >
            <CardContent className="p-3">
              <div className="flex space-x-3">
                <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
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
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-medium line-clamp-2">
                      {truncateText(product.title, 80)}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 h-auto w-auto p-0 text-gray-400 hover:text-gray-600"
                      onClick={() => onRemove(product.id)}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-baseline mt-1">
                    <span className="text-base font-semibold text-gray-900">
                      {formatPrice(product.currentPrice, product.currency)}
                    </span>
                    
                    {product.originalPrice && Number(product.currentPrice) < Number(product.originalPrice) && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-success text-white rounded">
                        -{Math.round(((Number(product.originalPrice) - Number(product.currentPrice)) / Number(product.originalPrice)) * 100)}%
                      </span>
                    )}
                    
                    {product.originalPrice && Number(product.currentPrice) > Number(product.originalPrice) && (
                      <span className="ml-2 text-xs text-error">
                        +{formatPrice(Number(product.currentPrice) - Number(product.originalPrice), product.currency)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <span>{product.store}</span>
                    <span className="mx-1">•</span>
                    <span>Saved {formatTimeAgo(product.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
