import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api"; // ADDED
import { HorizontalScrollList } from "@/components/horizontal-scroll-list"; // ADDED
import { FloatingOtp } from "@/components/floating-otp"; // ADDED
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import ServiceCard from "@/components/service-card";
import {
  MapPin,
  Search,
  Zap,
  Wrench,
  Scissors,
  Cake,
  ShoppingBasket,
  Home as HomeIcon,
  Share,
  Sandwich,
  UtensilsCrossed,
  Loader2,
  ChevronRight, // Layout element for sections
  Bell, // Top Notification Icon
  ChevronDown,
  LogOut,
  Package,
  Settings,
  X, // ADDED: Close button for image modal
  Truck,
  LayoutDashboard,
  User,
  Plus,
  Minus,
  DollarSign,
  Smartphone,
  Shield,
  RefreshCw,
  ShoppingBag
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { OffersCarousel } from "@/components/offers-carousel";
import { useCartStore } from "@/hooks/use-cart-store"; // ADDED
import { trackEvent, FacebookStandardEvent } from "@/lib/facebook-pixel"; // Facebook Pixel

// NOTE: Yeh static data tumhari original file se hai.
const services = [
  { name: "Electrician", slug: "electrician", icon: Zap, description: "Find certified electricians near you for all electrical work", badge: "Available 24/7", color: "accent" },
  { name: "Plumber", slug: "plumber", icon: Wrench, description: "Expert plumbing services for repairs and installations", badge: "Quick Response", color: "primary" },
  { name: "Beauty Parlor", slug: "beauty", icon: Scissors, description: "Professional beauty services at your convenience", badge: "10% Platform Fee", color: "secondary" },
  { name: "Cake Shop", slug: "cake-shop", icon: Cake, description: "Order delicious custom cakes for every occasion", badge: "View Gallery", color: "destructive" },
  { name: "Grocery (GMart)", slug: "grocery", icon: ShoppingBasket, description: "Order fresh groceries with fast home delivery", badge: "Free Delivery 🎉", color: "secondary" },
  { name: "No Brokerage", slug: "rental", icon: HomeIcon, description: "Find rental properties directly from owners", badge: "Zero Brokerage", color: "primary" },
  { name: "Street Food", slug: "street-food", icon: Sandwich, description: "Discover delicious street food vendors nearby", badge: "Hot Deals", color: "accent" },
  { name: "Restaurants", slug: "restaurants", icon: UtensilsCrossed, description: "Book tables and browse menus from top restaurants", badge: "Reserve Now", color: "destructive" },
];




function PendingPaymentPopup() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: bookings } = useQuery({
    queryKey: ["/api/customer/my-bookings"],
    queryFn: () => api.get("/customer/my-bookings").then(res => res.data),
    enabled: !!user,
  });

  const pendingBooking = useMemo(() => {
    if (!Array.isArray(bookings)) return null;
    return bookings.find((b: any) => b.status === "pending_payment" && b.invoice);
  }, [bookings]);

  useEffect(() => {
    if (pendingBooking) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [pendingBooking]);

  if (!pendingBooking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-white border-orange-100 shadow-xl">
        <div className="flex flex-col items-center text-center py-6 px-4">
          <div className="h-16 w-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-5 animate-bounce shadow-sm">
            <DollarSign className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Due</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm">
            Your technician has generated the final bill of <span className="font-bold text-gray-900 text-base">₹{pendingBooking.invoice.totalAmount}</span>. Please complete the payment.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
             <Button
                className="w-full bg-orange-600 hover:bg-orange-700 h-12 shadow-sm text-sm"
                onClick={() => {
                   setIsOpen(false);
                   navigate(`/pay/invoice/${pendingBooking.invoice.id}`);
                }}
             >
                <DollarSign className="mr-2 h-4 w-4" /> Pay Online
             </Button>
             <Button
                variant="outline"
                className="w-full h-12 border-orange-200 text-orange-700 hover:bg-orange-100 text-sm font-medium"
                onClick={() => {
                   setIsOpen(false);
                   navigate(`/my-bookings`);
                }}
             >
                <span className="mr-2 text-lg leading-none">💵</span> Pay Cash
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const PHONE_HUB_CATEGORIES = [
  { id: "screen-guard", name: "Screen Guard", icon: Shield, description: "Screen guard installation at ₹70 only" },
  { id: "phone-repair", name: "Phone Repair", icon: Wrench, description: "Expert phone repair at best prices" },
  { id: "buy-phone", name: "Buy Phone", icon: ShoppingBag, description: "Buy quality phones at best deals" },
  { id: "sell-phone", name: "Sell Phone", icon: RefreshCw, description: "Sell your old phone for best price" },
];

export default function Home() {
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedService, setSelectedService] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showPhoneHub, setShowPhoneHub] = useState(false);

  // Get Admin Electrician Provider for Phone Hub Routing
  const { data: adminProviders } = useQuery<any[]>({
    queryKey: ["service-providers", "electrician"],
    queryFn: () =>
      api.get("/service-providers?category=electrician")
        .then(res => res.data),
  });

  const adminProviderId = (Array.isArray(adminProviders) ? [...adminProviders] : [])?.sort((a, b) => {
    if (a.isVerified && !b.isVerified) return -1;
    if (!a.isVerified && b.isVerified) return 1;
    if (a.isAvailable && !b.isAvailable) return -1;
    if (!a.isAvailable && b.isAvailable) return 1;
    return 0;
  })?.[0]?.id;
  const [isFocused, setIsFocused] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null); // ADDED: For full-screen image modal

  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { items, addItem, updateQuantity, getTotalPrice } = useCartStore(); // ADDED

  // Auto-redirect admin users to admin dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate("/admin");
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged Out", description: "Successfully logged out" });
    } catch (e) {
      toast({ title: "Error", description: "Logout failed", variant: "destructive" });
    }
  };


  // REMOVED LOCAL TRIE - Using Backend Search API for suggestions
  // Debounce logic for API calls
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (selectedService.length > 2) {
        try {
          const res = await api.get(`/search/suggestions?q=${encodeURIComponent(selectedService)}`);
          // New format: { suggestions: string[], didYouMean: string | null }
          const data = res.data;
          const suggestionsArray = Array.isArray(data?.suggestions) 
            ? data.suggestions 
            : (Array.isArray(data) ? data : []);
          setSuggestions(suggestionsArray);
        } catch (error) {
          console.error("Failed to fetch suggestions", error);
        }
      } else {
        setSuggestions([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [selectedService]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedService(value);
    // Debounce effect will handle fetching
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSelectedService(suggestion);
    setIsFocused(false);
    // Optional: Auto search on click?
    // navigate(`/search?term=${encodeURIComponent(suggestion)}&location=${encodeURIComponent(location)}`);
  };

  // useQuery call abhi bhi rakha hai, for best practice
  const { data: serviceCategories, isLoading } = useQuery({
    queryKey: ["/api/service-categories"],
  });

  // Fetch Popular Items
  const { data: popularData, isLoading: isPopularLoading } = useQuery({
    queryKey: ["/api/homepage/popular"],
    queryFn: () => api.get("/homepage/popular").then(r => r.data),
  });

  const handleSearch = () => {
    // Navigation to a generic search results page
    if (selectedService) {
      // Track Search event for Meta Ads
      trackEvent(FacebookStandardEvent.Search, {
        search_string: selectedService,
        content_category: 'services',
      });
      navigate(`/search?term=${encodeURIComponent(selectedService)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 pb-16 relative overflow-hidden">
      {/* Colorful Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-400/30 to-purple-500/30 blur-[80px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-emerald-400/20 to-teal-500/20 blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-rose-400/20 to-orange-400/20 blur-[80px] animate-pulse pointer-events-none" style={{ transform: 'translate(-50%, -50%)', animationDelay: '4s' }} />
      <FloatingOtp />
      <PendingPaymentPopup />

      {/* 1. Top Location Header (Zomato Style) */}
      <header 
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between p-2 sm:p-3 max-w-7xl mx-auto gap-1 sm:gap-4 overflow-hidden">
          {/* App Logo & Name */}
          <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none shrink-1 min-w-0" onClick={() => navigate("/")}>
            <div className="h-10 w-10 sm:h-14 sm:w-14 flex items-center justify-center shrink-0">
              <img src="/shirur-express-logo.png" alt="Shirur Express" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-primary font-extrabold text-[18px] sm:text-[24px] leading-none tracking-tight truncate">Shirur</span>
              <span className="text-gray-500 font-extrabold text-[10px] sm:text-[12px] leading-none tracking-[0.15em] mt-0.5 truncate">EXPRESS</span>
            </div>
          </div>

          {/* Profile & Notifications */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link href="/notifications">
              <div className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 hover:text-primary transition-colors" />
              </div>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 cursor-pointer border-2 border-primary/10">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs sm:text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/my-bookings")}>
                    <Package className="mr-2 h-4 w-4" />
                    <span>My Bookings</span>
                  </DropdownMenuItem>
                  {user.role === 'provider' && (
                    <DropdownMenuItem onClick={() => navigate("/provider/dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Provider Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate("/login")}
                className="rounded-full px-3 sm:px-4 text-xs sm:text-sm font-bold h-8 sm:h-9"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>



      {/* 4. Unified Search Bar (Image Reference: Are you hungry) */}
      <section 
        className="px-4 py-3 bg-white/60 backdrop-blur-xl shadow-sm sticky z-30 transition-all border-b border-white/40"
        style={{ top: 'calc(56px + env(safe-area-inset-top))' }}
      >
        <div className="max-w-7xl mx-auto flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search for Services or Products (Electrician, Cake, Rental...)"
              className="w-full pl-10 pr-4 py-2 h-12 rounded-lg border border-gray-200/80 bg-white/90 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              value={selectedService}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Delay hiding suggestions to allow clicking them
                setTimeout(() => setIsFocused(false), 200);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            {isFocused && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                <ul className="py-1">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* GPS/Search Button - Isse ab sirf search hoga, GPS toh upar handle ho raha hai */}
          <Button
            className="h-12 w-24 flex-shrink-0"
            onClick={handleSearch}
            disabled={!selectedService}
            data-testid="button-hero-search"
          >
            Go
          </Button>
        </div>
      </section>

      {/* Offers Carousel (Amazon/Zepto Style) */}
      <section className="px-4 py-3 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="w-full max-w-2xl">
            <OffersCarousel />
          </div>
        </div>
      </section>

      {/* 3. Services Section (Image Reference: What's on Your Mind? - Categories) */}
      <section id="services" className="py-4 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header jaisa Food UI mein tha */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Explore Categories</h2>

          </div>

          {/* Service Card Grid (Minimal) */}
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 md:gap-6 overflow-x-auto pb-2 scrollbar-hide">
            {/* Ab yahan hum services array ko map karenge, jaisa Food UI mein gol buttons the */}
            {services.slice(0, 8).map((service) => (
              <div 
                key={service.slug} 
                className="flex flex-col items-center min-w-[70px] cursor-pointer group"
                onClick={() => navigate(`/${service.slug}`)}
              >
                <div className="bg-white rounded-full shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow group-hover:border-primary/20 flex items-center justify-center h-16 w-16 md:h-20 md:w-20">
                  <service.icon className="h-8 w-8 md:h-10 md:w-10 text-primary" strokeWidth={1.5} />
                </div>
                <span className="text-xs md:text-sm text-center mt-2 font-bold text-gray-700 group-hover:text-primary transition-colors truncate max-w-full">{service.name}</span>
              </div>
            ))}
          </div>

          {/* EXPRESS PHONE HUB Banner */}
          <div className="mt-6 mx-2 sm:mx-0 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group relative"
            onClick={() => setShowPhoneHub(true)}
            style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 40%, #a7f3d0 100%)' }}
          >
            {/* Decorative floating shapes */}
            <div className="absolute top-2 left-3 w-8 h-8 rounded-full bg-emerald-300/20 blur-sm animate-pulse" />
            <div className="absolute bottom-4 left-1/3 w-6 h-6 rounded-full bg-teal-200/30 blur-sm" />
            
            <div className="flex relative min-h-[280px] sm:min-h-[300px]">
              {/* Left: Content */}
              <div className="p-4 sm:p-6 z-10 w-[58%] sm:w-[55%] flex flex-col justify-center">
                {/* Title Badge */}
                <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] sm:text-xs font-extrabold px-3 py-1 sm:px-4 sm:py-1.5 rounded-full self-start mb-3 shadow-sm tracking-wide uppercase">
                  <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Express Phone Hub
                </div>
                
                {/* Service 1: Screen Guard */}
                <div className="flex items-start gap-1.5 mb-2.5">
                  <div className="mt-0.5 shrink-0 bg-white/70 rounded-full p-1 shadow-sm">
                    <Shield className="h-3 w-3 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-emerald-950 font-bold text-[11px] sm:text-sm leading-tight block">Screen Guard</span>
                    <span className="text-emerald-800/80 text-[9px] sm:text-xs leading-tight block">
                      Bas <span className="font-extrabold text-emerald-700">₹70</span> mein screen guard + free doorstep installation!
                      <span className="text-emerald-600/60 text-[8px] sm:text-[10px]"> (Market ₹100)</span>
                    </span>
                  </div>
                </div>

                {/* Service 2: Phone Repair */}
                <div className="flex items-start gap-1.5 mb-2.5">
                  <div className="mt-0.5 shrink-0 bg-white/70 rounded-full p-1 shadow-sm">
                    <Wrench className="h-3 w-3 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-emerald-950 font-bold text-[11px] sm:text-sm leading-tight block">Phone Repair</span>
                    <span className="text-emerald-800/80 text-[9px] sm:text-xs leading-tight block">
                      Market se saste mein expert phone repair!
                    </span>
                  </div>
                </div>

                {/* Service 3: Buy / Sell */}
                <div className="flex items-start gap-1.5 mb-3">
                  <div className="mt-0.5 shrink-0 bg-white/70 rounded-full p-1 shadow-sm">
                    <RefreshCw className="h-3 w-3 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-emerald-950 font-bold text-[11px] sm:text-sm leading-tight block">Buy / Sell</span>
                    <span className="text-emerald-800/80 text-[9px] sm:text-xs leading-tight block">
                      Purana phone kharido ya becho—best deals guarantee!
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="bg-emerald-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full inline-block self-start shadow-sm group-hover:bg-emerald-700 transition-colors">
                  View Now &rarr;
                </div>
              </div>

              {/* Right: Phone Repair Expert Image */}
              <div className="w-[42%] sm:w-[45%] absolute right-0 top-0 bottom-0 flex items-end justify-end pointer-events-none overflow-visible">
                <img 
                  src="/phone-repair-expert.png" 
                  alt="Phone Repair Expert" 
                  className="h-full w-full object-contain object-right-bottom mix-blend-multiply transition-transform group-hover:scale-105 origin-bottom drop-shadow-md pr-1 sm:pr-3"
                />
              </div>
            </div>

            {/* Bottom decorative border */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
          </div>

        </div>
      </section>

      {/* 5.5. Popular Restaurant Food Section (New Request) */}
      <HorizontalScrollList
        title="Popular Restaurant Food"
        items={popularData?.menuItems || []}
        isLoading={isPopularLoading}
        onSeeAll={() => navigate("/restaurants")}
        renderItem={(item: any) => (
          <div className="cursor-pointer group">
            <div 
              className="relative h-32 md:h-40 w-full rounded-2xl overflow-hidden mb-2 bg-gray-100"
              onClick={() => setSelectedImage(item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3")}
            >
              <img
                src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3")}
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-[10px] text-white truncate font-medium">{item.provider?.businessName}</p>
              </div>
              {item.isVeg && (
                <div className="absolute top-2 left-2 bg-green-600/90 backdrop-blur-md p-1 rounded-full shadow-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
              )}
            </div>
            <div 
              className="flex flex-col mt-1.5"
              onClick={() => navigate(`/restaurants/${item.providerId}`)}
            >
              <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
              <p className="text-xs text-gray-500 truncate">{item.description || item.category || "Restaurant Special"}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-gray-900">₹{item.price}</span>
                {items.find((i: any) => i.id === item.id) ? (
                  <div className="flex items-center gap-2 bg-white rounded-md shadow-sm border p-0.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, -1);
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-4 text-center text-sm font-semibold">
                      {items.find((i: any) => i.id === item.id)?.quantity || 0}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, 1);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="h-8 px-4 rounded-md bg-primary hover:bg-primary/90 text-white font-medium shadow-sm transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      addItem({
                        id: item.id,
                        name: item.name,
                        price: Number(item.price),
                        imageUrl: item.imageUrl,
                        providerId: item.providerId,
                        itemType: 'restaurant'
                      });
                      // Track AddToCart for Meta Ads
                      trackEvent(FacebookStandardEvent.AddToCart, {
                        content_name: item.name,
                        content_ids: [String(item.id)],
                        content_type: 'product',
                        value: Number(item.price),
                        currency: 'INR',
                      });
                      toast({
                        title: "Added to Cart",
                        description: `${item.name} added to your cart.`
                      });
                    }}
                  >
                    Add
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      />

      {/* 5. Jijamata Eats & Other Streets */}
      <HorizontalScrollList
        title="Jijamata Eats & Other Streets"
        items={popularData?.streetFood || []}
        isLoading={isPopularLoading}
        onSeeAll={() => navigate("/street-food")}
        renderItem={(item: any) => (
          <div className="cursor-pointer group">
            <div 
              className="relative h-32 md:h-40 w-full rounded-2xl overflow-hidden mb-2 bg-gray-100"
              onClick={() => setSelectedImage(item.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3")}
            >
              <img
                src={item.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-800 flex items-center gap-1 shadow-sm">
                <span className="text-yellow-600">★</span> 4.5
              </div>
              {item.isVeg && (
                <div className="absolute bottom-2 left-2 bg-green-600/90 backdrop-blur-md p-1 rounded-full shadow-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
              )}
            </div>
            <div 
              className="flex flex-col mt-1.5"
              onClick={() => navigate(`/street-food?item=${item.id}`)}
            >
              <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
              <p className="text-xs text-gray-500 truncate">{item.description || " Delicious street food"}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-gray-900">₹{item.price}</span>
                {items.find((i: any) => i.id === item.id) ? (
                  <div className="flex items-center gap-2 bg-white rounded-md shadow-sm border p-0.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, -1);
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-4 text-center text-sm font-semibold">
                      {items.find((i: any) => i.id === item.id)?.quantity || 0}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, 1);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="h-8 px-4 rounded-md bg-primary hover:bg-primary/90 text-white font-medium shadow-sm transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      addItem({
                        id: item.id,
                        name: item.name,
                        price: Number(item.price),
                        imageUrl: item.imageUrl,
                        providerId: item.providerId,
                        itemType: 'street_food'
                      });
                      // Track AddToCart for Meta Ads
                      trackEvent(FacebookStandardEvent.AddToCart, {
                        content_name: item.name,
                        content_ids: [String(item.id)],
                        content_type: 'product',
                        value: Number(item.price),
                        currency: 'INR',
                      });
                      toast({
                        title: "Added to Cart",
                        description: `${item.name} added to your cart.`
                      });
                    }}
                  >
                    Add
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      />

      {/* 6. Popular Restaurants Section */}
      <HorizontalScrollList
        title="Popular Restaurants"
        items={popularData?.restaurants || []}
        isLoading={isPopularLoading}
        onSeeAll={() => navigate("/restaurants")}
        renderItem={(provider: any) => (
          <div onClick={() => navigate(`/restaurants/${provider.id}`)} className="cursor-pointer group">
            <div className="relative h-32 md:h-40 w-full rounded-2xl overflow-hidden mb-2 bg-gray-100">
              <img
                src={provider.profileImageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                alt={provider.businessName}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              {!provider.isAvailable && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-xs uppercase tracking-wider border border-white/50 px-3 py-1 rounded-full">Closed</span>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
                <h3 className="font-bold text-white text-sm truncate">{provider.businessName}</h3>
                <p className="text-[10px] text-gray-300 truncate">{provider.address || "Shirur"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 rounded-md font-medium">
                <span className="text-green-600">★</span> 4.2
              </span>
              <span>• 25 mins</span>
              <span>• ₹200 for two</span>
            </div>
          </div>
        )}
      />

      {/* 7. Trending Cakes Section */}
      <HorizontalScrollList
        title="Trending Cakes"
        items={popularData?.cakes || []}
        isLoading={isPopularLoading}
        onSeeAll={() => navigate("/cake-shop")}
        renderItem={(cake: any) => (
          <div className="cursor-pointer group">
            <div 
              className="relative h-32 md:h-40 w-full rounded-2xl overflow-hidden mb-2 bg-pink-50"
              onClick={() => setSelectedImage(cake.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3")}
            >
              <img
                src={cake.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                alt={cake.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-2 left-2 bg-pink-500/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm">
                Trending
              </div>
            </div>
            <div 
              className="flex flex-col mt-1.5"
              onClick={() => navigate(`/cake-shop?item=${cake.id}`)}
            >
              <h3 className="font-bold text-gray-800 text-sm truncate">{cake.name}</h3>
              <p className="text-xs text-gray-500 truncate">{cake.weight || "1 kg"} • {cake.flavor || "Chocolate"}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-gray-900">₹{cake.price}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200">
                  +
                </Button>
              </div>
            </div>
          </div>
        )}
      />

      {/* Restaurant Expansion Popup */}
      {/* Full-Screen Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full h-full p-4 flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full h-12 w-12 z-50"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X className="h-8 w-8" />
            </Button>
            <img 
              src={selectedImage} 
              alt="Food details" 
              className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {/* Existing Green Cart Banner for Services */}
      {items.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-8 md:bottom-8 md:w-96 animate-in slide-in-from-bottom-5">
            <Button 
              className="w-full h-14 rounded-xl shadow-2xl bg-green-600 hover:bg-green-700 text-white flex justify-between items-center px-4"
              onClick={() => navigate("/checkout")}
            >
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{items.reduce((total: number, item: any) => total + item.quantity, 0)} ITEMS</span>
                    <span className="font-bold text-lg">₹{getTotalPrice().toFixed(2)} <span className="text-xs font-normal opacity-90">plus taxes</span></span>
                </div>
                <span className="font-bold flex items-center gap-2 text-sm uppercase tracking-wide">
                    View Cart <ChevronRight className="h-4 w-4" />
                </span>
            </Button>
        </div>
      )}

      {/* Phone Hub Categories Dialog */}
      <Dialog open={showPhoneHub} onOpenChange={setShowPhoneHub}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              Express Phone Hub
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">Select a service to book</p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {PHONE_HUB_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all group/card text-center"
                  onClick={() => {
                    setShowPhoneHub(false);
                    if (adminProviderId) {
                      navigate(`/electrician/${adminProviderId}?problemId=${cat.id}&problemName=${encodeURIComponent(cat.name)}`);
                    }
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 group-hover/card:bg-emerald-200 flex items-center justify-center transition-colors">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="font-semibold text-sm text-emerald-950">{cat.name}</span>
                  <span className="text-[10px] text-emerald-700/70 leading-tight">{cat.description}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}