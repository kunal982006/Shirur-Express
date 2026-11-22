import { Switch, Route, Router as LocationProvider, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { Suspense, useEffect, useRef } from "react";
import { initFacebookPixel, trackPageView } from "@/lib/facebook-pixel";
import { useAnalyticsTracker } from "@/hooks/use-analytics";
import Header from "@/components/layout/header";
import OrderNotificationPopup from "@/components/OrderNotificationPopup";
import { IosPushSync } from "@/components/IosPushSync";
import { AndroidPushSync } from "@/components/AndroidPushSync";
import { ActiveOrderBar } from "@/components/ActiveOrderBar";
import AppUpdatePopup from "@/components/AppUpdatePopup";
import OfflineBanner from "@/components/OfflineBanner";
import SwipeBackGesture from "@/components/SwipeBackGesture";
import PullToRefreshGuard from "@/components/PullToRefreshGuard";
import { AddressSheet } from "@/components/address/AddressSheet";
import { Loader2 } from "lucide-react";
import { page, preloadPagesWhenIdle } from "@/lib/lazy-pages";
import { useLiveOrderTracking } from "@/hooks/use-live-order-tracking";

import Home from "@/pages/home";

const NotFound = page(() => import("@/pages/not-found"));
const Electrician = page(() => import("@/pages/electrician"), true);
const ElectricianBook = page(() => import("@/pages/electrician-detail"));
const PlumberBook = page(() => import("@/pages/plumber-detail"));
const Plumber = page(() => import("@/pages/plumber"), true);
const Beauty = page(() => import("@/pages/beauty"), true);
const BeautyDetail = page(() => import("@/pages/BeautyDetail"));
const BookBeauty = page(() => import("@/pages/book-beauty"));
const CakeShop = page(() => import("@/pages/cake-shop"), true);
const CakeShopMenu = page(() => import("@/pages/cake-shop-menu"));
const Grocery = page(() => import("@/pages/grocery"), true);
const StreetFood = page(() => import("@/pages/street-food"), true);
const StreetFoodDetail = page(() => import("@/pages/StreetFoodDetail"), true);
const RestaurantsIndex = page(() => import("@/pages/restaurants/index"), true);
const RestaurantDetail = page(() => import("@/pages/restaurants/RestaurantDetail"), true);
const FoodCollection = page(() => import("@/pages/restaurants/FoodCollection"), true);
const Checkout = page(() => import("@/pages/checkout"), true);
const Settings = page(() => import("@/pages/settings"), true);
const DeleteAccount = page(() => import("@/pages/delete-account"));
const PrivacyPolicy = page(() => import("@/pages/privacy-policy"));
const ProviderDashboard = page(() => import("@/pages/provider-dashboard"));
const MyBookings = page(() => import("@/pages/my-bookings"), true);
const InvoicePayment = page(() => import("@/pages/invoice-payment"));
const Login = page(() => import("@/pages/login"), true);
const Signup = page(() => import("@/pages/signup"));
const ProviderOnboarding = page(() => import("@/pages/provider-onboarding"));
const OrderSuccess = page(() => import("@/pages/OrderSuccess"), true);
const RunnerDashboard = page(() => import("@/pages/runner-dashboard"));
const RunnerManagement = page(() => import("@/pages/runner-management"));
const RiderDashboard = page(() => import("@/pages/rider-dashboard"));
const PropertySearch = page(() => import("@/pages/property-search"));
const PropertyDetail = page(() => import("@/pages/property-detail"));
const PropertyListingForm = page(() => import("@/pages/property-listing-form"));
const MyProperties = page(() => import("@/pages/my-properties"));
const EditPropertyForm = page(() => import("@/pages/edit-property"));
const DeliveryPartnerOnboarding = page(() => import("@/pages/delivery-partner-onboarding"));
const DeliveryPartnerDashboard = page(() => import("@/pages/delivery-partner-dashboard"));
const PrintBill = page(() => import("@/pages/print-bill"));
const OrderTracking = page(() => import("@/pages/order-tracking"), true);
const OfferDetailsPage = page(() => import("@/pages/offer-details"));
const NotificationsPage = page(() => import("@/pages/notifications"), true);
const AdminDashboard = page(() => import("@/pages/admin-dashboard"));
const SearchResults = page(() => import("@/pages/search-results"), true);
const CafeOfJoyMenu = page(() => import("@/pages/cafe-of-joy-menu"));
const BuyPhone = page(() => import("@/pages/buy-phone"));
const SellPhone = page(() => import("@/pages/sell-phone"));
const Wishlist = page(() => import("@/pages/wishlist"));
const HelpSupport = page(() => import("@/pages/help-support"));
const GeneralInfo = page(() => import("@/pages/general-info"));
const EditProfile = page(() => import("@/pages/edit-profile"));

// Shown only if a page's code takes a moment to arrive; stays invisible for the
// first 200ms so a fast load never flashes a spinner.
const PageLoader = () => (
  <div className="page-loader flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

/**
 * Start every newly opened page at the top. Back/forward navigation is left
 * alone so the browser can put the customer back where they were in a list.
 */
function ScrollToTop() {
  const [location] = useLocation();
  const lastPopAt = useRef(0);

  useEffect(() => {
    const onPop = () => { lastPopAt.current = Date.now(); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (Date.now() - lastPopAt.current < 400) return;
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function AnalyticsTracker() {
  useAnalyticsTracker();
  return null;
}

function LiveOrderSync() {
  useLiveOrderTracking();
  return null;
}

function RouterComponent() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={SearchResults} /> {/* NAYA ROUTE */}
        <Route path="/electrician/book" component={ElectricianBook} />
        <Route path="/electrician" component={Electrician} />
        <Route path="/plumber/book" component={PlumberBook} />
        <Route path="/plumber" component={Plumber} />

        {/* Beauty Services Routes - More specific routes first */}
        <Route path="/beauty/:parlorId" component={BeautyDetail} />
        <Route path="/book/beauty" component={BookBeauty} />
        <Route path="/beauty" component={Beauty} />

        <Route path="/cake-shop" component={CakeShop} />
        <Route path="/cake-shop-menu/:id" component={CakeShopMenu} />
        <Route path="/grocery" component={Grocery} />
        <Route path="/rental" component={PropertySearch} />
        <Route path="/no-brokerage" component={PropertySearch} />
        <Route path="/properties/:id" component={PropertyDetail} />
        <Route path="/list-property" component={PropertyListingForm} />
        <Route path="/my-properties" component={MyProperties} />
        <Route path="/edit-property/:id" component={EditPropertyForm} />
        <Route path="/street-food" component={StreetFood} />
        <Route path="/street-food/:vendorId" component={StreetFoodDetail} />
        <Route path="/restaurants/collections/:slug" component={FoodCollection} />
        <Route path="/restaurants/:id" component={RestaurantDetail} />
        <Route path="/restaurants" component={RestaurantsIndex} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/settings" component={Settings} />
        <Route path="/delete-account" component={DeleteAccount} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/order-success" component={OrderSuccess} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/wishlist" component={Wishlist} />
        <Route path="/help-support" component={HelpSupport} />
        <Route path="/general-info" component={GeneralInfo} />
        <Route path="/edit-profile" component={EditProfile} />
        
        {/* Phone Hub Buy/Sell */}
        <Route path="/buy-phone" component={BuyPhone} />
        <Route path="/sell-phone" component={SellPhone} />
        
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
        <Route path="/billing" component={PrintBill} />
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
    preloadPagesWhenIdle();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {/* Correctly using AuthProvider */}
        <LocationProvider>
          <TooltipProvider>
            <ScrollToTop />
            <FacebookPixelTracker />
            <AnalyticsTracker />
            <LiveOrderSync />
            <div className="min-h-screen bg-background text-foreground flex flex-col">
              <Header />
              <main className="flex-1 pb-16 md:pb-0">
                <RouterComponent />
              </main>

            </div>
            <AddressSheet />
            <SwipeBackGesture />
            <PullToRefreshGuard />
            <OrderNotificationPopup />
            <IosPushSync />
            <AndroidPushSync />
            <ActiveOrderBar />
            <AppUpdatePopup />
            <OfflineBanner />
            <Toaster />
          </TooltipProvider>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;