import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCartStore } from "@/hooks/use-cart-store";

// A dish offered as an add-on (pav, roti, naan, rice...) from the same restaurant.
export interface DishExtra {
    id: string;
    itemType?: "restaurant" | "street_food";
    name: string;
    price: string | number;
    imageUrl?: string | null;
    providerId: string;
}

export interface DishHighlight {
    // Orders in the last 24 hours.
    orderCount: number;
    isMostlySelling: boolean;
    // "Mostly Selling" or the restaurant's speciality tag ("Known for Biryani").
    badge: string | null;
    availableUntilMinute: number | null;
    accompaniments?: DishExtra[];
}

// Badges, 24-hour counters and add-on extras of highlighted dishes, keyed by dish id. One
// shared request, so every menu page shows the same badges as the home screen.
export function useDishHighlights(): Record<string, DishHighlight> {
    const { data } = useQuery<Record<string, DishHighlight>>({
        queryKey: ["/api/dish-highlights"],
        queryFn: () => apiRequest("GET", "/api/dish-highlights").then((res) => res.json()),
        staleTime: 60 * 1000,
        refetchInterval: 60 * 1000,
    });
    return data || {};
}

export const badgeText = (dish: { badge?: string | null; isMostlySelling?: boolean }) =>
    dish.isMostlySelling ? "🔥 Mostly Selling" : dish.badge || null;

export const orderCountText = (count?: number | null) =>
    count && count > 0 ? `${count} ordered in last 24 hrs` : null;

interface DishExtrasDialogProps {
    // The dish just added to the cart; null keeps the dialog closed.
    dish: { name: string; providerName?: string; accompaniments?: DishExtra[] } | null;
    onClose: () => void;
}

// "Add something with it?" popup shown right after a featured dish goes into the cart.
export function DishExtrasDialog({ dish, onClose }: DishExtrasDialogProps) {
    const { items, addItem, updateQuantity } = useCartStore();
    const extras = dish?.accompaniments || [];
    const getQuantity = (id: string) => items.find((item) => item.id === id)?.quantity || 0;
    const anyAdded = extras.some((extra) => getQuantity(extra.id) > 0);

    return (
        <Dialog open={Boolean(dish) && extras.length > 0} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-sm rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Add something with it?</DialogTitle>
                    <DialogDescription>
                        Goes well with {dish?.name}.{dish?.providerName ? ` From ${dish.providerName}, at menu price.` : " From the same kitchen, at menu price."}
                    </DialogDescription>
                </DialogHeader>
                <ul className="max-h-[45vh] divide-y overflow-y-auto">
                    {extras.map((extra) => {
                        const quantity = getQuantity(extra.id);
                        return (
                            <li key={extra.id} className="flex items-center justify-between gap-3 py-2.5">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">{extra.name}</p>
                                    <p className="text-xs text-muted-foreground">₹{Number(extra.price)}</p>
                                </div>
                                {quantity === 0 ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 shrink-0 rounded-lg px-3 text-xs"
                                        onClick={() => addItem({
                                            id: extra.id,
                                            name: extra.name,
                                            price: Number(extra.price),
                                            imageUrl: extra.imageUrl || undefined,
                                            providerId: extra.providerId,
                                            itemType: extra.itemType || "restaurant",
                                        })}
                                    >
                                        Add
                                    </Button>
                                ) : (
                                    <div className="flex h-8 shrink-0 items-center rounded-lg border border-border bg-card">
                                        <button className="grid h-8 w-8 place-items-center text-primary" aria-label={`Remove ${extra.name}`} onClick={() => updateQuantity(extra.id, -1)}><Minus className="h-3.5 w-3.5" /></button>
                                        <span className="min-w-5 text-center text-xs font-semibold">{quantity}</span>
                                        <button className="grid h-8 w-8 place-items-center text-primary" aria-label={`Add another ${extra.name}`} onClick={() => updateQuantity(extra.id, 1)}><Plus className="h-3.5 w-3.5" /></button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
                <DialogFooter>
                    <Button variant={anyAdded ? "default" : "outline"} className="w-full rounded-xl" onClick={onClose}>
                        {anyAdded ? "Done" : "Skip"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
