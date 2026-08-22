import { useLocation, Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Plus, Minus, Star, MapPin, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";
import { CakeProduct, ServiceProvider } from "@shared/schema";
import { useCartStore } from "@/hooks/use-cart-store";

function CakeCard({ cake, onAdd, quantity, onUpdateQuantity }: { cake: CakeProduct, onAdd: () => void, quantity: number, onUpdateQuantity: (q: number) => void }) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-none shadow-sm bg-card">
      <div className="relative h-48 w-full bg-muted">
        <img 
          src={cake.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587"} 
          alt={cake.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        {cake.isAvailable === false && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold px-3 py-1 border border-white rounded shadow-sm backdrop-blur-sm">Sold Out</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg truncate text-foreground group-hover:text-primary transition-colors">{cake.name}</h3>
        <p className="text-xs text-muted-foreground truncate mb-2">{cake.description || "Delicious fresh cake from Shirur Express"}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="font-extrabold text-lg">₹{cake.price}</span>
          
          {cake.isAvailable !== false && (
            quantity > 0 ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-1 shadow-sm">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-700 hover:bg-green-100 rounded" onClick={(e) => { e.stopPropagation(); onUpdateQuantity(quantity - 1); }}>
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-bold w-4 text-center text-green-800">{quantity}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-700 hover:bg-green-100 rounded" onClick={(e) => { e.stopPropagation(); onUpdateQuantity(quantity + 1); }}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Button 
                    variant="outline" 
                    className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 uppercase text-xs font-bold px-6 py-1 h-9 shadow-sm"
                    onClick={(e) => { e.stopPropagation(); onAdd(); }}
                >
                    Add
                </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CakeShopMenu() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/cake-shop-menu/:id");
  const providerId = params?.id;
  const { addItem, items, updateQuantity } = useCartStore();

  const { data: provider, isLoading: isProviderLoading } = useQuery<ServiceProvider>({
    queryKey: [`/api/service-providers/${providerId}`],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/service-providers/${providerId}`);
      if (!res.ok) throw new Error("Failed to fetch provider");
      return res.json();
    },
    enabled: !!providerId,
  });

  const { data: cakes, isLoading: isCakesLoading } = useQuery<CakeProduct[]>({
    queryKey: [`/api/cakes?providerId=${providerId}`],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/cakes?providerId=${providerId}`);
      if (!res.ok) throw new Error("Failed to fetch cakes");
      return res.json();
    },
    enabled: !!providerId,
  });

  const isLoading = isProviderLoading || isCakesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold">Provider not found</h2>
        <Button onClick={() => setLocation("/cake-shop")} className="mt-4">Back to Cake Shops</Button>
      </div>
    );
  }

  const getQuantity = (itemId: string) => items.find(i => i.id === itemId)?.quantity || 0;

  const handleAdd = (cake: CakeProduct) => {
    addItem({
      id: cake.id,
      name: cake.name,
      price: parseFloat(cake.price.toString()),
      imageUrl: cake.imageUrl || undefined,
      providerId: cake.providerId,
      itemType: 'restaurant', // Using restaurant type to share the cart flow
    });
  };

  const handleUpdateQuantity = (cakeId: string, quantity: number) => {
    if (quantity === 0) {
      updateQuantity(cakeId, 0);
    } else {
      updateQuantity(cakeId, quantity);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Image & Info */}
      <div className="relative h-48 md:h-64 bg-slate-800">
        <img 
          src={provider.profileImageUrl || provider.galleryImages?.[0] || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1"} 
          alt={provider.businessName}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/cake-shop")} className="bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">{provider.businessName}</h1>
          <p className="text-sm text-gray-200 mb-2 flex items-center gap-1"><MapPin className="h-3 w-3"/> {provider.address}</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 bg-green-600 px-2 py-0.5 rounded text-white font-bold">
              <Star className="h-3 w-3 fill-current" />
              <span>{provider.rating ? parseFloat(provider.rating.toString()).toFixed(1) : "New"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <div>
          <h2 className="text-xl font-black mb-6 text-foreground tracking-tight flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Full Menu
          </h2>

          {!cakes || cakes.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
               <h3 className="text-lg font-medium text-gray-600">No cakes currently available</h3>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {cakes.map((cake) => (
                <CakeCard
                  key={cake.id}
                  cake={cake}
                  onAdd={() => handleAdd(cake)}
                  quantity={getQuantity(cake.id)}
                  onUpdateQuantity={(q) => handleUpdateQuantity(cake.id, q)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {items.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-8 md:bottom-8 md:w-96">
            <Link href="/checkout">
                <Button className="w-full h-14 rounded-xl shadow-2xl bg-green-600 hover:bg-green-700 text-white flex justify-between items-center px-4 animate-in slide-in-from-bottom-5">
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-medium uppercase tracking-wider">{items.length} ITEMS</span>
                        <span className="font-bold text-lg">₹{items.reduce((a, b) => a + b.price * b.quantity, 0)} plus taxes</span>
                    </div>
                    <span className="font-bold flex items-center gap-2">
                        View Cart <ArrowLeft className="h-4 w-4 rotate-180" />
                    </span>
                </Button>
            </Link>
        </div>
      )}
    </div>
  );
}
