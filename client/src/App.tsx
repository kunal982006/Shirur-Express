import { Switch, Route, Router as LocationProvider } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth"; // Correct import for AuthProvider
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
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
import Restaurants from "@/pages/restaurants";
import Checkout from "@/pages/checkout";
import ProviderDashboard from "@/pages/provider-dashboard";
import MyBookings from "@/pages/my-bookings";
import InvoicePayment from "@/pages/invoice-payment";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ProviderOnboarding from "@/pages/provider-onboarding";
import OrderSuccess from "@/pages/OrderSuccess";
import RunnerDashboard from "@/pages/runner-dashboard";
import RunnerManagement from "@/pages/runner-management"; // NAYA IMPORT
import RiderDashboard from "@/pages/rider-dashboard"; // NAYA IMPORT
import PropertySearch from "@/pages/property-search";
import PropertyDetail from "@/pages/property-detail";
import PropertyListingForm from "@/pages/property-listing-form";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

function RouterComponent() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/electrician/:id" component={ElectricianDetail} />
      <Route path="/electrician" component={Electrician} />
      <Route path="/plumber/:id" component={PlumberDetail} />
      <Route path="/plumber" component={Plumber} />

      {/* Beauty Services Routes */}
      <Route path="/beauty" component={Beauty} />
      <Route path="/beauty/:parlorId" component={BeautyDetail} />
      <Route path="/book/beauty" component={BookBeauty} />

      <Route path="/cake-shop" component={CakeShop} />
      <Route path="/grocery" component={Grocery} />
      <Route path="/rental" component={PropertySearch} />
      <Route path="/properties/:id" component={PropertyDetail} />
      <Route path="/list-property" component={PropertyListingForm} />
      <Route path="/street-food" component={StreetFood} />
      <Route path="/street-food/:vendorId" component={StreetFoodDetail} />
      <Route path="/restaurants" component={Restaurants} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-success" component={OrderSuccess} />

      <Route path="/provider/dashboard" component={ProviderDashboard} />

      <Route path="/my-bookings" component={MyBookings} />
      <Route path="/pay/invoice/:id" component={InvoicePayment} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/provider-onboarding" component={ProviderOnboarding} />
      <Route path="/runner/dashboard" component={RunnerDashboard} />
      <Route path="/runner/management" component={RunnerManagement} />
      <Route path="/rider/dashboard" component={RiderDashboard} />

      {/* Fallback for 404 */}
      <Route component={NotFound} />
    </Switch>
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
              <main className="flex-1">
                <RouterComponent />
              </main>
              <Footer />
            </div>
            <Toaster />
          </TooltipProvider>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;