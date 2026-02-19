
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Loader2, Search, ArrowLeft, MapPin, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HorizontalScrollList } from "@/components/horizontal-scroll-list";

// Helper for query params
const useQueryParams = () => {
    const [location] = useLocation();
    const search = window.location.search;
    return new URLSearchParams(search);
};

export default function SearchResults() {
    const [location, setLocation] = useLocation();
    const queryParams = useQueryParams();
    const initialTerm = queryParams.get("term") || "";
    const [searchTerm, setSearchTerm] = useState(initialTerm);

    const { data: results, isLoading, error } = useQuery({
        queryKey: ["/api/search", searchTerm],
        queryFn: async () => {
            if (!searchTerm) return null;
            const res = await api.get(`/api/search?q=${encodeURIComponent(searchTerm)}`);
            return res.data;
        },
        enabled: searchTerm.length > 0,
    });

    // Update internal state if URL changes
    useEffect(() => {
        setSearchTerm(initialTerm);
    }, [initialTerm]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            setLocation(`/search?term=${encodeURIComponent(searchTerm)}`);
        }
    };

    const hasResults = results && (
        results.services.length > 0 ||
        results.restaurants.length > 0 ||
        results.streetFood.length > 0 ||
        results.menuItems.length > 0 ||
        results.cakes.length > 0 ||
        results.grocery.length > 0 ||
        results.rentals.length > 0
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                    <ArrowLeft className="h-6 w-6 text-gray-700" />
                </Button>
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for food, services..."
                        className="pl-9 h-10 w-full bg-gray-100 border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                </form>
            </header>

            {/* Results */}
            <main className="max-w-3xl mx-auto p-4 space-y-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                        <p>Searching for "{searchTerm}"...</p>
                    </div>
                )}

                {!isLoading && !hasResults && searchTerm && (
                    <div className="text-center py-12 text-gray-500">
                        <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                        <p>Try searching for "Chicken", "Plumber", or "Pizza"</p>
                    </div>
                )}

                {!isLoading && hasResults && (
                    <>
                        {/* Services */}
                        {results.services.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold mb-3 px-1">Services</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {results.services.map((service: any) => (
                                        <Card key={service.id} onClick={() => setLocation(`/${service.slug}`)} className="cursor-pointer hover:border-primary/50 transition-colors">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className={`p-2 rounded-full bg-${service.color || 'primary'}/10 text-primary`}>
                                                    {/* Icons are dynamic in home, here we use generic or need map */}
                                                    <Star className="h-5 w-5" />
                                                </div>
                                                <span className="font-medium">{service.name}</span>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Restaurants */}
                        {results.restaurants.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold mb-3 px-1">Restaurants</h2>
                                {results.restaurants.map((repo: any) => (
                                    <div key={repo.id} onClick={() => setLocation(`/restaurants/${repo.id}`)} className="bg-white p-3 rounded-xl shadow-sm mb-3 flex gap-3 cursor-pointer">
                                        <img src={repo.profileImageUrl || "/placeholder-restaurant.jpg"} className="w-20 h-20 rounded-lg object-cover bg-gray-200" alt={repo.businessName} />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900">{repo.businessName}</h3>
                                            <p className="text-xs text-gray-500 line-clamp-1">{repo.address}</p>
                                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                                    4.2 <Star className="h-3 w-3 fill-current" />
                                                </span>
                                                <span>• {repo.isAvailable ? 'Open' : 'Closed'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}

                        {/* Matching Menu Items (Food from Restaurants) */}
                        {results.menuItems.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold mb-3 px-1">Dishes from Restaurants</h2>
                                <div className="space-y-3">
                                    {results.menuItems.map((item: any) => (
                                        <div key={item.id} onClick={() => setLocation(`/restaurants/${item.providerId}`)} className="bg-white p-3 rounded-xl shadow-sm flex justify-between gap-3 cursor-pointer">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-2">
                                                    {item.isVeg ? (
                                                        <img src="/veg-icon.png" className="w-4 h-4 mt-1" alt="Veg" />
                                                    ) : (
                                                        <img src="/non-veg-icon.png" className="w-4 h-4 mt-1" alt="Non-Veg" />
                                                    )}
                                                    <div>
                                                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                                                        <p className="text-xs text-gray-500 font-medium">₹{item.price}</p>
                                                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative w-24 h-24 flex-shrink-0">
                                                <img src={item.imageUrl || "/placeholder-food.jpg"} className="w-full h-full object-cover rounded-lg bg-gray-100" alt={item.name} />
                                                <Button size="sm" variant="secondary" className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-7 text-xs shadow-md bg-white text-green-600 hover:bg-gray-50 border border-gray-200 font-bold uppercase">
                                                    Add
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Street Food */}
                        {results.streetFood.length > 0 && (
                            <HorizontalScrollList
                                title="Street Food"
                                items={results.streetFood}
                                isLoading={false}
                                onSeeAll={() => setLocation("/street-food")}
                                renderItem={(item: any) => (
                                    <div onClick={() => setLocation(`/street-food?item=${item.id}`)} className="cursor-pointer group w-36">
                                        <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2 bg-gray-100">
                                            <img src={item.imageUrl || "/placeholder-street-food.jpg"} className="w-full h-full object-cover" alt={item.name} />
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
                                        <p className="text-xs text-gray-500">₹{item.price}</p>
                                    </div>
                                )}
                            />
                        )}

                        {/* Cakes */}
                        {results.cakes.length > 0 && (
                            <HorizontalScrollList
                                title="Cakes"
                                items={results.cakes}
                                isLoading={false}
                                onSeeAll={() => setLocation("/cake-shop")}
                                renderItem={(item: any) => (
                                    <div onClick={() => setLocation(`/cake-shop?item=${item.id}`)} className="cursor-pointer group w-36">
                                        <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2 bg-gray-100">
                                            <img src={item.imageUrl || "/placeholder-cake.jpg"} className="w-full h-full object-cover" alt={item.name} />
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
                                        <p className="text-xs text-gray-500">₹{item.price}</p>
                                    </div>
                                )}
                            />
                        )}

                        {/* Grocery */}
                        {results.grocery.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold mb-3 px-1">Grocery Items</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {results.grocery.map((item: any) => (
                                        <div key={item.id} onClick={() => setLocation("/grocery")} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                            <img src={item.image || "/placeholder-grocery.jpg"} className="w-full h-24 object-contain mb-2" alt={item.name} />
                                            <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                                            <p className="text-sm font-bold mt-1">₹{item.price}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Rentals */}
                        {results.rentals.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold mb-3 px-1">Rental Properties</h2>
                                <div className="space-y-3">
                                    {results.rentals.map((prop: any) => (
                                        <div key={prop.id} onClick={() => setLocation(`/properties/${prop.id}`)} className="bg-white p-3 rounded-xl shadow-sm flex gap-3 cursor-pointer">
                                            <img src={prop.images?.[0] || "/placeholder-house.jpg"} className="w-24 h-24 rounded-lg object-cover bg-gray-200" alt={prop.title} />
                                            <div>
                                                <h3 className="font-bold text-gray-900 line-clamp-1">{prop.title}</h3>
                                                <p className="text-xs text-gray-500">{prop.locality}</p>
                                                <p className="text-sm font-bold text-primary mt-1">₹{prop.rent}/month</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{prop.type}</span>
                                                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{prop.bhk} BHK</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
