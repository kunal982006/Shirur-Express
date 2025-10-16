import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Electrician from "@/pages/electrician";
import ElectricianDetail from "@/pages/electrician-detail";
import Plumber from "@/pages/plumber";
import Beauty from "@/pages/beauty";
import CakeShop from "@/pages/cake-shop";
import Grocery from "@/pages/grocery";
import Rental from "@/pages/rental";
import StreetFood from "@/pages/street-food";
import Restaurants from "@/pages/restaurants";
import Checkout from "@/pages/checkout";
import ProviderDashboard from "@/pages/provider-dashboard";
import MyBookings from "@/pages/my-bookings";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/electrician/:id" component={ElectricianDetail} />
      <Route path="/electrician" component={Electrician} />
      <Route path="/plumber" component={Plumber} />
      <Route path="/beauty" component={Beauty} />
      <Route path="/cake-shop" component={CakeShop} />
      <Route path="/grocery" component={Grocery} />
      <Route path="/rental" component={Rental} />
      <Route path="/street-food" component={StreetFood} />
      <Route path="/restaurants" component={Restaurants} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/provider-dashboard" component={ProviderDashboard} />
      <Route path="/my-bookings" component={MyBookings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
