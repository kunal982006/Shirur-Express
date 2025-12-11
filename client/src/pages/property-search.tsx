import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { MapPin, Bed, Bath, Home, Search, Filter } from "lucide-react";

const PROPERTY_TYPES = ["Apartment", "Villa", "Plot", "Commercial Space", "Independent House"];

export default function PropertySearch() {
    const [filters, setFilters] = useState({
        locality: "",
        propertyType: "all",
        minRent: 0,
        maxRent: 100000,
        bedrooms: "all",
    });

    const { data: properties, isLoading } = useQuery<(RentalProperty & { owner: User })[]>({
        queryKey: ["/api/rental-properties", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.locality) params.append("locality", filters.locality);
            if (filters.propertyType !== "all") params.append("propertyType", filters.propertyType);
            if (filters.bedrooms !== "all") params.append("bedrooms", filters.bedrooms);
            params.append("minRent", filters.minRent.toString());
            params.append("maxRent", filters.maxRent.toString());

            const res = await fetch(`/api/rental-properties?${params.toString()}`);
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
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <Filter className="h-4 w-4" /> Filters
                        </h2>

                        <div className="space-y-4">
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Rent Range (₹)</label>
                                <div className="pt-2">
                                    <Slider
                                        defaultValue={[0, 100000]}
                                        max={200000}
                                        step={1000}
                                        value={[filters.minRent, filters.maxRent]}
                                        onValueChange={([min, max]) => setFilters(prev => ({ ...prev, minRent: min, maxRent: max }))}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>₹{filters.minRent}</span>
                                    <span>₹{filters.maxRent}+</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1">
                    <div className="mb-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold">Properties for Rent</h1>
                        <span className="text-muted-foreground">{properties?.length || 0} results found</span>
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
                                            <Badge className="absolute top-2 right-2 bg-black/70 hover:bg-black/70">
                                                ₹{property.rent}/mo
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
        </div>
    );
}
