import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CakeSlice, Loader2, Plus, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";
import { CakeProduct } from "@shared/schema";
import { CakeCategoryCarousel } from "@/components/cakes/CakeCategoryCarousel";
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

export default function CakeShop() {
  const [, setLocation] = useLocation();
  const { addItem, items, updateQuantity } = useCartStore();

  const { data: cakes, isLoading } = useQuery<CakeProduct[]>({
    queryKey: ["/api/cakes"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/cakes`);
      if (!res.ok) throw new Error("Failed to fetch cakes");
      return res.json();
    },
  });

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
          <h2 className="text-2xl font-black mb-6 text-foreground tracking-tight">Freshly Baked & Ready</h2>

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
