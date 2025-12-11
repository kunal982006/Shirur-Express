import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sandwich, Flame, Leaf, MapPin, Star, Phone, ShoppingBag } from "lucide-react";

// --- YEH NAYE IMPORTS ADD KIYE HAIN ---
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";

const foodCategories = [
  { value: "all", label: "All Items" },
  { value: "Chaat", label: "Chaat" },
  { value: "Rolls", label: "Rolls & Wraps" },
  { value: "Momos", label: "Momos" },
  { value: "Snacks", label: "Snacks" },
  { value: "Beverages", label: "Beverages" },
  { value: "Sweets", label: "Sweets" },
];

const spiceLevels = [
  { value: "all", label: "All Spice Levels" },
  { value: "Mild", label: "Mild" },
  { value: "Medium", label: "Medium" },
  { value: "Hot", label: "Hot" },
];

export default function StreetFood() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- YEH NAYI LINES ADD KI HAIN ---
  const { toast } = useToast();
  const { addItem: addItemToCart, items: cartItems, getTotalPrice } = useCartStore();

  const handleOrderNow = (item: any) => {
    addItemToCart({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price), // Price ko number me convert kiya
      imageUrl: item.imageUrl,
      providerId: item.providerId,
      itemType: 'street_food',
    });
    toast({
      title: "✅ Added to Cart!",
      description: `${item.name} has been added to your cart.`,
    });
  };
  // --- END OF NEW LINES ---

  const { data: providers, isLoading: loadingProviders } = useQuery<any[]>({
    queryKey: ["/api/service-providers", "street-food"],
    queryFn: async () => {
      const res = await fetch("/api/service-providers?category=street-food");
      if (!res.ok) {
        throw new Error('Failed to fetch vendors');
      }
      return res.json();
    },
  });

  const { data: items, isLoading: loadingItems } = useQuery<any[]>({
    queryKey: ["/api/street-food-items", searchTerm],
    queryFn: async () => {
      // ✅ Naya, Smarter URL
      const url = searchTerm
        ? `/api/street-food-items?search=${encodeURIComponent(searchTerm)}`
        : "/api/street-food-items";

      const res = await fetch(url); // Sahi URL use karna

      if (!res.ok) {
        throw new Error('Failed to fetch street food items');
      }
      return res.json();
    },
  });
  const filteredItems = items?.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    if (selectedSpiceLevel !== "all" && item.spicyLevel !== selectedSpiceLevel) return false;
    if (vegOnly && !item.isVeg) return false;
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Street Food</h1>
            <Link href="/">
              <Button variant="outline" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Input
                type="text"
                placeholder="Search for momos, chaat, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                data-testid="input-search"
              />
            </div>
            <div className="flex-1 w-full">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {foodCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 w-full">
              <Select value={selectedSpiceLevel} onValueChange={setSelectedSpiceLevel}>
                <SelectTrigger data-testid="select-spice">
                  <SelectValue placeholder="Spice Level" />
                </SelectTrigger>
                <SelectContent>
                  {spiceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={vegOnly ? "default" : "outline"}
              onClick={() => setVegOnly(!vegOnly)}
              className="flex items-center gap-2"
              data-testid="button-veg-filter"
            >
              <Leaf className="h-4 w-4" />
              Veg Only
            </Button>
          </div>
        </div>
      </section>

      {/* Vendors Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Popular Vendors Near You</h2>

          {loadingProviders ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-48 bg-muted rounded-lg mb-4" />
                    <div className="h-6 bg-muted rounded mb-2 w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : providers && providers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-lg transition-shadow" data-testid={`card-vendor-${vendor.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{vendor.businessName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{vendor.address}</span>
                        </div>
                      </div>
                      {vendor.rating && (
                        <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-sm font-semibold">{vendor.rating}</span>
                        </div>
                      )}
                    </div>

                    {vendor.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {vendor.description}
                      </p>
                    )}

                    <div className="flex gap-2 mb-4">
                      {vendor.specializations?.slice(0, 3).map((spec: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/street-food/${vendor.id}`}>
                        <Button className="flex-1" data-testid={`button-menu-${vendor.id}`}>
                          View Menu
                        </Button>
                      </Link>
                      <Button variant="outline" size="icon" data-testid={`button-call-${vendor.id}`}>
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Sandwich className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">No vendors found in your area</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your location or check back later</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Menu Items Section */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Popular Items</h2>

          {loadingItems ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-5 bg-muted rounded mb-2 w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-item-${item.id}`}>
                  {item.imageUrl && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <div className="flex gap-1">
                        {item.isVeg && (
                          <div className="border-2 border-green-600 p-0.5 w-5 h-5 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-600" />
                          </div>
                        )}
                        {!item.isVeg && (
                          <div className="border-2 border-red-600 p-0.5 w-5 h-5 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-red-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-primary">₹{item.price}</span>
                      {item.spicyLevel && (
                        <Badge variant={
                          item.spicyLevel === 'Hot' ? 'destructive' :
                            item.spicyLevel === 'Medium' ? 'default' : 'secondary'
                        } className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {item.spicyLevel}
                        </Badge>
                      )}
                    </div>

                    {item.category && (
                      <Badge variant="outline" className="text-xs mb-3">
                        {item.category}
                      </Badge>
                    )}

                    <Button
                      className="w-full"
                      disabled={!item.isAvailable}
                      data-testid={`button-order-${item.id}`}
                      onClick={() => handleOrderNow(item)} // <-- YEH LINE ADD KI HAI
                    >
                      {item.isAvailable ? 'Order Now' : 'Out of Stock'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-lg text-muted-foreground">No items match your filters</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Cart Summary Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card p-4 shadow-lg border-t z-50 animate-slide-up-fast">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">{cartItems.reduce((total, item) => total + item.quantity, 0)} Items</p>
              <p className="text-xl font-bold">₹{getTotalPrice().toFixed(2)}</p>
            </div>
            <Link href="/checkout">
              <Button size="lg">
                Proceed to Checkout
                <ShoppingBag className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}