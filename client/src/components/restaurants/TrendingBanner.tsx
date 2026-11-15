import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CollectionDishCard } from "@/components/restaurants/CollectionDishCard";
import { dishProviderPath, useCollectionCart, type CollectionDish } from "@/components/restaurants/use-collection-cart";
import { useLocation } from "wouter";

// Tabs for the Banner Insights view. "Lunch" shares its items with "Dinner" on the server.
const TABS = [
    { key: "all", label: "All", path: "/api/trending" },
    { key: "breakfast", label: "Breakfast", path: "/api/food-collections/breakfast" },
    { key: "lunch", label: "Lunch", path: "/api/food-collections/lunch" },
    { key: "cafe", label: "Café", path: "/api/food-collections/cafe" },
    { key: "street-food", label: "Street Food", path: "/api/food-collections/street-food" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Eye-catching entry point below the search bar. Opens the Banner Insights view.
export function TrendingBanner() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 p-3.5 text-left text-white shadow-md transition-transform hover:-translate-y-0.5"
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Live in Shirur</p>
                        <h2 className="truncate text-base font-extrabold tracking-tight sm:text-lg">What Shirur is Ordering 🔥</h2>
                        <p className="truncate text-[11px] text-white/85">Most-ordered dishes in the last 24 hours</p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
                        <Flame className="h-5 w-5" />
                    </span>
                </div>
                <span className="absolute bottom-3 right-3 hidden items-center gap-0.5 text-[11px] font-semibold text-white/90 sm:flex">
                    See all <ChevronRight className="h-3.5 w-3.5" />
                </span>
            </button>
            <BannerInsights open={open} onOpenChange={setOpen} />
        </>
    );
}

function BannerInsights({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [tab, setTab] = useState<TabKey>("all");
    const [, setLocation] = useLocation();
    const cart = useCollectionCart();
    const current = TABS.find((t) => t.key === tab)!;

    const { data, isLoading } = useQuery<CollectionDish[]>({
        queryKey: [current.path],
        queryFn: () => apiRequest("GET", current.path).then((res) => res.json()),
        enabled: open,
        refetchInterval: open ? 30 * 1000 : false,
    });

    // Slug feeds are full lists; keep only dishes with real orders today, most ordered first.
    const dishes = (data || [])
        .filter((dish) => (dish.orderCount ?? 0) > 0)
        .sort((a, b) => (b.orderCount ?? 0) - (a.orderCount ?? 0))
        .slice(0, 30);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden rounded-2xl p-0">
                <DialogHeader className="px-5 pt-5">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Flame className="h-5 w-5 text-orange-500" /> What Shirur is Ordering
                    </DialogTitle>
                    <DialogDescription>Real orders from the last 24 hours. Resets every day.</DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${t.key === tab ? "bg-foreground text-background" : "bg-muted/70 text-muted-foreground hover:bg-muted"}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="max-h-[60vh] overflow-y-auto px-5 pb-5 pt-3">
                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />)}
                        </div>
                    ) : dishes.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">No orders in this section yet today.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {dishes.map((dish) => (
                                <CollectionDishCard
                                    key={dish.id}
                                    dish={dish}
                                    quantity={cart.getQuantity(dish.id)}
                                    onAdd={() => cart.add(dish)}
                                    onUpdate={(change) => cart.updateQuantity(dish.id, change)}
                                    onOpen={() => { onOpenChange(false); setLocation(dishProviderPath(dish)); }}
                                />
                            ))}
                        </div>
                    )}
                </div>
                {cart.conflictDialog}
            </DialogContent>
        </Dialog>
    );
}
