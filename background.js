// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('SaveCart extension installed');
  
  // Create default settings
  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          emailNotifications: true,
          pushNotifications: true,
          autoDetectProducts: true,
          priceDropThreshold: 5
        }
      });
    }
  });
});

// Message listener for communication with content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkPrices') {
    checkPrices().then(priceDrops => {
      if (priceDrops.length > 0) {
        notifyPriceDrops(priceDrops);
      }
    });
    return true; // indicates async response
  }
});

// Listen for tabs being updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only run on complete load and for supported e-commerce sites
  if (changeInfo.status === 'complete' && isEcommerceSite(tab.url)) {
    // Tell content script to extract product info
    chrome.tabs.sendMessage(tabId, { action: 'detectProduct' });
  }
});

// Check if URL is from a supported e-commerce site
function isEcommerceSite(url) {
  if (!url) return false;
  
  const supportedDomains = [
    'amazon.com',
    'ebay.com',
    'walmart.com',
    'bestbuy.com',
    'target.com',
    'newegg.com'
  ];
  
  return supportedDomains.some(domain => url.includes(domain));
}

// Price checking functionality
async function checkPrices() {
  const { products } = await chrome.storage.local.get(['products']);
  if (!products || products.length === 0) return [];
  
  const priceDrops = [];
  
  // In a real extension, we would make API calls to check current prices
  // For this implementation, we'll use a simulated check
  for (const product of products) {
    if (product.lastChecked && 
        product.currentPrice < product.lastCheckedPrice && 
        product.isAlertSet) {
      priceDrops.push({
        id: product.id,
        title: product.title,
        oldPrice: product.lastCheckedPrice,
        newPrice: product.currentPrice,
        store: product.store,
        url: product.productUrl
      });
    }
  }
  
  return priceDrops;
}

// Notify user of price drops
function notifyPriceDrops(priceDrops) {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || {};
    
    if (settings.pushNotifications) {
      // Create notification for the first price drop
      const drop = priceDrops[0];
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Price Drop Alert!',
        message: `${drop.title} is now ${formatPrice(drop.newPrice)} at ${drop.store}. You're saving ${formatPrice(drop.oldPrice - drop.newPrice)}!`,
        buttons: [
          { title: 'View Product' }
        ],
        priority: 2
      });
      
      // If there are multiple drops, add a summary notification
      if (priceDrops.length > 1) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Multiple Price Drops',
          message: `${priceDrops.length - 1} more products have price drops. Open SaveCart to view all.`,
          priority: 1
        });
      }
    }
  });
}

// Format price as currency
function formatPrice(price, currency = 'USD') {
  // Define locale based on currency
  const localeMap = {
    'USD': 'en-US',
    'INR': 'en-IN',
    'EUR': 'en-EU',
    'GBP': 'en-GB'
  };
  
  const locale = localeMap[currency] || 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(price);
}

// Set up periodic price checking (every 6 hours)
setInterval(() => {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || {};
    
    // Only check if automatic price checking is enabled
    if (settings.autoDetectProducts) {
      checkPrices().then(priceDrops => {
        if (priceDrops.length > 0) {
          notifyPriceDrops(priceDrops);
        }
      });
    }
  });
}, 6 * 60 * 60 * 1000); // 6 hours
