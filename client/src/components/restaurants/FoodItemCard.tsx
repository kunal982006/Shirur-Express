import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Star } from "lucide-react";
import type { RestaurantMenuItem, RestaurantOrder } from "@shared/schema";

interface FoodItemCardProps {
    item: RestaurantMenuItem;
    quantity: number;
    onAdd: () => void;
    onRemove: () => void;
}

export function FoodItemCard({ item, quantity, onAdd, onRemove }: FoodItemCardProps) {
    const isVeg = item.isVeg;
    const image = item.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60";

    return (
        <div className="flex gap-4 p-4 border-b last:border-0 hover:bg-accent/5 transition-colors">
            <div className="flex-1 space-y-2">
                <div className="flex items-start gap-2">
                    <div className={`mt-1.5 border-2 p-0.5 w-4 h-4 flex items-center justify-center ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
                        <div className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                    </div>
                    <div>
                        <h4 className="font-bold text-base text-foreground">{item.name}</h4>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">₹{item.price}</span>
                            {Number(item.price) > 300 && <Badge variant="secondary" className="text-[10px] px-1 h-4">Bestseller</Badge>}
                        </div>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.description || "A delicious preparation with authentic spices and fresh ingredients."}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-yellow-600">4.2</span>
                    <span>(104 votes)</span>
                </div>
            </div>

            <div className="relative w-32 min-w-[128px]">
                <div className="w-32 h-24 rounded-xl overflow-hidden shadow-sm">
                    <img src={image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-lg bg-background rounded-lg border border-muted-foreground/20">
                    {quantity === 0 ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-24 text-green-600 font-extrabold hover:text-green-700 hover:bg-green-50 uppercase tracking-wide bg-white"
                            onClick={onAdd}
                        >
                            ADD
                        </Button>
                    ) : (
                        <div className="flex items-center h-9 w-24 bg-white rounded-lg justify-between px-1">
                            <Button variant="ghost" size="icon" className="h-full w-8 text-muted-foreground" onClick={onRemove}>
                                <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-bold text-green-600 text-sm">{quantity}</span>
                            <Button variant="ghost" size="icon" className="h-full w-8 text-green-600" onClick={onAdd}>
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
