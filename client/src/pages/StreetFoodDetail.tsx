import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { FoodItemCard } from "@/components/restaurants/FoodItemCard";
import { useCartStore } from "@/hooks/use-cart-store";
import type { StreetFoodItem, ServiceProvider, RestaurantMenuItem } from "@shared/schema";

// Helper components for placeholder tabs
const OverviewTab = ({ vendor }: { vendor: ServiceProvider }) => (
  <div className="p-4 space-y-6">
    <div>
      <h3 className="text-lg font-bold mb-2">About this spot</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {vendor.description || "Authentic and delicious street food experiences."}
      </p>
    </div>
    <Separator />
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="font-semibold mb-1 text-sm">Specialties</h4>
        <div className="flex flex-wrap gap-2">
          {vendor.specializations?.map(s => (
            <Badge key={s} variant="outline" className="text-xs font-normal">{s}</Badge>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-1 text-sm">Average Cost</h4>
        <p className="text-sm text-muted-foreground">₹100 for two people (approx.)</p>
      </div>
    </div>
    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
      <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
      <div>
        <h5 className="font-bold text-blue-800 text-sm">Hygiene Verified</h5>
        <p className="text-xs text-blue-600 mt-1">
          This vendor follows standard hygiene practices.
        </p>
      </div>
    </div>
  </div>
);

export default function StreetFoodDetail() {
  const [, params] = useRoute("/street-food/:vendorId");
  const vendorId = params?.vendorId;
  const { addItem, items, removeItem } = useCartStore();
  const [searchQuery, setSearchQuery] = useState("");

  // Verify mount
  useEffect(() => {
    console.log("StreetFoodDetail mounted, vendorId:", vendorId);
  }, [vendorId]);

  const { data: vendor, isLoading: loadingVendor } = useQuery<ServiceProvider>({
    queryKey: ["vendor", vendorId],
    queryFn: () => apiRequest("GET", `/api/service-providers/${vendorId}`).then(res => res.json()),
    enabled: !!vendorId
  });

  const { data: menuItems, isLoading: loadingMenu } = useQuery<StreetFoodItem[]>({
    queryKey: ["streetFoodMenu", vendorId],
    queryFn: () => apiRequest("GET", `/api/street-food-items?providerId=${vendorId}`).then(res => res.json()),
    enabled: !!vendorId
  });

  if (loadingVendor || !vendor) {
    return (
      <div className="min-h-screen animate-pulse bg-background">
        <div className="h-64 bg-muted" />
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <div className="h-8 w-1/2 bg-muted rounded" />
          <div className="h-4 w-1/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const getQuantity = (itemId: string) => items.find(i => i.id === itemId)?.quantity || 0;

  const handleAdd = (item: StreetFoodItem) => {
    // Explicitly format price as number for cart
    addItem({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price.toString()),
      imageUrl: item.imageUrl || undefined,
      providerId: vendor.id,
      itemType: 'street_food',
    });
  };

  const filteredItems = menuItems?.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Group items by category (StreetFoodItem has 'category' field)
  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category || "Recommended";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, StreetFoodItem[]>);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Image */}
      <div className="relative h-64 md:h-80 w-full">
        <img
          src={vendor.galleryImages?.[0] || vendor.profileImageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000&auto=format&fit=crop&q=60"}
          alt={vendor.businessName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-3xl font-bold mb-1">{vendor.businessName}</h1>
          <p className="text-white/90 text-sm mb-2">{vendor.specializations?.join(", ")}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-green-600 px-1.5 py-0.5 rounded font-bold">{vendor.rating || "New"} ★</span>
            <span>• 35 mins</span>
            <span>• {vendor.address}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="p-4 sticky top-0 bg-background z-10 border-b">
          <OverviewTab vendor={vendor} />
        </div>

        <div className="p-4 space-y-8">
          {/* Menu Categories */}
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} id={category} className="scroll-mt-32">
              <h3 className="font-bold text-xl mb-4 text-foreground">{category} ({items.length})</h3>
              <div className="space-y-4">
                {items.map(item => {
                  // SAFELY convert StreetFoodItem to RestaurantMenuItem shape for the component
                  const safeItem: any = {
                    ...item,
                    price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
                  };

                  return (
                    <FoodItemCard
                      key={item.id}
                      item={safeItem}
                      quantity={getQuantity(item.id)}
                      onAdd={() => handleAdd(item)}
                      onRemove={() => removeItem(item.id)}
                    />
                  );
                })}
              </div>
              <Separator className="my-6" />
            </div>
          ))}

          {(!menuItems || menuItems.length === 0) && (
            <div className="text-center py-10 text-muted-foreground">
              Menu items loading or not available.
            </div>
          )}
        </div>
      </div>

      {/* Cart floating bar */}
      {items.length > 0 && vendorId === items[0].providerId && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50">
          <div className="max-w-4xl mx-auto">
            <Button className="w-full h-12 text-lg font-bold flex justify-between items-center" onClick={() => window.location.href = '/checkout'}>
              <span>{items.reduce((a, b) => a + b.quantity, 0)} items | ₹{items.reduce((a, b) => a + (b.price * b.quantity), 0)}</span>
              <span>View Cart</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}