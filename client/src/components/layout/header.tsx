
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useCallback, useEffect, useRef } from "react";
import { cssColorToHex, hasNativeBottomNav, setNativeBottomNav, type NativeNavIcon, type NativeNavItem } from "@/lib/native-app";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Truck, LayoutDashboard, Settings, User as UserIcon, LogOut, Package, Search, Phone, CheckCircle, Clock, ChefHat, Home, ArrowLeft, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "My Bookings", href: "/my-bookings", icon: Package },
  // Settings link ko user-specific settings ke liye rakha hai
  // Provider Dashboard ka link alag se handle kiya gaya hai
];

const TAB_ICONS: Record<NativeNavIcon, typeof Home> = {
  home: Home,
  bookings: Package,
  deliveries: Truck,
  dashboard: LayoutDashboard,
  settings: Settings,
  login: UserIcon,
};

/**
 * Invisible stand-in for the bottom bar when the Android app draws the real one.
 * It keeps the app told which tabs to show, which is selected, and whether a
 * popup, sheet or a page's own bottom bar is currently covering this spot (the
 * app's bar then steps aside, exactly as the website's bar would be covered).
 */
function NativeBottomNavSlot({ items, active }: { items: NativeNavItem[]; active: string | null }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [location, setLocation] = useLocation();
  const itemsKey = JSON.stringify(items);

  useEffect(() => {
    (window as any).__nativeNavigate = (href: string) => setLocation(href);
    return () => { delete (window as any).__nativeNavigate; };
  }, [setLocation]);

  useEffect(() => {
    const sync = () => {
      const slot = slotRef.current;
      const probe = probeRef.current;
      if (!slot || !probe) return;
      const top = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 24);
      const probeStyle = getComputedStyle(probe);
      setNativeBottomNav({
        visible: !!top && slot.contains(top),
        active,
        items: JSON.parse(itemsKey),
        colors: {
          background: cssColorToHex(probeStyle.backgroundColor, "#ffffff"),
          active: cssColorToHex(probeStyle.color, "#2563eb"),
          border: cssColorToHex(probeStyle.borderTopColor, "#e2e8f0"),
          inactive: cssColorToHex(getComputedStyle(slot).color, "#0f172a"),
        },
      });
    };

    // Popups and sheets are added straight under <body>; re-check as they animate in.
    const timers = new Set<number>();
    const burst = () => {
      for (const delay of [0, 150, 350]) {
        const id = window.setTimeout(() => { timers.delete(id); sync(); }, delay);
        timers.add(id);
      }
    };
    burst();
    const observer = new MutationObserver(burst);
    observer.observe(document.body, { childList: true });
    const interval = window.setInterval(sync, 400);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.removeEventListener("resize", sync);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [itemsKey, active, location]);

  return (
    <div ref={slotRef} className="fixed bottom-0 left-0 right-0 z-50 h-16 text-foreground md:hidden" aria-hidden="true">
      <span ref={probeRef} className="hidden bg-background text-primary border-border" />
    </div>
  );
}

/**
 * Floating "island" tab bar: a dark glass pill with icons only, and a lighter
 * bubble that slides to the selected tab. It never reaches higher than the old
 * full-width bar (4rem + safe area), so buttons that sit above it still fit.
 */
function IslandBottomNav({
  items,
  active,
  onSelect,
}: {
  items: NativeNavItem[];
  active: string | null;
  onSelect: (href: string) => void;
}) {
  const activeIndex = items.findIndex((tab) => tab.href === active);
  const lastIndex = useRef(activeIndex);
  // When nothing is selected the bubble fades out where it last was.
  if (activeIndex >= 0) lastIndex.current = activeIndex;
  const bubbleIndex = Math.max(lastIndex.current, 0);

  return (
    <nav
      aria-label="Main"
      className="app-bottom-nav pointer-events-none fixed inset-x-0 z-50 flex justify-center px-3 md:hidden"
      style={{ bottom: "calc(env(safe-area-inset-bottom) * 0.5 + 8px)" }}
    >
      <div
        className="pointer-events-auto relative flex h-14 w-full max-w-md items-center rounded-full border border-white/15 bg-neutral-900/75 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150"
      >
        {/* Sliding bubble behind the selected tab */}
        <div
          aria-hidden="true"
          className="absolute inset-y-1.5 left-1.5 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
          style={{
            width: `calc((100% - 0.75rem) / ${items.length || 1})`,
            transform: `translateX(${bubbleIndex * 100}%)`,
            opacity: activeIndex >= 0 ? 1 : 0,
          }}
        >
          <div className="mx-1 h-full rounded-full bg-white/20" />
        </div>

        {items.map((tab) => {
          const Icon = TAB_ICONS[tab.icon];
          const selected = active === tab.href;
          return (
            <button
              key={tab.href}
              type="button"
              aria-label={tab.label}
              title={tab.label}
              aria-current={selected ? "page" : undefined}
              onClick={() => onSelect(tab.href)}
              className="relative z-10 flex h-full flex-1 items-center justify-center rounded-full text-white outline-none transition-transform duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Icon
                className={`h-6 w-6 transition-opacity duration-200 ${selected ? "opacity-100" : "opacity-80"}`}
                strokeWidth={selected ? 2.4 : 2}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function Header() {
  const [location, setLocation] = useLocation();

  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();

  // Back button handler - uses browser history for proper iOS swipe-back support
  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  }, [setLocation]);

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

  // Check if we're on the homepage - only hide top header, keep bottom nav
  const isHomePage = location === "/" || location === "";
  const hideTopHeader = isHomePage || location.startsWith("/admin") || location.startsWith("/search");

  // One list of bottom tabs, drawn either by the website or by the Android app.
  const bottomTabs: NativeNavItem[] = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/my-bookings", label: "Bookings", icon: "bookings" },
  ];
  if (isDeliveryPartner) {
    bottomTabs.push({ href: "/delivery-partner/dashboard", label: "Deliveries", icon: "deliveries" });
  }
  if ((user?.role === 'provider' || user?.username === 'streetfood_admin') && !isDeliveryPartner) {
    bottomTabs.push({ href: "/provider/dashboard", label: user?.username === 'streetfood_admin' ? 'Orders' : 'Dashboard', icon: "dashboard" });
  }
  if (user?.role === 'admin' && user?.username === 'streetfood_admin') {
    bottomTabs.push({ href: "/admin", label: "Vendors", icon: "dashboard" });
  }
  if (user) {
    bottomTabs.push({ href: "/settings", label: "Settings", icon: "settings" });
  } else if (!isLoading) {
    bottomTabs.push({ href: "/login", label: "Login", icon: "login" });
  }
  // Login is a shortcut, not a place you "are", so it is never highlighted.
  const activeTab = isHomePage
    ? "/"
    : bottomTabs.find((tab) => tab.href !== "/" && tab.href !== "/login" && tab.href === location)?.href ?? null;

  return (
    <>
      {/* Only show top header on non-home/admin pages */}
      {!hideTopHeader && (
        <header 
          className="relative z-50 bg-background border-b flex items-center px-4"
          style={{ 
            paddingTop: 'env(safe-area-inset-top)',
            height: 'calc(4rem + env(safe-area-inset-top))'
          }}
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              {/* Back Arrow Button */}
              <button
                onClick={handleBack}
                className="back-button-ios flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted active:bg-muted/80 transition-all duration-200 -ml-1 shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>

              {/* Logo / Home link */}
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent px-1" onClick={() => setLocation("/")}>
                <img
                  src="/shirur-express-logo.png"
                  alt="Shirur Express Logo"
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="flex flex-col items-start bg-transparent">
                  <span className="text-xl font-extrabold tracking-tight leading-none text-primary" style={{ fontFamily: "'Outfit', sans-serif" }}>Shirur Express</span>
                  <span className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>Home Services</span>
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
                {(user?.role === 'provider' || user?.username === 'streetfood_admin') && !isDeliveryPartner && (
                  <Button
                    variant="ghost"
                    onClick={() => setLocation("/provider/dashboard")}
                    className="text-sm font-medium"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {user?.username === 'streetfood_admin' ? 'Orders Dashboard' : 'Provider Dashboard'}
                  </Button>
                )}
                {user?.role === 'admin' && (
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/admin")}
                    className="text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600 border-red-500/20"
                  >
                    {user?.username === 'streetfood_admin' ? 'Vendor Manager' : 'Admin Panel'}
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
                    <DropdownMenuItem onClick={() => setLocation("/my-properties")}>
                      <Home className="mr-2 h-4 w-4" />
                      <span>My Properties</span>
                    </DropdownMenuItem>
                    {user.role !== 'admin' && user.role !== 'provider' && user.username !== 'streetfood_admin' && !isDeliveryPartner && (
                      <DropdownMenuItem onClick={() => setLocation("/provider-onboarding")}>
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>Become a Provider</span>
                      </DropdownMenuItem>
                    )}
                    {/* Desktop Dropdown: Dashboard link based on user type */}
                    {isDeliveryPartner && (
                      <DropdownMenuItem onClick={() => setLocation("/delivery-partner/dashboard")}>
                        <Truck className="mr-2 h-4 w-4" />
                        <span>Delivery Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    {(user.role === 'provider' || user.username === 'streetfood_admin') && !isDeliveryPartner && (
                      <DropdownMenuItem onClick={() => setLocation("/provider/dashboard")}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>{user.username === 'streetfood_admin' ? 'Orders Dashboard' : 'Provider Dashboard'}</span>
                      </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => setLocation("/admin")} className="text-red-500 font-medium">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>{user.username === 'streetfood_admin' ? 'Vendor Manager' : 'Admin Panel'}</span>
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
      )}

      {/* Bottom Navigation for Mobile - ALWAYS VISIBLE */}
      {hasNativeBottomNav() ? (
        // The Android app draws this bar itself, exactly over this placeholder.
        <NativeBottomNavSlot items={bottomTabs} active={activeTab} />
      ) : (
        <IslandBottomNav items={bottomTabs} active={activeTab} onSelect={setLocation} />
      )}
    </>
  );
}