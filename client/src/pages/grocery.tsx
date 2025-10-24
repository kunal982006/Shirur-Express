// client/src/pages/Grocery.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/grocery/product-card";
// --- BADLAV: CartSummary ko hata diya, ab inline summary hai ---
// import CartSummary from "@/components/grocery/cart-summary";
// --- BADLAV: useCart ki jagah useCartStore import kiya ---
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast"; // Toast ko bhi import kiya

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
  Sparkles,// Naya icon add kiya
} from "lucide-react";


// --- YEH WALA 'categories' ARRAY UPDATE KARO ---
const categories = [
  { name: "Fruits", icon: Apple, slug: "fruits" },
  { name: "Vegetables", icon: Carrot, slug: "vegetables" },
  { name: "Dairy", icon: Milk, slug: "dairy" },
  { name: "Bakery", icon: Croissant, slug: "bakery" },
  { name: "Snacks", icon: Cookie, slug: "snacks" },
  { name: "Beverages", icon: Coffee, slug: "beverages" },
  { name: "Staples", icon: ShoppingBag, slug: "staples" }, // Nayi category
  { name: "Toiletries", icon: Sparkles, slug: "toiletries" }, // Nayi category
  { name: "Personal Care", icon: Sparkles, slug: "personal-care" }, // Nayi category (Sparkles icon use kiya, aap badal sakte ho)
];

// API function to fetch grocery products (queryKey ko deconstruct karke use kiya)
const fetchGroceryProducts = async ({ queryKey }: { queryKey: (string | { category: string, search: string })[] }) => {
  const [, { category, search }] = queryKey;
  const url = `/api/grocery-products?${category ? `category=${category}` : ''}${search ? `&search=${search}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch grocery products');
  }
  return res.json();
};

export default function Grocery() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  // --- BADLAV: useCart ki jagah useCartStore se items, addItem, updateQuantity, getTotalPrice liya ---
  const { items, addItem, updateQuantity, getTotalPrice } = useCartStore();
  const { toast } = useToast(); // useToast ko use karenge

  const { data: products, isLoading } = useQuery({
    queryKey: ["groceryProducts", { category: selectedCategory, search: searchQuery }],
    queryFn: fetchGroceryProducts, // fetchGroceryProducts ko directly pass kiya
  });

  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategory(selectedCategory === categorySlug ? "" : categorySlug);
  };

  const handleAddToCart = (product: any) => {
    // Check if the item is already in the cart. If yes, update quantity instead of adding new.
    const existingItem = items.find(item => item.id === product.id);
    if (existingItem) {
      updateQuantity(product.id, 1); // Increase quantity by 1
      toast({
        title: "➕ Quantity Updated!",
        description: `${product.name} quantity increased to ${existingItem.quantity + 1}.`,
      });
    } else {
      addItem({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        // --- BADLAV: `weight` prop ko ab bhi yahan se remove kiya hai,
        //             kyunki useCartStore me weight nahi hai.
        //             Agar chahiye, toh useCartStore ke CartItem type me add karna hoga.
        // weight: product.weight,
        imageUrl: product.imageUrl,
      });
      toast({
        title: "✅ Added to Cart!",
        description: `${product.name} has been added to your cart.`,
      });
    }
  };


  // --- BADLAV: getTotalItems aur getSubtotal ki ab zaroorat nahi, useCartStore ke functions use honge ---
  // const getTotalItems = () => { /* ... */ };
  // const getSubtotal = () => { /* ... */ };

  return (
    <div className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 flex items-center space-x-2"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Services</span>
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">GMart Grocery</h2>
            <p className="text-muted-foreground">Fresh groceries delivered to your doorstep</p>
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
                  data-testid={`category-${category.slug}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    selectedCategory === category.slug
                      ? "bg-primary-foreground"
                      : "bg-secondary/10"
                  }`}>
                    <category.icon className={`h-6 w-6 ${
                      selectedCategory === category.slug
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
              data-testid="input-search"
            />
          </div>
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            // Loading Skeletons
            [...Array(8)].map((_, i) => (
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
            ))
          ) : products?.length === 0 ? (
            // No Products Found Message
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or category filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            // Actual Product Cards
            products?.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
                // --- BADLAV: Quantity prop add kiya ProductCard me ---
                quantity={items.find(item => item.id === product.id)?.quantity || 0}
                onIncreaseQuantity={() => updateQuantity(product.id, 1)}
                onDecreaseQuantity={() => updateQuantity(product.id, -1)}
              />
            ))
          )}
        </div>

        {/* --- BADLAV: Cart Summary Component (Inline) --- */}
        {/* Ab hum useCartStore ke items aur functions ko use karenge */}
        {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-card p-4 shadow-lg border-t z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">{items.reduce((total, item) => total + item.quantity, 0)} Items</p>
                <p className="text-xl font-bold">₹{getTotalPrice().toFixed(2)}</p>
              </div>
              <Button onClick={() => setLocation("/checkout")}>
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