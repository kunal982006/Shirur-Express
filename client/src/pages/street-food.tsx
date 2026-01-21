import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";
import { FilterBar } from "@/components/restaurants/FilterBar";
import { CategoryCarousel } from "@/components/restaurants/CategoryCarousel";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import type { ServiceProvider } from "@shared/schema";

export default function StreetFood() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("sort");

  const { data: vendors, isLoading } = useQuery<ServiceProvider[]>({
    queryKey: ["street-food-vendors"],
    queryFn: () => apiRequest("GET", "/api/service-providers?category=street-food").then(res => res.json())
  });

  const filters = [
    { label: "Sort", value: "sort", active: true },
    { label: "Nearest", value: "nearest" },
    { label: "Rating 4.0+", value: "rating" },
    { label: "Pure Veg", value: "veg" },
    { label: "Spicy", value: "spicy" },
  ];

  const filteredVendors = vendors?.filter(v =>
    v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.address.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background shadow-sm">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div className="flex-1">
              <h2 className="font-bold text-lg leading-none">Street Food</h2>
              <p className="text-xs text-muted-foreground truncate">Tasty local delights nearby</p>
            </div>
            <div className="h-9 w-9 bg-secondary rounded-full flex items-center justify-center">
              <span className="font-bold text-primary">SF</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for vada pav, chaat, etc..."
              className="pl-10 bg-white shadow-sm border-muted-foreground/20 h-12 rounded-xl text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4">
          <FilterBar filters={filters} onFilterChange={setActiveFilter} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Inspiration Carousel */}
        <CategoryCarousel onSelect={() => { }} />

        <h2 className="font-bold text-xl mb-4 text-foreground/90">{filteredVendors.length} street food spots around you</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map(vendor => (
              <RestaurantCard
                key={vendor.id}
                restaurant={vendor}
                onClick={() => setLocation(`/street-food/${vendor.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}