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
  Check,
} from "lucide-react";
import type { ServiceProvider, User, ServiceCategory, GroceryProduct } from "@shared/schema"; // Types import kiye
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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

  // --- Metadata (Categories & Brands) ---
  const { data: metadata } = useQuery({
    queryKey: ["groceryMetadata", gmartProviderId],
    queryFn: async () => {
      if (!gmartProviderId) return { categories: [], brands: [] };
      const res = await fetch(`/api/grocery-metadata?providerId=${gmartProviderId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!gmartProviderId
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSearchQuery("");
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
    ? products.filter(product => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const matchesBrand = selectedBrands.length === 0 || (product.brand && selectedBrands.includes(product.brand));
      // Search is mainly handled by API but let's double check if we can refine
      const matchesSearch = !searchQuery || product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesBrand && matchesSearch;
    })
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

          {/* Removed Delivery Charges Info as per user request */}
        </div>

        {/* Categories Navigation (Horizontal Scroll) */}
        {metadata?.categories && metadata.categories.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                {metadata.categories.map((category: string) => (
                  <Button
                    key={category}
                    variant={selectedCategories.includes(category) && selectedCategories.length === 1 ? "default" : "ghost"}
                    className="flex-shrink-0 flex flex-col items-center p-3 h-auto min-w-[80px]"
                    onClick={() => {
                      // Quick filter behavior: Single select toggle
                      if (selectedCategories.includes(category) && selectedCategories.length === 1) {
                        setSelectedCategories([]);
                      } else {
                        setSelectedCategories([category]);
                      }
                    }}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${selectedCategories.includes(category) && selectedCategories.length === 1
                      ? "bg-primary-foreground"
                      : "bg-secondary/10"
                      }`}>
                      <ShoppingBag className={`h-6 w-6 ${selectedCategories.includes(category) && selectedCategories.length === 1
                        ? "text-primary"
                        : "text-secondary"
                        }`} />
                    </div>
                    <span className="text-xs font-medium text-center truncate w-full">{category}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2 relative">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                {(selectedCategories.length > 0 || selectedBrands.length > 0) && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {selectedCategories.length + selectedBrands.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                <div className="py-4 space-y-6">
                  {/* Categories Filter */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {metadata?.categories?.map((cat: string) => (
                        <Badge
                          key={cat}
                          variant={selectedCategories.includes(cat) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleCategory(cat)}
                        >
                          {cat}
                          {selectedCategories.includes(cat) && <Check className="ml-1 h-3 w-3" />}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Brands Filter */}
                  {metadata?.brands && metadata.brands.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Brands</h3>
                      <div className="flex flex-wrap gap-2">
                        {metadata.brands.map((brand: string) => (
                          <Badge
                            key={brand}
                            variant={selectedBrands.includes(brand) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleBrand(brand)}
                          >
                            {brand}
                            {selectedBrands.includes(brand) && <Check className="ml-1 h-3 w-3" />}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="py-4 border-t mt-auto">
                <Button variant="destructive" className="w-full" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
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
                {searchQuery || selectedCategories.length > 0 || selectedBrands.length > 0
                  ? 'Try adjusting your filters or search term.'
                  : 'No products available.'}
              </p>
              <Button variant="link" onClick={clearFilters}>Clear Filters</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {filteredProducts.map((product: GroceryProduct) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  weight: product.weight || undefined,
                  imageUrl: product.imageUrl || undefined,
                  mrp: product.mrp || undefined
                }}
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