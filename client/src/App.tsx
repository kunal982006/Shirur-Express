import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Electrician from "@/pages/electrician";
import ElectricianDetail from "@/pages/electrician-detail";
import Plumber from "@/pages/plumber";
import Beauty from "@/pages/beauty";
// 💥 FIX: Import path ko capital letters ke saath theek kiya (assuming convention is @/pages/BeautyDetail) 💥
import BeautyDetail from "@/pages/BeautyDetail"; // <-- Assuming this component name is correct
import CakeShop from "@/pages/cake-shop";
import Grocery from "@/pages/grocery";
import Rental from "@/pages/rental";
import StreetFood from "@/pages/street-food";
import Restaurants from "@/pages/restaurants";
import Checkout from "@/pages/checkout";
import ProviderDashboard from "@/pages/provider-dashboard";
import MyBookings from "@/pages/my-bookings";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ProviderOnboarding from "@/pages/provider-onboarding";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

function Router() {
return (
<Switch>
<Route path="/" component={Home} />
<Route path="/electrician/:id" component={ElectricianDetail} />
<Route path="/electrician" component={Electrician} />
<Route path="/plumber" component={Plumber} />

        {/* 1. Beauty Listing Page */}
<Route path="/beauty" component={Beauty} /> 

        {/* 💥 FIX: Beauty Detail Page Route (yahan koi change nahi hai, bas import theek hona chahiye) 💥 */}
        <Route path="/beauty/:parlorId"> 
            {(params) => <BeautyDetail parlorId={params.parlorId} />}
        </Route>

<Route path="/cake-shop" component={CakeShop} />
<Route path="/grocery" component={Grocery} />
<Route path="/rental" component={Rental} />
<Route path="/street-food" component={StreetFood} />
<Route path="/restaurants" component={Restaurants} />
<Route path="/checkout" component={Checkout} />
<Route path="/provider-dashboard" component={ProviderDashboard} />
<Route path="/my-bookings" component={MyBookings} />
<Route path="/login" component={Login} />
<Route path="/signup" component={Signup} />
<Route path="/provider-onboarding" component={ProviderOnboarding} />
<Route component={NotFound} />
</Switch>
);
}

function App() {
return (
<QueryClientProvider client={queryClient}>
<AuthProvider>
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
</AuthProvider>
</QueryClientProvider>
);
}

export default App;
