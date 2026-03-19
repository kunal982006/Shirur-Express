
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, ArrowLeft, MapPin, Star, Clock, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useCallback } from "react";
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
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
    // Autocomplete state
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [suggestionDidYouMean, setSuggestionDidYouMean] = useState<string | null>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: results, isLoading, error } = useQuery({
        queryKey: ["/api/search", searchTerm],
        queryFn: async () => {
            if (!searchTerm) return null;
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
            if (!res.ok) return null;
            return res.json();
        },
        enabled: searchTerm.length > 0,
    });

    // Update internal state if URL changes
    useEffect(() => {
        setSearchTerm(initialTerm);
    }, [initialTerm]);

    // Debounced autocomplete suggestions
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length > 1) {
                try {
                    const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchTerm)}`);
                    const data = await res.json();
                    setSuggestions(data.suggestions || []);
                    setSuggestionDidYouMean(data.didYouMean || null);
                    // Dropdown visibility is strictly controlled by `isFocused` state
                    setHighlightedIndex(-1);
                } catch (e) {
                    console.error("Suggestions fetch failed:", e);
                }
            } else {
                setSuggestions([]);
                setIsFocused(false);
                setSuggestionDidYouMean(null);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSearch = useCallback((term?: string) => {
        const finalTerm = term || searchTerm;
        if (finalTerm.trim()) {
            setIsFocused(false);
            setLocation(`/search?term=${encodeURIComponent(finalTerm)}`);
        }
    }, [searchTerm, setLocation]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isFocused || suggestions.length === 0) {
            if (e.key === 'Enter') handleSearch();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0) {
                const selected = suggestions[highlightedIndex];
                setSearchTerm(selected);
                setIsFocused(false);
                handleSearch(selected);
            } else {
                handleSearch();
            }
        } else if (e.key === 'Escape') {
            setIsFocused(false);
        }
    };

    // Derived data
    const didYouMean = results?.didYouMean || null;

    const services = results?.services || [];
    const restaurants = results?.restaurants || [];
    const streetFood = results?.streetFood || [];
    const menuItems = results?.menuItems || [];
    const cakes = results?.cakes || [];
    const grocery = results?.grocery || [];
    const rentals = results?.rentals || [];

    const hasResults = results && (
        services.length > 0 ||
        restaurants.length > 0 ||
        streetFood.length > 0 ||
        menuItems.length > 0 ||
        cakes.length > 0 ||
        grocery.length > 0 ||
        rentals.length > 0
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header with Smart Search */}
            <header className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                        <ArrowLeft className="h-6 w-6 text-gray-700" />
                    </Button>
                    <form onSubmit={handleSubmit} className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <Input
                            ref={inputRef}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            placeholder="Search for food, services, grocery..."
                            className="pl-9 h-10 w-full bg-gray-100 border-none focus-visible:ring-1 focus-visible:ring-primary"
                            autoFocus
                        />
                        {/* Autocomplete Suggestions Dropdown */}
                        {isFocused && suggestions.length > 0 && (
                            <div 
                                ref={suggestionsRef}
                                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-auto"
                                style={{ backdropFilter: 'blur(12px)' }}
                            >
                                {suggestionDidYouMean && (
                                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 flex items-center gap-1.5">
                                        <Sparkles className="h-3 w-3 text-amber-500" />
                                        <span>Showing results for <button 
                                            className="font-bold text-primary hover:underline"
                                            onClick={() => {
                                                setSearchTerm(suggestionDidYouMean);
                                                handleSearch(suggestionDidYouMean);
                                            }}
                                        >{suggestionDidYouMean}</button></span>
                                    </div>
                                )}
                                <ul className="py-1">
                                    {suggestions.map((suggestion, index) => (
                                        <li
                                            key={index}
                                            className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors ${
                                                index === highlightedIndex
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                            onMouseDown={() => {
                                                setSearchTerm(suggestion);
                                                setIsFocused(false);
                                                handleSearch(suggestion);
                                            }}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                        >
                                            <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm font-medium truncate">{suggestion}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </form>
                </div>
            </header>

            {/* Results */}
            <main className="max-w-3xl mx-auto p-4 space-y-6">
                {/* "Did you mean" Banner */}
                {didYouMean && !isLoading && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl">
                        <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <p className="text-sm text-gray-700">
                            Showing results for{' '}
                            <button
                                className="font-bold text-primary hover:underline"
                                onClick={() => {
                                    setSearchTerm(didYouMean);
                                    handleSearch(didYouMean);
                                }}
                            >
                                "{didYouMean}"
                            </button>
                        </p>
                    </div>
                )}

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
                        <p className="mt-1">Try searching for "Chicken", "Plumber", or "Pizza"</p>
                    </div>
                )}

                {!isLoading && hasResults && (
                    <>
                        {/* Services */}
                        {services.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold mb-3 px-1">Services</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {services.map((service: any) => (
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
                        {restaurants.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold mb-3 px-1">Restaurants</h2>
                                {restaurants.map((repo: any) => (
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
                        {menuItems.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold mb-3 px-1">Dishes from Restaurants</h2>
                                <div className="space-y-3">
                                    {menuItems.map((item: any) => (
                                        <div key={item.id} onClick={() => setLocation(`/restaurants/${item.providerId}`)} className="bg-white p-3 rounded-xl shadow-sm flex justify-between gap-3 cursor-pointer hover:border-primary/30 transition-colors border border-transparent">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-2">
                                                    {/* Extreme Left: Restaurant Profile Image instead of Veg/Non-Veg */}
                                                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 mt-1">
                                                        <img 
                                                            src={item.providerImage || "/placeholder-restaurant.jpg"} 
                                                            alt={item.providerName || "Restaurant"} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            {item.isVeg ? (
                                                                <div className="h-3 w-3 border border-green-600 flex items-center justify-center rounded-sm">
                                                                    <div className="h-1.5 w-1.5 bg-green-600 rounded-full" />
                                                                </div>
                                                            ) : (
                                                                <div className="h-3 w-3 border border-red-600 flex items-center justify-center rounded-sm">
                                                                    <div className="h-1.5 w-1.5 bg-red-600 rounded-full" />
                                                                </div>
                                                            )}
                                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider line-clamp-1">{item.providerName || "Restaurant"}</span>
                                                        </div>
                                                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                                                        <p className="text-sm font-bold text-gray-900 mt-0.5">₹{item.price}</p>
                                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative w-28 h-28 flex-shrink-0 group">
                                                {/* Image Container with click handler for full-screen view */}
                                                <div 
                                                    className="w-full h-full rounded-xl overflow-hidden cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImage(item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3");
                                                    }}
                                                >
                                                    <img 
                                                        src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"} 
                                                        className="w-full h-full object-cover bg-gray-100 group-hover:scale-105 transition-transform duration-300" 
                                                        alt={item.name} 
                                                    />
                                                </div>
                                                {/* Adjusted Add Button position to fit the larger image container */}
                                                <Button 
                                                    size="sm" 
                                                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-8 px-6 text-sm shadow-md bg-white text-primary hover:bg-gray-50 border border-gray-200 font-bold uppercase rounded-lg z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // In future, this could directly add to cart
                                                        // For now it mimics the previous behavior but prevents modal opening
                                                        setLocation(`/restaurants/${item.providerId}`);
                                                    }}
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Street Food */}
                        {streetFood.length > 0 && (
                            <HorizontalScrollList
                                title="Street Food"
                                items={streetFood}
                                isLoading={false}
                                onSeeAll={() => setLocation("/street-food")}
                                renderItem={(item: any) => (
                                    <div className="cursor-pointer group w-36">
                                        <div 
                                            className="relative h-28 w-full rounded-xl overflow-hidden mb-2 bg-gray-100"
                                            onClick={() => setSelectedImage(item.imageUrl || "/placeholder-street-food.jpg")}
                                        >
                                            <img src={item.imageUrl || "/placeholder-street-food.jpg"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={item.name} />
                                        </div>
                                        <div onClick={() => setLocation(`/street-food?item=${item.id}`)}>
                                            <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
                                            <p className="text-xs text-gray-500">₹{item.price}</p>
                                        </div>
                                    </div>
                                )}
                            />
                        )}

                        {/* Cakes */}
                        {cakes.length > 0 && (
                            <HorizontalScrollList
                                title="Cakes"
                                items={cakes}
                                isLoading={false}
                                onSeeAll={() => setLocation("/cake-shop")}
                                renderItem={(item: any) => (
                                    <div className="cursor-pointer group w-36">
                                        <div 
                                            className="relative h-28 w-full rounded-xl overflow-hidden mb-2 bg-gray-100"
                                            onClick={() => setSelectedImage(item.imageUrl || "/placeholder-cake.jpg")}
                                        >
                                            <img src={item.imageUrl || "/placeholder-cake.jpg"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={item.name} />
                                        </div>
                                        <div onClick={() => setLocation(`/cake-shop?item=${item.id}`)}>
                                            <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
                                            <p className="text-xs text-gray-500">₹{item.price}</p>
                                        </div>
                                    </div>
                                )}
                            />
                        )}

                        {/* Grocery */}
                        {grocery.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold mb-3 px-1">Grocery Items</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {grocery.map((item: any) => (
                                        <div key={item.id} onClick={() => setLocation("/grocery")} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 cursor-pointer">
                                            <div
                                                className="w-full h-24 mb-2 overflow-hidden flex items-center justify-center cursor-pointer"
                                                onClick={(e) => {
                                                    if (item.imageUrl) {
                                                        e.stopPropagation();
                                                        setSelectedImage(item.imageUrl);
                                                    }
                                                }}
                                            >
                                                <img src={item.imageUrl || "/placeholder-grocery.jpg"} className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" alt={item.name} />
                                            </div>
                                            <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                                            <p className="text-sm font-bold mt-1">₹{item.price}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Rentals */}
                        {rentals.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold mb-3 px-1">Rental Properties</h2>
                                <div className="space-y-3">
                                    {rentals.map((prop: any) => (
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
            
            {/* Full-Screen Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl w-full h-full p-4 flex items-center justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full h-12 w-12 z-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                            }}
                        >
                            <X className="h-8 w-8" />
                        </Button>
                        <img 
                            src={selectedImage} 
                            alt="Food details full screen" 
                            className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </div>
                </div>
            )}
            
        </div>
    );
}
