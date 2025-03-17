import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string, currency = "USD"): string {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(numericPrice);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "PPP");
}

export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function calculatePriceDifference(currentPrice: number, originalPrice: number): {
  difference: number;
  percentChange: number;
  isIncrease: boolean;
} {
  const difference = Math.abs(currentPrice - originalPrice);
  const percentChange = (difference / originalPrice) * 100;
  const isIncrease = currentPrice > originalPrice;
  
  return {
    difference,
    percentChange: Math.round(percentChange * 10) / 10, // Round to 1 decimal place
    isIncrease,
  };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getStoreColorClass(store: string): string {
  const storeMap: Record<string, string> = {
    'Amazon': 'bg-orange-100 text-orange-800',
    'Best Buy': 'bg-blue-100 text-blue-800',
    'Walmart': 'bg-yellow-100 text-yellow-800',
    'Target': 'bg-red-100 text-red-800',
    'eBay': 'bg-green-100 text-green-800',
    'Newegg': 'bg-orange-100 text-orange-800',
    'Home Depot': 'bg-orange-100 text-orange-800',
  };
  
  return storeMap[store] || 'bg-gray-100 text-gray-800';
}

export function getDomainFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    
    if (parts.length > 2) {
      // Handle subdomains
      if (parts[parts.length - 2] === 'co' || parts[parts.length - 2] === 'com') {
        return parts[parts.length - 3];
      }
      return parts[parts.length - 2];
    }
    
    return parts[0];
  } catch (e) {
    return 'Unknown';
  }
}

export function getStoreFromUrl(url: string): string {
  const domain = getDomainFromUrl(url).toLowerCase();
  
  const storeMap: Record<string, string> = {
    'amazon': 'Amazon',
    'bestbuy': 'Best Buy',
    'walmart': 'Walmart',
    'target': 'Target',
    'ebay': 'eBay',
    'newegg': 'Newegg',
    'homedepot': 'Home Depot',
  };
  
  return storeMap[domain] || domain.charAt(0).toUpperCase() + domain.slice(1);
}
