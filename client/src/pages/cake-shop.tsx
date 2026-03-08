import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CakeSlice, Star, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { CakeProduct } from "@shared/schema";

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

  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true },
    [Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  if (isLoading) {
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

        {/* Highlighted Offers / Scrolling Banner (Zomato Style) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500" fill="currentColor" />
              Special Occasion Bakes
            </h2>
            <div className="text-sm font-bold text-rose-500 flex items-center cursor-pointer hover:underline">
              See all <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </div>

          {/* Continuous Auto-scrolling Carousel */}
          <div className="overflow-hidden rounded-xl" ref={emblaRef}>
            <div className="flex touch-pan-y -ml-4">
              {validCakes.map((cake, idx) => (
                <div
                  key={`carousel-${cake.id}-${idx}`}
                  className="flex-[0_0_85%] sm:flex-[0_0_60%] md:flex-[0_0_40%] lg:flex-[0_0_30%] pl-4"
                >
                  <div
                    className="relative rounded-2xl overflow-hidden aspect-[4/3] group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border border-border/40"
                    onClick={() => setLocation(`/cake/${cake.id}`)}
                  >
                    <img
                      src={cake.imageUrl || undefined}
                      alt={cake.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
                      {cake.isPopular && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-black border-none font-bold shadow-lg">
                            Bestseller
                          </Badge>
                        </div>
                      )}

                      <div className="flex justify-between items-end gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-bold text-white mb-1 truncate drop-shadow-md">
                            {cake.name}
                          </h3>
                          <p className="text-pink-200 text-sm truncate font-medium">
                            {cake.category || "Custom Cake"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base font-black text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/30">
                            ₹{cake.price}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 my-8 w-full"></div>

        {/* Regular Grid (All items) */}
        <div>
          <h2 className="text-2xl font-black mb-6 text-foreground tracking-tight">Explore the Bakery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {cakes.map((cake) => (
              <Card
                key={`grid-${cake.id}`}
                className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-border/40 group bg-white/50 backdrop-blur-sm"
                onClick={() => setLocation(`/cake/${cake.id}`)}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {cake.imageUrl ? (
                    <img
                      src={cake.imageUrl}
                      alt={cake.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <CakeSlice className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  {cake.weight && (
                    <Badge variant="secondary" className="absolute bottom-2 left-2 bg-white/90 text-black shadow-sm font-semibold border-none">
                      {cake.weight}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-bold text-base truncate flex-1 leading-tight group-hover:text-primary transition-colors">{cake.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-2 font-medium">{cake.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[15px] tracking-tight text-foreground">₹{cake.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
