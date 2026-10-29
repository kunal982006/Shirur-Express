import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CollectionDish } from "./use-collection-cart";

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
export function CollectionDishCard({ dish, onOpen, ...control }: DishQuantityProps & { onOpen: () => void }) {
    return (
        <article className="app-product-card" onClick={onOpen}>
            <img
                src={dish.imageUrl || FALLBACK_IMAGE}
                alt={dish.name}
                loading="lazy"
                onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
            />
            <div className="min-w-0 p-2">
                <div className="flex items-center gap-1">
                    <VegMark isVeg={dish.isVeg} />
                    <p className="truncate text-xs sm:text-sm font-bold text-slate-900">{dish.name}</p>
                </div>
                <p className="truncate text-[10.5px] text-slate-500">{dish.provider.businessName}</p>
                <div className="mt-1.5 flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">₹{Number(dish.price)}</span>
                    <DishQuantityControl dish={dish} {...control} />
                </div>
            </div>
        </article>
    );
}

export { FALLBACK_IMAGE as DISH_FALLBACK_IMAGE };
