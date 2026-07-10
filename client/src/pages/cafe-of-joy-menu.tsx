import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, MapPin, Star, UtensilsCrossed, Coffee, Leaf } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { RestaurantMenuItem, ServiceProvider } from "@shared/schema";

// Standalone Menu Card for Cafe of Joy — accessible only via direct link (QR code)
// NOTE: Prices are displayed as-is from the database (includes our 10% margin). Do NOT reduce them.

export default function CafeOfJoyMenu() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Step 1: Find "Cafe of Joy" provider from the restaurant category
    const { data: providers, isLoading: loadingProviders } = useQuery<ServiceProvider[]>({
        queryKey: ["service-providers", "restaurants"],
        queryFn: () =>
            apiRequest("GET", "/api/service-providers?category=restaurants")
                .then(res => res.json()),
    });

    const cafeOfJoy = providers?.find(
        (p) => p.businessName.toLowerCase().includes("cafe of joy")
    );

    // Step 2: Fetch menu items for that provider
    const { data: menuItems, isLoading: loadingMenu } = useQuery<RestaurantMenuItem[]>({
        queryKey: ["restaurantMenu", cafeOfJoy?.id],
        queryFn: () =>
            apiRequest("GET", `/api/restaurant-menu-items?providerId=${cafeOfJoy!.id}`)
                .then(res => res.json()),
        enabled: !!cafeOfJoy?.id,
    });

    // Loading state
    if (loadingProviders || (cafeOfJoy && loadingMenu)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center animate-pulse">
                        <Coffee className="h-8 w-8 text-amber-600" />
                    </div>
                    <p className="text-amber-800 font-medium animate-pulse">Loading menu...</p>
                </div>
            </div>
        );
    }

    // Not found state
    if (!cafeOfJoy) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                        <UtensilsCrossed className="h-10 w-10 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-900">Cafe of Joy</h2>
                    <p className="text-amber-700">Menu is currently unavailable. Please try again later.</p>
                </div>
            </div>
        );
    }

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
            {/* Hero Header */}
            <div className="relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                <div className="relative">
                    {/* Top branding bar */}
                    <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 text-white py-2 px-4 text-center text-xs font-medium tracking-wider">
                        POWERED BY SHIRUR EXPRESS • ORDER ONLINE AT <span className="underline font-bold">shirurexpress.com</span>
                    </div>

                    {/* Restaurant Hero */}
                    {cafeOfJoy.profileImageUrl ? (
                        <div className="relative h-56 md:h-72 w-full overflow-hidden cursor-pointer"
                             onClick={() => setSelectedImage(cafeOfJoy.profileImageUrl)}>
                            <img
                                src={cafeOfJoy.profileImageUrl}
                                alt={cafeOfJoy.businessName}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-lg tracking-tight">
                                    {cafeOfJoy.businessName}
                                </h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge className="bg-green-500/90 hover:bg-green-500 text-white font-bold border-0 shadow-md">
                                        {cafeOfJoy.rating || "4.2"} ★
                                    </Badge>
                                    <span className="text-sm font-medium opacity-90">
                                        {cafeOfJoy.specializations?.join(" • ")}
                                    </span>
                                </div>
                                <p className="text-sm mt-1 opacity-80 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {cafeOfJoy.address}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 px-6 text-center">
                            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center mb-4 shadow-lg">
                                <Coffee className="h-12 w-12 text-amber-700" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-amber-900 tracking-tight">
                                {cafeOfJoy.businessName}
                            </h1>
                            <p className="text-amber-700 mt-2 flex items-center gap-1 justify-center">
                                <MapPin className="h-3 w-3" /> {cafeOfJoy.address}
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-3">
                                <Badge className="bg-green-600 hover:bg-green-600 text-white font-bold border-0">
                                    {cafeOfJoy.rating || "4.2"} ★
                                </Badge>
                                <span className="text-sm text-amber-700 font-medium">
                                    {cafeOfJoy.specializations?.join(" • ")}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Menu Section */}
            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-extrabold text-amber-900 flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5 text-amber-600" />
                        Our Menu
                    </h2>
                    <span className="text-xs text-amber-600 font-medium bg-amber-100 px-2 py-1 rounded-full">
                        {menuItems?.length || 0} items
                    </span>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                    <Input
                        placeholder="Search for dishes..."
                        className="pl-9 bg-white/80 border-amber-200 rounded-xl focus:border-amber-400 focus:ring-amber-200 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Category Sidebar (horizontal on mobile) */}
                {Object.keys(groupedItems).length > 1 && (
                    <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
                        {Object.keys(groupedItems).map(cat => (
                            <a
                                key={cat}
                                href={`#menu-cat-${cat.replace(/\s+/g, '-')}`}
                                className="whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-full bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-colors shadow-sm"
                            >
                                {cat} ({groupedItems[cat].length})
                            </a>
                        ))}
                    </div>
                )}

                {/* Menu Items */}
                {Object.keys(groupedItems).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-amber-300" />
                        </div>
                        <p className="text-amber-700 font-medium">No menu items found.</p>
                        <p className="text-amber-500 text-sm mt-1">Try a different search term.</p>
                    </div>
                ) : (
                    Object.entries(groupedItems).map(([category, catItems]) => (
                        <div key={category} id={`menu-cat-${category.replace(/\s+/g, '-')}`} className="mb-8 scroll-mt-24">
                            {/* Category Header */}
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="font-extrabold text-lg text-amber-900">{category}</h3>
                                <Separator className="flex-1 bg-amber-200/50" />
                                <span className="text-xs text-amber-500 font-medium">{catItems.length} items</span>
                            </div>

                            {/* Item Cards */}
                            <div className="space-y-1">
                                {catItems.map(item => (
                                    <MenuItemCard key={item.id} item={item} onImageClick={setSelectedImage} />
                                ))}
                            </div>
                        </div>
                    ))
                )}

                {/* Footer */}
                <div className="mt-12 mb-8 text-center space-y-4">
                    <Separator className="bg-amber-200/50" />
                    <div className="py-6 space-y-2">
                        <p className="text-amber-800 font-bold text-sm">
                            🛵 Want to order food online?
                        </p>
                        <p className="text-amber-600 text-xs">
                            Download <span className="font-bold">Shirur Express</span> or visit{" "}
                            <a href="https://shirurexpress.com" className="underline font-bold text-amber-700 hover:text-amber-900">
                                shirurexpress.com
                            </a>
                        </p>
                        <p className="text-[10px] text-amber-400 mt-4">
                            © {new Date().getFullYear()} Shirur Express. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>

            {/* Full-Screen Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md cursor-pointer"
                    onClick={() => setSelectedImage(null)}
                >
                    <img
                        src={selectedImage}
                        alt="Menu item"
                        className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}

// ============================================================
// Individual Menu Item Card (view-only, no add-to-cart buttons)
// ============================================================
function MenuItemCard({ item, onImageClick }: { item: RestaurantMenuItem; onImageClick: (url: string) => void }) {
    const isVeg = item.isVeg;
    const image = item.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60";

    return (
        <div className="flex gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-amber-100/80 hover:bg-white/90 hover:shadow-md transition-all duration-200">
            {/* Left: Item Details */}
            <div className="flex-1 space-y-1.5">
                <div className="flex items-start gap-2">
                    {/* Veg/Non-veg indicator */}
                    <div className={`mt-1 border-2 p-0.5 w-4 h-4 flex-shrink-0 flex items-center justify-center ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
                        <div className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 leading-tight">{item.name}</h4>
                        <p className="text-base font-semibold text-amber-800 mt-0.5">₹{item.price}</p>
                    </div>
                </div>
                {item.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed pl-6">
                        {item.description}
                    </p>
                )}
                {isVeg && (
                    <div className="flex items-center gap-1 pl-6">
                        <Leaf className="h-3 w-3 text-green-500" />
                        <span className="text-[10px] text-green-600 font-medium">Pure Veg</span>
                    </div>
                )}
            </div>

            {/* Right: Image */}
            <div
                className="w-28 min-w-[112px] h-20 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                onClick={() => onImageClick(image)}
            >
                <img src={image} alt={item.name} className="w-full h-full object-cover" />
            </div>
        </div>
    );
}
