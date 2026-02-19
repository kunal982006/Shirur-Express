import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, Flame, MapPin, Star, ChefHat, Sparkles } from "lucide-react";
import type { ServiceProvider } from "@shared/schema";

// Compact Street Vendor Card Component for Mobile Grid
function StreetVendorCard({ vendor, onClick }: { vendor: ServiceProvider; onClick: () => void }) {
  const rating = vendor.rating ? parseFloat(vendor.rating.toString()).toFixed(1) : "New";
  const specializations = vendor.specializations || [];
  const image = vendor.galleryImages?.[0] || vendor.profileImageUrl || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop&q=60";

  return (
    <div
      className="relative overflow-hidden rounded-2xl cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      style={{ background: "linear-gradient(to bottom right, #fff7ed, #fef3c7)" }}
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative h-28 sm:h-36 w-full overflow-hidden">
        <img
          src={image}
          alt={vendor.businessName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Rating Badge */}
        <div
          className="absolute top-2 right-2 flex items-center gap-0.5 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-lg"
          style={{ background: "linear-gradient(to right, #f59e0b, #ea580c)" }}
        >
          <Star className="h-2.5 w-2.5 fill-white" />
          <span>{rating}</span>
        </div>

        {/* Fire Icon for Popular */}
        {Number(rating) >= 4.0 && (
          <div className="absolute top-2 left-2">
            <Flame className="h-4 w-4 text-orange-400 animate-pulse" style={{ color: "#fb923c" }} />
          </div>
        )}

        {/* Closed Overlay */}
        {vendor.isAvailable === false && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white font-bold text-xs px-2 py-1 border border-white rounded">Closed</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5">
        <h3 className="font-bold text-sm text-foreground truncate leading-tight mb-1">
          {vendor.businessName}
        </h3>

        <p className="text-[10px] text-muted-foreground truncate mb-1.5">
          {specializations.slice(0, 2).join(" • ") || "Street Food"}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            <span className="truncate max-w-[60px]">{vendor.address?.split(",")[0] || "Local"}</span>
          </div>
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 py-0 border-0"
            style={{ background: "#ffedd5", color: "#ea580c" }}
          >
            ₹50-150
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Category Pill Component
function CategoryPill({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 ${active
        ? "text-white shadow-lg"
        : "bg-white dark:bg-zinc-800 text-muted-foreground hover:bg-orange-50 border border-border"
        }`}
      style={active ? {
        background: "linear-gradient(to right, #f97316, #f59e0b)",
        boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)"
      } : undefined}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function StreetFood() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    console.log("StreetFood List mounted");
  }, []);

  const { data: vendors, isLoading } = useQuery<ServiceProvider[]>({
    queryKey: ["street-food-vendors"],
    queryFn: () => apiRequest("GET", "/api/service-providers?category=street-food").then(res => res.json())
  });

  const categories = [
    { id: "all", label: "All", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: "chaat", label: "Chaat", icon: <span className="text-sm">🥗</span> },
    { id: "snacks", label: "Snacks", icon: <span className="text-sm">🍿</span> },
    { id: "desserts", label: "Desserts", icon: <span className="text-sm">🍧</span> },
    { id: "drinks", label: "Drinks", icon: <span className="text-sm">🧋</span> },
    { id: "chinese", label: "Chinese", icon: <span className="text-sm">🍜</span> },
  ];

  const filteredVendors = vendors?.filter(v =>
    v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.specializations?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="min-h-screen pb-24" style={{ background: "linear-gradient(to bottom, #fff7ed, var(--background), var(--background))" }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Decorative Background */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #f97316, #f59e0b, #fbbf24)", opacity: 0.95 }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')" }}
        />

        <div className="relative z-10 p-4 pt-3">
          {/* Top Bar */}
          <div className="flex items-center gap-3 mb-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-white -ml-1 hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-white" />
                <h1 className="font-bold text-lg text-white leading-none">Street Food</h1>
              </div>
              <p className="text-white/80 text-xs mt-0.5">The taste of the streets, served at your seat. 🌭🌶️</p>
            </div>
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Flame className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vada pav, chaat, momos..."
              className="pl-10 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm shadow-xl border-0 h-12 rounded-2xl text-base placeholder:text-muted-foreground/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Wave Decoration */}
        <svg className="relative -mb-1 w-full" viewBox="0 0 1200 60" preserveAspectRatio="none" style={{ color: "#fff7ed" }}>
          <path fill="currentColor" d="M0,60 L0,30 Q300,0 600,30 T1200,30 L1200,60 Z" />
        </svg>
      </div>

      {/* Category Pills */}
      <div className="px-4 py-3 -mt-1" style={{ background: "#fff7ed" }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {categories.map(cat => (
            <CategoryPill
              key={cat.id}
              label={cat.label}
              icon={cat.icon}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Flame className="h-5 w-5" style={{ color: "#f97316" }} />
              {filteredVendors.length} vendors near you
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Discover authentic street food</p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="h-48 rounded-2xl animate-pulse"
                style={{ background: "linear-gradient(to bottom right, #fed7aa, #fef3c7)" }}
              />
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: "#ffedd5" }}
            >
              <ChefHat className="h-10 w-10" style={{ color: "#f97316" }} />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">No vendors found</h3>
            <p className="text-sm text-muted-foreground">Try searching for something else</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredVendors.map(vendor => (
              <StreetVendorCard
                key={vendor.id}
                vendor={vendor}
                onClick={() => setLocation(`/street-food/${vendor.id}`)}
              />
            ))}
          </div>
        )}

        {/* Popular Tags Section */}
        {!isLoading && filteredVendors.length > 0 && (
          <div className="mt-8 mb-4">
            <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "#f59e0b" }} />
              Popular searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Pani Puri", "Vada Pav", "Momos", "Bhel Puri", "Dosa", "Samosa", "Pav Bhaji", "Egg Rolls"].map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-800 border border-border rounded-full transition-colors"
                  style={{
                    borderColor: "var(--border)"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#fdba74";
                    e.currentTarget.style.background = "#fff7ed";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "";
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}