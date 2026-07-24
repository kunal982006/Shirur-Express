import { Switch, Route, Router as LocationProvider, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { lazy, Suspense, useEffect } from "react";
import { initFacebookPixel, trackPageView } from "@/lib/facebook-pixel";
import Header from "@/components/layout/header";
import OrderNotificationPopup from "@/components/OrderNotificationPopup";
import SwipeBackGesture from "@/components/SwipeBackGesture";
import { Loader2 } from "lucide-react";

import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import Electrician from "@/pages/electrician";
import ElectricianDetail from "@/pages/electrician-detail";
import PlumberDetail from "@/pages/plumber-detail";
import Plumber from "@/pages/plumber";
import Beauty from "@/pages/beauty";
import BeautyDetail from "@/pages/BeautyDetail";
import BookBeauty from "@/pages/book-beauty";
import CakeShop from "@/pages/cake-shop";
import Grocery from "@/pages/grocery";
import Rental from "@/pages/rental";
import StreetFood from "@/pages/street-food";
import StreetFoodDetail from "@/pages/StreetFoodDetail";
import RestaurantsIndex from "@/pages/restaurants/index";
import RestaurantDetail from "@/pages/restaurants/RestaurantDetail";
import Checkout from "@/pages/checkout";
import Settings from "@/pages/settings";
import DeleteAccount from "@/pages/delete-account";
import PrivacyPolicy from "@/pages/privacy-policy";
import ProviderDashboard from "@/pages/provider-dashboard";
import MyBookings from "@/pages/my-bookings";
import InvoicePayment from "@/pages/invoice-payment";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ProviderOnboarding from "@/pages/provider-onboarding";
import OrderSuccess from "@/pages/OrderSuccess";
import RunnerDashboard from "@/pages/runner-dashboard";
import RunnerManagement from "@/pages/runner-management";
import RiderDashboard from "@/pages/rider-dashboard";
import PropertySearch from "@/pages/property-search";
import PropertyDetail from "@/pages/property-detail";
import PropertyListingForm from "@/pages/property-listing-form";
import MyProperties from "@/pages/my-properties";
import EditPropertyForm from "@/pages/edit-property";
import DeliveryPartnerOnboarding from "@/pages/delivery-partner-onboarding";
import DeliveryPartnerDashboard from "@/pages/delivery-partner-dashboard";
import OrderTracking from "@/pages/order-tracking";
import OfferDetailsPage from "@/pages/offer-details";
import NotificationsPage from "@/pages/notifications";
import AdminDashboard from "@/pages/admin-dashboard";
import SearchResults from "@/pages/search-results";
import CafeOfJoyMenu from "@/pages/cafe-of-joy-menu";

// Fallback loader if ever needed again
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 text-primary animate-spin" />
  </div>
);

/**
 * Track page views on route changes for Meta Pixel.
 * Uses wouter's useLocation to detect navigation.
 */
function FacebookPixelTracker() {
  const [location] = useLocation();

  useEffect(() => {
    trackPageView();
  }, [location]);

  return null;
}

function RouterComponent() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={SearchResults} /> {/* NAYA ROUTE */}
        <Route path="/electrician/:id" component={ElectricianDetail} />
        <Route path="/electrician" component={Electrician} />
        <Route path="/plumber/:id" component={PlumberDetail} />
        <Route path="/plumber" component={Plumber} />

        {/* Beauty Services Routes - More specific routes first */}
        <Route path="/beauty/:parlorId" component={BeautyDetail} />
        <Route path="/book/beauty" component={BookBeauty} />
        <Route path="/beauty" component={Beauty} />

        <Route path="/cake-shop" component={CakeShop} />
        <Route path="/grocery" component={Grocery} />
        <Route path="/rental" component={PropertySearch} />
        <Route path="/properties/:id" component={PropertyDetail} />
        <Route path="/list-property" component={PropertyListingForm} />
        <Route path="/my-properties" component={MyProperties} />
        <Route path="/edit-property/:id" component={EditPropertyForm} />
        <Route path="/street-food" component={StreetFood} />
        <Route path="/street-food/:vendorId" component={StreetFoodDetail} />
        <Route path="/restaurants/:id" component={RestaurantDetail} />
        <Route path="/restaurants" component={RestaurantsIndex} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/settings" component={Settings} />
        <Route path="/delete-account" component={DeleteAccount} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/order-success" component={OrderSuccess} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/admin" component={AdminDashboard} />

        <Route path="/provider/dashboard" component={ProviderDashboard} />

        <Route path="/my-bookings" component={MyBookings} />
        <Route path="/pay/invoice/:id" component={InvoicePayment} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/provider-onboarding" component={ProviderOnboarding} />
        <Route path="/runner/dashboard" component={RunnerDashboard} />
        <Route path="/runner/management" component={RunnerManagement} />
        <Route path="/rider/dashboard" component={RiderDashboard} />

        {/* Delivery Partner Routes */}
        <Route path="/delivery-partner/onboarding" component={DeliveryPartnerOnboarding} />
        <Route path="/delivery-partner/dashboard" component={DeliveryPartnerDashboard} />
        <Route path="/order/:orderId/track" component={OrderTracking} />

        {/* Offer Details Route */}
        <Route path="/offer/:id" component={OfferDetailsPage} />

        {/* QR Menu Card Routes (link-only, no in-app buttons) */}
        <Route path="/menu/cafe-of-joy" component={CafeOfJoyMenu} />

        {/* Fallback for 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  // Initialize Meta Pixel once on app mount
  useEffect(() => {
    initFacebookPixel();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {/* Correctly using AuthProvider */}
        <LocationProvider>
          <TooltipProvider>
            <FacebookPixelTracker />
            <div className="min-h-screen bg-background text-foreground flex flex-col">
              <Header />
              <main className="flex-1 pb-16 md:pb-0">
                <RouterComponent />
              </main>

            </div>
            <SwipeBackGesture />
            <OrderNotificationPopup />
            <Toaster />
          </TooltipProvider>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;