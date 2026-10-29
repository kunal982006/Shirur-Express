import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { HorizontalScrollList } from "@/components/horizontal-scroll-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Bell, Cake, ChevronRight, Home as HomeIcon, Minus, Package, Plus,
  RefreshCw, Scissors, Search, Shield, ShoppingBag, ShoppingBasket, Smartphone,
  Sparkles, UtensilsCrossed, Wrench, Zap, Sandwich, Heart, User as UserIcon, Settings as SettingsIcon, HelpCircle, Info, LogOut
} from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { OffersCarousel } from "@/components/offers-carousel";
import { useCartStore } from "@/hooks/use-cart-store";
import { trackEvent, FacebookStandardEvent } from "@/lib/facebook-pixel";
import { motion, AnimatePresence } from "framer-motion";
import { HomeHeroBanner } from "@/components/HomeHeroBanner";
import { HeroPromoCarousel } from "@/components/HeroPromoCarousel";
import { AddressChip } from "@/components/address/AddressChip";
import { CategoryCarousel } from "@/components/restaurants/CategoryCarousel";
import { useDeliveryEstimate } from "@/hooks/use-delivery-address";
import { formatDistance } from "@/lib/location";

const services = [
  { name: "Food", slug: "restaurants", icon: UtensilsCrossed, tone: "bg-orange-50 text-orange-600" },
  { name: "Groceries", slug: "grocery", icon: ShoppingBasket, tone: "bg-emerald-50 text-emerald-600" },
  { name: "Electrician", slug: "electrician", icon: Zap, tone: "bg-amber-50 text-amber-600" },
  { name: "Plumber", slug: "plumber", icon: Wrench, tone: "bg-sky-50 text-sky-600" },
  { name: "Beauty", slug: "beauty", icon: Scissors, tone: "bg-rose-50 text-rose-600" },
  { name: "Cakes", slug: "cake-shop", icon: Cake, tone: "bg-pink-50 text-pink-600" },
  { name: "Street food", slug: "street-food", icon: Sandwich, tone: "bg-red-50 text-red-600" },
  { name: "Properties", slug: "rental", icon: HomeIcon, tone: "bg-violet-50 text-violet-600" },
];

const phoneHubServices = [
  { id: "screen-guard", name: "Screen guard", icon: Shield, description: "Installation from ₹70" },
  { id: "phone-repair", name: "Phone repair", icon: Wrench, description: "Expert doorstep help" },
  { id: "buy-phone", name: "Buy phone", icon: ShoppingBag, description: "Verified phone deals" },
  { id: "sell-phone", name: "Sell phone", icon: RefreshCw, description: "Get the best quote" },
];

const SEARCH_PLACEHOLDERS = [
  "What do you need in Shirur today?",
  "Craving food or need a quick fix?",
  "Shirur ki har zaroorat, bas ek search door...",
  "Find food, groceries, electricians & more...",
  "Search for restaurants, daily needs, or home services...",
  "Order a meal or book a repair in Shirur...",
];

function PendingPaymentPrompt() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { data: bookings } = useQuery({
    queryKey: ["/api/customer/my-bookings"],
    queryFn: () => api.get("/customer/my-bookings").then((res) => res.data),
    enabled: Boolean(user),
  });
  const pendingBooking = useMemo(
    () => Array.isArray(bookings) ? bookings.find((booking: any) => booking.status === "pending_payment" && booking.invoice) : null,
    [bookings],
  );

  useEffect(() => setIsOpen(Boolean(pendingBooking)), [pendingBooking]);
  if (!pendingBooking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-sm rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg"><Package className="h-5 w-5 text-primary" /> Payment pending</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Your final technician bill is ready: <span className="font-semibold text-foreground">₹{pendingBooking.invoice.totalAmount}</span>.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => navigate(`/pay/invoice/${pendingBooking.invoice.id}`)}>Pay now</Button>
          <Button variant="outline" onClick={() => navigate("/my-bookings")}>View booking</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuantityControl({ item, add, update }: { item: any; add: () => void; update: (change: number) => void }) {
  const { items } = useCartStore();
  const inCart = items.find((cartItem: any) => cartItem.id === item.id);
  if (!inCart) {
    return <Button size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={(event) => { event.stopPropagation(); add(); }}>Add</Button>;
  }
  return (
    <div className="flex h-8 items-center rounded-lg border border-border bg-card" onClick={(event) => event.stopPropagation()}>
      <button className="grid h-8 w-8 place-items-center text-primary" aria-label={`Remove ${item.name}`} onClick={() => update(-1)}><Minus className="h-3.5 w-3.5" /></button>
      <span className="min-w-5 text-center text-xs font-semibold">{inCart.quantity}</span>
      <button className="grid h-8 w-8 place-items-center text-primary" aria-label={`Add another ${item.name}`} onClick={() => update(1)}><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function ProductCard({ item, onOpen, onAdd, onUpdate }: { item: any; onOpen: () => void; onAdd: () => void; onUpdate: (change: number) => void }) {
  return (
    <article className="app-product-card" onClick={onOpen}>
      <div className="relative">
        <img
          src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60"}
          alt={item.name}
          loading="lazy"
          onError={(event) => { event.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60"; }}
        />
        <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-xs">
          ★ 4.2 · 25m
        </span>
      </div>
      <div className="min-w-0 p-2">
        <p className="truncate text-xs sm:text-sm font-bold text-slate-900">{item.name}</p>
        <p className="truncate text-[10.5px] text-slate-500">{item.provider?.businessName || item.category || "Local favourite"}</p>
        <div className="mt-1.5 flex items-center justify-between gap-1">
          <span className="text-xs sm:text-sm font-extrabold text-slate-900">₹{item.price}</span>
          <QuantityControl item={item} add={onAdd} update={onUpdate} />
        </div>
      </div>
    </article>
  );
}

function TopPlaceCard({ provider, onClick }: { provider: any; onClick: () => void }) {
  const estimate = useDeliveryEstimate(provider);
  const rating = provider.rating ? Number(provider.rating).toFixed(1) : "4.2";
  return (
    <article className="app-place-card" onClick={onClick}>
      <div className="relative">
        <img src={provider.profileImageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60"} alt={provider.businessName} loading="lazy" />
        <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-xs">★ {rating}{estimate ? ` · ${estimate.minutes} mins` : ""}</span>
      </div>
      <div className="p-2">
        <p className="truncate text-xs sm:text-sm font-bold text-slate-900">{provider.businessName}</p>
        <p className="truncate text-[10.5px] text-slate-500">{estimate ? `${formatDistance(estimate.distanceKm)} away` : provider.address || "Shirur"}</p>
      </div>
    </article>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showPhoneHub, setShowPhoneHub] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { items, addItem, updateQuantity, getTotalPrice } = useCartStore();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (query) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [query]);

  useEffect(() => {
    if (user?.role === "admin") navigate("/admin");
  }, [navigate, user?.role]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (query.trim().length < 3) return setSuggestions([]);
      try {
        const response = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
        const result = response.data;
        setSuggestions(Array.isArray(result?.suggestions) ? result.suggestions : Array.isArray(result) ? result : []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data: popularData, isLoading: isPopularLoading } = useQuery({
    queryKey: ["/api/homepage/popular"],
    queryFn: () => api.get("/homepage/popular").then((response) => response.data),
  });

  const search = (term = query) => {
    const normalized = term.trim();
    if (!normalized) return searchRef.current?.focus();
    trackEvent(FacebookStandardEvent.Search, { search_string: normalized, content_category: "services" });
    navigate(`/search?term=${encodeURIComponent(normalized)}`);
  };

  const addProduct = (item: any, itemType: "restaurant" | "street_food") => {
    addItem({ id: item.id, name: item.name, price: Number(item.price), imageUrl: item.imageUrl, providerId: item.providerId, itemType });
    trackEvent(FacebookStandardEvent.AddToCart, { content_name: item.name, content_ids: [String(item.id)], content_type: "product", value: Number(item.price), currency: "INR" });
    toast({ title: "Added to cart", description: item.name });
  };

  const cartCount = items.reduce((total: number, item: any) => total + item.quantity, 0);

  return (
    <div className="app-home min-h-screen pb-28">
      <PendingPaymentPrompt />

      <header className="app-home__top relative overflow-hidden">
        <HomeHeroBanner />
        <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button className="shrink-0" onClick={() => navigate("/")} aria-label="Shirur Express home">
              <img src="/shirur-express-logo.png" alt="" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg object-cover shadow-sm" />
            </button>
            <span className="min-w-0"><span className="block truncate text-sm sm:text-[15px] font-extrabold tracking-tight text-white">Shirur Express</span><AddressChip variant="light" className="max-w-full" /></span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-white hover:bg-white/10 hover:text-white" onClick={() => navigate("/notifications")} aria-label="Notifications"><Bell className="h-4 w-4" /></Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900" aria-label={user ? "Account settings" : "Sign in"}>
                  {user ? <span className="text-xs sm:text-sm font-bold">{user.username.slice(0, 1).toUpperCase()}</span> : <Sparkles className="h-4 w-4" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                {user ? (
                  <>
                    <SheetHeader className="text-left border-b pb-4 mb-4">
                      <SheetTitle className="text-xl font-bold tracking-tight">Hi, {user.username}</SheetTitle>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </SheetHeader>
                    <div className="flex flex-col gap-1 mt-6">
                      <Button variant="ghost" className="justify-start font-medium" onClick={() => navigate("/wishlist")}>
                        <Heart className="mr-3 h-5 w-5 text-slate-500" /> Your Wishlist
                      </Button>
                      <Button variant="ghost" className="justify-start font-medium" onClick={() => navigate("/help-support")}>
                        <HelpCircle className="mr-3 h-5 w-5 text-slate-500" /> Help & Support
                      </Button>
                      <Button variant="ghost" className="justify-start font-medium" onClick={() => navigate("/edit-profile")}>
                        <UserIcon className="mr-3 h-5 w-5 text-slate-500" /> Edit Profile
                      </Button>
                      <Button variant="ghost" className="justify-start font-medium" onClick={() => navigate("/notifications")}>
                        <Bell className="mr-3 h-5 w-5 text-slate-500" /> Notifications
                      </Button>
                      <Button variant="ghost" className="justify-start font-medium" onClick={() => navigate("/general-info")}>
                        <Info className="mr-3 h-5 w-5 text-slate-500" /> General Info
                      </Button>
                      <Button variant="ghost" className="justify-start font-medium" onClick={() => navigate("/settings")}>
                        <SettingsIcon className="mr-3 h-5 w-5 text-slate-500" /> Setting
                      </Button>
                      <div className="h-px bg-slate-100 my-2" />
                      <Button variant="ghost" className="justify-start font-medium text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="mr-3 h-5 w-5 text-red-500" /> Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <UserIcon className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-xl font-bold">Welcome!</h2>
                      <p className="text-muted-foreground text-sm mt-1">Sign in to manage your account</p>
                    </div>
                    <Button onClick={() => navigate("/login")} className="w-full">Login / Signup</Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Sticky Search Bar (remains on screen when scrolling) */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-[#0d4294] via-[#0f4ea8] to-[#0d4294] shadow-md border-b border-blue-400/20 px-3 pt-[max(0.45rem,env(safe-area-inset-top))] pb-2 sm:px-6 sm:pb-2.5">
        <div className="mx-auto max-w-6xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 160)}
              onKeyDown={(event) => event.key === "Enter" && search()}
              className="h-10 sm:h-11 rounded-xl border-slate-200 bg-white pl-9 pr-20 text-sm shadow-xs"
            />
            {/* Motion Animated Search Placeholder */}
            {!query && (
              <div
                onClick={() => searchRef.current?.focus()}
                className="pointer-events-none absolute inset-y-0 left-9 right-20 flex items-center overflow-hidden z-10 select-none"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={placeholderIndex}
                    initial={{ y: 14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -14, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="text-xs sm:text-sm text-slate-400 truncate block w-full"
                  >
                    {SEARCH_PLACEHOLDERS[placeholderIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
            <button onClick={() => search()} className="absolute right-1 top-1 h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground z-10">Search</button>
            {isSearchFocused && suggestions.length > 0 && (
              <div className="absolute inset-x-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                {suggestions.slice(0, 6).map((suggestion) => (
                  <button key={suggestion} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs sm:text-sm hover:bg-slate-50" onMouseDown={() => { setQuery(suggestion); search(suggestion); }}>
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-2.5 px-3 pt-2 sm:px-6 sm:pt-3">
        {/* Hero Promo Carousel: Biryani (Restaurants) & HomeCare (Electrician / Technicians) */}
        <HeroPromoCarousel />

        <section aria-labelledby="services-heading">
          <div className="mb-1.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Everything nearby</p>
              <h1 id="services-heading" className="text-sm font-extrabold tracking-tight text-slate-950 sm:text-base">What do you need today?</h1>
            </div>
            <button className="text-xs font-semibold text-primary hover:underline" onClick={() => search("services")}>Browse all</button>
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8 sm:gap-2">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <button key={service.slug} className="app-service-tile" onClick={() => navigate(`/${service.slug}`)}>
                  <span className={`grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-lg ${service.tone}`}>
                    <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </span>
                  <span className="truncate w-full px-0.5">{service.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <button
            className="app-home__help w-full"
            onClick={() => navigate("/my-bookings")}
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Package className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">Track an order</span>
                <span className="text-[10.5px] text-slate-500 hidden sm:inline">• Bookings & live status</span>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary shrink-0">
                View <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </button>
        </section>

        <HorizontalScrollList
          title="Popular food near you"
          items={popularData?.menuItems || []}
          isLoading={isPopularLoading}
          autoScroll={true}
          onSeeAll={() => navigate("/restaurants")}
          renderItem={(item: any) => (
            <ProductCard
              item={item}
              onOpen={() => navigate(`/restaurants/${item.providerId}`)}
              onAdd={() => addProduct(item, "restaurant")}
              onUpdate={(change) => updateQuantity(item.id, change)}
            />
          )}
        />
        <HorizontalScrollList
          title="Local favourites"
          items={popularData?.streetFood || []}
          isLoading={isPopularLoading}
          autoScroll={true}
          onSeeAll={() => navigate("/street-food")}
          renderItem={(item: any) => (
            <ProductCard
              item={item}
              onOpen={() => navigate(`/street-food?item=${item.id}`)}
              onAdd={() => addProduct(item, "street_food")}
              onUpdate={(change) => updateQuantity(item.id, change)}
            />
          )}
        />
        <CategoryCarousel className="-mx-3 px-3 sm:-mx-6 sm:px-6" onSelect={(id) => navigate(`/search?term=${id}`)} />
        <HorizontalScrollList title="Top places in Shirur" items={popularData?.restaurants || []} isLoading={isPopularLoading} onSeeAll={() => navigate("/restaurants")} renderItem={(provider: any) => <TopPlaceCard provider={provider} onClick={() => navigate(`/restaurants/${provider.id}`)} />} />
      </main>

      {items.length > 0 && <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 mx-auto max-w-md"><Button className="h-14 w-full justify-between rounded-xl bg-slate-900 px-4 text-white shadow-xl hover:bg-slate-800" onClick={() => navigate("/checkout")}><span className="text-left"><span className="block text-[10px] font-semibold uppercase tracking-wider text-white/70">{cartCount} item{cartCount !== 1 ? "s" : ""}</span><span className="text-sm font-bold">₹{getTotalPrice().toFixed(2)}</span></span><span className="flex items-center gap-1 text-sm font-semibold">View cart <ChevronRight className="h-4 w-4" /></span></Button></div>}

      <Dialog open={showPhoneHub} onOpenChange={setShowPhoneHub}>
        <DialogContent className="max-w-sm rounded-2xl p-5"><DialogHeader><DialogTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-emerald-600" /> Express Phone Hub</DialogTitle></DialogHeader><p className="-mt-1 text-sm text-muted-foreground">Quick, local phone care and better deals.</p><div className="grid grid-cols-2 gap-2">{phoneHubServices.map((service) => { const Icon = service.icon; return <button key={service.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-left transition-colors hover:bg-emerald-100" onClick={() => { setShowPhoneHub(false); if (service.id === "buy-phone") navigate("/buy-phone"); else if (service.id === "sell-phone") navigate("/sell-phone"); else navigate(`/electrician/book?problemId=${service.id}&problemName=${encodeURIComponent(service.name)}`); }}><Icon className="mb-3 h-5 w-5 text-emerald-700" /><span className="block text-sm font-bold text-emerald-950">{service.name}</span><span className="mt-0.5 block text-[11px] text-emerald-800">{service.description}</span></button>; })}</div></DialogContent>
      </Dialog>
    </div>
  );
}
