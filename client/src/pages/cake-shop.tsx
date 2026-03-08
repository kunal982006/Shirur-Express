import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CakeSlice, Star, Loader2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { CakeProduct, ServiceProvider } from "@shared/schema";

function BakeryCard({ bakery, cakes, onClick }: { bakery: ServiceProvider; cakes: CakeProduct[]; onClick: () => void }) {
  const rating = bakery.rating ? parseFloat(bakery.rating.toString()).toFixed(1) : "New";
  const specializations = bakery.specializations || [];

  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "center", dragFree: true },
    [Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const displayImages = cakes.length > 0 ? cakes.map(c => c.imageUrl).filter(Boolean) : [bakery.profileImageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60"];
  if (displayImages.length === 0) displayImages.push("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60");

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-none shadow-sm group bg-card"
      onClick={onClick}
    >
      <div className="relative h-56 w-full overflow-hidden rounded-t-xl bg-muted" ref={emblaRef}>
        <div className="flex h-full">
          {displayImages.map((img, i) => (
            <div className="flex-[0_0_100%] h-full relative" key={i}>
              <img
                src={img!}
                alt={bakery.businessName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          ))}
        </div>

        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold shadow-sm z-10 text-black">
          30-40 min
        </div>
        {bakery.isAvailable === false && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <span className="text-white font-bold text-lg border border-white px-4 py-2 rounded shadow-lg backdrop-blur-sm">Currently Closed</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-lg truncate pr-2 text-foreground group-hover:text-primary transition-colors">{bakery.businessName}</h3>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-xs font-bold ${Number(rating) >= 4.0 ? 'bg-green-600' : 'bg-green-500'}`}>
            <span>{rating}</span>
            <Star className="h-3 w-3 fill-white" />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <p className="truncate w-2/3 text-pink-600 font-medium">{specializations.slice(0, 2).join(", ") || "Cakes & Desserts"}</p>
          <p>₹200 for two</p>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
            <Clock className="h-3 w-3" />
            <span>Freshly baked</span>
          </div>
          <span className="truncate max-w-[150px]">{bakery.address}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CakeShop() {
  const [, setLocation] = useLocation();

  const { data: cakes, isLoading } = useQuery<CakeProduct[]>({
    queryKey: ["/api/cakes"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/cakes`);
      if (!res.ok) throw new Error("Failed to fetch cakes");
      return res.json();
    },
  });

  const { data: bakeries, isLoading: isLoadingBakeries } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/bakeries"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/bakeries`);
      if (!res.ok) throw new Error("Failed to fetch bakeries");
      return res.json();
    },
  });

  if (isLoading || isLoadingBakeries) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback if no cakes are loaded yet
  if (!cakes || cakes.length === 0) {
    return (
      <div className="py-16 bg-background pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-8 flex items-center space-x-2" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          <div className="flex flex-col items-center justify-center mt-12 text-center">
            <CakeSlice className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-muted-foreground">No cakes available right now</h2>
            <p className="text-muted-foreground mt-2">Please check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter out cakes that might not have imagery just in case (optional, but good for UI)
  const validCakes = cakes.filter(c => c.imageUrl);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-extrabold tracking-tight">Cakes & Desserts</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

        <div>
          <h2 className="text-2xl font-black mb-6 text-foreground tracking-tight">Top Bakeries Near You</h2>

          {bakeries && bakeries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bakeries.map((bakery) => {
                const bakeryCakes = cakes ? cakes.filter(c => c.providerId === bakery.id) : [];
                return (
                  <BakeryCard
                    key={bakery.id}
                    bakery={bakery}
                    cakes={bakeryCakes}
                    onClick={() => setLocation(`/restaurants/${bakery.id}`)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">No bakeries found.</div>
          )}
        </div>

      </div>
    </div>
  );
}
