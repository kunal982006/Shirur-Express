import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { RestaurantMenuItem, RestaurantOrder } from "@shared/schema";

interface FoodItemCardProps {
    item: RestaurantMenuItem;
    quantity: number;
    onAdd: () => void;
    onRemove: () => void;
    disabled?: boolean;
}

export function FoodItemCard({ item, quantity, onAdd, onRemove, disabled = false }: FoodItemCardProps) {
    const isVeg = item.isVeg;
    const image = item.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60";

    return (
        <div className={`flex gap-4 p-4 border-b last:border-0 transition-colors ${disabled ? 'opacity-60 pointer-events-none' : 'hover:bg-accent/5'}`}>
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
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="w-32 h-24 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
                            <img src={image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl w-[90vw] p-0 border-none bg-transparent shadow-none [&>button]:right-[-20px] [&>button]:top-[-20px] [&>button]:text-white [&>button]:bg-black/50 [&>button]:rounded-full">
                        <img
                            src={image}
                            alt={item.name}
                            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                        />
                    </DialogContent>
                </Dialog>

                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-lg bg-background rounded-lg border border-muted-foreground/20 z-10">
                    {disabled ? (
                        <div className="h-9 w-24 flex items-center justify-center text-xs font-medium text-red-500 bg-red-50 rounded-lg">
                            Closed
                        </div>
                    ) : quantity === 0 ? (
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
