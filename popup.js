document.addEventListener('DOMContentLoaded', function() {
  const productContainer = document.getElementById('product-container');
  const dashboardLink = document.getElementById('dashboard-link');
  
  // Update dashboard link to point to the proper URL
  dashboardLink.href = 'http://localhost:5000'; // Update to point to main dashboard URL
  
  console.log("Popup script initialized");
  
  // Try to get the active tab info
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length === 0) {
      console.log("No active tabs found");
      return;
    }
    
    const currentTab = tabs[0];
    console.log("Current tab:", currentTab.url);
    
    // Send message to content script to get product info
    chrome.tabs.sendMessage(currentTab.id, {action: 'extractProductInfo'}, function(response) {
      if (chrome.runtime.lastError) {
        console.log("Runtime error:", chrome.runtime.lastError);
        productContainer.innerHTML = `
          <div class="product-card">
            <div class="product-title">Not a product page</div>
            <div>Navigate to a supported e-commerce product page to track prices.</div>
          </div>
        `;
        return;
      }
      
      console.log("Content script response:", response);
      
      if (!response || !response.productInfo) {
        console.log("No product info found");
        productContainer.innerHTML = `
          <div class="product-card">
            <div class="product-title">No product detected</div>
            <div>Visit a product page on Amazon, Flipkart, eBay, or other supported stores.</div>
          </div>
        `;
        return;
      }
      
      const product = response.productInfo;
      console.log("Product detected:", product);
      
      // Format price
      const formatPrice = (price, currency) => {
        if (price === null || price === undefined) return 'Price unavailable';
        
        let currencySymbol = '$'; // Default
        
        // Handle different currencies
        switch(currency) {
          case 'INR':
            currencySymbol = '₹';
            break;
          case 'EUR':
            currencySymbol = '€';
            break;
          case 'GBP':
            currencySymbol = '£';
            break;
          default:
            currencySymbol = '$';
        }
        
        return `${currencySymbol}${parseFloat(price).toFixed(2)}`;
      };
      
      // Build product card
      productContainer.innerHTML = `
        <div class="product-card">
          <div class="product-title">${product.title}</div>
          <div>
            <span class="price">${formatPrice(product.currentPrice, product.currency)}</span>
            ${product.originalPrice ? `<span class="original-price">${formatPrice(product.originalPrice, product.currency)}</span>` : ''}
          </div>
          <div class="store-badge">${product.store}</div>
          <button class="button" id="save-button">Save Product</button>
        </div>
      `;
      
      // Set up save button action
      document.getElementById('save-button').addEventListener('click', function() {
        console.log("Save button clicked, sending to server");
        
        // Disable button and show saving state
        const saveButton = document.getElementById('save-button');
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;
        
        // Send product info to background script or server
        fetch('http://localhost:5000/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: product.title,
            currentPrice: product.currentPrice,
            originalPrice: product.originalPrice,
            currency: product.currency,
            store: product.store,
            productUrl: product.productUrl,
            imageUrl: product.imageUrl,
            userId: 1 // Default user ID for testing
          })
        })
        .then(response => {
          console.log("Server response:", response);
          return response.json();
        })
        .then(data => {
          console.log("Product saved:", data);
          saveButton.textContent = 'Product Saved!';
          saveButton.disabled = true;
          saveButton.style.backgroundColor = '#4CAF50'; // Green color
        })
        .catch(error => {
          console.error('Error saving product:', error);
          saveButton.textContent = 'Error - Try Again';
          saveButton.disabled = false;
          saveButton.style.backgroundColor = '#f44336'; // Red color
        });
      });
    });
  });
});