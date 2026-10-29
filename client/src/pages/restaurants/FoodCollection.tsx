import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/hooks/use-cart-store";
import { useDeliveryAddress } from "@/hooks/use-delivery-address";
import { estimateDelivery, formatDistance } from "@/lib/location";
import { DishQuantityControl, VegMark, DISH_FALLBACK_IMAGE } from "@/components/restaurants/CollectionDishCard";
import { useCollectionCart, type CollectionDish } from "@/components/restaurants/use-collection-cart";
import type { FoodCollection as FoodCollectionInfo } from "@shared/food-collections";

type SortOption = "recommended" | "price-asc" | "price-desc" | "nearest";

const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${active ? "bg-foreground text-background shadow-xs" : "bg-muted/70 text-muted-foreground hover:bg-muted"}`;

// Master page behind "View All": every dish in one collection, from every partner restaurant.
export default function FoodCollection() {
    const { slug } = useParams<{ slug: string }>();
    const [, setLocation] = useLocation();
    const address = useDeliveryAddress((state) => state.address);
    const cart = useCollectionCart();
    const { items: cartItems, getTotalPrice } = useCartStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [diet, setDiet] = useState<"all" | "veg" | "non-veg">("all");
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [sort, setSort] = useState<SortOption>("recommended");

    const { data, isLoading, isError } = useQuery<FoodCollectionInfo & { items: CollectionDish[] }>({
        queryKey: ["/api/food-collections", slug],
        queryFn: () => apiRequest("GET", `/api/food-collections/${slug}`).then(res => res.json()),
    });

    const dishes = useMemo(() => (data?.items || []).map((dish) => ({
        ...dish,
        estimate: estimateDelivery(address, dish.provider),
    })), [data, address?.lat, address?.lng]);

    const restaurants = useMemo(() => {
        const counts = new Map<string, { id: string; name: string; count: number }>();
        for (const dish of dishes) {
            const entry = counts.get(dish.providerId) || { id: dish.providerId, name: dish.provider.businessName, count: 0 };
            entry.count++;
            counts.set(dish.providerId, entry);
        }
        return Array.from(counts.values()).sort((a, b) => b.count - a.count);
    }, [dishes]);

    const visibleDishes = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const filtered = dishes.filter((dish) => {
            if (restaurantId && dish.providerId !== restaurantId) return false;
            if (diet === "veg" && dish.isVeg !== true) return false;
            if (diet === "non-veg" && dish.isVeg !== false) return false;
            if (query && !`${dish.name} ${dish.provider.businessName} ${dish.category || ""}`.toLowerCase().includes(query)) return false;
            return true;
        });
        // "recommended" keeps the server order (open restaurants and popular dishes first).
        if (sort === "recommended") return filtered;
        const isOpen = (dish: CollectionDish) => Number(dish.provider.isAvailable !== false);
        return [...filtered].sort((a, b) => {
            const openFirst = isOpen(b) - isOpen(a);
            if (openFirst) return openFirst;
            if (sort === "price-asc") return Number(a.price) - Number(b.price);
            if (sort === "price-desc") return Number(b.price) - Number(a.price);
            return (a.estimate?.distanceKm ?? Infinity) - (b.estimate?.distanceKm ?? Infinity);
        });
    }, [dishes, searchQuery, diet, restaurantId, sort]);

    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    if (isError) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="font-semibold">This collection isn't available.</p>
                <Button onClick={() => setLocation("/restaurants")}>Back to food</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-28">
            <div className="sticky top-0 z-40 border-b bg-background shadow-sm">
                <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">
                    <Link href="/restaurants">
                        <Button variant="ghost" size="icon" aria-label="Back to food">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-lg font-bold">{data?.title || "Loading..."}</h1>
                        <p className="truncate text-xs text-muted-foreground">
                            {data ? `${dishes.length} dishes from ${restaurants.length} restaurants` : " "}
                        </p>
                    </div>
                </div>

                <div className="mx-auto max-w-4xl space-y-2 px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={`Search in ${data?.title || "this collection"}...`}
                            className="h-10 rounded-xl pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        <button type="button" className={chip(diet === "all")} onClick={() => setDiet("all")}>All</button>
                        <button type="button" className={chip(diet === "veg")} onClick={() => setDiet("veg")}>Veg</button>
                        <button type="button" className={chip(diet === "non-veg")} onClick={() => setDiet("non-veg")}>Non-Veg</button>
                        <span className="mx-1 w-px shrink-0 bg-border" />
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortOption)}
                            className="shrink-0 rounded-full bg-muted/70 px-3 py-1 text-xs font-bold text-muted-foreground"
                            aria-label="Sort dishes"
                        >
                            <option value="recommended">Recommended</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            {address && <option value="nearest">Nearest first</option>}
                        </select>
                    </div>
                    {restaurants.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            <button type="button" className={chip(restaurantId === null)} onClick={() => setRestaurantId(null)}>All restaurants</button>
                            {restaurants.map((restaurant) => (
                                <button key={restaurant.id} type="button" className={chip(restaurantId === restaurant.id)} onClick={() => setRestaurantId(restaurant.id)}>
                                    {restaurant.name} ({restaurant.count})
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4">
                {isLoading ? (
                    <div className="space-y-3 pt-4">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
                    </div>
                ) : visibleDishes.length === 0 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">No dishes match your filters.</p>
                ) : (
                    <ul className="divide-y">
                        {visibleDishes.map((dish) => {
                            const closed = dish.provider.isAvailable === false;
                            return (
                                <li key={dish.id} className={`flex gap-3 py-4 ${closed ? "opacity-60" : ""}`}>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <VegMark isVeg={dish.isVeg} />
                                            <h3 className="truncate text-sm font-bold sm:text-base">{dish.name}</h3>
                                        </div>
                                        <p className="text-sm font-semibold">₹{Number(dish.price)}</p>
                                        {dish.description && <p className="line-clamp-2 text-xs text-muted-foreground">{dish.description}</p>}
                                        <button
                                            type="button"
                                            className="flex max-w-full items-center gap-0.5 text-xs font-semibold text-primary"
                                            onClick={() => setLocation(`/restaurants/${dish.providerId}`)}
                                        >
                                            <span className="truncate">{dish.provider.businessName}</span>
                                            {dish.estimate && <span className="shrink-0 font-normal text-muted-foreground">· {formatDistance(dish.estimate.distanceKm)} · {dish.estimate.minutes} mins</span>}
                                            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                        </button>
                                    </div>
                                    <div className="relative w-28 shrink-0">
                                        <img
                                            src={dish.imageUrl || DISH_FALLBACK_IMAGE}
                                            alt={dish.name}
                                            loading="lazy"
                                            onError={(event) => { event.currentTarget.src = DISH_FALLBACK_IMAGE; }}
                                            className="h-24 w-28 rounded-xl object-cover"
                                        />
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-lg bg-background shadow-md">
                                            <DishQuantityControl
                                                dish={dish}
                                                quantity={cart.getQuantity(dish.id)}
                                                onAdd={() => cart.add(dish)}
                                                onUpdate={(change) => cart.updateQuantity(dish.id, change)}
                                            />
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {cartItems.length > 0 && (
                <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 mx-auto max-w-md">
                    <Button className="h-14 w-full justify-between rounded-xl bg-slate-900 px-4 text-white shadow-xl hover:bg-slate-800" onClick={() => setLocation("/checkout")}>
                        <span className="text-left">
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/70">{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
                            <span className="text-sm font-bold">₹{getTotalPrice().toFixed(2)}</span>
                        </span>
                        <span className="flex items-center gap-1 text-sm font-semibold">View cart <ChevronRight className="h-4 w-4" /></span>
                    </Button>
                </div>
            )}

            {cart.conflictDialog}
        </div>
    );
}
