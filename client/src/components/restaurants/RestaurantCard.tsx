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
    const image = restaurant.profileImageUrl || restaurant.galleryImages?.[0] || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60";

    return (
        <Card
            className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-none shadow-sm group bg-card"
            onClick={onClick}
        >
            <div className="relative h-28 sm:h-48 w-full overflow-hidden rounded-t-xl">
                <img
                    src={image}
                    alt={restaurant.businessName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold shadow-sm">
                    30-40 min
                </div>
                {restaurant.isAvailable === false && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-xs sm:text-lg border border-white px-2 py-1 sm:px-4 sm:py-2 rounded">Currently Closed</span>
                    </div>
                )}
            </div>

            <CardContent className="p-2 sm:p-4">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-sm sm:text-lg truncate pr-1 text-foreground">{restaurant.businessName}</h3>
                    <div className={`flex items-center gap-0.5 px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded text-white text-[10px] sm:text-xs font-bold ${Number(rating) >= 4.0 ? 'bg-green-600' : 'bg-green-500'}`}>
                        <span>{rating}</span>
                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-white" />
                    </div>
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                    <p className="truncate w-2/3">{specializations.slice(0, 2).join(", ")}</p>
                    <p>₹200/2</p>
                </div>

                <div className="border-t border-dashed pt-2 sm:pt-3 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    {/* Random aggregate info for Zomato feel */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span>On time</span>
                    </div>
                    <span className="truncate max-w-[100px] sm:max-w-[150px]">{restaurant.address}</span>
                </div>

            </CardContent>
        </Card>
    );
}
