import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, ArrowLeft, X } from "lucide-react";
import { FilterBar } from "@/components/restaurants/FilterBar";
import { CategoryCarousel } from "@/components/restaurants/CategoryCarousel";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import type { ServiceProvider } from "@shared/schema";

export default function RestaurantsIndex() {
    const [, setLocation] = useLocation();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("sort");
    const [showPromo, setShowPromo] = useState(false);

    useEffect(() => {
        // Show promo after a short delay for better UX
        const timer = setTimeout(() => setShowPromo(true), 500);
        return () => clearTimeout(timer);
    }, []);

    const { data: restaurants, isLoading } = useQuery<ServiceProvider[]>({
        queryKey: ["restaurants"],
        queryFn: () => apiRequest("GET", "/api/service-providers?category=restaurants").then(res => res.json())
    });

    const filters = [
        { label: "Sort", value: "sort", active: true },
        { label: "Nearest", value: "nearest" },
        { label: "Rating 4.0+", value: "rating" },
        { label: "Pure Veg", value: "veg" },
        { label: "Cuisines", value: "cuisine" },
    ];

    const filteredRestaurants = restaurants?.filter(r =>
        r.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.address.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // Find Cafe of Joy dynamically to get its ID
    const cafeOfJoy = restaurants?.find(r => r.businessName.toLowerCase().includes("cafe of joy"));

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Promo Popup */}
            <Dialog open={showPromo} onOpenChange={setShowPromo}>
                <DialogContent className="w-[90vw] max-w-md p-0 overflow-hidden bg-black border-none rounded-xl">
                    <div className="flex flex-col items-center">
                        <div className="relative w-full">
                            <img 
                                src="/cafe-of-joy-promo.jpeg" 
                                alt="Cafe of Joy Special Offer - Buy Any Pasta Get Free Fries" 
                                className="w-full h-auto object-contain max-h-[70vh]"
                            />
                            <DialogClose className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors z-10 backdrop-blur-md">
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </DialogClose>
                        </div>
                        <div className="w-full p-4 bg-black/95">
                            <Button 
                                onClick={() => {
                                    setShowPromo(false);
                                    if (cafeOfJoy) {
                                        setLocation(`/restaurants/${cafeOfJoy.id}`);
                                    } else {
                                        setLocation('/restaurants');
                                    }
                                }}
                                className="w-full bg-[#d4af37] hover:bg-[#b5952f] text-black font-bold rounded-full py-6 text-lg shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all hover:scale-[1.02]"
                            >
                                View Menu
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* New Zomato-like Header */}
            <div className="sticky top-0 z-40 bg-background shadow-sm">
                <div className="px-4 pt-4 pb-1 flex flex-col gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Restaurant name or a dish..."
                            className="pl-10 bg-white shadow-sm border-muted-foreground/20 h-12 rounded-xl text-base"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filters - Sticky */}
                <div className="px-4">
                    <FilterBar filters={filters} onFilterChange={setActiveFilter} />
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4">
                {/* Inspiration Carousel */}
                <CategoryCarousel onSelect={(id) => setLocation(`/search?term=${id}`)} />

                <h2 className="font-bold text-lg mb-3 text-foreground/90">{filteredRestaurants.length} restaurants around you</h2>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-48 sm:h-64 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                        {filteredRestaurants.map(restaurant => (
                            <RestaurantCard
                                key={restaurant.id}
                                restaurant={restaurant}
                                onClick={() => setLocation(`/restaurants/${restaurant.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
