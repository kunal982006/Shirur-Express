import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { HorizontalScrollList } from "@/components/horizontal-scroll-list";
import { CollectionDishCard } from "@/components/restaurants/CollectionDishCard";
import { useCollectionCart, type CollectionDish } from "@/components/restaurants/use-collection-cart";
import { FOOD_COLLECTIONS, type FoodCollection } from "@shared/food-collections";

type FoodCollectionRow = FoodCollection & { totalItems: number; restaurantCount: number; items: CollectionDish[] };

// Skeleton rows while collections load, so the screen doesn't jump.
const placeholderRows: FoodCollectionRow[] = FOOD_COLLECTIONS.map((collection) => ({ ...collection, totalItems: 0, restaurantCount: 0, items: [] }));

// Category rows: dishes from every partner restaurant, grouped by what you're craving.
// Shown on the restaurants page and the app home page.
export function FoodCollectionRows({ className = "space-y-4" }: { className?: string }) {
    const [, setLocation] = useLocation();
    const { data: collections, isLoading } = useQuery<FoodCollectionRow[]>({
        queryKey: ["/api/food-collections"],
        queryFn: () => apiRequest("GET", "/api/food-collections").then(res => res.json())
    });
    const cart = useCollectionCart();

    return (
        <div className={className}>
            {(isLoading ? placeholderRows : collections || []).map(collection => (
                <HorizontalScrollList
                    key={collection.slug}
                    title={collection.title}
                    subtitle={collection.restaurantCount ? `${collection.totalItems} dishes from ${collection.restaurantCount} restaurants` : undefined}
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
                            onOpen={() => setLocation(`/restaurants/${dish.providerId}`)}
                        />
                    )}
                />
            ))}
            {cart.conflictDialog}
        </div>
    );
}
