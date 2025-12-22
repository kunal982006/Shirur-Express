import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Star, MapPin, Clock, Award, Cake, ShoppingBag, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const cakeCategories = [
  { name: "All Cakes", active: true },
  { name: "Birthday" },
  { name: "Anniversary" },
  { name: "Wedding" },
  { name: "Custom" },
  { name: "Cupcakes" }
];

// Mock cake shop data
const mockCakeShops = [
  {
    id: "1",
    name: "Sweet Delights Bakery",
    rating: 4.9,
    reviews: 456,
    address: "Mall Road, City Center",
    distance: "0.8 km",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    cakes: [
      {
        name: "Chocolate Truffle",
        image: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        weightOptions: [
          { weight: "500g", price: 499 },
          { weight: "1kg", price: 899 },
          { weight: "2kg", price: 1699 }
        ]
      },
      {
        name: "Strawberry Delight",
        image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        weightOptions: [
          { weight: "500g", price: 549 },
          { weight: "1kg", price: 999 },
          { weight: "2kg", price: 1899 }
        ]
      },
      {
        name: "Red Velvet",
        image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        weightOptions: [
          { weight: "500g", price: 599 },
          { weight: "1kg", price: 1099 },
          { weight: "2kg", price: 1999 }
        ]
      },
      {
        name: "Custom Design",
        image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        isCustom: true,
        startingPrice: 2499
      }
    ]
  }
];


function PopularCakesSection() {
  const [, setLocation] = useLocation();
  const { data: popularCakes, isLoading } = useQuery({
    queryKey: ["popularCakes"],
    queryFn: async () => {
      const res = await fetch("/api/cake-shop/popular");
      if (!res.ok) throw new Error("Failed to fetch popular cakes");
      return res.json();
    },
  });

  if (isLoading || !popularCakes || popularCakes.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Award className="h-5 w-5 text-amber-500" />
        <h3 className="text-xl font-bold">Popular Cakes</h3>
      </div>

      <Carousel
        plugins={[
          Autoplay({
            delay: 3000,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {popularCakes.map((cake: any) => (
            <CarouselItem key={cake.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
              <div className="p-1">
                <Card className="overflow-hidden border-0 shadow-md">
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      <img
                        src={cake.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587"}
                        alt={cake.name}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600">
                        Top Rated
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold truncate mb-1" title={cake.name}>{cake.name}</h4>

                      {/* Provider Info & Action */}
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span className="truncate max-w-[150px] font-medium text-foreground">
                            {cake.provider?.businessName}
                          </span>
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs h-8"
                          onClick={() => {
                            // Find the shop section on this page and scroll to it/expand it
                            const element = document.getElementById(`shop-${cake.providerId}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                        >
                          View Full Menu
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

export default function CakeShop() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("All Cakes");
  const { items, addItem, updateQuantity, getTotalPrice } = useCartStore();
  const { toast } = useToast();
  const [expandedShops, setExpandedShops] = useState<Record<string, boolean>>({});

  const { data: cakeShops, isLoading } = useQuery({
    queryKey: ["/api/service-providers", { category: "cake-shop" }],
    queryFn: async () => {
      const res = await fetch("/api/service-providers?category=cake-shop");
      if (!res.ok) throw new Error("Failed to fetch cake shops");
      return res.json();
    }
  });

  const toggleShopExpansion = (shopId: string) => {
    setExpandedShops(prev => ({
      ...prev,
      [shopId]: !prev[shopId]
    }));
  };

  const handleAddToCart = (cake: any, shopId: string) => {
    const existingItem = items.find(item => item.id === cake.id);
    if (existingItem) {
      updateQuantity(cake.id, 1);
      toast({
        title: "➕ Quantity Updated!",
        description: `${cake.name} quantity increased.`,
      });
    } else {
      addItem({
        id: cake.id,
        name: cake.name,
        price: parseFloat(cake.price),
        imageUrl: cake.imageUrl || undefined,
        providerId: shopId, // Ensure we track which shop this is from
        itemType: 'cake'
      });
      toast({
        title: "✅ Added to Cart!",
        description: `${cake.name} added to your cart.`,
      });
    }
  };

  return (
    <div className="py-16 bg-background pb-24">
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

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Cake Shops</h2>
          <p className="text-muted-foreground">
            Order delicious custom cakes for every occasion
          </p>
        </div>

        {/* Popular Cakes Carousel */}
        <PopularCakesSection />

        {/* Cake Categories */}
        <div className="mb-6 flex flex-wrap gap-2">
          {cakeCategories.map((category) => (
            <Button
              key={category.name}
              variant={activeCategory === category.name ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.name)}
              data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Cake Shop Cards */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <div className="w-20 h-20 bg-muted rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cakeShops?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Cake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No cake shops found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your location or check back later for available shops.
                </p>
              </CardContent>
            </Card>
          ) : (
            cakeShops?.map((shop: any) => {
              const filteredCakes = shop.cakeProducts?.filter((cake: any) => activeCategory === "All Cakes" || cake.category === activeCategory) || [];
              const isExpanded = expandedShops[shop.id];
              const displayedCakes = isExpanded ? filteredCakes : filteredCakes.slice(0, 4);

              return (
                <Card key={shop.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={shop.profileImageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                            alt={shop.businessName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{shop.businessName}</h3>
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < Math.floor(parseFloat(shop.rating))
                                    ? "text-yellow-500 fill-current"
                                    : "text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{shop.rating}</span>
                            <span className="text-sm text-muted-foreground">({shop.reviewCount})</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{shop.address}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex items-center">
                        <Award className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>

                    {/* Cake Gallery */}
                    <div className="border-t border-border pt-4 mt-4">
                      <h4 className="font-semibold mb-3">Featured Cakes</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {displayedCakes.map((cake: any) => {
                          const cartItem = items.find(item => item.id === cake.id);
                          return (
                            <div
                              key={cake.id}
                              className="group border rounded-lg p-2 hover:shadow-md transition-all"
                              data-testid={`cake-${cake.name.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <div className="aspect-square rounded-lg overflow-hidden mb-2 relative">
                                <img
                                  src={cake.imageUrl || "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"}
                                  alt={cake.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                />
                              </div>
                              <h5 className="font-medium text-sm mb-1 truncate">{cake.name}</h5>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold">₹{cake.price}</span>
                                {cake.weight && <span className="text-xs text-muted-foreground">{cake.weight}</span>}
                              </div>

                              {cartItem ? (
                                <div className="flex items-center justify-between bg-secondary/20 rounded-md p-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => { e.stopPropagation(); updateQuantity(cake.id, -1); }}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-sm font-medium">{cartItem.quantity}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => { e.stopPropagation(); updateQuantity(cake.id, 1); }}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  className="w-full h-8 text-xs"
                                  onClick={(e) => { e.stopPropagation(); handleAddToCart(cake, shop.id); }}
                                >
                                  Add
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Order 24 hours in advance for custom cakes
                        </p>
                        {filteredCakes.length > 4 && (
                          <Button
                            variant="outline"
                            onClick={() => toggleShopExpansion(shop.id)}
                            data-testid={`button-view-all-${shop.id}`}
                          >
                            {isExpanded ? "Show Less" : "View All Cakes"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Cart Summary Bar */}
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
