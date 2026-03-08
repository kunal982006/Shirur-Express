import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";
import { Link } from "wouter";
import { RentalProperty, User } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Home, Search, Filter, Key, IndianRupee, ArrowRight, HomeIcon } from "lucide-react";

const PROPERTY_TYPES = ["Apartment", "Villa", "Plot", "Commercial Space", "Independent House"];

export default function PropertySearch() {
    const [filters, setFilters] = useState({
        listingType: "rent", // "rent" or "sell"
        locality: "",
        propertyType: "all",
        minPrice: 0,
        maxPrice: 300000,
        bedrooms: "all",
    });

    // We use a separate state for visual slider changes so it doesn't trigger API on every drag tick
    const [visualPrice, setVisualPrice] = useState([filters.minPrice, filters.maxPrice]);

    // Derived values based on listing type
    const isRent = filters.listingType === "rent";
    const SLIDER_MAX = isRent ? 300000 : 50000000; // 3 Lakhs for Rent, 5 Crores for Sell
    const SLIDER_STEP = isRent ? 1000 : 100000; // 1k increments for Rent, 1L increments for Sell

    const formatPrice = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    const { data: properties, isLoading } = useQuery<(RentalProperty & { owner: User })[]>({
        queryKey: ["/api/rental-properties", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append("listingType", filters.listingType);
            if (filters.locality) params.append("locality", filters.locality);
            if (filters.propertyType !== "all") params.append("propertyType", filters.propertyType);
            if (filters.bedrooms !== "all") params.append("bedrooms", filters.bedrooms);
            params.append("minRent", filters.minPrice.toString());
            params.append("maxRent", filters.maxPrice.toString());

            const res = await fetch(`${API_BASE_URL}/api/rental-properties?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch properties");
            return res.json();
        },
    });

    return (
        <div className="container mx-auto p-4">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Filters Sidebar */}
                <div className="w-full md:w-64 space-y-6">
                    <div className="bg-card p-4 rounded-lg border shadow-sm">
                        <h2 className="font-semibold mb-6 flex items-center gap-2 text-xl">
                            <Filter className="h-5 w-5 text-primary" /> Filters
                        </h2>

                        <div className="space-y-6">
                            {/* Listing Type Toggle */}
                            <div className="flex bg-muted/50 p-1 mb-2 rounded-xl border border-white/5">
                                <button
                                    onClick={() => {
                                        setFilters({ ...filters, listingType: "rent", minPrice: 0, maxPrice: 300000 });
                                        setVisualPrice([0, 300000]);
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm ${filters.listingType === "rent"
                                        ? "bg-primary text-black"
                                        : "text-muted-foreground hover:bg-white/5"
                                        }`}
                                >
                                    <Key className="h-4 w-4" /> Rent House
                                </button>
                                <button
                                    onClick={() => {
                                        setFilters({ ...filters, listingType: "sell", minPrice: 0, maxPrice: 50000000 });
                                        setVisualPrice([0, 50000000]);
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm ${filters.listingType === "sell"
                                        ? "bg-primary text-black"
                                        : "text-muted-foreground hover:bg-white/5"
                                        }`}
                                >
                                    <IndianRupee className="h-4 w-4" /> Sell House
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Locality</label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search locality..."
                                        className="pl-8"
                                        value={filters.locality}
                                        onChange={(e) => setFilters(prev => ({ ...prev, locality: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Property Type</label>
                                <Select
                                    value={filters.propertyType}
                                    onValueChange={(val) => setFilters(prev => ({ ...prev, propertyType: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Any" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any</SelectItem>
                                        {PROPERTY_TYPES.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bedrooms</label>
                                <Select
                                    value={filters.bedrooms}
                                    onValueChange={(val) => setFilters(prev => ({ ...prev, bedrooms: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Any" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any</SelectItem>
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <SelectItem key={n} value={n.toString()}>{n} BHK</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-white/5">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-sm font-medium">{isRent ? 'Rent' : 'Price'} Range</label>
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                                        {formatPrice(visualPrice[0])} - {formatPrice(visualPrice[1])}{visualPrice[1] === SLIDER_MAX ? '+' : ''}
                                    </span>
                                </div>
                                <div className="pt-2 px-1">
                                    <Slider
                                        min={0}
                                        max={SLIDER_MAX}
                                        step={SLIDER_STEP}
                                        value={visualPrice}
                                        onValueChange={setVisualPrice}
                                        onValueCommit={([min, max]) => setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }))}
                                        className="py-4"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 mt-6 md:mt-0">
                    <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-2">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">
                                Properties for {isRent ? 'Rent' : 'Sale'}
                            </h1>
                            <p className="text-muted-foreground mt-2 font-medium">
                                Find your dream home. <span className="text-primary italic">Zero Brokerage.</span> 🏠🔑
                            </p>
                        </div>
                        <Badge variant="outline" className="text-sm px-3 py-1 font-semibold border-primary/30 text-primary self-start md:self-auto">
                            {properties?.length || 0} results found
                        </Badge>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {properties?.map((property) => (
                                <Link key={property.id} href={`/properties/${property.id}`}>
                                    <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col">
                                        <div className="relative h-48 bg-muted">
                                            {property.images && property.images.length > 0 ? (
                                                <img
                                                    src={property.images[0]}
                                                    alt={property.title}
                                                    className="w-full h-full object-cover rounded-t-lg"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                                    <Home className="h-12 w-12 opacity-20" />
                                                </div>
                                            )}
                                            <Badge className={`absolute top-2 right-2 ${isRent ? 'bg-primary/90 text-primary-foreground' : 'bg-emerald-500/90 text-white'} border-none shadow-sm backdrop-blur-sm transition-transform hover:scale-105`}>
                                                {formatPrice(parseFloat(property.rent as unknown as string))}{isRent ? '/mo' : ''}
                                            </Badge>
                                            {property.owner?.isVerified && (
                                                <Badge variant="secondary" className="absolute top-2 left-2 bg-green-100 text-green-800 hover:bg-green-100">
                                                    Verified Owner
                                                </Badge>
                                            )}
                                        </div>
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
                                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                <span className="truncate">{property.locality || property.address}</span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0 flex-1">
                                            <div className="flex gap-4 mt-2 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Bed className="h-4 w-4 text-muted-foreground" />
                                                    <span>{property.bedrooms} BHK</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Bath className="h-4 w-4 text-muted-foreground" />
                                                    <span>{property.bathrooms} Bath</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Home className="h-4 w-4 text-muted-foreground" />
                                                    <span>{property.area} sqft</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="p-4 pt-0 border-t mt-auto pt-3">
                                            <Button variant="outline" className="w-full">View Details</Button>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            ))}
                            {properties?.length === 0 && (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    No properties found matching your filters.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Owner CTA Section */}
            <div className="mt-16 pt-12 border-t border-border/50">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold tracking-tight mb-3">Are you a Property Owner?</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        List your property on Shirur-Express directly and skip the middlemen. Connect with verified tenants and buyers instantly.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Rent CTA */}
                    <Link href="/list-property">
                        <Card className="group cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all duration-300 overflow-hidden relative h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0"></div>
                            <CardContent className="p-8 relative z-10 flex flex-col items-center text-center h-full">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Key className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Rent out your property</h3>
                                <p className="text-muted-foreground mb-6 flex-1">
                                    Got an empty apartment or house? List it for rent and start earning monthly passive income with zero brokerage fees.
                                </p>
                                <Button className="w-full sm:w-auto" variant="default">
                                    List for Rent <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Sell CTA */}
                    <Link href="/list-property">
                        <Card className="group cursor-pointer hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 overflow-hidden relative h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent z-0"></div>
                            <CardContent className="p-8 relative z-10 flex flex-col items-center text-center h-full">
                                <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <IndianRupee className="h-8 w-8 text-emerald-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Sell your property</h3>
                                <p className="text-muted-foreground mb-6 flex-1">
                                    Ready to cash in on your real estate investment? List your property for sale and deal directly with potential buyers.
                                </p>
                                <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white">
                                    List for Sale <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}
