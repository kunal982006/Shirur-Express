import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input"; // Import Input
import { Separator } from "@/components/ui/separator"; // Import Separator
import { ArrowLeft, Star, MapPin, Search, Clock, ShieldCheck, Share2, Heart, Info, X, UtensilsCrossed } from "lucide-react";
import { FoodItemCard } from "@/components/restaurants/FoodItemCard";
import { useCartStore } from "@/hooks/use-cart-store";
import type { RestaurantMenuItem, ServiceProvider } from "@shared/schema";

// Helper components for placeholder tabs
const OverviewTab = ({ restaurant }: { restaurant: ServiceProvider }) => (
    <div className="p-4 space-y-6">
        <div>
            <h3 className="text-lg font-bold mb-2">About this place</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
                {restaurant.description || "A wonderful dining experience waiting for you."}
            </p>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold mb-1 text-sm">Cuisines</h4>
                <div className="flex flex-wrap gap-2">
                    {restaurant.specializations?.map(s => (
                        <Badge key={s} variant="outline" className="text-xs font-normal">{s}</Badge>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="font-semibold mb-1 text-sm">Average Cost</h4>
                <p className="text-sm text-muted-foreground">₹200 for two people (approx.)</p>
            </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
                <h5 className="font-bold text-blue-800 text-sm">Safety Precautions</h5>
                <p className="text-xs text-blue-600 mt-1">
                    Restaurant partners follow all safety protocols, including regular temperature checks and sanitization.
                </p>
            </div>
        </div>
    </div>
);

export default function RestaurantDetail() {
    const [, params] = useRoute("/restaurants/:id");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const id = params?.id;
    const { addItem, items, removeItem, updateQuantity } = useCartStore();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: restaurant, isLoading: loadingRest } = useQuery<ServiceProvider>({
        queryKey: ["restaurant", id],
        queryFn: () => apiRequest("GET", `/api/service-providers/${id}`).then(res => res.json()),
        enabled: !!id
    });

    const { data: menuItems, isLoading: loadingMenu } = useQuery<RestaurantMenuItem[]>({
        queryKey: ["restaurantMenu", id],
        queryFn: () => apiRequest("GET", `/api/restaurant-menu-items?providerId=${id}`).then(res => res.json()),
        enabled: !!id
    });

    if (loadingRest || !restaurant) {
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

    const handleAdd = (item: RestaurantMenuItem) => {
        // Prevent adding items if restaurant is closed
        if (restaurant.isAvailable === false) {
            return;
        }
        addItem({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price.toString()),
            imageUrl: item.imageUrl || undefined,
            providerId: restaurant.id,
            itemType: 'restaurant',
        });
    };

    const filteredItems = menuItems?.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // Group items by category
    const groupedItems = filteredItems.reduce((acc, item) => {
        const cat = item.category || "Recommended";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, RestaurantMenuItem[]>);

    const isRestaurantClosed = restaurant.isAvailable === false;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Closed Restaurant Banner */}
            {isRestaurantClosed && (
                <div className="sticky top-0 z-50 bg-red-600 text-white py-3 px-4 text-center shadow-lg">
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                        <span className="font-bold">🔴 This restaurant is currently CLOSED</span>
                    </div>
                    <p className="text-sm opacity-90 mt-1">Orders cannot be placed at this time. Please check back later.</p>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-background border-b shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Link href="/restaurants">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-lg truncate">{restaurant.businessName}</h1>
                        <p className="text-xs text-muted-foreground truncate">{restaurant.address}</p>
                    </div>
                    <Button variant="ghost" size="icon"><Search className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon"><Share2 className="h-5 w-5" /></Button>
                </div>
            </div>
            
            {/* Conditionally hide Restaurant Hero Banner for bakeries/cake shops as requested */}
            {!(restaurant.specializations?.some(s => s.toLowerCase().includes('cake') || s.toLowerCase().includes('bakery'))) && (
                <div className="relative h-48 md:h-72 w-full bg-muted overflow-hidden">
                    {restaurant.profileImageUrl ? (
                        <img 
                            src={restaurant.profileImageUrl} 
                            alt={restaurant.businessName} 
                            className="w-full h-full object-cover"
                            onClick={() => setSelectedImage(restaurant.profileImageUrl)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                            <UtensilsCrossed className="h-16 w-16 text-gray-400 opacity-20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h1 className="text-3xl font-extrabold drop-shadow-lg">{restaurant.businessName}</h1>
                        <div className="flex items-center gap-2 mt-1 drop-shadow-md">
                            <Badge variant="secondary" className="bg-white/90 text-primary font-bold">
                                {restaurant.rating || "4.2"} ★
                            </Badge>
                            <span className="text-sm font-medium">{restaurant.specializations?.join(", ")}</span>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="max-w-5xl mx-auto">
                {/* Restaurant Basic Info (Additional details) */}
                <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p className="text-muted-foreground text-sm flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {restaurant.address}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                {isRestaurantClosed ? (
                                    <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">
                                        <Clock className="h-3 w-3" />
                                        Currently Closed
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">
                                        <Clock className="h-3 w-3" />
                                        34 mins
                                    </span>
                                )}
                                <span>•</span>
                                <span>5 km</span>
                                <span>•</span>
                                <span>Free Delivery</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center bg-green-700/10 px-3 py-2 rounded-xl">
                            <span className="flex items-center gap-1 text-green-700 font-extrabold text-xl">
                                {restaurant.rating || "4.2"}<Star className="h-4 w-4 fill-green-700 underline-offset-4" />
                            </span>
                            <div className="h-[1px] w-full bg-green-700/20 my-1" />
                            <span className="text-[10px] font-bold text-green-700 uppercase tracking-tighter">1K+ ratings</span>
                        </div>
                    </div>
                </div>

                <div className="h-2 bg-muted/20" />

                <Tabs defaultValue="order" className="w-full">
                    <TabsList className="w-full justify-start h-12 rounded-none bg-background border-b px-4 gap-6">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 font-bold text-muted-foreground">Overview</TabsTrigger>
                        <TabsTrigger value="order" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 font-bold text-muted-foreground">Order Online</TabsTrigger>
                        <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 font-bold text-muted-foreground">Reviews</TabsTrigger>
                        <TabsTrigger value="photos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 font-bold text-muted-foreground">Photos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="order" className="m-0 min-h-[60vh]">
                        <div className="flex relative">
                            {/* Sidebar Categories (Desktop) / Sticky Header (Mobile - simplified here) */}
                            <div className="w-1/4 hidden md:block sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto border-r p-2">
                                {Object.keys(groupedItems).map(cat => (
                                    <a key={cat} href={`#cat-${cat}`} className="block py-3 px-4 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-r-full transition-colors">
                                        {cat} ({groupedItems[cat].length})
                                    </a>
                                ))}
                            </div>

                            {/* Menu Items List */}
                            <div className="flex-1 pb-20">
                                {/* Search in Menu */}
                                <div className="p-4 sticky top-[4rem] bg-background z-20 border-b">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search for dishes..."
                                            className="pl-9 bg-muted/30 border-none rounded-xl"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {Object.keys(groupedItems).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                            <Search className="h-8 w-8 opacity-50" />
                                        </div>
                                        <p>No menu items found.</p>
                                    </div>
                                ) : (
                                    Object.entries(groupedItems).map(([category, catItems]) => (
                                        <div key={category} id={`cat-${category}`} className="scroll-mt-32">
                                            <div className="flex items-center justify-between px-4 py-6">
                                                <h3 className="font-extrabold text-lg">{category}</h3>
                                                <ArrowLeft className={`h-4 w-4 rotate-[-90deg] transition-transform ${true ? '' : 'rotate-90'}`} />
                                            </div>
                                            {catItems.map(item => (
                                                <FoodItemCard
                                                    key={item.id}
                                                    item={item}
                                                    quantity={getQuantity(item.id)}
                                                    onAdd={() => handleAdd(item)}
                                                    onRemove={() => {
                                                        if (getQuantity(item.id) === 1) removeItem(item.id);
                                                        else updateQuantity(item.id, getQuantity(item.id) - 1);
                                                    }}
                                                    disabled={isRestaurantClosed}
                                                />
                                            ))}
                                            <div className="h-3 bg-muted/10" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="overview">
                        <OverviewTab restaurant={restaurant} />
                    </TabsContent>
                    <TabsContent value="reviews">
                        <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl m-4 bg-muted/5">
                            <Star className="h-12 w-12 opacity-20 mx-auto mb-4" />
                            <h3 className="font-bold text-lg text-foreground/80">Be the first to review</h3>
                            <p className="text-sm max-w-[250px] mx-auto mt-1">Share your dining experience with others.</p>
                        </div>
                    </TabsContent>
                    <TabsContent value="photos" className="m-0 p-4">
                        {(() => {
                            const allPhotos = [
                                ...(restaurant.profileImageUrl ? [restaurant.profileImageUrl] : []),
                                ...(restaurant.galleryImages || [])
                            ];
                            
                            return allPhotos.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {allPhotos.map((img, index) => (
                                        <div 
                                            key={index} 
                                            className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all border shadow-sm group"
                                            onClick={() => setSelectedImage(img)}
                                        >
                                            <img 
                                                src={img} 
                                                alt={`${restaurant.businessName} photo ${index + 1}`} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            {index === 0 && restaurant.profileImageUrl === img && (
                                                <div className="absolute top-2 left-2 bg-primary/90 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                                                    FEATURED
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/5">
                                    <Info className="h-12 w-12 opacity-20 mb-4" />
                                    <h3 className="font-bold text-lg text-foreground/80">No photos available</h3>
                                    <p className="text-sm max-w-[250px] mx-auto mt-1">Images of decor and food uploaded by the restaurant will appear here.</p>
                                </div>
                            );
                        })()}
                    </TabsContent>
                </Tabs>
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
            {/* Full-Screen Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md transition-opacity duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-5xl w-full h-[90vh] p-4 flex items-center justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full h-12 w-12 z-50 scale-125 transition-transform active:scale-95"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                            }}
                        >
                            <X className="h-8 w-8" />
                        </Button>
                        <img 
                            src={selectedImage} 
                            alt="Restaurant gallery full screen" 
                            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
