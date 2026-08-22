import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Star, MapPin, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";
import { CakeProduct, ServiceProvider } from "@shared/schema";
import { CakeCategoryCarousel } from "@/components/cakes/CakeCategoryCarousel";

export default function CakeShop() {
  const [, setLocation] = useLocation();

  const { data: providers, isLoading: isProvidersLoading } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/service-providers?category=cake-shop"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/service-providers?category=cake-shop`);
      if (!res.ok) throw new Error("Failed to fetch providers");
      return res.json();
    },
  });

  const { data: cakes, isLoading: isCakesLoading } = useQuery<CakeProduct[]>({
    queryKey: ["/api/cakes"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/cakes`);
      if (!res.ok) throw new Error("Failed to fetch cakes");
      return res.json();
    },
  });

  const isLoading = isProvidersLoading || isCakesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-extrabold tracking-tight">Shirur Express Cakes</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        <CakeCategoryCarousel onSelect={(id) => setLocation(`/search?term=${id}`)} />

        <div>
          <h2 className="text-2xl font-black mb-6 text-foreground tracking-tight">Top Cake Shops</h2>

          {(!providers || providers.length === 0) ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
              <Store className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-600">No cake shops found</h3>
              <p className="text-sm text-gray-400 mt-1">Check back later for delicious cakes!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {providers.map((provider) => {
                // Get up to 6 cakes for this provider
                const providerCakes = cakes?.filter(c => c.providerId === provider.id).slice(0, 6) || [];
                
                return (
                  <div 
                    key={provider.id} 
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setLocation(`/cake-shop-menu/${provider.id}`)}
                  >
                    <div className="p-4 flex items-start gap-4 border-b border-gray-50">
                      <img 
                        src={provider.profileImageUrl || provider.galleryImages?.[0] || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1"} 
                        alt={provider.businessName}
                        className="w-16 h-16 rounded-xl object-cover shadow-sm bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-gray-900 truncate">{provider.businessName}</h3>
                          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs font-bold whitespace-nowrap border border-green-100">
                            <Star className="h-3 w-3 fill-current" />
                            <span>{provider.rating ? parseFloat(provider.rating.toString()).toFixed(1) : "New"}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 truncate flex items-center gap-1 mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {provider.address}
                        </p>
                      </div>
                    </div>

                    {/* Horizontal scrollable cakes */}
                    {providerCakes.length > 0 && (
                      <div className="p-4 bg-gray-50/50">
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                          {providerCakes.map(cake => (
                            <div key={cake.id} className="flex-none w-32 group">
                              <div className="relative h-24 w-full rounded-lg overflow-hidden bg-white shadow-sm border border-gray-100 mb-2">
                                <img 
                                  src={cake.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587"} 
                                  alt={cake.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <h4 className="text-xs font-medium text-gray-800 truncate leading-tight">{cake.name}</h4>
                              <p className="text-xs font-bold text-gray-900 mt-0.5">₹{cake.price}</p>
                            </div>
                          ))}
                          
                          <div className="flex-none w-32 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100 h-24 mt-0 text-sm font-medium text-primary cursor-pointer hover:bg-gray-50 transition-colors">
                            View all
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
