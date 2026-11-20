import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HorizontalScrollList } from "@/components/horizontal-scroll-list";
import { CollectionDishCard, DishQuantityControl, VegMark } from "./CollectionDishCard";
import { dishProviderPath, useCollectionCart, type CollectionDish } from "./use-collection-cart";

// A Half / Full dish: one card, both portions in `variants`.
type FavouriteDish = CollectionDish & { variants?: (CollectionDish & { label: string })[] };

type Diet = "veg" | "non-veg";

// Home screen "Local favourites": a hand-picked list with a Veg / Non-Veg switch. Order counters
// come from the server and move every few minutes, so the list is refreshed every minute.
export function LocalFavourites() {
    const [diet, setDiet] = useState<Diet>("veg");
    const [picker, setPicker] = useState<FavouriteDish | null>(null);
    const [, navigate] = useLocation();
    const cart = useCollectionCart();
    const { data, isLoading } = useQuery<{ veg: FavouriteDish[]; nonVeg: FavouriteDish[] }>({
        queryKey: ["/api/local-favourites"],
        queryFn: () => apiRequest("GET", "/api/local-favourites").then((res) => res.json()),
        refetchInterval: 60 * 1000,
    });
    const items = (diet === "veg" ? data?.veg : data?.nonVeg) || [];

    const dietSwitch = (
        <div className="flex gap-1.5" role="group" aria-label="Veg or non-veg">
            {([
                { key: "veg", label: "Veg", active: "bg-green-600 text-white", idle: "border border-green-200 bg-green-50 text-green-700", dot: "bg-green-600" },
                { key: "non-veg", label: "Non-Veg", active: "bg-red-600 text-white", idle: "border border-red-200 bg-red-50 text-red-700", dot: "bg-red-600" },
            ] as const).map((option) => (
                <button
                    key={option.key}
                    type="button"
                    aria-pressed={diet === option.key}
                    onClick={() => setDiet(option.key)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${diet === option.key ? option.active : option.idle}`}
                >
                    <span className={`h-2 w-2 rounded-full ${diet === option.key ? "bg-white" : option.dot}`} />
                    {option.label}
                </button>
            ))}
        </div>
    );

    return (
        <>
            <HorizontalScrollList
                key={diet}
                title="Local favourites"
                headerAction={dietSwitch}
                items={items}
                isLoading={isLoading}
                autoScroll={true}
                renderItem={(dish: FavouriteDish) => {
                    const variants = dish.variants;
                    const inCart = variants ? variants.reduce((sum, variant) => sum + cart.getQuantity(variant.id), 0) : 0;
                    return (
                        <CollectionDishCard
                            dish={dish}
                            onOpen={() => navigate(dishProviderPath(dish))}
                            quantity={cart.getQuantity(dish.id)}
                            onAdd={() => cart.add(dish)}
                            onUpdate={(change) => cart.updateQuantity(dish.id, change)}
                            priceLabel={variants ? `₹${Number(dish.price)} onwards` : undefined}
                            control={variants ? (
                                <Button
                                    size="sm"
                                    variant={inCart ? "outline" : "default"}
                                    className="h-8 rounded-lg px-3 text-xs"
                                    disabled={dish.provider.isAvailable === false}
                                    onClick={(event) => { event.stopPropagation(); setPicker(dish); }}
                                >
                                    {inCart ? `${inCart} added` : "Add"}
                                </Button>
                            ) : undefined}
                        />
                    );
                }}
            />

            <Dialog open={Boolean(picker)} onOpenChange={(open) => !open && setPicker(null)}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <VegMark isVeg={picker?.isVeg} /> {picker?.name}
                        </DialogTitle>
                        <DialogDescription>Choose half or full · {picker?.provider.businessName}</DialogDescription>
                    </DialogHeader>
                    <ul className="divide-y">
                        {picker?.variants?.map((variant) => (
                            <li key={variant.id} className="flex items-center justify-between gap-3 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold">{variant.label}</p>
                                    <p className="text-sm text-muted-foreground">₹{Number(variant.price)}</p>
                                </div>
                                <DishQuantityControl
                                    dish={variant}
                                    quantity={cart.getQuantity(variant.id)}
                                    onAdd={() => cart.add(variant)}
                                    onUpdate={(change) => cart.updateQuantity(variant.id, change)}
                                />
                            </li>
                        ))}
                    </ul>
                    <Button className="w-full" onClick={() => setPicker(null)}>Done</Button>
                </DialogContent>
            </Dialog>
            {cart.conflictDialog}
        </>
    );
}
