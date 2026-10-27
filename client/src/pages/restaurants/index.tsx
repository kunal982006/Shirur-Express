import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CategoryCarousel } from "@/components/restaurants/CategoryCarousel";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import type { ServiceProvider } from "@shared/schema";
import { AddressChip } from "@/components/address/AddressChip";

export default function RestaurantsIndex() {
    const [, setLocation] = useLocation();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: restaurants, isLoading } = useQuery<ServiceProvider[]>({
        queryKey: ["restaurants"],
        queryFn: () => apiRequest("GET", "/api/service-providers?category=restaurants").then(res => res.json())
    });

    const filteredRestaurants = restaurants?.filter(r =>
        r.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.address.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="min-h-screen bg-background pb-20">

            {/* Sticky Search Header */}
            <div className="sticky top-0 z-40 bg-background shadow-sm">
                <div className="p-4 flex flex-col gap-3">
                    <AddressChip className="max-w-full" />
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
