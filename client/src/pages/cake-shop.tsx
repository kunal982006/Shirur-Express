import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Star, MapPin, Clock, Award, Cake, ShoppingBag, Plus, Minus, Sparkles, Wand2 } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { CakeWizard } from "@/components/cake/CakeWizard";

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

export default function CakeShop() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("All Cakes");
  const { items, addItem, updateQuantity, getTotalPrice } = useCartStore();
  const { toast } = useToast();
  const [expandedShops, setExpandedShops] = useState<Record<string, boolean>>({});
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const { data: cakeShops, isLoading } = useQuery({
    queryKey: ["/api/service-providers", { category: "cake-shop" }],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/service-providers?category=cake-shop`);
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

        {/* Dynamic Build Your Masterpiece Banner */}
        <div
          className="mb-10 text-center md:text-left relative overflow-hidden rounded-3xl p-8 shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #db2777 0%, #7c3aed 50%, #4338ca 100%)' }}
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <span
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
              >
                <Sparkles className="h-3 w-3" /> Masterpiece Mode
              </span>
              <h2
                className="text-4xl md:text-5xl font-black tracking-tight leading-tight"
                style={{ color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
              >
                Build Your Masterpiece 🎂
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.3)' }} className="text-lg font-medium">
                Full creative control. From the sponge texture to the frosting color. Design the cake of your dreams in 5 easy steps.
              </p>
              <Button
                onClick={() => setIsWizardOpen(true)}
                size="lg"
                className="h-14 px-8 rounded-full font-black text-lg shadow-xl hover:scale-105 transition-transform mt-2"
                style={{ background: '#fff', color: '#7c3aed' }}
              >
                <Wand2 className="mr-2 h-5 w-5" /> Start Building Your Cake
              </Button>
            </div>

            {/* Rotating Cake Image */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="w-48 h-48 md:w-56 md:h-56 relative z-10 shrink-0"
              style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.3))' }}
            >
              <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400&h=400" alt="Beautiful Cake" className="w-full h-full object-cover rounded-full" style={{ border: '4px solid rgba(255,255,255,0.3)' }} />
            </motion.div>
          </div>
        </div>

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

        {/* Wizard Modal */}
        <CakeWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
      </div>
    </div>
  );
}
