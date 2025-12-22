
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, Settings, LogOut, Package, User, LayoutDashboard, Truck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "My Bookings", href: "/my-bookings", icon: Package },
  // Settings link ko user-specific settings ke liye rakha hai
  // Provider Dashboard ka link alag se handle kiya gaya hai
];

export default function Header() {
  const [, setLocation] = useLocation();

  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();

  // Check if user is a delivery partner
  const { data: deliveryPartnerProfile } = useQuery({
    queryKey: ["deliveryPartnerProfile"],
    queryFn: async () => {
      try {
        const res = await api.get("/delivery-partner/profile");
        return res.data;
      } catch (error: any) {
        // Return null if not a delivery partner (404)
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!user, // Only fetch if user is logged in
    retry: false, // Don't retry on 404
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const isDeliveryPartner = !!deliveryPartnerProfile;

  const handleLogout = async () => {
    try {
      await logout(); // Ab yeh aaram se intezaar karega
      toast({
        title: "👋 Logged Out!",
        description: "You have been successfully logged out.",
      });
      setLocation("/login"); // Logout poora hone ke baad, aaram se redirect hoga
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b h-16 flex items-center px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-4">
            {/* Mobile Navigation (Hamburger) Removed - Replaced by Bottom Nav */}

            {/* Logo / Home link */}
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent" onClick={() => setLocation("/")}>
              <img
                src="/shirur-express-logo.png"
                alt="Shirur Express Logo"
                className="h-16 w-16 rounded-full object-cover"
              />
              <div className="flex flex-col items-start bg-transparent">
                <span className="text-2xl font-extrabold tracking-tight leading-none text-primary" style={{ fontFamily: "'Outfit', sans-serif" }}>Shirur Express</span>
                <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>Home Services</span>
              </div>
            </Button>

            {/* Desktop Navigation (optional, if needed) */}
            <nav className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  onClick={() => setLocation(item.href)}
                  className="text-sm font-medium"
                >
                  {item.name}
                </Button>
              ))}
              {/* Show Dashboard based on user type */}
              {isDeliveryPartner && (
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/delivery-partner/dashboard")}
                  className="text-sm font-medium"
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Delivery Dashboard
                </Button>
              )}
              {user?.role === 'provider' && !isDeliveryPartner && (
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/provider/dashboard")}
                  className="text-sm font-medium"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Provider Dashboard
                </Button>
              )}
              {user && (
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/settings")}
                  className="text-sm font-medium"
                >
                  <Settings className="mr-2 h-4 w-4" /> {/* Icon ke saath */}
                  Settings
                </Button>
              )}
            </nav>
          </div>

          {/* User Dropdown / Login Button */}
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div> // Loading state for avatar
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/my-bookings")}>
                    <Package className="mr-2 h-4 w-4" />
                    <span>My Bookings</span>
                  </DropdownMenuItem>
                  {/* Desktop Dropdown: Dashboard link based on user type */}
                  {isDeliveryPartner && (
                    <DropdownMenuItem onClick={() => setLocation("/delivery-partner/dashboard")}>
                      <Truck className="mr-2 h-4 w-4" />
                      <span>Delivery Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'provider' && !isDeliveryPartner && (
                    <DropdownMenuItem onClick={() => setLocation("/provider/dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Provider Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setLocation("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => setLocation("/login")}>
                Login / Signup
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t h-16 flex justify-around items-center md:hidden px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        {/* Home */}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center gap-1 h-full w-full rounded-none active:bg-accent"
          onClick={() => setLocation("/")}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Button>

        {/* My Bookings */}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center gap-1 h-full w-full rounded-none active:bg-accent"
          onClick={() => setLocation("/my-bookings")}
        >
          <Package className="h-5 w-5" />
          <span className="text-[10px] font-medium">Bookings</span>
        </Button>

        {/* Dashboard - show delivery or provider based on user type */}
        {isDeliveryPartner && (
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center gap-1 h-full w-full rounded-none active:bg-accent"
            onClick={() => setLocation("/delivery-partner/dashboard")}
          >
            <Truck className="h-5 w-5" />
            <span className="text-[10px] font-medium">Deliveries</span>
          </Button>
        )}
        {user?.role === 'provider' && !isDeliveryPartner && (
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center gap-1 h-full w-full rounded-none active:bg-accent"
            onClick={() => setLocation("/provider/dashboard")}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Button>
        )}

        {/* Settings (if logged in) */}
        {user && (
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center gap-1 h-full w-full rounded-none active:bg-accent"
            onClick={() => setLocation("/settings")}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </Button>
        )}

        {/* Login (if not logged in) */}
        {!user && !isLoading && (
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center gap-1 h-full w-full rounded-none active:bg-accent"
            onClick={() => setLocation("/login")}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Login</span>
          </Button>
        )}
      </div>
    </>
  );
}