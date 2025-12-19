import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, MapPin } from "lucide-react";
import type { ServiceProvider } from "@shared/schema";

interface RestaurantCardProps {
    restaurant: ServiceProvider;
    onClick: () => void;
}

export function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
    // Parsing generic fields for display
    const rating = restaurant.rating ? parseFloat(restaurant.rating.toString()).toFixed(1) : "New";
    const specializations = restaurant.specializations || [];
    const image = restaurant.galleryImages?.[0] || restaurant.profileImageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60";

    return (
        <Card
            className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-none shadow-sm group bg-card"
            onClick={onClick}
        >
            <div className="relative h-48 w-full overflow-hidden rounded-t-xl">
                <img
                    src={image}
                    alt={restaurant.businessName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold shadow-sm">
                    30-40 min
                </div>
                {restaurant.isAvailable === false && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg border border-white px-4 py-2 rounded">Currently Closed</span>
                    </div>
                )}
            </div>

            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg truncate pr-2 text-foreground">{restaurant.businessName}</h3>
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-xs font-bold ${Number(rating) >= 4.0 ? 'bg-green-600' : 'bg-green-500'}`}>
                        <span>{rating}</span>
                        <Star className="h-3 w-3 fill-white" />
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <p className="truncate w-2/3">{specializations.slice(0, 2).join(", ")}</p>
                    <p>₹200 for two</p>
                </div>

                <div className="border-t border-dashed pt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    {/* Random aggregate info for Zomato feel */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>On time</span>
                    </div>
                    <span className="truncate max-w-[150px]">{restaurant.address}</span>
                </div>

            </CardContent>
        </Card>
    );
}
