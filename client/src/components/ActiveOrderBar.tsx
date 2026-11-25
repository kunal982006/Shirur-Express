// Live order bar (like Blinkit / Swiggy): while a customer's order is on its way, a bar sits just
// above the bottom menu on every screen, showing the current status and, once the rider has
// picked it up, the arrival time. Tapping it opens the order tracking page.
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bike, ChefHat, CheckCircle2, ChevronRight, PackageCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/hooks/use-cart-store";
import api from "@/lib/api";

interface ActiveOrder {
  id: string;
  orderType: string;
  status: string;
  shopName: string;
  etaMinutes: number | null;
}

// Screens where the bar would get in the way (staff dashboards, checkout, the tracking page itself).
const HIDDEN_PREFIXES = [
  "/order/", "/checkout", "/order-success", "/admin", "/provider", "/delivery-partner",
  "/rider", "/runner", "/print-bill", "/menu/", "/login", "/signup", "/invoice",
  "/restaurants/", // restaurant pages have their own floating menu button
];

function describe(o: ActiveOrder) {
  switch (o.status) {
    case "accepted":
      return { icon: CheckCircle2, title: "Order accepted", sub: `${o.shopName} confirmed your order` };
    case "preparing":
      return { icon: ChefHat, title: "Preparing your order", sub: o.shopName };
    case "out_for_delivery":
      return {
        icon: Bike,
        title: o.etaMinutes ? `Arriving in ${o.etaMinutes} min` : "On the way",
        sub: "Your delivery partner is on the way",
      };
    default: // ready_for_pickup, assigned, arrived_at_pickup
      return { icon: PackageCheck, title: "Order ready", sub: "A delivery partner will pick it up shortly" };
  }
}

export function ActiveOrderBar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  // A "View cart" bar takes the same spot while the cart has items.
  const cartCount = useCartStore((s: any) => s.items?.length || 0);
  const hidden = cartCount > 0 || HIDDEN_PREFIXES.some((p) => location.startsWith(p));

  const { data } = useQuery<ActiveOrder[]>({
    queryKey: ["/api/customer/active-orders"],
    queryFn: () => api.get("/customer/active-orders").then((r) => r.data),
    enabled: !!user?.id,
    // Status changes arrive instantly over the live stream; this keeps the arrival time fresh.
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  if (!user?.id || hidden || !data?.length) return null;
  const order = data[0];
  const { icon: Icon, title, sub } = describe(order);
  const more = data.length - 1;

  return (
    <button
      type="button"
      onClick={() => setLocation(`/order/${order.id}/track`)}
      className="fixed left-3 right-3 z-40 mx-auto max-w-md flex items-center gap-3 rounded-2xl bg-green-600 px-4 py-3 text-left text-white shadow-xl active:scale-[0.98] transition-transform md:bottom-4"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      aria-label={`${title}. Track your order`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-tight truncate">{title}</span>
        <span className="block text-xs opacity-90 truncate">
          {sub}{more > 0 ? ` • +${more} more order${more > 1 ? "s" : ""}` : ""}
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 opacity-90" />
    </button>
  );
}
