import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { HorizontalScrollList } from "@/components/horizontal-scroll-list";
import { CollectionDishCard } from "@/components/restaurants/CollectionDishCard";
import { dishProviderPath, useCollectionCart, type CollectionDish } from "@/components/restaurants/use-collection-cart";
import { getActiveFoodCollections, type FoodCollection } from "@shared/food-collections";

type FoodCollectionRow = FoodCollection & { totalItems: number; restaurantCount: number; items: CollectionDish[] };

// Slugs of the categories open right now (IST), re-checked every minute and whenever the app
// comes back to the foreground, so rows switch over without a reload.
function useActiveCollectionSlugs() {
    const current = () => getActiveFoodCollections().map((collection) => collection.slug).join(",");
    const [slugs, setSlugs] = useState(current);
    useEffect(() => {
        const refresh = () => setSlugs(current());
        const interval = window.setInterval(refresh, 60 * 1000);
        document.addEventListener("visibilitychange", refresh);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, []);
    return slugs.split(",");
}

// Time-of-day category rows (Breakfast, Lunch, Dinner, Street Food, Cafe Items): one mixed feed
// of dishes from every partner restaurant. Shown on the restaurants page and the app home page.
export function FoodCollectionRows({ className = "space-y-4" }: { className?: string }) {
    const [, setLocation] = useLocation();
    const { data: collections, isLoading } = useQuery<FoodCollectionRow[]>({
        queryKey: ["/api/food-collections"],
        queryFn: () => apiRequest("GET", "/api/food-collections").then(res => res.json())
    });
    const cart = useCollectionCart();
    const activeSlugs = useActiveCollectionSlugs();

    // Skeleton rows while collections load, so the screen doesn't jump.
    const rows: FoodCollectionRow[] = isLoading
        ? getActiveFoodCollections().map((collection) => ({ ...collection, totalItems: 0, restaurantCount: 0, items: [] }))
        : (collections || []).filter((collection) => activeSlugs.includes(collection.slug));

    return (
        <div className={className}>
            {rows.map(collection => (
                <HorizontalScrollList
                    key={collection.slug}
                    title={collection.title}
                    subtitle={collection.restaurantCount ? `${collection.subtitle} · ${collection.totalItems} dishes from ${collection.restaurantCount} places` : undefined}
                    items={collection.items}
                    isLoading={isLoading}
                    seeAllLabel="View All"
                    onSeeAll={() => setLocation(`/restaurants/collections/${collection.slug}`)}
                    renderItem={(dish) => (
                        <CollectionDishCard
                            dish={dish}
                            quantity={cart.getQuantity(dish.id)}
                            onAdd={() => cart.add(dish)}
                            onUpdate={(change) => cart.updateQuantity(dish.id, change)}
                            onOpen={() => setLocation(dishProviderPath(dish))}
                        />
                    )}
                />
            ))}
            {cart.conflictDialog}
        </div>
    );
}
