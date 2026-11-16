import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DISH_FALLBACK_IMAGE, DishQuantityControl, VegMark } from "@/components/restaurants/CollectionDishCard";
import { badgeText, orderCountText } from "@/components/restaurants/dish-highlights";
import { dishProviderPath, useCollectionCart, type CollectionDish } from "@/components/restaurants/use-collection-cart";
import { useLocation } from "wouter";

// Tabs of the Banner Insights view. Lunch and dinner share one list on the server.
const TABS = [
    { key: "all", label: "All" },
    { key: "breakfast", label: "Breakfast" },
    { key: "lunch", label: "Lunch" },
    { key: "cafe", label: "Café" },
    { key: "biryani", label: "Biryani" },
    { key: "street-food", label: "Street Food" },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type Diet = "all" | "veg" | "non-veg";

const DIETS: { key: Diet; label: string; active: string; idle: string; dot?: string }[] = [
    { key: "all", label: "All", active: "bg-foreground text-background", idle: "bg-muted/70 text-muted-foreground" },
    { key: "veg", label: "Veg", active: "bg-green-600 text-white", idle: "border border-green-200 bg-green-50 text-green-700", dot: "bg-green-600" },
    { key: "non-veg", label: "Non-Veg", active: "bg-red-600 text-white", idle: "border border-red-200 bg-red-50 text-red-700", dot: "bg-red-600" },
];

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
                        <p className="truncate text-[11px] text-white/85">Most-ordered dishes in the last 24 hours · tap to see</p>
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
    const [diet, setDiet] = useState<Diet>("all");
    const [, setLocation] = useLocation();
    const cart = useCollectionCart();
    const path = `/api/food-insights?tab=${tab}&diet=${diet}`;

    // Ranked on the server: orders in the last 24 hours first, then each restaurant's specialities.
    const { data: dishes = [], isLoading } = useQuery<CollectionDish[]>({
        queryKey: [path],
        queryFn: () => apiRequest("GET", path).then((res) => res.json()),
        enabled: open,
        refetchInterval: open ? 30 * 1000 : false,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[88vh] max-w-xl gap-0 overflow-hidden rounded-2xl p-0">
                <DialogHeader className="px-5 pt-5">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Flame className="h-5 w-5 text-orange-500" /> What Shirur is Ordering
                    </DialogTitle>
                    <DialogDescription>Orders in the last 24 hours, and what each place is known for.</DialogDescription>
                </DialogHeader>

                <div className="mt-3 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${t.key === tab ? "bg-primary text-primary-foreground" : "bg-muted/70 text-muted-foreground hover:bg-muted"}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 px-5 pb-2 pt-2">
                    {DIETS.map((d) => (
                        <button
                            key={d.key}
                            type="button"
                            aria-pressed={d.key === diet}
                            onClick={() => setDiet(d.key)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${d.key === diet ? d.active : d.idle}`}
                        >
                            {d.dot && <span className={`h-2 w-2 rounded-full ${d.key === diet ? "bg-white" : d.dot}`} />}
                            {d.label}
                        </button>
                    ))}
                </div>

                <div className="max-h-[58vh] overflow-y-auto border-t px-5 pb-5">
                    {isLoading ? (
                        <div className="space-y-3 pt-3">
                            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
                        </div>
                    ) : dishes.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">Nothing in this section right now.</p>
                    ) : (
                        <ol className="divide-y">
                            {dishes.map((dish, index) => {
                                const badge = badgeText(dish);
                                const count = orderCountText(dish.orderCount);
                                const openMenu = () => { onOpenChange(false); setLocation(dishProviderPath(dish)); };
                                return (
                                    <li key={dish.id} className="flex items-center gap-3 py-3">
                                        <span className="w-5 shrink-0 text-center text-sm font-extrabold text-muted-foreground">{index + 1}</span>
                                        <img
                                            src={dish.imageUrl || DISH_FALLBACK_IMAGE}
                                            alt=""
                                            loading="lazy"
                                            onClick={openMenu}
                                            onError={(event) => { event.currentTarget.src = DISH_FALLBACK_IMAGE; }}
                                            className="h-14 w-14 shrink-0 cursor-pointer rounded-xl object-cover"
                                        />
                                        <button type="button" onClick={openMenu} className="min-w-0 flex-1 text-left">
                                            <span className="flex items-center gap-1.5">
                                                <VegMark isVeg={dish.isVeg} />
                                                <span className="truncate text-sm font-bold">{dish.name}</span>
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">{dish.provider.businessName} · ₹{Number(dish.price)}</span>
                                            {(count || badge) && (
                                                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-orange-600">
                                                    {count && <span>{count}</span>}
                                                    {badge && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">{badge}</span>}
                                                </span>
                                            )}
                                        </button>
                                        <DishQuantityControl
                                            dish={dish}
                                            quantity={cart.getQuantity(dish.id)}
                                            onAdd={() => cart.add(dish)}
                                            onUpdate={(change) => cart.updateQuantity(dish.id, change)}
                                        />
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
                {cart.conflictDialog}
            </DialogContent>
        </Dialog>
    );
}
