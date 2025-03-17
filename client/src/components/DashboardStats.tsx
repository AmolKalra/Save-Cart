import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import type { DashboardStats as DashboardStatsType } from '@/types';
import { 
  ShoppingBag, 
  TrendingDown, 
  TrendingUp, 
  DollarSign
} from 'lucide-react';

interface DashboardStatsProps {
  stats: DashboardStatsType;
  isLoading?: boolean;
}

export function DashboardStats({ stats, isLoading = false }: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 mt-1"></div>
                </div>
                <div className="bg-gray-200 p-2 rounded-lg w-10 h-10"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-32 mt-3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Saved Products</p>
              <h3 className="text-2xl font-bold mt-1">{stats.savedProducts}</h3>
            </div>
            <div className="bg-primary-light/10 p-2 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            From {Math.min(3, stats.savedProducts)} different store{stats.savedProducts !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Price Drops</p>
              <h3 className="text-2xl font-bold mt-1 text-success">{stats.priceDrops}</h3>
            </div>
            <div className="bg-success/10 p-2 rounded-lg">
              <TrendingDown className="w-6 h-6 text-success" />
            </div>
          </div>
          {stats.priceDrops > 0 ? (
            <p className="text-xs text-success mt-3">
              Save up to {formatPrice(stats.moneySaved)} total
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-3">No price drops detected yet</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Price Increases</p>
              <h3 className="text-2xl font-bold mt-1 text-error">{stats.priceIncreases}</h3>
            </div>
            <div className="bg-error/10 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-error" />
            </div>
          </div>
          {stats.priceIncreases > 0 ? (
            <p className="text-xs text-error mt-3">
              Increased by {formatPrice(stats.priceIncreases * 10)} total
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-3">No price increases detected</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Money Saved</p>
              <h3 className="text-2xl font-bold mt-1">{formatPrice(stats.moneySaved)}</h3>
            </div>
            <div className="bg-secondary/10 p-2 rounded-lg">
              <DollarSign className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Since using SaveCart</p>
        </CardContent>
      </Card>
    </div>
  );
}
