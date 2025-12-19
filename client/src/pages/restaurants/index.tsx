import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, ArrowLeft } from "lucide-react";
import { FilterBar } from "@/components/restaurants/FilterBar";
import { CategoryCarousel } from "@/components/restaurants/CategoryCarousel";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import type { ServiceProvider } from "@shared/schema";

export default function RestaurantsIndex() {
    const [, setLocation] = useLocation();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("sort");

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

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* New Zomato-like Header */}
            <div className="sticky top-0 z-40 bg-background shadow-sm">
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="h-5 w-5" /></Button>
                        </Link>
                        <div className="flex-1">
                            <h2 className="font-bold text-lg leading-none">Shirur, Pune</h2>
                            <p className="text-xs text-muted-foreground truncate">Vidyanagar, Shirur - 412210</p>
                        </div>
                        <div className="h-9 w-9 bg-secondary rounded-full flex items-center justify-center">
                            <span className="font-bold text-primary">S</span>
                        </div>
                    </div>

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
                <CategoryCarousel onSelect={() => { }} />

                <h2 className="font-bold text-xl mb-4 text-foreground/90">{filteredRestaurants.length} restaurants around you</h2>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
