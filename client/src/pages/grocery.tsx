// client/src/pages/Grocery.tsx (MODIFIED FOR providerId)
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/grocery/product-card";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";

import {
  ArrowLeft,
  Search,
  Filter,
  Apple,
  Carrot,
  Milk,
  Croissant,
  Cookie,
  Coffee,
  ShoppingBag,
  Sparkles,
  Loader2, // Loader icon add kiya
} from "lucide-react";
import type { ServiceProvider, User, ServiceCategory, GroceryProduct } from "@shared/schema"; // Types import kiye

// Categories list wahi rahegi
const categories = [
  { name: "Fruits", icon: Apple, slug: "fruits" },
  { name: "Vegetables", icon: Carrot, slug: "vegetables" },
  { name: "Dairy", icon: Milk, slug: "dairy" },
  { name: "Bakery", icon: Croissant, slug: "bakery" },
  { name: "Snacks", icon: Cookie, slug: "snacks" },
  { name: "Beverages", icon: Coffee, slug: "beverages" },
  { name: "Staples", icon: ShoppingBag, slug: "staples" },
  { name: "Toiletries", icon: Sparkles, slug: "toiletries" },
  { name: "Personal Care", icon: Sparkles, slug: "personal-care" },
];

// Type define kiya service provider ke liye
type GMartProvider = ServiceProvider & { user: User; category: ServiceCategory };

// API function GMart provider ko fetch karne ke liye
const fetchGmartProvider = async (): Promise<GMartProvider | undefined> => {
  const res = await fetch(`/api/service-providers?category=grocery`);
  if (!res.ok) {
    throw new Error('Failed to fetch GMart provider');
  }
  const providers: GMartProvider[] = await res.json();
  // Hum assume kar rahe hain ki GMart ka ek hi official provider hai
  return providers[0];
};

// API function grocery products fetch karne ke liye (ab providerId lega)
const fetchGroceryProducts = async ({ queryKey }: { queryKey: [string, string | undefined, string] }): Promise<GroceryProduct[]> => {
  const [, providerId, search] = queryKey;

  if (!providerId) {
    // Agar providerId nahi hai, toh fetch mat karo
    return [];
  }

  const url = `/api/grocery-products?providerId=${providerId}&${search ? `search=${search}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch grocery products');
  }
  return res.json();
};

// --- YEH HAI NAYA LOADING COMPONENT ---
function GMartLoading() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="aspect-square bg-muted"></div>
          <CardContent className="p-3">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded mb-2"></div>
            <div className="flex justify-between items-center">
              <div className="h-4 bg-muted rounded w-16"></div>
              <div className="w-8 h-8 bg-muted rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Grocery() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // Yeh abhi sirf UI ke liye hai
  const [searchQuery, setSearchQuery] = useState("");
  const { items, addItem, updateQuantity, getTotalPrice } = useCartStore();
  const { toast } = useToast();

  // --- STEP 1: GMart Provider ko fetch karo ---
  const { data: gmartProvider, isLoading: isLoadingProvider } = useQuery({
    queryKey: ["gmartProvider"],
    queryFn: fetchGmartProvider,
  });

  const gmartProviderId = gmartProvider?.id;

  // --- STEP 2: Provider ID milne ke baad hi products fetch karo ---
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["groceryProducts", gmartProviderId, searchQuery],
    queryFn: fetchGroceryProducts,
    enabled: !!gmartProviderId, // Yeh query tabhi chalegi jab providerId mil jayega
  });

  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategory(selectedCategory === categorySlug ? "" : categorySlug);
    // TODO: Ab category select pe client-side filter kar sakte hain,
    // ya backend API ko update kar sakte hain ki woh providerId + category dono le.
    // Abhi ke liye, yeh sirf UI highlight karega.
  };

  const handleAddToCart = (product: GroceryProduct) => {
    const existingItem = items.find(item => item.id === product.id);
    if (existingItem) {
      updateQuantity(product.id, 1);
      toast({
        title: "➕ Quantity Updated!",
        description: `${product.name} quantity increased to ${existingItem.quantity + 1}.`,
      });
    } else {
      addItem({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        imageUrl: product.imageUrl || undefined,
        quantity: 1, // Store 'quantity' 1 se start karega
        providerId: product.providerId, // Pass providerId
      });
      toast({
        title: "✅ Added to Cart!",
        description: `${product.name} has been added to your cart.`,
      });
    }
  };

  // Filtered products (client-side category filter)
  const filteredProducts = products
    ? products.filter(product =>
      selectedCategory ? product.category === selectedCategory : true
    )
    : [];

  const isLoading = isLoadingProvider || isLoadingProducts;

  return (
    <div className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 flex items-center space-x-2"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Services</span>
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            {/* Ab provider ka naam dikha sakte hain */}
            <h2 className="text-3xl font-bold mb-2">
              {gmartProvider ? gmartProvider.businessName : "GMart Grocery"}
            </h2>
            <p className="text-muted-foreground">
              {gmartProvider ? gmartProvider.description : "Fresh groceries..."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Delivery Charges</p>
            <p className="text-lg font-semibold">₹7 per km + 1% platform fee</p>
          </div>
        </div>

        {/* Categories Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category.slug}
                  variant={selectedCategory === category.slug ? "default" : "ghost"}
                  className="flex-shrink-0 flex flex-col items-center p-3 h-auto"
                  onClick={() => handleCategorySelect(category.slug)}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${selectedCategory === category.slug
                      ? "bg-primary-foreground"
                      : "bg-secondary/10"
                    }`}>
                    <category.icon className={`h-6 w-6 ${selectedCategory === category.slug
                        ? "text-primary"
                        : "text-secondary"
                      }`} />
                  </div>
                  <span className="text-xs font-medium">{category.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for products..."
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <GMartLoading />
        ) : filteredProducts.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Try selecting a different category or clearing filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {filteredProducts.map((product: GroceryProduct) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
                quantity={items.find(item => item.id === product.id)?.quantity || 0}
                onIncreaseQuantity={() => updateQuantity(product.id, 1)}
                onDecreaseQuantity={() => updateQuantity(product.id, -1)}
              />
            ))}
          </div>
        )}

        {/* Cart Summary (neeche waala bar) */}
        {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-card p-4 shadow-lg border-t z-50 animate-slide-up-fast">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">{items.reduce((total, item) => total + item.quantity, 0)} Items</p>
                <p className="text-xl font-bold">₹{getTotalPrice().toFixed(2)}</p>
              </div>
              <Button onClick={() => setLocation("/checkout")} size="lg">
                Proceed to Checkout
                <ShoppingBag className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}