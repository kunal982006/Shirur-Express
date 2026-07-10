import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, MapPin, Star, UtensilsCrossed, Coffee, Leaf,
  Plus, Minus, ShoppingBag, ArrowLeft, Check, Clock,
  ChefHat, BellRing, PartyPopper, RotateCcw, X, Hash
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { RestaurantMenuItem, ServiceProvider } from "@shared/schema";

// ============================================================
// TYPES
// ============================================================
interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface QrOrder {
  id: string;
  providerId: string;
  tokenNumber: number;
  customerName: string | null;
  customerPhone: string | null;
  tableNumber: string | null;
  items: Array<{ menuItemId: string; name: string; quantity: number; price: number }>;
  totalAmount: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CafeOfJoyMenu() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCheckout, setShowCheckout] = useState(false);
    const [placedOrder, setPlacedOrder] = useState<QrOrder | null>(null);

    // Checkout form
    const [customerName, setCustomerName] = useState("");
    const [tableNumber, setTableNumber] = useState("");
    const [notes, setNotes] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    // Step 1: Find "Cafe of Joy" provider
    const { data: providers, isLoading: loadingProviders } = useQuery<ServiceProvider[]>({
        queryKey: ["service-providers", "restaurants"],
        queryFn: () =>
            apiRequest("GET", "/api/service-providers?category=restaurants")
                .then(res => res.json()),
    });

    const cafeOfJoy = providers?.find(
        (p) => p.businessName.toLowerCase().includes("cafe of joy")
    );

    // Step 2: Fetch menu items
    const { data: menuItems, isLoading: loadingMenu } = useQuery<RestaurantMenuItem[]>({
        queryKey: ["restaurantMenu", cafeOfJoy?.id],
        queryFn: () =>
            apiRequest("GET", `/api/restaurant-menu-items?providerId=${cafeOfJoy!.id}`)
                .then(res => res.json()),
        enabled: !!cafeOfJoy?.id,
    });

    // Step 3: Poll order status if an order was placed
    const { data: orderStatus } = useQuery<QrOrder>({
        queryKey: ["qr-order-status", placedOrder?.id],
        queryFn: () =>
            apiRequest("GET", `/api/qr-orders/${placedOrder!.id}`)
                .then(res => res.json()),
        enabled: !!placedOrder?.id,
        refetchInterval: 8000, // Poll every 8 seconds
    });

    // Vibrate/alert when status changes to ready
    useEffect(() => {
        if (orderStatus && placedOrder && orderStatus.status !== placedOrder.status) {
            setPlacedOrder(orderStatus);
            if (orderStatus.status === "ready") {
                // Try to vibrate
                if (navigator.vibrate) {
                    navigator.vibrate([300, 100, 300, 100, 300]);
                }
            }
        }
    }, [orderStatus, placedOrder]);

    // Place order mutation
    const placeOrderMutation = useMutation({
        mutationFn: async (orderPayload: any) => {
            const res = await apiRequest("POST", "/api/qr-orders", orderPayload);
            return res.json();
        },
        onSuccess: (data: QrOrder) => {
            setPlacedOrder(data);
            setCart([]);
            setShowCheckout(false);
            setCustomerName("");
            setTableNumber("");
            setNotes("");
            setCustomerPhone("");
        },
    });

    // Cart operations
    const addToCart = useCallback((item: RestaurantMenuItem) => {
        setCart(prev => {
            const existing = prev.find(c => c.menuItemId === item.id);
            if (existing) {
                return prev.map(c =>
                    c.menuItemId === item.id
                        ? { ...c, quantity: c.quantity + 1 }
                        : c
                );
            }
            return [...prev, {
                menuItemId: item.id,
                name: item.name,
                price: Math.round(Number(item.price) / 1.1), // Remove 10% margin for QR menu
                quantity: 1,
            }];
        });
    }, []);

    const removeFromCart = useCallback((menuItemId: string) => {
        setCart(prev => {
            const existing = prev.find(c => c.menuItemId === menuItemId);
            if (existing && existing.quantity > 1) {
                return prev.map(c =>
                    c.menuItemId === menuItemId
                        ? { ...c, quantity: c.quantity - 1 }
                        : c
                );
            }
            return prev.filter(c => c.menuItemId !== menuItemId);
        });
    }, []);

    const getQuantity = (menuItemId: string) =>
        cart.find(c => c.menuItemId === menuItemId)?.quantity || 0;

    const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    // Handle order placement
    const handlePlaceOrder = () => {
        if (!cafeOfJoy || cart.length === 0) return;
        placeOrderMutation.mutate({
            providerId: cafeOfJoy.id,
            customerName: customerName.trim() || undefined,
            customerPhone: customerPhone.trim() || undefined,
            tableNumber: tableNumber.trim() || undefined,
            items: cart.map(c => ({
                menuItemId: c.menuItemId,
                name: c.name,
                quantity: c.quantity,
                price: c.price,
            })),
            totalAmount: cartTotal.toFixed(2),
            notes: notes.trim() || undefined,
        });
    };

    // Reset for new order
    const handleOrderAgain = () => {
        setPlacedOrder(null);
        setCart([]);
        setShowCheckout(false);
    };

    // ========================================
    // RENDER: ORDER PLACED — TOKEN SCREEN
    // ========================================
    if (placedOrder) {
        return <TokenScreen order={placedOrder} onOrderAgain={handleOrderAgain} />;
    }

    // ========================================
    // RENDER: CHECKOUT
    // ========================================
    if (showCheckout) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 text-white py-2 px-4 text-center text-xs font-medium tracking-wider">
                    POWERED BY SHIRUR EXPRESS
                </div>
                <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm">
                    <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                        <button onClick={() => setShowCheckout(false)} className="p-1">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="font-bold text-lg">Confirm Order</h1>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                    {/* Order Summary */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-amber-600" />
                            Your Order
                        </h3>
                        <div className="space-y-2">
                            {cart.map(item => (
                                <div key={item.menuItemId} className="flex justify-between items-center text-sm py-1.5 border-b border-dashed border-amber-100 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-amber-100 text-amber-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                                            {item.quantity}
                                        </span>
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    <span className="font-semibold">₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        <Separator className="my-3" />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-amber-800">₹{cartTotal}</span>
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 space-y-4">
                        <h3 className="font-bold text-lg">Your Details <span className="text-sm font-normal text-gray-400">(optional)</span></h3>

                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Your Name</label>
                            <Input
                                placeholder="e.g., Rahul"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="border-amber-200 focus:border-amber-400"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">So we can call your name when your order is ready</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Table Number</label>
                            <Input
                                placeholder="e.g., 5"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="border-amber-200 focus:border-amber-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Phone Number</label>
                            <Input
                                placeholder="e.g., 9876543210"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="border-amber-200 focus:border-amber-400"
                                type="tel"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Special Instructions</label>
                            <Textarea
                                placeholder="e.g., Less spicy, no onions..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="border-amber-200 focus:border-amber-400 min-h-[80px]"
                            />
                        </div>
                    </div>

                    {/* Payment Note */}
                    <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                        <span className="text-lg">💰</span>
                        <div>
                            <p className="font-semibold text-blue-800 text-sm">Pay at Counter</p>
                            <p className="text-xs text-blue-600 mt-0.5">Payment will be collected at the counter when your order is ready.</p>
                        </div>
                    </div>

                    {/* Place Order Button */}
                    <Button
                        className="w-full h-14 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-lg shadow-lg"
                        onClick={handlePlaceOrder}
                        disabled={placeOrderMutation.isPending}
                    >
                        {placeOrderMutation.isPending ? (
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Placing Order...
                            </div>
                        ) : (
                            `Place Order • ₹${cartTotal}`
                        )}
                    </Button>

                    {placeOrderMutation.isError && (
                        <p className="text-red-500 text-center text-sm">
                            Failed to place order. Please try again.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ========================================
    // RENDER: LOADING
    // ========================================
    if (loadingProviders || (cafeOfJoy && loadingMenu)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center animate-pulse">
                        <Coffee className="h-8 w-8 text-amber-600" />
                    </div>
                    <p className="text-amber-800 font-medium animate-pulse">Loading menu...</p>
                </div>
            </div>
        );
    }

    // ========================================
    // RENDER: NOT FOUND
    // ========================================
    if (!cafeOfJoy) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                        <UtensilsCrossed className="h-10 w-10 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-900">Cafe of Joy</h2>
                    <p className="text-amber-700">Menu is currently unavailable. Please try again later.</p>
                </div>
            </div>
        );
    }

    const filteredItems = menuItems?.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const groupedItems = filteredItems.reduce((acc, item) => {
        const cat = item.category || "Recommended";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, RestaurantMenuItem[]>);

    // ========================================
    // RENDER: MENU WITH CART
    // ========================================
    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-24">
            {/* Top branding */}
            <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 text-white py-2 px-4 text-center text-xs font-medium tracking-wider">
                POWERED BY SHIRUR EXPRESS • SCAN, ORDER & ENJOY!
            </div>

            {/* Restaurant Hero */}
            {cafeOfJoy.profileImageUrl ? (
                <div className="relative h-48 md:h-64 w-full overflow-hidden cursor-pointer"
                     onClick={() => setSelectedImage(cafeOfJoy.profileImageUrl)}>
                    <img src={cafeOfJoy.profileImageUrl} alt={cafeOfJoy.businessName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow-lg">{cafeOfJoy.businessName}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-green-500/90 hover:bg-green-500 text-white font-bold border-0 text-xs">
                                {cafeOfJoy.rating || "4.2"} ★
                            </Badge>
                            <span className="text-xs opacity-80">{cafeOfJoy.specializations?.join(" • ")}</span>
                        </div>
                        <p className="text-xs mt-1 opacity-70 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {cafeOfJoy.address}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="py-8 px-6 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center mb-3 shadow-lg">
                        <Coffee className="h-10 w-10 text-amber-700" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-amber-900">{cafeOfJoy.businessName}</h1>
                    <p className="text-amber-600 mt-1 text-sm flex items-center gap-1 justify-center">
                        <MapPin className="h-3 w-3" /> {cafeOfJoy.address}
                    </p>
                </div>
            )}

            {/* Menu Section */}
            <div className="max-w-3xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-extrabold text-amber-900 flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                        Menu
                    </h2>
                    <span className="text-xs text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
                        {menuItems?.length || 0} items
                    </span>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                    <Input
                        placeholder="Search for dishes..."
                        className="pl-9 bg-white/80 border-amber-200 rounded-xl focus:border-amber-400 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Category pills */}
                {Object.keys(groupedItems).length > 1 && (
                    <div className="flex overflow-x-auto gap-2 mb-5 pb-1 scrollbar-hide">
                        {Object.keys(groupedItems).map(cat => (
                            <a key={cat} href={`#qr-cat-${cat.replace(/\s+/g, '-')}`}
                               className="whitespace-nowrap px-3 py-1 text-xs font-semibold rounded-full bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors shadow-sm">
                                {cat} ({groupedItems[cat].length})
                            </a>
                        ))}
                    </div>
                )}

                {/* Menu Items */}
                {Object.keys(groupedItems).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Search className="h-12 w-12 text-amber-200 mb-3" />
                        <p className="text-amber-700 font-medium">No dishes found.</p>
                    </div>
                ) : (
                    Object.entries(groupedItems).map(([category, catItems]) => (
                        <div key={category} id={`qr-cat-${category.replace(/\s+/g, '-')}`} className="mb-6 scroll-mt-20">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-extrabold text-base text-amber-900">{category}</h3>
                                <Separator className="flex-1 bg-amber-200/50" />
                                <span className="text-[10px] text-amber-400 font-medium">{catItems.length}</span>
                            </div>
                            <div className="space-y-2">
                                {catItems.map(item => (
                                    <MenuItemCardWithCart
                                        key={item.id}
                                        item={item}
                                        quantity={getQuantity(item.id)}
                                        onAdd={() => addToCart(item)}
                                        onRemove={() => removeFromCart(item.id)}
                                        onImageClick={setSelectedImage}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Cart Bar */}
            {cartItemCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
                    <div className="max-w-3xl mx-auto pointer-events-auto">
                        <button
                            onClick={() => setShowCheckout(true)}
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white flex justify-between items-center px-5 shadow-2xl transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 rounded-full px-2.5 py-0.5 text-sm font-bold">
                                    {cartItemCount}
                                </div>
                                <span className="font-bold text-sm">
                                    {cartItemCount === 1 ? "item" : "items"} added
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-lg">₹{cartTotal}</span>
                                <ArrowLeft className="h-4 w-4 rotate-180" />
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Full-Screen Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md cursor-pointer"
                     onClick={() => setSelectedImage(null)}>
                    <img src={selectedImage} alt="Menu item" className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
                         onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}


// ============================================================
// Menu Item Card with Add/Remove Cart Controls
// ============================================================
function MenuItemCardWithCart({
    item, quantity, onAdd, onRemove, onImageClick
}: {
    item: RestaurantMenuItem;
    quantity: number;
    onAdd: () => void;
    onRemove: () => void;
    onImageClick: (url: string) => void;
}) {
    const isVeg = item.isVeg;
    const image = item.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60";
    const displayPrice = Math.round(Number(item.price) / 1.1);

    return (
        <div className="flex gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-amber-100/80 hover:bg-white/90 transition-all">
            <div className="flex-1 space-y-1">
                <div className="flex items-start gap-1.5">
                    <div className={`mt-1 border-2 p-0.5 w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 leading-tight">{item.name}</h4>
                        <p className="text-sm font-semibold text-amber-800 mt-0.5">₹{displayPrice}</p>
                    </div>
                </div>
                {item.description && (
                    <p className="text-[11px] text-gray-400 line-clamp-2 pl-5">{item.description}</p>
                )}
            </div>

            {/* Image + Add/Remove */}
            <div className="relative w-24 min-w-[96px] flex-shrink-0">
                <div className="w-24 h-[68px] rounded-xl overflow-hidden shadow-sm cursor-pointer"
                     onClick={() => onImageClick(image)}>
                    <img src={image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                {/* Cart controls */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-lg bg-white rounded-lg border z-10">
                    {quantity === 0 ? (
                        <button
                            onClick={onAdd}
                            className="h-8 w-20 text-green-600 font-extrabold text-xs hover:bg-green-50 rounded-lg uppercase tracking-wide flex items-center justify-center gap-1 transition-colors"
                        >
                            ADD <Plus className="h-3 w-3" />
                        </button>
                    ) : (
                        <div className="flex items-center h-8 w-20 rounded-lg justify-between px-1">
                            <button onClick={onRemove} className="h-full w-7 flex items-center justify-center text-gray-500 hover:text-red-500">
                                <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-bold text-green-600 text-sm">{quantity}</span>
                            <button onClick={onAdd} className="h-full w-7 flex items-center justify-center text-green-600 hover:text-green-700">
                                <Plus className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


// ============================================================
// TOKEN CONFIRMATION SCREEN
// ============================================================
function TokenScreen({ order, onOrderAgain }: { order: QrOrder; onOrderAgain: () => void }) {
    const statusConfig: Record<string, { icon: any; label: string; color: string; bg: string; description: string }> = {
        pending: {
            icon: Clock,
            label: "Order Placed",
            color: "text-amber-600",
            bg: "bg-amber-50 border-amber-200",
            description: "Your order has been sent to the kitchen. Waiting for confirmation...",
        },
        preparing: {
            icon: ChefHat,
            label: "Preparing",
            color: "text-blue-600",
            bg: "bg-blue-50 border-blue-200",
            description: "The chef is preparing your order. It will be ready soon!",
        },
        ready: {
            icon: BellRing,
            label: "Ready for Pickup!",
            color: "text-green-600",
            bg: "bg-green-50 border-green-200",
            description: "Your order is ready! Please collect it from the counter.",
        },
        completed: {
            icon: PartyPopper,
            label: "Completed",
            color: "text-gray-600",
            bg: "bg-gray-50 border-gray-200",
            description: "Thank you for dining with us! Hope you enjoyed your meal.",
        },
        cancelled: {
            icon: X,
            label: "Cancelled",
            color: "text-red-600",
            bg: "bg-red-50 border-red-200",
            description: "This order was cancelled. Please contact the counter for assistance.",
        },
    };

    const status = statusConfig[order.status || "pending"] || statusConfig.pending;
    const StatusIcon = status.icon;
    const tokenStr = String(order.tokenNumber).padStart(3, '0');

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
            <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 text-white py-2 px-4 text-center text-xs font-medium tracking-wider">
                POWERED BY SHIRUR EXPRESS
            </div>

            <div className="max-w-md mx-auto px-4 py-8 space-y-6">
                {/* Token Number — Big & Bold */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium">
                        <Hash className="h-4 w-4" />
                        YOUR TOKEN
                    </div>
                    <div className={`text-7xl md:text-8xl font-black tracking-tight ${
                        order.status === "ready" ? "text-green-600 animate-pulse" : "text-amber-800"
                    }`}>
                        #{tokenStr}
                    </div>
                    {order.customerName && (
                        <p className="text-amber-600 text-sm font-medium">{order.customerName}</p>
                    )}
                    {order.tableNumber && (
                        <p className="text-amber-500 text-xs">Table {order.tableNumber}</p>
                    )}
                </div>

                {/* Status Card */}
                <div className={`rounded-2xl border-2 p-5 ${status.bg} transition-all duration-500`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.color} bg-white shadow-sm`}>
                            <StatusIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${status.color}`}>{status.label}</h3>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 ml-[52px]">{status.description}</p>
                </div>

                {/* Status Timeline */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
                    <h4 className="font-bold text-sm mb-4 text-gray-700">Order Progress</h4>
                    <div className="space-y-0">
                        {["pending", "preparing", "ready", "completed"].map((step, idx) => {
                            const stepStates = ["pending", "preparing", "ready", "completed"];
                            const currentIdx = stepStates.indexOf(order.status || "pending");
                            const isActive = idx <= currentIdx;
                            const isCurrent = idx === currentIdx;
                            const stepLabels = ["Order Placed", "Preparing", "Ready", "Completed"];
                            const stepIcons = [Check, ChefHat, BellRing, PartyPopper];
                            const Icon = stepIcons[idx];
                            return (
                                <div key={step} className="flex items-center gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                            isCurrent ? 'border-amber-500 bg-amber-500 text-white scale-110' :
                                            isActive ? 'border-green-500 bg-green-500 text-white' :
                                            'border-gray-200 bg-white text-gray-300'
                                        }`}>
                                            <Icon className="h-3.5 w-3.5" />
                                        </div>
                                        {idx < 3 && (
                                            <div className={`w-0.5 h-6 ${isActive && idx < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                                        )}
                                    </div>
                                    <span className={`text-sm font-medium pb-5 ${
                                        isCurrent ? 'text-amber-700 font-bold' :
                                        isActive ? 'text-green-700' : 'text-gray-400'
                                    }`}>
                                        {stepLabels[idx]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Order Details */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
                    <h4 className="font-bold text-sm mb-3 text-gray-700">Order Details</h4>
                    <div className="space-y-1.5">
                        {Array.isArray(order.items) && order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.quantity}x {item.name}</span>
                                <span className="font-medium">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-amber-800">₹{order.totalAmount}</span>
                    </div>
                    <div className="mt-3 bg-blue-50 rounded-lg p-2.5 flex items-center gap-2 text-xs text-blue-700">
                        <span>💰</span> Pay at Counter
                    </div>
                </div>

                {/* Order Again */}
                {(order.status === "completed" || order.status === "cancelled") && (
                    <Button
                        onClick={onOrderAgain}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold shadow-lg"
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Order Again
                    </Button>
                )}

                {/* Footer */}
                <div className="text-center pt-4">
                    <p className="text-[10px] text-amber-400">
                        © {new Date().getFullYear()} Shirur Express. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
