import React, { useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, PriceHistory } from '@/types';

interface ProductGridProps {
  products: Product[];
  priceHistoryMap: Record<number, PriceHistory[]>;
  isLoading: boolean;
  selectedProductIds: number[];
  onProductSelect: (id: number, isSelected: boolean) => void;
  onRemoveProduct: (id: number) => void;
  onSetAlert: (id: number) => void;
  onToggleFavorite: (id: number, isFavorite: boolean) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ProductGrid({
  products,
  priceHistoryMap,
  isLoading,
  selectedProductIds,
  onProductSelect,
  onRemoveProduct,
  onSetAlert,
  onToggleFavorite,
  currentPage,
  totalPages,
  onPageChange,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between mb-3">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="flex justify-center mb-3">
              <div className="w-40 h-40 bg-gray-200 rounded"></div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-4/5 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-2/5 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-full mb-3"></div>
            <div className="flex justify-between mb-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
        <p className="mt-2 text-sm text-gray-500">
          Try adjusting your filters or adding new products to your cart.
        </p>
      </div>
    );
  }
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            priceHistory={priceHistoryMap[product.id] || []}
            onRemove={onRemoveProduct}
            onSetAlert={onSetAlert}
            onToggleFavorite={onToggleFavorite}
            onSelect={onProductSelect}
            isSelected={selectedProductIds.includes(product.id)}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:bg-gray-100"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'ghost'}
                    size="sm"
                    className={currentPage === page ? 'text-white' : 'text-gray-700 hover:bg-gray-100'}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </Button>
                );
              } else if (
                (page === 2 && currentPage > 3) ||
                (page === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return (
                  <span key={page} className="px-3 py-2 text-sm text-gray-500">
                    ...
                  </span>
                );
              }
              return null;
            })}
            
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:bg-gray-100"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      )}
    </>
  );
}
