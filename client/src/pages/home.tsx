import { useState, useMemo } from "react";
import { Trie } from "@/lib/trie";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";

// NOTE: Yeh static data tumhari original file se hai.
const services = [
  { name: "Electrician", slug: "electrician", icon: Zap, description: "Find certified electricians near you for all electrical work", badge: "Available 24/7", color: "accent" },
  { name: "Plumber", slug: "plumber", icon: Wrench, description: "Expert plumbing services for repairs and installations", badge: "Quick Response", color: "primary" },
  { name: "Beauty Parlor", slug: "beauty", icon: Scissors, description: "Professional beauty services at your convenience", badge: "10% Platform Fee", color: "secondary" },
  { name: "Cake Shop", slug: "cake-shop", icon: Cake, description: "Order delicious custom cakes for every occasion", badge: "View Gallery", color: "destructive" },
  { name: "Grocery (GMart)", slug: "grocery", icon: ShoppingBasket, description: "Order fresh groceries with fast home delivery", badge: "₹7/km delivery", color: "secondary" },
  { name: "No Brokerage", slug: "rental", icon: HomeIcon, description: "Find rental properties directly from owners", badge: "Zero Brokerage", color: "primary" },
  { name: "Street Food", slug: "street-food", icon: Sandwich, description: "Discover delicious street food vendors nearby", badge: "Hot Deals", color: "accent" },
  { name: "Restaurants", slug: "restaurants", icon: UtensilsCrossed, description: "Book tables and browse menus from top restaurants", badge: "Reserve Now", color: "destructive" },
];




export default function Home() {
  const [, navigate] = useLocation();

  const [selectedService, setSelectedService] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [location, setLocation] = useState("Current GPS Location"); // Location bar ke liye initial value
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const trie = useMemo(() => {
    const t = new Trie();
    services.forEach(service => t.insert(service.name));
    // Add common keywords or aliases if needed
    t.insert("Food");
    t.insert("Repair");
    return t;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedService(value);
    if (value) {
      const results = trie.search(value);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSelectedService(suggestion);
    setShowSuggestions(false);
  };

  // useQuery call abhi bhi rakha hai, for best practice
  const { data: serviceCategories, isLoading } = useQuery({
    queryKey: ["/api/service-categories"],
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

      {/* 1. Top Location Bar (Image Reference: Top Bar) */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 p-4 shadow-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-800 cursor-pointer" onClick={handleLocationClick}>
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-gray-500 text-xs truncate max-w-[200px] hover:text-primary">
              {locationStatus === 'loading' ? 'Fetching Location...' : location}
            </span>
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </div>
          <Bell className="h-5 w-5 text-gray-500 cursor-pointer hover:text-primary" />
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

      {/* 3. Services Section (Image Reference: What's on Your Mind? - Categories) */}
      <section id="services" className="py-4 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header jaisa Food UI mein tha */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Explore Categories</h2>

          </div>

          {/* Service Card Grid (Minimal) */}
          <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-8 gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* Ab yahan hum services array ko map karenge, jaisa Food UI mein gol buttons the */}
            {services.slice(0, 8).map((service) => ( // Top 8 services dikhao
              <div key={service.slug} className="flex flex-col items-center min-w-[70px]">
                {/* ServiceCard ki jagah, chota icon button banao */}
                <Link to={`/${service.slug}`} className="p-3 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg transition-all">
                  <service.icon className={`h-6 w-6 text-primary`} />
                </Link>
                <span className="text-xs text-center mt-1 font-medium text-gray-600 truncate max-w-full">{service.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* NOTE: Bottom Navbar ko abhi delete kiya hai, kyunki wo tumhare app structure par depend karega */}
    </div>
  );
}