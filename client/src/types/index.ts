export interface Product {
  id: number;
  userId: number;
  title: string;
  imageUrl?: string;
  currentPrice: number;
  originalPrice?: number;
  currency: string;
  store: string;
  productUrl: string;
  createdAt: string;
  lastUpdated: string;
  isAlertSet: boolean;
  alertPrice?: number;
  isFavorite: boolean;
}

export interface ProductInfo {
  title: string;
  imageUrl?: string;
  currentPrice: number;
  originalPrice?: number;
  currency: string;
  store: string;
  productUrl: string;
}

export interface PriceHistory {
  id: number;
  productId: number;
  price: number;
  date: string;
}

export interface Notification {
  id: number;
  userId: number;
  productId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface DashboardStats {
  savedProducts: number;
  priceDrops: number;
  priceIncreases: number;
  moneySaved: number;
}

export interface ProductFilters {
  store?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface AlertSettings {
  email: boolean;
  pushNotifications: boolean;
  priceDropPercentage: number;
}
