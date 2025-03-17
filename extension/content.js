// Product extraction strategies for different e-commerce sites
const extractors = {
  'amazon.com': extractAmazonProduct,
  'ebay.com': extractEbayProduct,
  'walmart.com': extractWalmartProduct,
  'bestbuy.com': extractBestBuyProduct,
  'target.com': extractTargetProduct,
  'newegg.com': extractNeweggProduct,
  'flipkart.com': extractFlipkartProduct,
  // Default fallback extractor
  'default': extractGenericProduct
};

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractProductInfo') {
    const productInfo = extractProductInfo();
    sendResponse({ productInfo });
    return true;
  }
  
  if (message.action === 'detectProduct') {
    // Only auto-detect if we're on a product page
    if (isProductPage()) {
      const productInfo = extractProductInfo();
      
      // Only display notification if we successfully extracted product info
      if (productInfo && productInfo.title && productInfo.currentPrice) {
        showProductDetectedNotification(productInfo);
      }
    }
    return true;
  }
});

// Main function to extract product info based on the current website
function extractProductInfo() {
  const hostname = window.location.hostname;
  let extractorName = 'default';
  
  // Find the matching extractor based on domain
  for (const domain in extractors) {
    if (hostname.includes(domain)) {
      extractorName = domain;
      break;
    }
  }
  
  try {
    const productInfo = extractors[extractorName]();
    
    // Add the store name based on hostname
    if (productInfo) {
      productInfo.store = getStoreName(hostname);
      productInfo.productUrl = window.location.href;
    }
    
    return productInfo;
  } catch (error) {
    console.error('Error extracting product info:', error);
    return null;
  }
}

// Check if current page is a product page
function isProductPage() {
  // Look for common product page indicators
  const hasPrice = document.querySelector('[data-price], .price, .product-price, [itemprop="price"]') !== null;
  const hasProductTitle = document.querySelector('[itemprop="name"], .product-title, .product-name, h1.title') !== null;
  const hasAddToCart = document.querySelector('button[data-action="add-to-cart"], .add-to-cart, #add-to-cart, [id*="ddToCart"], [id*="addToCart"]') !== null;
  
  return hasPrice && (hasProductTitle || hasAddToCart);
}

// Amazon product extractor
function extractAmazonProduct() {
  console.log("Running Amazon extractor with updated selectors");

  // Extract title - using exact selector from the example
  const titleElement = document.querySelector('#productTitle');
  let title = titleElement?.textContent.trim();
    
  console.log("Detected title element:", titleElement);
  console.log("Detected title text:", title);
  
  if (!title) {
    console.log("No title found with #productTitle, trying alternate selectors");
    title = document.querySelector('.product-title-word-break')?.textContent.trim() ||
            document.querySelector('[data-feature-name="title"]')?.textContent.trim() ||
            document.querySelector('h1')?.textContent.trim();
            
    console.log("Alternate title found:", title);
    
    if (!title) {
      console.log("No title found at all, not a product page");
      return null; // Not a product page
    }
  }
  
  let currentPrice = null;
  
  // Try the specific price selector from the example
  const priceWhole = document.querySelector('.a-price-whole');
  console.log("Price whole element:", priceWhole);
  
  if (priceWhole) {
    const priceText = priceWhole.textContent.trim();
    console.log("Price text found:", priceText);
    currentPrice = extractPriceValue(priceText);
    console.log("Extracted price value:", currentPrice);
  } else {
    console.log("No .a-price-whole element found, trying alternate selectors");
    
    // Try various price selectors for Amazon's changing UI
    const priceElement = 
      document.querySelector('.a-price .a-offscreen') || 
      document.querySelector('#priceblock_ourprice') || 
      document.querySelector('#priceblock_dealprice') ||
      document.querySelector('.a-price') ||
      document.querySelector('.priceToPay') ||
      document.querySelector('[data-a-color="price"] .a-offscreen') ||
      document.querySelector('#corePrice_feature_div .a-price');
    
    if (priceElement) {
      const priceText = priceElement.textContent.trim();
      console.log("Alternate price text found:", priceText);
      currentPrice = extractPriceValue(priceText);
      console.log("Extracted alternate price value:", currentPrice);
    } else {
      console.log("No price element found with any selector");
      // For debugging, let's log all elements with 'price' in their class or id
      const potentialPriceElements = document.querySelectorAll('[id*="price"], [class*="price"], [data-a-color="price"]');
      console.log("Potential price elements found:", potentialPriceElements.length);
      potentialPriceElements.forEach((el, i) => {
        if (i < 10) { // Limit to first 10 to avoid excessive logging
          console.log(`Element ${i}:`, el.tagName, el.id, el.className, el.textContent.trim());
        }
      });
    }
  }
  
  // Get original price if available (for deals)
  let originalPrice = null;
  const originalPriceElement = 
    document.querySelector('.a-text-price .a-offscreen') || 
    document.querySelector('.a-text-price') ||
    document.querySelector('.basisPrice .a-offscreen') ||
    document.querySelector('[data-a-strike="true"]') ||
    document.querySelector('.a-price.a-text-price');
  
  if (originalPriceElement) {
    const priceText = originalPriceElement.textContent.trim();
    console.log("Original price text:", priceText);
    originalPrice = extractPriceValue(priceText);
    console.log("Extracted original price:", originalPrice);
  }
  
  // Get product image - use the exact selector from the example
  let imageUrl = null;
  const landingImage = document.querySelector('#landingImage');
  console.log("Landing image element:", landingImage);
  
  if (landingImage) {
    // Try to get the high-res image URL
    imageUrl = landingImage.getAttribute('data-old-hires') || landingImage.src;
    console.log("Image URL found from #landingImage:", imageUrl);
  } else {
    console.log("No #landingImage found, trying alternate selectors");
    
    const imageElement = 
      document.querySelector('#imgBlkFront') ||
      document.querySelector('#main-image') ||
      document.querySelector('[data-old-hires]') ||
      document.querySelector('[data-a-image-name="landingImage"]') ||
      document.querySelector('img[alt="' + title + '"]');
      
    if (imageElement) {
      // Try different image attributes that Amazon might use
      imageUrl = imageElement.getAttribute('data-old-hires') || 
                imageElement.src || 
                imageElement.getAttribute('data-a-dynamic-image');
      console.log("Image URL found from alternate selectors:", imageUrl);
    } else {
      console.log("No image found with any selector");
    }
  }
  
  // Determine currency from the page
  let currency = 'USD'; // Default
  
  // Check if we're on amazon.in (India)
  if (window.location.hostname.includes('.in')) {
    currency = 'INR';
    console.log("Detected Amazon India, setting currency to INR");
  } 
  // Check for common currency symbols in the price text
  else if (document.body.textContent.includes('₹')) {
    currency = 'INR';
    console.log("Found ₹ symbol, setting currency to INR");
  } else if (document.body.textContent.includes('€')) {
    currency = 'EUR';
    console.log("Found € symbol, setting currency to EUR");
  } else if (document.body.textContent.includes('£')) {
    currency = 'GBP';
    console.log("Found £ symbol, setting currency to GBP");
  }
  
  const result = {
    title,
    currentPrice,
    originalPrice: originalPrice && originalPrice > currentPrice ? originalPrice : null,
    imageUrl,
    currency,
    store: 'Amazon'
  };
  
  console.log("Amazon extractor result:", result);
  return result;
}

// eBay product extractor
function extractEbayProduct() {
  const title = document.querySelector('h1.x-item-title__mainTitle span')?.textContent.trim();
  if (!title) return null; // Not a product page
  
  let currentPrice = null;
  const priceElement = 
    document.querySelector('[itemprop="price"]') || 
    document.querySelector('span.notranslate');
  
  if (priceElement) {
    const priceText = priceElement.textContent.trim();
    currentPrice = extractPriceValue(priceText);
  }
  
  // Get original price
  let originalPrice = null;
  const originalPriceElement = document.querySelector('.original-price');
  if (originalPriceElement) {
    const priceText = originalPriceElement.textContent.trim();
    originalPrice = extractPriceValue(priceText);
  }
  
  // Get product image
  let imageUrl = null;
  const imageElement = document.querySelector('#icImg') || document.querySelector('.img img');
  if (imageElement) {
    imageUrl = imageElement.src;
  }
  
  return {
    title,
    currentPrice,
    originalPrice: originalPrice && originalPrice > currentPrice ? originalPrice : null,
    imageUrl,
    currency: 'USD'
  };
}

// Walmart product extractor
function extractWalmartProduct() {
  const title = document.querySelector('h1[itemprop="name"], h1.prod-title')?.textContent.trim();
  if (!title) return null; // Not a product page
  
  let currentPrice = null;
  
  // Try various price selectors
  const priceElement = 
    document.querySelector('[itemprop="price"]') || 
    document.querySelector('.price-characteristic') ||
    document.querySelector('[data-automation="product-price"]');
  
  if (priceElement) {
    const priceText = priceElement.textContent.trim();
    currentPrice = extractPriceValue(priceText);
  }
  
  // Get original price
  let originalPrice = null;
  const originalPriceElement = 
    document.querySelector('.strikethrough-price') || 
    document.querySelector('.was-price');
  
  if (originalPriceElement) {
    const priceText = originalPriceElement.textContent.trim();
    originalPrice = extractPriceValue(priceText);
  }
  
  // Get product image
  let imageUrl = null;
  const imageElement = document.querySelector('.prod-hero-image');
  if (imageElement) {
    imageUrl = imageElement.src;
  }
  
  return {
    title,
    currentPrice,
    originalPrice: originalPrice && originalPrice > currentPrice ? originalPrice : null,
    imageUrl,
    currency: 'USD'
  };
}

// Best Buy product extractor
function extractBestBuyProduct() {
  const title = document.querySelector('.heading-5, .sku-title h1')?.textContent.trim();
  if (!title) return null; // Not a product page
  
  let currentPrice = null;
  
  // Try various price selectors
  const priceElement = 
    document.querySelector('.priceView-customer-price span') || 
    document.querySelector('.priceView-purchase-price');
  
  if (priceElement) {
    const priceText = priceElement.textContent.trim();
    currentPrice = extractPriceValue(priceText);
  }
  
  // Get original price
  let originalPrice = null;
  const originalPriceElement = document.querySelector('.pricing-price__regular-price');
  
  if (originalPriceElement) {
    const priceText = originalPriceElement.textContent.trim();
    originalPrice = extractPriceValue(priceText);
  }
  
  // Get product image
  let imageUrl = null;
  const imageElement = document.querySelector('.primary-image');
  if (imageElement) {
    imageUrl = imageElement.src;
  }
  
  return {
    title,
    currentPrice,
    originalPrice: originalPrice && originalPrice > currentPrice ? originalPrice : null,
    imageUrl,
    currency: 'USD'
  };
}

// Target product extractor
function extractTargetProduct() {
  const title = document.querySelector('[data-test="product-title"]')?.textContent.trim();
  if (!title) return null; // Not a product page
  
  let currentPrice = null;
  
  // Try various price selectors
  const priceElement = document.querySelector('[data-test="product-price"]');
  
  if (priceElement) {
    const priceText = priceElement.textContent.trim();
    currentPrice = extractPriceValue(priceText);
  }
  
  // Get original price
  let originalPrice = null;
  const originalPriceElement = document.querySelector('[data-test="product-price-was"]');
  
  if (originalPriceElement) {
    const priceText = originalPriceElement.textContent.trim();
    originalPrice = extractPriceValue(priceText);
  }
  
  // Get product image
  let imageUrl = null;
  const imageElement = document.querySelector('[data-test="product-image"]');
  if (imageElement) {
    imageUrl = imageElement.src;
  }
  
  return {
    title,
    currentPrice,
    originalPrice: originalPrice && originalPrice > currentPrice ? originalPrice : null,
    imageUrl,
    currency: 'USD'
  };
}

// Newegg product extractor
function extractNeweggProduct() {
  const title = document.querySelector('.product-title')?.textContent.trim();
  if (!title) return null; // Not a product page
  
  let currentPrice = null;
  
  // Try various price selectors
  const priceElement = 
    document.querySelector('.price-current') || 
    document.querySelector('.product-price');
  
  if (priceElement) {
    const priceText = priceElement.textContent.trim();
    currentPrice = extractPriceValue(priceText);
  }
  
  // Get original price
  let originalPrice = null;
  const originalPriceElement = document.querySelector('.price-was');
  
  if (originalPriceElement) {
    const priceText = originalPriceElement.textContent.trim();
    originalPrice = extractPriceValue(priceText);
  }
  
  // Get product image
  let imageUrl = null;
  const imageElement = document.querySelector('.product-view-img-original');
  if (imageElement) {
    imageUrl = imageElement.src;
  }
  
  return {
    title,
    currentPrice,
    originalPrice: originalPrice && originalPrice > currentPrice ? originalPrice : null,
    imageUrl,
    currency: 'USD'
  };
}

// Flipkart product extractor
function extractFlipkartProduct() {
  console.log("Running Flipkart extractor with updated selectors");
  
  // Log all potential title elements to help debug
  console.log("All potential title elements:");
  const allTitleElements = document.querySelectorAll('h1, [class*="title"], [class*="name"], .B_NuCI, .yhB1nd');
  allTitleElements.forEach((el, i) => {
    if (i < 5) { // Limit to first 5 to avoid excessive logging
      console.log(`Title element ${i}:`, el.tagName, el.className, el.textContent.trim());
    }
  });
  
  // Extract product title - using multiple possible selectors for Flipkart's changing UI
  const titleElement = document.querySelector('.B_NuCI');
  let title = titleElement?.textContent.trim();
  
  console.log("Main title element:", titleElement);
  console.log("Main title text:", title);
  
  if (!title) {
    console.log("No title found with .B_NuCI, trying alternate selectors");
    title = 
      document.querySelector('h1.yhB1nd')?.textContent.trim() ||
      document.querySelector('span.B_NuCI')?.textContent.trim() ||
      document.querySelector('h1[class*="title"]')?.textContent.trim() ||
      document.querySelector('h1')?.textContent.trim();
    
    console.log("Alternate title found:", title);
    
    if (!title) {
      console.log("No title found at all, not a product page");
      return null; // Not a product page
    }
  }
  
  let currentPrice = null;
  
  // Log all potential price elements to help debug
  console.log("All potential price elements:");
  const allPriceElements = document.querySelectorAll('[class*="price"], [class*="Price"], ._30jeq3');
  allPriceElements.forEach((el, i) => {
    if (i < 5) { // Limit to first 5 to avoid excessive logging
      console.log(`Price element ${i}:`, el.tagName, el.className, el.textContent.trim());
    }
  });
  
  // Try various price selectors for Flipkart's changing UI
  const priceElement = 
    document.querySelector('._30jeq3._16Jk6d') || // Main price selector
    document.querySelector('._30jeq3') ||         // Alternative price selector
    document.querySelector('.aMaAEs') ||          // Mobile app view price
    document.querySelector('div[class*="_30jeq3"]') || // Class-based selector
    document.querySelector('div[class*="price"]');     // Generic price class
  
  console.log("Main price element:", priceElement);
  
  if (priceElement) {
    const priceText = priceElement.textContent.trim();
    console.log("Price text found:", priceText);
    currentPrice = extractPriceValue(priceText);
    console.log("Extracted price value:", currentPrice);
  } else {
    console.log("No price element found with known selectors, looking for any elements with price text");
    
    // Try to find any element that looks like a price (contains ₹ symbol)
    const allElements = document.querySelectorAll('*');
    for (let i = 0; i < allElements.length; i++) {
      const text = allElements[i].textContent.trim();
      if (text.includes('₹') && text.length < 15) {
        console.log("Found element with ₹ symbol:", allElements[i].tagName, allElements[i].className, text);
        currentPrice = extractPriceValue(text);
        console.log("Extracted price from ₹ symbol element:", currentPrice);
        if (currentPrice) break;
      }
    }
    
    if (!currentPrice) {
      console.log("Still no price found, trying generic number detection");
      // Look for elements that might contain prices (numbers with commas/periods)
      const priceRegex = /(?:₹|Rs\.?|INR)?\s*[\d,]+\.?\d*/i;
      for (let i = 0; i < allElements.length; i++) {
        const text = allElements[i].textContent.trim();
        const match = text.match(priceRegex);
        if (match && text.length < 15) {
          console.log("Found element with price-like text:", allElements[i].tagName, allElements[i].className, text);
          currentPrice = extractPriceValue(match[0]);
          console.log("Extracted price from price-like text:", currentPrice);
          if (currentPrice) break;
        }
      }
    }
  }
  
  // Get original price (strikethrough price) if available for discounts
  let originalPrice = null;
  const originalPriceElement = 
    document.querySelector('._3I9_wc._2p6lqe') || // Main original price selector
    document.querySelector('._3I9_wc') ||         // Alternative original price selector
    document.querySelector('[class*="striked"]'); // Any striked price
  
  console.log("Original price element:", originalPriceElement);
  
  if (originalPriceElement) {
    const priceText = originalPriceElement.textContent.trim();
    console.log("Original price text:", priceText);
    originalPrice = extractPriceValue(priceText);
    console.log("Extracted original price:", originalPrice);
  }
  
  // Get product image
  let imageUrl = null;
  
  // Log all potential image elements to help debug
  console.log("All potential image elements:");
  const allImageElements = document.querySelectorAll('img[class*="product"], img[class*="image"], ._396cs4, ._2r_T1I');
  allImageElements.forEach((el, i) => {
    if (i < 5) { // Limit to first 5 to avoid excessive logging
      console.log(`Image element ${i}:`, el.tagName, el.className, el.src);
    }
  });
  
  const imageElement = 
    document.querySelector('._396cs4') || // Main product image
    document.querySelector('._2r_T1I') ||  // Alternative image selector
    document.querySelector('img[class*="product-image"]') ||
    document.querySelector('.CXW8mj img') || // Another common image container
    document.querySelector('img[alt="' + title + '"]'); // Image with same alt text as title
                        
  console.log("Main image element:", imageElement);
  
  if (imageElement) {
    imageUrl = imageElement.src;
    console.log("Image URL found:", imageUrl);
  } else {
    console.log("No image found with known selectors, looking for any product images");
    
    // Look for any large image that might be a product image
    const allImages = document.querySelectorAll('img');
    let largestImage = null;
    let largestArea = 0;
    
    for (let i = 0; i < allImages.length; i++) {
      const img = allImages[i];
      const area = img.width * img.height;
      if (area > largestArea && img.width > 100 && img.height > 100) { // Must be reasonably sized
        largestArea = area;
        largestImage = img;
      }
    }
    
    if (largestImage) {
      imageUrl = largestImage.src;
      console.log("Found largest image on page:", imageUrl, "Width:", largestImage.width, "Height:", largestImage.height);
    }
  }
  
  const result = {
    title,
    currentPrice,
    originalPrice: originalPrice && originalPrice > currentPrice ? originalPrice : null,
    imageUrl,
    currency: 'INR', // Indian Rupees for Flipkart
    store: 'Flipkart'
  };
  
  console.log("Flipkart extractor result:", result);
  return result;
}

// Generic product extractor using common patterns and structured data
function extractGenericProduct() {
  // Try to get structured data
  const structuredData = getStructuredData();
  if (structuredData) return structuredData;
  
  // Fallback to DOM scraping for common elements
  
  // Title extraction
  const title = 
    document.querySelector('[itemprop="name"]')?.textContent.trim() ||
    document.querySelector('h1')?.textContent.trim();
  
  if (!title) return null; // Not a product page or title not found
  
  // Price extraction
  let currentPrice = null;
  const priceElement = 
    document.querySelector('[itemprop="price"]') ||
    document.querySelector('[data-price]') ||
    document.querySelector('.price') ||
    document.querySelector('.product-price');
  
  if (priceElement) {
    const priceText = priceElement.textContent.trim();
    currentPrice = extractPriceValue(priceText);
  }
  
  // Image extraction
  let imageUrl = null;
  const imageElement = 
    document.querySelector('[itemprop="image"]') ||
    document.querySelector('.product-image img') ||
    document.querySelector('.product img');
  
  if (imageElement) {
    imageUrl = imageElement.src || imageElement.dataset.src;
  }
  
  return {
    title,
    currentPrice,
    imageUrl,
    currency: 'USD'
  };
}

// Extract structured data from JSON-LD or microdata
function getStructuredData() {
  // Try JSON-LD first
  const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
  for (const element of jsonLdElements) {
    try {
      const data = JSON.parse(element.textContent);
      
      // Check for product schema
      if (data['@type'] === 'Product' || (data['@graph'] && data['@graph'].find(item => item['@type'] === 'Product'))) {
        const product = data['@type'] === 'Product' ? data : data['@graph'].find(item => item['@type'] === 'Product');
        
        // Extract offer data
        let offer = product.offers;
        if (Array.isArray(offer)) {
          offer = offer[0];
        }
        
        if (offer && product.name) {
          return {
            title: product.name,
            currentPrice: typeof offer.price === 'number' ? offer.price : parseFloat(offer.price),
            imageUrl: Array.isArray(product.image) ? product.image[0] : product.image,
            currency: offer.priceCurrency || 'USD'
          };
        }
      }
    } catch (e) {
      console.error('Error parsing JSON-LD:', e);
    }
  }
  
  return null;
}

// Extract price value from a string
function extractPriceValue(priceString) {
  if (!priceString) return null;
  
  // Remove all non-numeric characters except for decimal point
  const priceMatch = priceString.match(/[\d,.]+/);
  if (!priceMatch) return null;
  
  // Clean up the price string and convert to number
  let price = priceMatch[0].replace(/[^\d.]/g, '');
  return parseFloat(price);
}

// Get store name from hostname
function getStoreName(hostname) {
  // Extract domain name
  const domainParts = hostname.split('.');
  let domain = domainParts[domainParts.length - 2];
  
  // Capitalize first letter
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

// Show a notification when a product is detected
function showProductDetectedNotification(productInfo) {
  // Create a notification container
  let container = document.getElementById('savecart-notification');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'savecart-notification';
    
    // Style the notification
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '9999',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      padding: '16px',
      maxWidth: '320px',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      transform: 'translateY(120%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      border: '1px solid #e2e8f0'
    });
    
    document.body.appendChild(container);
  } else {
    // Clear previous content
    container.innerHTML = '';
  }
  
  // Create header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  
  const title = document.createElement('div');
  title.textContent = 'SaveCart';
  title.style.fontWeight = 'bold';
  title.style.color = '#4F46E5';
  title.style.display = 'flex';
  title.style.alignItems = 'center';
  title.style.gap = '6px';
  
  // Add icon using emoji (would use SVG in real extension)
  const icon = document.createElement('span');
  icon.textContent = '🛒';
  icon.style.fontSize = '16px';
  title.prepend(icon);
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = '#9CA3AF';
  closeBtn.style.fontSize = '14px';
  closeBtn.onclick = () => {
    container.style.transform = 'translateY(120%)';
    setTimeout(() => {
      container.remove();
    }, 300);
  };
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Product info
  const content = document.createElement('div');
  content.style.marginTop = '4px';
  
  const productName = document.createElement('div');
  productName.textContent = productInfo.title.length > 80 
    ? productInfo.title.substring(0, 80) + '...' 
    : productInfo.title;
  productName.style.marginBottom = '8px';
  productName.style.fontWeight = '500';
  
  const priceText = document.createElement('div');
  priceText.textContent = `Price: ${formatPrice(productInfo.currentPrice, productInfo.currency)}`;
  priceText.style.marginBottom = '12px';
  
  // Add to cart button
  const addButton = document.createElement('button');
  addButton.textContent = 'Save to Cart';
  addButton.style.backgroundColor = '#4F46E5';
  addButton.style.color = 'white';
  addButton.style.border = 'none';
  addButton.style.borderRadius = '6px';
  addButton.style.padding = '8px 16px';
  addButton.style.cursor = 'pointer';
  addButton.style.fontWeight = '500';
  addButton.style.width = '100%';
  addButton.style.transition = 'background-color 0.2s';
  
  addButton.onmouseover = () => {
    addButton.style.backgroundColor = '#4338CA';
  };
  
  addButton.onmouseout = () => {
    addButton.style.backgroundColor = '#4F46E5';
  };
  
  addButton.onclick = () => {
    // Send message to background script to save product
    chrome.runtime.sendMessage({
      action: 'saveProduct',
      productInfo
    });
    
    // Update button text
    addButton.textContent = 'Saved!';
    addButton.disabled = true;
    addButton.style.backgroundColor = '#22C55E';
    
    // Remove notification after delay
    setTimeout(() => {
      container.style.transform = 'translateY(120%)';
      setTimeout(() => {
        container.remove();
      }, 300);
    }, 2000);
  };
  
  // Assemble the notification
  content.appendChild(productName);
  content.appendChild(priceText);
  content.appendChild(addButton);
  
  container.appendChild(header);
  container.appendChild(content);
  
  // Animate in
  setTimeout(() => {
    container.style.transform = 'translateY(0)';
  }, 10);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (document.body.contains(container)) {
      container.style.transform = 'translateY(120%)';
      setTimeout(() => {
        if (document.body.contains(container)) {
          container.remove();
        }
      }, 300);
    }
  }, 10000);
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
