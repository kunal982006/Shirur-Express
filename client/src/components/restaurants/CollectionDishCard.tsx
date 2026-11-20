import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CollectionDish } from "./use-collection-cart";
import { badgeText, orderCountText } from "./dish-highlights";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60";

export function VegMark({ isVeg }: { isVeg?: boolean | null }) {
    return (
        <span className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${isVeg ? "border-green-600" : "border-red-600"}`} aria-label={isVeg ? "Veg" : "Non-veg"}>
            <span className={`h-1.5 w-1.5 rounded-full ${isVeg ? "bg-green-600" : "bg-red-600"}`} />
        </span>
    );
}

interface DishQuantityProps {
    dish: CollectionDish;
    quantity: number;
    onAdd: () => void;
    onUpdate: (change: number) => void;
}

export function DishQuantityControl({ dish, quantity, onAdd, onUpdate }: DishQuantityProps) {
    if (dish.provider.isAvailable === false) {
        return <span className="rounded-lg bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">Closed</span>;
    }
    if (quantity === 0) {
        return (
            <Button size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={(event) => { event.stopPropagation(); onAdd(); }}>
                Add
            </Button>
        );
    }
    return (
        <div className="flex h-8 items-center rounded-lg border border-border bg-card" onClick={(event) => event.stopPropagation()}>
            <button className="grid h-8 w-8 place-items-center text-primary" aria-label={`Remove ${dish.name}`} onClick={() => onUpdate(-1)}><Minus className="h-3.5 w-3.5" /></button>
            <span className="min-w-5 text-center text-xs font-semibold">{quantity}</span>
            <button className="grid h-8 w-8 place-items-center text-primary" aria-label={`Add another ${dish.name}`} onClick={() => onUpdate(1)}><Plus className="h-3.5 w-3.5" /></button>
        </div>
    );
}

// Compact card for the horizontal category rows on the food home screen.
// `priceLabel` and `control` replace the price and the Add button (e.g. "from ₹290" and a Half / Full picker).
export function CollectionDishCard({ dish, onOpen, priceLabel, control: customControl, ...control }: DishQuantityProps & { onOpen: () => void; priceLabel?: string; control?: React.ReactNode }) {
    return (
        <article className="app-product-card" onClick={onOpen}>
            <div className="relative">
                <img
                    src={dish.imageUrl || FALLBACK_IMAGE}
                    alt={dish.name}
                    loading="lazy"
                    onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
                />
                <span className="app-card-badge">{badgeText(dish) || "Trending in Shirur"}</span>
            </div>
            <div className="app-product-card__body">
                <div className="flex min-w-0 items-start gap-1.5">
                    <span className="mt-[3px]"><VegMark isVeg={dish.isVeg} /></span>
                    <p className="line-clamp-2 min-h-[2.6em] min-w-0 flex-1 break-words text-xs sm:text-sm font-bold leading-snug text-slate-900">{dish.name}</p>
                </div>
                <p className="truncate text-[10.5px] text-slate-500">
                    {dish.provider.businessName}
                    {orderCountText(dish.orderCount) && <span className="font-semibold text-orange-600"> · {orderCountText(dish.orderCount)}</span>}
                </p>
                {dish.showDescription && dish.description && (
                    <p className="mt-0.5 line-clamp-3 text-[10px] leading-snug text-slate-500">{dish.description}</p>
                )}
                <div className="app-product-card__footer">
                    <span className="truncate text-xs sm:text-sm font-extrabold text-slate-900">{priceLabel || `₹${Number(dish.price)}`}</span>
                    {customControl ?? <DishQuantityControl dish={dish} {...control} />}
                </div>
            </div>
        </article>
    );
}

export { FALLBACK_IMAGE as DISH_FALLBACK_IMAGE };
