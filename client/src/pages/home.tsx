import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api"; // ADDED
import { HorizontalScrollList } from "@/components/horizontal-scroll-list"; // ADDED
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
  Truck,
  LayoutDashboard,
  User,
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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LocationPicker } from "@/components/location-picker";
import { useToast } from "@/hooks/use-toast";
import { OffersCarousel } from "@/components/offers-carousel";

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




export default function Home() {
  const [, navigate] = useLocation();

  const [selectedService, setSelectedService] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [location, setLocation] = useState("Select your location");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const { user, logout } = useAuth();
  const { toast } = useToast();

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

  const handleAddressSelect = (address: string) => {
    setLocation(address);
    setIsLocationOpen(false);
  };

  // REMOVED LOCAL TRIE - Using Backend Search API for suggestions
  // Debounce logic for API calls
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (selectedService.length > 2) {
        try {
          const res = await api.get(`/api/search/suggestions?q=${encodeURIComponent(selectedService)}`);
          setSuggestions(res.data);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Failed to fetch suggestions", error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
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
    setShowSuggestions(false);
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

  const handleLocationClick = () => {
    // Geolocation logic remains the same
    if (!navigator.geolocation) {
      setLocationStatus('error');
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationStatus('success');
        setLocation("Current GPS Location (Captured)");
      },
      (error) => {
        console.error("Geolocation Error:", error);
        setLocationStatus('error');
        alert("Unable to retrieve your location. Please type manually.");
        setLatitude(null);
        setLongitude(null);
        setLocation("");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSearch = () => {
    // Navigation to a generic search results page
    if (selectedService && (location || (latitude && longitude))) {
      const coords = (latitude && longitude) ? `&lat=${latitude}&lng=${longitude}` : '';
      navigate(`/search?term=${encodeURIComponent(selectedService)}&location=${encodeURIComponent(location)}${coords}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* 1. Top Location Header (Zomato Style) */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-3 max-w-7xl mx-auto">
          {/* Location Picker Trigger */}
          <Dialog open={isLocationOpen} onOpenChange={setIsLocationOpen}>
            <DialogTrigger asChild>
              <div className="flex flex-col cursor-pointer max-w-[70%]">
                <div className="flex items-center gap-1 text-primary font-extrabold text-lg leading-tight">
                  <MapPin className="h-5 w-5 text-primary fill-current" />
                  <span className="truncate">Home</span>
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </div>
                <p className="text-xs text-muted-foreground truncate pl-6 font-medium">
                  {location}
                </p>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
              <div className="p-4 bg-primary text-primary-foreground">
                <h2 className="font-bold text-lg">Select Location</h2>
                <p className="text-xs opacity-90">Choose your delivery location</p>
              </div>
              <div className="p-4">
                <LocationPicker onAddressSelect={handleAddressSelect} currentAddress={location} />
              </div>
            </DialogContent>
          </Dialog>

          {/* Profile & Notifications */}
          <div className="flex items-center gap-3">
            <Link href="/notifications">
              <Bell className="h-6 w-6 text-gray-700 cursor-pointer hover:text-primary transition-colors" />
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer border-2 border-primary/10">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
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
                className="rounded-full px-4 font-bold"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 4. Unified Search Bar (Image Reference: Are you hungry) */}
      <section className="p-4 bg-white shadow-sm sticky top-[61px] z-30">
        <div className="max-w-7xl mx-auto flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for Services or Products (Electrician, Cake, Rental...)"
              className="w-full pl-10 pr-4 py-2 h-12 rounded-lg border border-gray-300 focus:ring-primary focus:border-primary"
              value={selectedService}
              onChange={handleInputChange}
              onFocus={() => {
                if (selectedService.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow clicking them
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
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
      <section className="px-4 py-3 bg-white">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="w-full max-w-2xl">
            <OffersCarousel />
          </div>
        </div>
      </section>

      {/* 3. Services Section (Image Reference: What's on Your Mind? - Categories) */}
      <section id="services" className="py-4 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header jaisa Food UI mein tha */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Explore Categories</h2>

          </div>

          {/* Service Card Grid (Minimal) */}
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 md:gap-6 overflow-x-auto pb-2 scrollbar-hide">
            {/* Ab yahan hum services array ko map karenge, jaisa Food UI mein gol buttons the */}
            {services.slice(0, 8).map((service) => ( // Top 8 services dikhao
              <div key={service.slug} className="flex flex-col items-center min-w-[70px]">
                {/* ServiceCard ki jagah, chota icon button banao */}
                <Link to={`/${service.slug}`} className="p-3 md:p-5 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg hover:border-primary/30 transition-all">
                  <service.icon className="h-6 w-6 md:h-10 md:w-10 lg:h-14 lg:w-14 text-primary" />
                </Link>
                <span className="text-xs md:text-sm text-center mt-1.5 font-medium text-gray-600 truncate max-w-full">{service.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Popular Street Food Section */}
      <HorizontalScrollList
        title="Popular Street Food"
        items={popularData?.streetFood || []}
        isLoading={isPopularLoading}
        onSeeAll={() => navigate("/street-food")}
        renderItem={(item: any) => (
          <div onClick={() => navigate(`/street-food?item=${item.id}`)} className="cursor-pointer group">
            <div className="relative h-32 md:h-40 w-full rounded-2xl overflow-hidden mb-2 bg-gray-100">
              <img
                src={item.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                alt={item.name}
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
            <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
            <p className="text-xs text-gray-500 truncate">{item.description || " Delicious street food"}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-sm font-bold text-gray-900">₹{item.price}</span>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50">
                Add +
              </Button>
            </div>
          </div>
        )}
      />

      {/* 5.5. Popular Restaurant Food Section (New Request) */}
      <HorizontalScrollList
        title="Popular Restaurant Food"
        items={popularData?.menuItems || []}
        isLoading={isPopularLoading}
        onSeeAll={() => navigate("/restaurants")}
        renderItem={(item: any) => (
          <div onClick={() => navigate(`/restaurant/${item.providerId}`)} className="cursor-pointer group">
            <div className="relative h-32 md:h-40 w-full rounded-2xl overflow-hidden mb-2 bg-gray-100">
              <img
                src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
            <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
            <p className="text-xs text-gray-500 truncate">{item.description || item.category || "Restaurant Special"}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-sm font-bold text-gray-900">₹{item.price}</span>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 rounded-full border-orange-200 text-orange-600 hover:bg-orange-50">
                Order
              </Button>
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
          <div onClick={() => navigate(`/restaurant/${provider.id}`)} className="cursor-pointer group">
            <div className="relative h-32 md:h-40 w-full rounded-2xl overflow-hidden mb-2 bg-gray-100">
              <img
                src={provider.profileImageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                alt={provider.businessName}
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
          <div onClick={() => navigate(`/cake-shop?item=${cake.id}`)} className="cursor-pointer group">
            <div className="relative h-32 md:h-40 w-full rounded-2xl overflow-hidden mb-2 bg-pink-50">
              <img
                src={cake.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                alt={cake.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-2 left-2 bg-pink-500/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm">
                Trending
              </div>
            </div>
            <h3 className="font-bold text-gray-800 text-sm truncate">{cake.name}</h3>
            <p className="text-xs text-gray-500 truncate">{cake.weight || "1 kg"} • {cake.flavor || "Chocolate"}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-sm font-bold text-gray-900">₹{cake.price}</span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200">
                +
              </Button>
            </div>
          </div>
        )}
      />

    </div>
  );
}