import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, ChevronDown } from 'lucide-react';
import type { ProductFilters as ProductFiltersType } from '@/types';

interface ProductFiltersProps {
  filters: ProductFiltersType;
  storeOptions: string[];
  categoryOptions: string[];
  onFiltersChange: (filters: ProductFiltersType) => void;
  onClearFilters: () => void;
  onCompareSelected: () => void;
  selectedCount: number;
}

export function ProductFilters({
  filters,
  storeOptions,
  categoryOptions,
  onFiltersChange,
  onClearFilters,
  onCompareSelected,
  selectedCount
}: ProductFiltersProps) {
  const [search, setSearch] = useState(filters.search || '');
  
  const handleStoreChange = (value: string) => {
    onFiltersChange({
      ...filters,
      store: value === 'all' ? undefined : value
    });
  };
  
  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      category: value === 'all' ? undefined : value
    });
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({
      ...filters,
      search: search.trim() || undefined
    });
  };
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <span>{filters.store || 'All Stores'}</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup value={filters.store || 'all'} onValueChange={handleStoreChange}>
              <DropdownMenuRadioItem value="all">All Stores</DropdownMenuRadioItem>
              {storeOptions.map(store => (
                <DropdownMenuRadioItem key={store} value={store}>{store}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <span>{filters.category || 'All Categories'}</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup value={filters.category || 'all'} onValueChange={handleCategoryChange}>
              <DropdownMenuRadioItem value="all">All Categories</DropdownMenuRadioItem>
              {categoryOptions.map(category => (
                <DropdownMenuRadioItem key={category} value={category}>{category}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <span>Price Range</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-2">
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Min"
                className="h-8"
                value={filters.minPrice || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  onFiltersChange({
                    ...filters,
                    minPrice: value,
                  });
                }}
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                placeholder="Max"
                className="h-8"
                value={filters.maxPrice || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  onFiltersChange({
                    ...filters,
                    maxPrice: value,
                  });
                }}
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {(filters.store || filters.category || filters.minPrice || filters.maxPrice || filters.search) && (
          <Button
            variant="link"
            className="text-primary hover:text-primary-dark text-sm font-medium h-auto p-0"
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>
      
      <div className="flex items-center space-x-2 w-full md:w-auto">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={handleSearchChange}
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Button type="submit" className="hidden">Search</Button>
        </form>
        
        <Button
          onClick={onCompareSelected}
          disabled={selectedCount < 2}
        >
          Compare {selectedCount > 0 ? `(${selectedCount})` : 'Selected'}
        </Button>
      </div>
    </div>
  );
}
