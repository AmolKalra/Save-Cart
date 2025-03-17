import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Popup from "@/pages/popup";
import ProductDetails from "@/pages/product-details";
import Settings from "@/pages/settings";
import PriceAlerts from "@/pages/price-alerts";
import Compare from "@/pages/compare";

// Detect if running in Chrome extension context
const isExtensionPopup = window.location.pathname === "/popup.html" || 
                          window.chrome?.extension?.getViews({ type: "popup" }).includes(window);

function Router() {
  // Use different routes for extension popup vs dashboard
  if (isExtensionPopup) {
    return (
      <Switch>
        <Route path="/" component={Popup} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/product/:id" component={ProductDetails} />
      <Route path="/settings" component={Settings} />
      <Route path="/price-alerts" component={PriceAlerts} />
      <Route path="/compare" component={Compare} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
