import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, ArrowLeft, Search, UtensilsCrossed, SlidersHorizontal, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FoodItemCard } from "@/components/restaurants/FoodItemCard";
import { ProviderReviews } from "@/components/restaurants/ProviderReviews";
import { useCartStore } from "@/hooks/use-cart-store";
import { toast } from "@/hooks/use-toast";
import { isAddOnCategory, ADD_ON_ONLY_MESSAGE } from "@shared/add-ons";
import type { StreetFoodItem, ServiceProvider, RestaurantMenuItem } from "@shared/schema";

// Helper components for placeholder tabs
const OverviewTab = ({ vendor }: { vendor: ServiceProvider }) => (
  <div className="p-4 space-y-6">
    <div>
      <h3 className="text-lg font-bold mb-2">About this spot</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {vendor.description || "Authentic and delicious street food experiences."}
      </p>
    </div>
    <Separator />
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="font-semibold mb-1 text-sm">Specialties</h4>
        <div className="flex flex-wrap gap-2">
          {vendor.specializations?.map(s => (
            <Badge key={s} variant="outline" className="text-xs font-normal">{s}</Badge>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-1 text-sm">Average Cost</h4>
        <p className="text-sm text-muted-foreground">
          {vendor.avgCostPerPerson ? `₹${vendor.avgCostPerPerson} for one person (approx.)` : "₹50-150 for one person (approx.)"}
        </p>
      </div>
    </div>
    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
      <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
      <div>
        <h5 className="font-bold text-blue-800 text-sm">Hygiene Verified</h5>
        <p className="text-xs text-blue-600 mt-1">
          This vendor follows standard hygiene practices.
        </p>
      </div>
    </div>
  </div>
);

// Custom hook for a subtle, satisfying clicky sound when scrolling through items
function useScrollSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastScrollY = useRef(0);
  
  // Track continuous scrolling to prevent infinite sound spam
  const lastSoundTime = useRef(0);

  useEffect(() => {
    // Only works in browser environment
    if (typeof window === "undefined") return;

    const playTickSound = () => {
      const now = Date.now();
      if (now - lastSoundTime.current < 50) return; // Prevent overlapping sounds (max 1 per 50ms)
      
      try {
        if (!audioCtxRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          audioCtxRef.current = new AudioContext();
        }
        
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') return;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // A satisfying wooden tick/pop sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.04);
        
        lastSoundTime.current = now;
      } catch (e) {
        // Silently ignore audio errors
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Play a sound every time the user scrolls by 150 pixels
      if (Math.abs(currentScrollY - lastScrollY.current) > 150) {
        // Haptic feedback for mobile if enabled/allowed
        if (navigator.vibrate) {
            try { navigator.vibrate(5); } catch(e){} // very tiny vibration
        }
        playTickSound();
        lastScrollY.current = currentScrollY;
      }
    };

    const initAudio = () => {
      try {
        if (!audioCtxRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            audioCtxRef.current = new AudioContext();
          }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      } catch (e) {}
    };

    // User must interact with the page before AudioContext can resume
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true, passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try { audioCtxRef.current.close(); } catch(e){}
      }
    };
  }, []);
}

export default function StreetFoodDetail() {
  const [, params] = useRoute("/street-food/:vendorId");
  const vendorId = params?.vendorId;
  const [, navigate] = useLocation();
  const { addItem, items, removeItem } = useCartStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const categoryPillsRef = useRef<HTMLDivElement>(null);

  // Initialize scroll sound effect
  useScrollSound();

  // Verify mount
  useEffect(() => {
    console.log("StreetFoodDetail mounted, vendorId:", vendorId);
  }, [vendorId]);

  const { data: vendor, isLoading: loadingVendor } = useQuery<ServiceProvider>({
    queryKey: ["vendor", vendorId],
    queryFn: () => apiRequest("GET", `/api/service-providers/${vendorId}`).then(res => res.json()),
    enabled: !!vendorId
  });

  const { data: menuItems, isLoading: loadingMenu } = useQuery<StreetFoodItem[]>({
    queryKey: ["streetFoodMenu", vendorId],
    queryFn: () => apiRequest("GET", `/api/street-food-items?providerId=${vendorId}`).then(res => res.json()),
    enabled: !!vendorId
  });

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return menuItems?.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    ) || [];
  }, [menuItems, searchQuery]);

  // Group items by category, keeping the order categories first appear in
  const categoryEntries = useMemo(() => {
    const grouped = filteredItems.reduce((acc, item) => {
      const cat = item.category || "Recommended";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, StreetFoodItem[]>);
    return Object.entries(grouped);
  }, [filteredItems]);

  // Highlight the category currently on screen and keep its chip in view
  useEffect(() => {
    if (categoryEntries.length === 0) return;
    if (!categoryEntries.some(([cat]) => cat === activeCategory)) {
      setActiveCategory(categoryEntries[0][0]);
    }

    const handleScroll = () => {
      const headerOffset = 140;
      for (let i = categoryEntries.length - 1; i >= 0; i--) {
        const [cat] = categoryEntries[i];
        const el = document.getElementById(`cat-${cat}`);
        if (el && el.getBoundingClientRect().top <= headerOffset) {
          setActiveCategory(prev => {
            if (prev !== cat) {
              const pill = document.getElementById(`pill-${cat}`);
              const container = categoryPillsRef.current;
              if (pill && container) {
                container.scrollTo({ left: pill.offsetLeft - container.clientWidth / 2 + pill.clientWidth / 2, behavior: "smooth" });
              }
            }
            return cat;
          });
          return;
        }
      }
      setActiveCategory(categoryEntries[0][0]);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categoryEntries]);

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    setIsMenuSheetOpen(false);
    const el = document.getElementById(`cat-${cat}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 120;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  if (loadingVendor || !vendor) {
    return (
      <div className="min-h-screen animate-pulse bg-background">
        <div className="h-64 bg-muted" />
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <div className="h-8 w-1/2 bg-muted rounded" />
          <div className="h-4 w-1/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const getQuantity = (itemId: string) => items.find(i => i.id === itemId)?.quantity || 0;

  const handleAdd = (item: StreetFoodItem) => {
    const addOn = isAddOnCategory(item.category);
    if (addOn && !items.some((i) => i.providerId === vendor.id && !i.addOn)) {
      toast({ title: "Add a main dish first", description: ADD_ON_ONLY_MESSAGE });
      return;
    }
    // Explicitly format price as number for cart
    addItem({
      addOn,
      id: item.id,
      name: item.name,
      price: parseFloat(item.price.toString()),
      imageUrl: item.imageUrl || undefined,
      providerId: vendor.id,
      itemType: 'street_food',
    });
  };

  const cartHasThisVendor = items.length > 0 && vendorId === items[0].providerId;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Image */}
      <div className="relative h-64 md:h-80 w-full">
        <img loading="lazy" decoding="async"
          src={vendor.profileImageUrl || vendor.galleryImages?.[0] || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000&auto=format&fit=crop&q=60"}
          alt={vendor.businessName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-3xl font-bold mb-1">{vendor.businessName}</h1>
          <p className="text-white/90 text-sm mb-2">{vendor.specializations?.join(", ")}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="bg-green-600 px-1.5 py-0.5 rounded font-bold">{vendor.rating ? parseFloat(vendor.rating.toString()).toFixed(1) : "New"} ★</span>
            <span>• 35 mins</span>
            {vendor.avgCostPerPerson ? <span>• ₹{vendor.avgCostPerPerson} for one</span> : null}
            <span>• {vendor.address && vendor.address !== "Added via Admin Panel" ? vendor.address : "Shirur"}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="p-4 bg-background border-b mb-6 border-white/5 rounded-b-xl shadow-sm">
          <OverviewTab vendor={vendor} />
        </div>

        {/* Sticky search + category navigation */}
        {menuItems && menuItems.length > 0 && (
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b pt-[env(safe-area-inset-top)]">
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-10 rounded-xl"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Clear search">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {categoryEntries.length > 0 && (
                <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-3 rounded-xl border-muted-foreground/20 font-bold text-xs flex items-center gap-1.5 shrink-0 bg-background hover:bg-muted"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                      <span className="hidden sm:inline">Categories</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">
                        {categoryEntries.length}
                      </Badge>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="max-h-[75vh] rounded-t-2xl px-4 py-5 z-50">
                    <SheetHeader className="pb-3 border-b">
                      <div className="flex items-center justify-between">
                        <SheetTitle className="text-base font-extrabold flex items-center gap-2">
                          <UtensilsCrossed className="h-4 w-4 text-primary" />
                          Menu Categories
                        </SheetTitle>
                        <span className="text-xs text-muted-foreground font-medium">
                          {filteredItems.length} dishes
                        </span>
                      </div>
                    </SheetHeader>
                    <div className="py-3 space-y-1 overflow-y-auto max-h-[55vh]">
                      {categoryEntries.map(([cat, catItems]) => (
                        <button
                          key={cat}
                          onClick={() => scrollToCategory(cat)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                            activeCategory === cat
                              ? "bg-primary/10 text-primary font-bold"
                              : "hover:bg-muted text-foreground/80 font-medium"
                          }`}
                        >
                          <span className="text-sm">{cat}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-semibold">{catItems.length}</span>
                            {activeCategory === cat && <Check className="h-4 w-4 text-primary shrink-0" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>

            {categoryEntries.length > 0 && (
              <div
                ref={categoryPillsRef}
                className="flex items-center gap-2 overflow-x-auto px-4 pb-2.5 pt-0.5 no-scrollbar scrollbar-hide scroll-smooth"
              >
                {categoryEntries.map(([cat, catItems]) => (
                  <button
                    key={cat}
                    id={`pill-${cat}`}
                    onClick={() => scrollToCategory(cat)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 active:scale-95 ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        activeCategory === cat ? "bg-white/20 text-white font-bold" : "bg-background/80 text-muted-foreground font-medium"
                      }`}
                    >
                      {catItems.length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-4 space-y-8">
          {menuItems && menuItems.length > 0 && categoryEntries.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">No dishes match "{searchQuery}".</div>
          )}

          {/* Menu Categories */}
          {categoryEntries.map(([category, items]) => (
            <div key={category} id={`cat-${category}`} className="scroll-mt-36">
              <h3 className={`font-bold text-xl text-foreground ${isAddOnCategory(category) ? "mb-1" : "mb-4"}`}>{category} ({items.length})</h3>
              {isAddOnCategory(category) && (
                <p className="text-sm text-muted-foreground mb-4">Can be ordered only with a main dish.</p>
              )}
              <div className="space-y-4">
                {items.map(item => {
                  // SAFELY convert StreetFoodItem to RestaurantMenuItem shape for the component
                  const safeItem: any = {
                    ...item,
                    price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
                  };

                  return (
                    <FoodItemCard
                      key={item.id}
                      item={safeItem}
                      quantity={getQuantity(item.id)}
                      onAdd={() => handleAdd(item)}
                      onRemove={() => removeItem(item.id)}
                    />
                  );
                })}
              </div>
              <Separator className="my-6" />
            </div>
          ))}

          {(!menuItems || menuItems.length === 0) && (
            <div className="text-center py-10 text-muted-foreground">
              Menu items loading or not available.
            </div>
          )}

          <section aria-label="Ratings and reviews">
            <h3 className="font-bold text-xl text-foreground">Ratings & Reviews</h3>
            <ProviderReviews providerId={vendor.id} />
          </section>
        </div>
      </div>

      {/* Floating Quick Menu Button */}
      {categoryEntries.length > 1 && !isMenuSheetOpen && (
        <div
          className={`fixed right-4 z-30 md:hidden animate-in fade-in zoom-in duration-200 ${
            cartHasThisVendor ? "bottom-[calc(10rem+env(safe-area-inset-bottom))]" : "bottom-[calc(5rem+env(safe-area-inset-bottom))]"
          }`}
        >
          <Button
            onClick={() => setIsMenuSheetOpen(true)}
            className="rounded-full bg-slate-950/90 text-white hover:bg-slate-900 shadow-2xl backdrop-blur-md border border-white/20 px-4 h-11 flex items-center gap-2 font-bold text-xs"
          >
            <UtensilsCrossed className="h-4 w-4 text-primary" />
            <span>Menu</span>
            <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1.5">
              {categoryEntries.length}
            </Badge>
          </Button>
        </div>
      )}

      {/* Cart floating bar */}
      {cartHasThisVendor && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 p-4 bg-background border-t z-40">
          <div className="max-w-4xl mx-auto">
            <Button className="w-full h-12 text-lg font-bold flex justify-between items-center" onClick={() => navigate('/checkout')}>
              <span>{items.reduce((a, b) => a + b.quantity, 0)} items | ₹{items.reduce((a, b) => a + (b.price * b.quantity), 0)}</span>
              <span>View Cart</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}