import { Switch, Route, Router as LocationProvider } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { lazy, Suspense } from "react";
import Header from "@/components/layout/header";
import { Loader2 } from "lucide-react";

// Critical Routes - Eagerly Loaded (needed on first paint)
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

// All other pages: Lazy-loaded for code splitting (downloaded on navigation)
const Electrician = lazy(() => import("@/pages/electrician"));
const ElectricianDetail = lazy(() => import("@/pages/electrician-detail"));
const PlumberDetail = lazy(() => import("@/pages/plumber-detail"));
const Plumber = lazy(() => import("@/pages/plumber"));
const Beauty = lazy(() => import("@/pages/beauty"));
const BeautyDetail = lazy(() => import("@/pages/BeautyDetail"));
const BookBeauty = lazy(() => import("@/pages/book-beauty"));
const CakeShop = lazy(() => import("@/pages/cake-shop"));
const Grocery = lazy(() => import("@/pages/grocery"));
const Rental = lazy(() => import("@/pages/rental"));
const StreetFood = lazy(() => import("@/pages/street-food"));
const StreetFoodDetail = lazy(() => import("@/pages/StreetFoodDetail"));
const RestaurantsIndex = lazy(() => import("@/pages/restaurants/index"));
const RestaurantDetail = lazy(() => import("@/pages/restaurants/RestaurantDetail"));
const Checkout = lazy(() => import("@/pages/checkout"));
const Settings = lazy(() => import("@/pages/settings"));
const DeleteAccount = lazy(() => import("@/pages/delete-account"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const ProviderDashboard = lazy(() => import("@/pages/provider-dashboard"));
const MyBookings = lazy(() => import("@/pages/my-bookings"));
const InvoicePayment = lazy(() => import("@/pages/invoice-payment"));
const Login = lazy(() => import("@/pages/login"));
const Signup = lazy(() => import("@/pages/signup"));
const ProviderOnboarding = lazy(() => import("@/pages/provider-onboarding"));
const OrderSuccess = lazy(() => import("@/pages/OrderSuccess"));
const RunnerDashboard = lazy(() => import("@/pages/runner-dashboard"));
const RunnerManagement = lazy(() => import("@/pages/runner-management"));
const RiderDashboard = lazy(() => import("@/pages/rider-dashboard"));
const PropertySearch = lazy(() => import("@/pages/property-search"));
const PropertyDetail = lazy(() => import("@/pages/property-detail"));
const PropertyListingForm = lazy(() => import("@/pages/property-listing-form"));
const DeliveryPartnerOnboarding = lazy(() => import("@/pages/delivery-partner-onboarding"));
const DeliveryPartnerDashboard = lazy(() => import("@/pages/delivery-partner-dashboard"));
const OrderTracking = lazy(() => import("@/pages/order-tracking"));
const OfferDetailsPage = lazy(() => import("@/pages/offer-details"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const SearchResults = lazy(() => import("@/pages/search-results"));

// Fallback loader if ever needed again
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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

        {/* Fallback for 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {/* Correctly using AuthProvider */}
        <LocationProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
              <Header />
              <main className="flex-1 pb-16 md:pb-0">
                <RouterComponent />
              </main>

            </div>
            <Toaster />
          </TooltipProvider>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;