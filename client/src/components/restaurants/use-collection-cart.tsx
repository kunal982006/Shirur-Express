import { useState } from "react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { trackEvent, FacebookStandardEvent } from "@/lib/facebook-pixel";

export interface CollectionDish {
    id: string;
    itemType?: "restaurant" | "street_food";
    name: string;
    description?: string | null;
    category?: string | null;
    price: string | number;
    imageUrl?: string | null;
    isVeg?: boolean | null;
    isPopular?: boolean | null;
    // Real orders in the last 24 hours, and whether it is one of the top sellers.
    orderCount?: number;
    isMostlySelling?: boolean;
    // True when the description lists what the dish includes (e.g. a thali) and belongs on the card.
    showDescription?: boolean;
    // Extras from the same restaurant (pav, roti, naan...) offered in a popup when this dish is added.
    accompaniments?: CollectionDish[];
    providerId: string;
    provider: {
        id: string;
        businessName: string;
        isAvailable?: boolean | null;
        latitude?: string | number | null;
        longitude?: string | number | null;
        rating?: string | number | null;
    };
}

// Menu page of the restaurant or street food vendor that sells a dish.
export const dishProviderPath = (dish: CollectionDish) =>
    `${dish.itemType === "street_food" ? "/street-food" : "/restaurants"}/${dish.providerId}`;

// Collections mix dishes from many restaurants, but the cart holds one restaurant at a time
// (addItem silently empties it otherwise), so ask before replacing an existing cart.
export function useCollectionCart() {
    const { items, addItem, updateQuantity } = useCartStore();
    const { toast } = useToast();
    const [pending, setPending] = useState<CollectionDish | null>(null);

    const [extrasFor, setExtrasFor] = useState<CollectionDish | null>(null);

    const putInCart = (dish: CollectionDish) => addItem({
        id: dish.id,
        name: dish.name,
        price: Number(dish.price),
        imageUrl: dish.imageUrl || undefined,
        providerId: dish.providerId,
        itemType: dish.itemType || "restaurant",
    });

    const commitAdd = (dish: CollectionDish) => {
        putInCart(dish);
        // Offer pav / breads from the same restaurant right after the dish goes in.
        if (dish.accompaniments?.length) setExtrasFor(dish);
        trackEvent(FacebookStandardEvent.AddToCart, {
            content_name: dish.name,
            content_ids: [String(dish.id)],
            content_type: "product",
            value: Number(dish.price),
            currency: "INR",
        });
        toast({ title: "Added to cart", description: `${dish.name} · ${dish.provider.businessName}` });
    };

    const add = (dish: CollectionDish) => {
        if (dish.provider.isAvailable === false) return;
        const cartProviderId = items[0]?.providerId;
        if (cartProviderId && cartProviderId !== dish.providerId) {
            setPending(dish);
            return;
        }
        commitAdd(dish);
    };

    const getQuantity = (id: string) => items.find((item) => item.id === id)?.quantity || 0;

    const extras = extrasFor?.accompaniments || [];
    const extrasAdded = extras.some((extra) => getQuantity(extra.id) > 0);

    const conflictDialog = (
        <>
        <Dialog open={Boolean(extrasFor)} onOpenChange={(open) => !open && setExtrasFor(null)}>
            <DialogContent className="max-w-sm rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Add something with it?</DialogTitle>
                    <DialogDescription>
                        Goes well with {extrasFor?.name}. From {extrasFor?.provider.businessName}, at menu price.
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
                                    <Button size="sm" variant="outline" className="h-8 shrink-0 rounded-lg px-3 text-xs" onClick={() => putInCart(extra)}>Add</Button>
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
                    <Button variant={extrasAdded ? "default" : "outline"} className="w-full rounded-xl" onClick={() => setExtrasFor(null)}>
                        {extrasAdded ? "Done" : "Skip"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <AlertDialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
            <AlertDialogContent className="max-w-sm rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Replace cart items?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Your cart has dishes from another restaurant. Adding {pending?.name} from {pending?.provider.businessName} will clear them.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep cart</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { if (pending) commitAdd(pending); setPending(null); }}>
                        Replace
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );

    return { add, updateQuantity, getQuantity, conflictDialog };
}
