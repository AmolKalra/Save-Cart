import type { ProductInfo } from "@/types";

// Check if running in Chrome extension context
export const isExtension = !!window.chrome?.runtime?.id;

// Get the current tab
export async function getCurrentTab() {
  if (!isExtension) return null;
  
  try {
    const queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  } catch (error) {
    console.error("Error getting current tab:", error);
    return null;
  }
}

// Extract product data from a webpage
export async function extractProductInfo(): Promise<ProductInfo | null> {
  if (!isExtension) return null;
  
  try {
    const tab = await getCurrentTab();
    if (!tab?.id || !tab.url) return null;
    
    // Execute content script to extract product data
    const result = await chrome.tabs.sendMessage(tab.id, { action: "extractProductInfo" });
    
    if (result?.productInfo) {
      return {
        ...result.productInfo,
        store: result.productInfo.store || getStoreFromUrl(tab.url),
        productUrl: tab.url
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting product info:", error);
    return null;
  }
}

// Helper function to determine the store based on URL
function getStoreFromUrl(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase();
  
  if (hostname.includes('amazon')) return 'Amazon';
  if (hostname.includes('walmart')) return 'Walmart';
  if (hostname.includes('bestbuy')) return 'Best Buy';
  if (hostname.includes('ebay')) return 'eBay';
  if (hostname.includes('target')) return 'Target';
  if (hostname.includes('newegg')) return 'Newegg';
  
  // Extract domain name without TLD
  const match = hostname.match(/([^.]+)\.[^.]+$/);
  if (match && match[1]) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1);
  }
  
  return 'Other';
}

// Open a URL in a new tab
export function openUrl(url: string) {
  if (isExtension) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank');
  }
}

// Show a browser notification
export function showNotification(title: string, message: string) {
  if (isExtension && chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icon-128.png',
      title,
      message,
    });
  } else {
    // Fallback for web
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }
}

// Store data in extension storage
export async function storeData(key: string, value: any) {
  if (!isExtension) {
    localStorage.setItem(key, JSON.stringify(value));
    return;
  }
  
  return new Promise<void>((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// Retrieve data from extension storage
export async function getData<T>(key: string): Promise<T | null> {
  if (!isExtension) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key] || null);
      }
    });
  });
}

// Check if the extension has permission to access notifications
export async function checkNotificationPermission(): Promise<boolean> {
  if (!isExtension) {
    if (!('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }
  
  return new Promise((resolve) => {
    chrome.permissions.contains({ permissions: ['notifications'] }, (result) => {
      resolve(result);
    });
  });
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isExtension) {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return new Promise((resolve) => {
    chrome.permissions.request({ permissions: ['notifications'] }, (granted) => {
      resolve(granted);
    });
  });
}
