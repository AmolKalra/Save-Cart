import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PriceChart } from '@/components/ui/price-chart';
import { formatPrice, formatTimeAgo, getStoreColorClass, calculatePriceDifference } from '@/lib/utils';
import type { Product, PriceHistory } from '@/types';
import { openUrl } from '@/lib/chromeApi';
import { Link } from 'wouter';
import { Heart, Eye, Bell, Trash2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  priceHistory: PriceHistory[];
  onRemove?: (id: number) => void;
  onSetAlert?: (id: number) => void;
  onToggleFavorite?: (id: number, isFavorite: boolean) => void;
  onSelect?: (id: number, isSelected: boolean) => void;
  isSelected?: boolean;
}

export function ProductCard({
  product,
  priceHistory,
  onRemove,
  onSetAlert,
  onToggleFavorite,
  onSelect,
  isSelected = false
}: ProductCardProps) {
  const {
    id,
    title,
    imageUrl,
    currentPrice,
    originalPrice,
    currency,
    store,
    productUrl,
    lastUpdated,
    isAlertSet,
    isFavorite
  } = product;

  // Calculate price difference if original price exists
  const priceDifference = originalPrice ? calculatePriceDifference(
    Number(currentPrice),
    Number(originalPrice)
  ) : null;

  const handleVisitStore = () => {
    openUrl(productUrl);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <span className={`text-xs px-2 py-1 rounded ${getStoreColorClass(store)}`}>
            {store}
          </span>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className={`p-1 rounded-full ${isFavorite ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => onToggleFavorite?.(id, !isFavorite)}
            >
              <Heart className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
            </Button>
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(id, checked as boolean)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            )}
          </div>
        </div>
        
        <div className="mt-3 flex justify-center">
          <div className="w-40 h-40 bg-gray-100 rounded overflow-hidden">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/320x320?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="font-medium text-base line-clamp-2">{title}</h3>
          
          <div className="flex items-baseline mt-2">
            <span className="text-xl font-semibold text-gray-900">
              {formatPrice(currentPrice, currency)}
            </span>
            
            {originalPrice && priceDifference && (
              <>
                <span className={`ml-2 text-sm ${priceDifference.isIncrease ? 'text-error' : 'text-success line-through'}`}>
                  {formatPrice(originalPrice, currency)}
                </span>
                
                {Math.abs(priceDifference.percentChange) >= 1 && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${priceDifference.isIncrease ? 'bg-error' : 'bg-success'} text-white`}>
                    {priceDifference.isIncrease ? '+' : '-'}{priceDifference.percentChange}%
                  </span>
                )}
              </>
            )}
            
            {!originalPrice && (
              <span className="ml-2 text-sm text-gray-500">No change</span>
            )}
          </div>
          
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Price History (30 days)</div>
            <PriceChart priceHistory={priceHistory} />
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <div className="text-xs text-gray-500">
              Last updated: {formatTimeAgo(lastUpdated)}
            </div>
            <Link href={`/product/${id}`} className="text-xs text-primary hover:text-primary-dark font-medium">
              View Details
            </Link>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-gray-200 p-3 bg-gray-50 flex justify-between">
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" onClick={handleVisitStore}>
          <Eye className="w-4 h-4 mr-1" />
          Visit Store
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={`text-gray-600 hover:text-gray-900 ${isAlertSet ? 'text-primary' : ''}`}
          onClick={() => onSetAlert?.(id)}
        >
          <Bell className="w-4 h-4 mr-1" />
          {isAlertSet ? 'Alert Set' : 'Set Alert'}
        </Button>
        
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:text-error" onClick={() => onRemove?.(id)}>
          <Trash2 className="w-4 h-4 mr-1" />
          Remove
        </Button>
      </CardFooter>
    </Card>
  );
}
