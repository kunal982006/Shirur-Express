import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, Flame, MapPin, Star, ChefHat, Sparkles, Plus, Minus, ShoppingBasket, ChevronRight } from "lucide-react";
import type { StreetFoodItem, ServiceProvider } from "@shared/schema";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";

// Type definition for the joined data from the backend
type StreetFoodItemWithProvider = StreetFoodItem & {
  provider: ServiceProvider;
};

// Beautiful Street Food Item Card
function StreetFoodItemCard({ item, onClick }: { item: StreetFoodItemWithProvider; onClick: () => void }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const { toast } = useToast();
  const cartItem = items.find((i) => i.id === item.id);

  const vendorName = item.provider?.businessName || "Street Vendor";
  const rating = item.provider?.rating ? parseFloat(item.provider.rating.toString()).toFixed(1) : "New";
  const image = item.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60";
  const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card click
    addItem({
      id: item.id,
      name: item.name,
      price: price as number,
      imageUrl: item.imageUrl || undefined,
      providerId: item.providerId,
      itemType: 'street_food',
    });
    toast({
      title: "Added to Cart",
      description: `${item.name} added to your cart.`
    });
  };

  const handleUpdateQuantity = (e: React.MouseEvent, change: number) => {
    e.stopPropagation();
    updateQuantity(item.id, change);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white"
      onClick={onClick}
    >
      {/* Food Image Container */}
      <div className="relative h-32 sm:h-40 w-full overflow-hidden">
        <img
          src={image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60")}
        />
        {/* Soft Gradient for text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Veg/NonVeg Mark */}
        {item.isVeg !== null && (
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-sm">
            <div className={`h-2.5 w-2.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm text-gray-800 px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-sm">
          <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
          <span>{rating}</span>
        </div>

        {/* Vendor Name overlaid on image */}
        <h3 className="absolute bottom-2 left-2 right-2 font-bold text-white text-xs truncate shadow-black drop-shadow-md">
          {vendorName}
        </h3>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h4 className="font-extrabold text-foreground text-sm leading-tight line-clamp-2">{item.name}</h4>
        </div>
        
        <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2">
          {item.description || item.category || "Delicious street food"}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <span className="font-black text-gray-900 text-sm">₹{price}</span>
          
          {/* Add to Cart Actions */}
          {cartItem ? (
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg border shadow-sm p-0.5" onClick={(e) => e.stopPropagation()}>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 focus:ring-0"
                onClick={(e) => handleUpdateQuantity(e, -1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-4 text-center text-xs font-bold leading-none select-none">
                {cartItem.quantity}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-md text-green-600 hover:text-green-700 hover:bg-green-50 focus:ring-0"
                onClick={(e) => handleUpdateQuantity(e, 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="h-7 text-[10px] font-bold px-3 rounded-lg shadow-sm hover:shadow-md transition-shadow" 
              style={{ background: "linear-gradient(to right, #ea580c, #f97316)" }}
              onClick={handleAdd}
            >
              Add
            </Button>
          )}
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

  const { data: menuItems, isLoading } = useQuery<StreetFoodItemWithProvider[]>({
    queryKey: ["street-food-items", activeCategory],
    queryFn: () => {
      const catParam = activeCategory !== "all" ? `?category=${encodeURIComponent(activeCategory)}` : "";
      return apiRequest("GET", `/api/street-food-items${catParam}`).then(res => res.json());
    }
  });

  const categories = [
    { id: "all", label: "All", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: "chaat", label: "Chaat", icon: <span className="text-sm">🥗</span> },
    { id: "snacks", label: "Snacks", icon: <span className="text-sm">🍿</span> },
    { id: "desserts", label: "Desserts", icon: <span className="text-sm">🍧</span> },
    { id: "drinks", label: "Drinks", icon: <span className="text-sm">🧋</span> },
    { id: "chinese", label: "Chinese", icon: <span className="text-sm">🍜</span> },
  ];

  const filteredItems = menuItems?.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.provider?.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const { items, getTotalPrice } = useCartStore();
  const cartTotalItems = items.reduce((sum, item) => sum + item.quantity, 0);

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
              {filteredItems.length} items to crave
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Mouth-watering dishes nearby</p>
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
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: "#ffedd5" }}
            >
              <ChefHat className="h-10 w-10" style={{ color: "#f97316" }} />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">No items found</h3>
            <p className="text-sm text-muted-foreground">Try searching for something else</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map(item => (
              <StreetFoodItemCard
                key={item.id}
                item={item}
                onClick={() => setLocation(`/street-food/${item.providerId}`)}
              />
            ))}
          </div>
        )}

        {/* Popular Tags Section */}
        {!isLoading && filteredItems.length > 0 && (
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

      {/* Existing Green Cart Banner for Services */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-8 md:bottom-8 md:w-96 animate-in slide-in-from-bottom-5">
            <Button 
              className="w-full h-14 rounded-xl shadow-2xl bg-green-600 hover:bg-green-700 text-white flex justify-between items-center px-4"
              onClick={() => window.location.href = "/checkout"}
            >
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{cartTotalItems} ITEMS</span>
                    <span className="font-bold text-lg">₹{getTotalPrice().toFixed(2)} <span className="text-xs font-normal opacity-90">plus taxes</span></span>
                </div>
                <span className="font-bold flex items-center gap-2 text-sm uppercase tracking-wide">
                    View Cart <ChevronRight className="h-4 w-4" />
                </span>
            </Button>
        </div>
      )}
    </div>
  );
}