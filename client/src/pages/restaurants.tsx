// client/src/pages/restaurants.tsx (FIXED AND CLEANED)

import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, UtensilsCrossed, Star, MapPin, Phone, Clock, Calendar, Users, Leaf, Loader2, ShoppingCart, Plus, Minus, X } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart-store";
import { useLocation } from "wouter";
import type { ServiceProvider, User, ServiceCategory, RestaurantMenuItem } from "@shared/schema";

// Type definitions
type RestaurantProvider = ServiceProvider & { user: User; category: ServiceCategory };

const cuisineTypes = [
  { value: "all", label: "All Cuisines" },
  { value: "Indian", label: "Indian" },
  { value: "Chinese", label: "Chinese" },
  { value: "Italian", label: "Italian" },
  { value: "Continental", label: "Continental" },
  { value: "Mexican", label: "Mexican" },
  { value: "Thai", label: "Thai" },
];

const menuCategories = [
  { value: "all", label: "All Items" },
  { value: "Starters", label: "Starters" },
  { value: "Main Course", label: "Main Course" },
  { value: "Desserts", label: "Desserts" },
  { value: "Beverages", label: "Beverages" },
];

const timeSlots = [
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "6:00 PM - 7:00 PM",
  "7:00 PM - 8:00 PM",
  "8:00 PM - 9:00 PM",
  "9:00 PM - 10:00 PM",
];

export default function Restaurants() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { addItem, items, removeItem, updateQuantity } = useCartStore();
  const [selectedCuisine, setSelectedCuisine] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantProvider | null>(null);
  // Booking state removed

  // --- Restaurant query (FIXED) ---
  const { data: restaurants, isLoading: loadingRestaurants } = useQuery<RestaurantProvider[]>({
    queryKey: ["restaurantsList", "restaurants"],
    queryFn: () =>
      apiRequest("GET", "/api/service-providers?category=restaurants")
        .then(res => res.json()),
  });

  // --- Menu items query (FIXED) ---
  const { data: allMenuItems, isLoading: loadingMenu } = useQuery<RestaurantMenuItem[]>({
    queryKey: ["allRestaurantMenuItems"],
    queryFn: () =>
      apiRequest("GET", "/api/restaurant-menu-items")
        .then(res => res.json()),
  });

  const handleAddToCart = (item: RestaurantMenuItem, restaurant: RestaurantProvider) => {
    addItem({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price.toString()),
      imageUrl: item.imageUrl || undefined,
      providerId: restaurant.id,
      itemType: 'restaurant',
    });
    toast({
      title: "Added to Cart",
      description: `${item.name} added to your cart.`,
    });
  };

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Filter menu items
  const filteredMenuItems = allMenuItems?.filter((item) => {
    if (selectedRestaurant && item.providerId !== selectedRestaurant.id) return false;

    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;

    const restaurantForThisItem = restaurants?.find(r => r.id === item.providerId);
    if (!restaurantForThisItem) return false; // Agar restaurant nahi mila toh item mat dikhao

    if (selectedCuisine !== "all" && !restaurantForThisItem.specializations?.includes(selectedCuisine)) return false;

    if (vegOnly && !item.isVeg) return false;
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-500 to-orange-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-white hover:bg-white/20" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <UtensilsCrossed className="h-12 w-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Restaurants</h1>
          </div>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl">
            Order food from your favorite restaurants for fast delivery.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-muted/30 py-6 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                <SelectTrigger data-testid="select-cuisine">
                  <SelectValue placeholder="Cuisine Type" />
                </SelectTrigger>
                <SelectContent>
                  {cuisineTypes.map((cuisine) => (
                    <SelectItem key={cuisine.value} value={cuisine.value}>
                      {cuisine.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Menu Category" />
                </SelectTrigger>
                <SelectContent>
                  {menuCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
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

      {/* Restaurants Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Top Restaurants Near You</h2>

          {loadingRestaurants ? (
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
          ) : restaurants && restaurants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="hover:shadow-lg transition-shadow" data-testid={`card-restaurant-${restaurant.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{restaurant.businessName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span>{restaurant.address}</span>
                        </div>
                      </div>
                      {restaurant.rating && (
                        <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-sm font-semibold">{restaurant.rating}</span>
                        </div>
                      )}
                    </div>

                    {restaurant.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {restaurant.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      {restaurant.specializations?.slice(0, 3).map((spec: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setSelectedRestaurant(restaurant);
                          document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <UtensilsCrossed className="h-4 w-4 mr-2" />
                        View Menu
                      </Button>
                      <Button variant="outline" size="icon" data-testid={`button-call-${restaurant.id}`}>
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
                <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">No restaurants found in your area</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your location or check back later</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section >

      {/* Menu Items Section */}
      < section id="menu-section" className="py-12 bg-muted/30" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">
              {selectedRestaurant ? `Menu: ${selectedRestaurant.businessName}` : "Popular Dishes"}
            </h2>
            {selectedRestaurant && (
              <Button variant="outline" onClick={() => setSelectedRestaurant(null)}>
                <X className="h-4 w-4 mr-2" /> Show All Restaurants
              </Button>
            )}
          </div>

          {loadingMenu ? (
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
          ) : filteredMenuItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredMenuItems.map((item) => {
                const cartItem = items.find((i) => i.id === item.id);
                const quantity = cartItem ? cartItem.quantity : 0;

                return (
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
                        {item.cuisine && (
                          <Badge variant="outline" className="text-xs">
                            {item.cuisine}
                          </Badge>
                        )}
                      </div>

                      {item.category && (
                        <Badge variant="secondary" className="text-xs mb-3">
                          {item.category}
                        </Badge>
                      )}

                      {quantity > 0 ? (
                        <div className="flex items-center justify-between mt-2 bg-secondary/20 rounded-md p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              if (quantity === 1) {
                                removeItem(item.id);
                              } else {
                                updateQuantity(item.id, quantity - 1);
                              }
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-semibold">{quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const restaurant = restaurants?.find(r => r.id === item.providerId);
                              if (restaurant) handleAddToCart(item, restaurant);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full mt-2"
                          onClick={() => {
                            const restaurant = restaurants?.find(r => r.id === item.providerId);
                            if (restaurant) handleAddToCart(item, restaurant);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add to Cart
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-lg text-muted-foreground">No items match your filters</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your cuisine or category selection</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section >
      {/* Floating Cart Button */}
      {
        cartItemCount > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              size="lg"
              className="rounded-full shadow-xl h-14 px-6 bg-primary hover:bg-primary/90 text-primary-foreground animate-in fade-in slide-in-from-bottom-4"
              onClick={() => setLocation("/checkout")}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              View Cart ({cartItemCount})
            </Button>
          </div>
        )
      }
    </div >
  );
}