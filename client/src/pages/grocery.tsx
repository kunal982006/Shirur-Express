// client/src/pages/Grocery.tsx (MODIFIED FOR providerId)
import { useState } from "react";
import { useQuery, useInfiniteQuery, type QueryFunctionContext } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";

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
  const res = await fetch(`${API_BASE_URL}/api/service-providers?category=grocery`);
  if (!res.ok) {
    throw new Error('Failed to fetch GMart provider');
  }
  const providers: GMartProvider[] = await res.json();
  // Hum assume kar rahe hain ki GMart ka ek hi official provider hai
  return providers[0];
};

// API function grocery products fetch karne ke liye (ab providerId aur filters lega)
const fetchGroceryProducts = async ({
  queryKey,
  pageParam = 0
}: {
  queryKey: [string, string | undefined, string, string[]];
  pageParam?: number;
}): Promise<GroceryProduct[]> => {
  const [, providerId, search, categories] = queryKey;

  if (!providerId) {
    return [];
  }

  // Construct URL with query parameters
  const params = new URLSearchParams();
  params.append("providerId", providerId);
  const limit = 24; // Optimised batch size (multiple of 3 and 4)
  params.append("limit", limit.toString());
  params.append("offset", pageParam.toString());

  if (search) {
    params.append("search", search);
  }

  if (categories && categories.length > 0) {
    params.append("categories", categories.join(","));
  }

  const res = await fetch(`${API_BASE_URL}/api/grocery-products?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch grocery products');
  }
  return res.json();
};

function GMartLoading() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-8">
      {[...Array(12)].map((_, i) => ( // Show more skeletons
        <Card key={i} className="animate-pulse border-none shadow-none">
          <div className="aspect-square bg-gray-100 rounded-md mb-2"></div>
          <CardContent className="p-0">
            <div className="h-3 bg-gray-100 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Grocery() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { items, addItem, updateQuantity, getTotalPrice } = useCartStore();
  const { toast } = useToast();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- STEP 1: GMart Provider ko fetch karo ---
  const { data: gmartProvider, isLoading: isLoadingProvider } = useQuery({
    queryKey: ["gmartProvider"],
    queryFn: fetchGmartProvider,
    staleTime: 1000 * 60 * 60, // Cache provider fetch for 1 hour (optimization)
  });

  const gmartProviderId = gmartProvider?.id;

  // --- STEP 2: Use Infinite Query for Pagination ---
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingProducts
  } = useInfiniteQuery<GroceryProduct[]>({
    queryKey: ["groceryProducts", gmartProviderId, searchQuery, selectedCategories],
    queryFn: (context: QueryFunctionContext) => fetchGroceryProducts({
      queryKey: context.queryKey as [string, string | undefined, string, string[]],
      pageParam: context.pageParam as number
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: GroceryProduct[], allPages: GroceryProduct[][]) => {
      // If last page has fewer items than limit, we reached the end
      if (lastPage.length < 24) return undefined;
      return allPages.length * 24;
    },
    enabled: !!gmartProviderId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Flatten pages
  const products = data ? data.pages.flat() : [];

  // --- Metadata (Categories & Brands) ---
  const { data: metadata } = useQuery({
    queryKey: ["groceryMetadata", gmartProviderId],
    queryFn: async () => {
      if (!gmartProviderId) return { categories: [], brands: [] };
      const res = await fetch(`${API_BASE_URL}/api/grocery-metadata?providerId=${gmartProviderId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!gmartProviderId,
    staleTime: 1000 * 60 * 10, // Cache metadata for 10 mins
  });

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
        providerId: product.providerId,
      });
      toast({
        title: "✅ Added to Cart!",
        description: `${product.name} has been added to your cart.`,
      });
    }
  };

  // Filtered products (Now mostly handled by server, but we keep generic brand filter or fallback)
  // Since we don't have server-side brand filtering yet, we filter brands on the client on the FETCHED set.
  // Note: This has limitations with pagination (user might not find brand if not in top 100), but acceptable for MVP optimization.
  // Detect basket placeholder image
  const BASKET_PLACEHOLDER = "groceries.png";
  const isRealImage = (url?: string | null) => !!url && !url.includes(BASKET_PLACEHOLDER);

  const filteredProducts = products
    ? products.filter(product => {
      // Temporarily hide products without a real image (i.e. default basket)
      if (!isRealImage(product.imageUrl)) {
        return false;
      }

      // Search and Categories are already filtered by Server.
      // Only filter brands client-side if selected.
      const matchesBrand = selectedBrands.length === 0 || (product.brand && selectedBrands.includes(product.brand));
      return matchesBrand;
    }).sort((a, b) => {
      // Products with real images and in-stock first, basket/placeholder images and sold-out last
      const aIsGood = a.inStock && isRealImage(a.imageUrl);
      const bIsGood = b.inStock && isRealImage(b.imageUrl);
      if (aIsGood && !bIsGood) return -1;
      if (!aIsGood && bIsGood) return 1;
      return 0;
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
              {gmartProvider ? gmartProvider.description : "Order fresh groceries with fast home delivery 🥦🍎"}
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
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-8">
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

        {/* Load More Button */}
        {hasNextPage && (
          <div className="flex justify-center mb-24">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full sm:w-auto"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading more...
                </>
              ) : (
                "Load More Products"
              )}
            </Button>
          </div>
        )}

        {/* Cart Summary (neeche waala bar) */}
        {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-card p-4 shadow-lg border-t z-50 animate-slide-up-fast">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">{items.reduce((total, item) => total + item.quantity, 0)} Items</p>
                <p className="text-xl font-bold">₹{getTotalPrice().toFixed(2)}</p>
                {getTotalPrice() < 50 && (
                  <p className="text-xs text-orange-600 font-medium">Min. order ₹50 • Add ₹{(50 - getTotalPrice()).toFixed(2)} more</p>
                )}
              </div>
              <Button
                onClick={() => {
                  if (getTotalPrice() < 50) {
                    toast({
                      title: "⚠️ Minimum Order ₹50",
                      description: `Please add ₹${(50 - getTotalPrice()).toFixed(2)} more to proceed.`,
                      variant: "destructive",
                    });
                    return;
                  }
                  setLocation("/checkout");
                }}
                size="lg"
                disabled={getTotalPrice() < 50}
              >
                {getTotalPrice() < 50
                  ? `Add ₹${(50 - getTotalPrice()).toFixed(2)} more`
                  : "Proceed to Checkout"}
                <ShoppingBag className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}