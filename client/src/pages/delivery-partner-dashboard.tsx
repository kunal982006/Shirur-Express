import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { RestaurantOrder } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, MapPin, Package, CheckCircle, Truck, Phone, User as UserIcon, Navigation, Power, Clock, ReceiptText } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { deliveryDirectionsUrl, displayDeliveryAddress } from "@shared/delivery-address";
import { PrintOrderBillButton } from "@/components/print-order-bill-button";
import type { OrderSettlement, SettlementTotals } from "@shared/rider-settlement";
import { rupees, settleLine } from "@/components/settlement/money";

const getStatusColor = (status: string) => {
    switch (status) {
        case "pending": return "bg-yellow-500";
        case "accepted": return "bg-blue-400";
        case "preparing": return "bg-orange-400";
        case "ready_for_pickup": return "bg-green-500";
        case "assigned": return "bg-purple-500";
        case "out_for_delivery": return "bg-blue-600";
        case "delivered": return "bg-green-700";
        case "declined":
        case "cancelled": return "bg-red-500";
        default: return "bg-gray-500";
    }
};

const formatStatus = (status: string) => {
    return status?.replace(/_/g, " ").toUpperCase() || "PENDING";
};

export default function DeliveryPartnerDashboard() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const [isOnline, setIsOnline] = useState(false);
    const [tab, setTab] = useState("available");

    // Fetch delivery partner profile
    const { data: profile } = useQuery({
        queryKey: ["deliveryPartnerProfile"],
        queryFn: async () => {
            const res = await api.get("/delivery-partner/profile");
            return res.data;
        },
    });

    useEffect(() => {
        if (profile) {
            setIsOnline(profile.isOnline);
        }
    }, [profile]);

    // Toggle Online Status
    const toggleStatusMutation = useMutation({
        mutationFn: (newStatus: boolean) =>
            api.patch("/delivery-partner/status", { isOnline: newStatus }),
        onSuccess: (_, newStatus) => {
            setIsOnline(newStatus);
            toast({
                title: newStatus ? "You're Online!" : "You're Offline",
                description: newStatus ? "You can now receive delivery requests" : "You won't receive new orders",
            });
            queryClient.invalidateQueries({ queryKey: ["deliveryPartnerProfile"] });
        },
    });

    // Update Location
    const updateLocationMutation = useMutation({
        mutationFn: (coords: { latitude: number; longitude: number }) =>
            api.patch("/delivery-partner/location", coords),
    });

    // Start location tracking when online
    useEffect(() => {
        if (!isOnline) return;

        const updateLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        updateLocationMutation.mutate({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    },
                    (error) => console.error("Location error:", error)
                );
            }
        };

        updateLocation();
        const interval = setInterval(updateLocation, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, [isOnline]);

    // Fetch Available Orders (includes restaurant and grocery orders)
    const { data: availableOrders, isLoading: isLoadingAvailable } = useQuery<any[]>({
        queryKey: ["riderAvailableOrders"],
        queryFn: async () => {
            const res = await api.get("/rider/orders/available");
            return res.data;
        },
        refetchInterval: isOnline ? 5000 : false,
        enabled: isOnline,
    });

    // Fetch My Active Orders (includes restaurant and grocery orders)
    const { data: myOrders, isLoading: isLoadingMyOrders } = useQuery<any[]>({
        queryKey: ["riderMyOrders"],
        queryFn: async () => {
            const res = await api.get("/rider/orders/my-active");
            return res.data;
        },
        refetchInterval: 10000,
    });

    // Accept Order
    const acceptOrderMutation = useMutation({
        mutationFn: ({ orderId, orderType }: { orderId: string; orderType: string }) =>
            api.post(`/rider/orders/${orderId}/accept`, { orderType }),
        onSuccess: () => {
            toast({ title: "Order Accepted!", description: "Navigate to the pickup location." });
            queryClient.invalidateQueries({ queryKey: ["riderAvailableOrders"] });
            queryClient.invalidateQueries({ queryKey: ["riderMyOrders"] });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to accept order",
                variant: "destructive",
            });
        },
    });

    // Arrived at Pickup
    const arrivedMutation = useMutation({
        mutationFn: ({ orderId, orderType }: { orderId: string; orderType: string }) =>
            api.post(`/rider/orders/${orderId}/arrived-at-pickup`, { orderType }),
        onSuccess: () => {
            toast({ title: "Marked as Arrived", description: "Wait for store to hand over the order." });
            queryClient.invalidateQueries({ queryKey: ["riderMyOrders"] });
        },
    });

    // Picked Up (status change only, no OTP)
    const pickupMutation = useMutation({
        mutationFn: ({ orderId, orderType }: { orderId: string; orderType: string }) =>
            api.post(`/rider/orders/${orderId}/picked-up`, { orderType }),
        onSuccess: () => {
            toast({
                title: "Order Picked Up!",
                description: "Now deliver to the customer.",
            });
            queryClient.invalidateQueries({ queryKey: ["riderMyOrders"] });
        },
    });

    // Mark Delivered (direct - no OTP)
    const markDeliveredMutation = useMutation({
        mutationFn: ({ orderId, orderType }: { orderId: string; orderType: string }) =>
            api.post(`/rider/orders/${orderId}/verify-delivery`, { orderType }),
        onSuccess: () => {
            toast({ title: "✅ Delivery Complete!", description: "Tap Print Bill to print the customer's bill." });
            // Delivered orders move to History, where Print Bill is now enabled.
            setTab("history");
            queryClient.invalidateQueries({ queryKey: ["riderMyOrders"] });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to mark as delivered",
                variant: "destructive",
            });
        },
    });

    const activeMyOrders = myOrders?.filter(o => !['delivered', 'cancelled', 'declined'].includes(o.status || '')) || [];

    // Open "My Active" when the rider has a delivery, and jump there (with a toast) whenever a new
    // one lands on them, e.g. when the admin assigns an order and the phone rings.
    const seenActiveIds = useRef<Set<string> | null>(null);
    const activeIdsKey = activeMyOrders.map(o => o.id).sort().join(",");
    useEffect(() => {
        if (!myOrders) return;
        const ids = activeIdsKey ? activeIdsKey.split(",") : [];
        if (seenActiveIds.current === null) {
            if (ids.length > 0) setTab("active");
        } else if (ids.some(id => !seenActiveIds.current!.has(id))) {
            setTab("active");
            toast({ title: "🛵 New delivery assigned to you", description: "Pick it up from the restaurant shown." });
        }
        seenActiveIds.current = new Set(ids);
    }, [activeIdsKey, myOrders]);
    // Latest delivery first, so the order just delivered is on top with its Print Bill button.
    const finishedAt = (o: any) => new Date(o.deliveredAt || o.createdAt || 0).getTime();
    const historyMyOrders = (myOrders?.filter(o => ['delivered', 'cancelled', 'declined'].includes(o.status || '')) || [])
        .sort((a, b) => finishedAt(b) - finishedAt(a));

    if (isLoadingMyOrders) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 pt-20 pb-20">
            <div className="max-w-3xl mx-auto">
                {/* Header with Online/Offline Toggle */}
                <header className="mb-6 bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
                            <p className="text-gray-500">Welcome, {user?.username}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                            <Switch
                                checked={isOnline}
                                onCheckedChange={(checked) => toggleStatusMutation.mutate(checked)}
                                disabled={toggleStatusMutation.isPending}
                            />
                            <Power className={`h-5 w-5 ${isOnline ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                    </div>
                    {profile && (
                        <div className="mt-3 flex gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <Truck className="h-4 w-4" />
                                {profile.vehicleType} - {profile.vehicleNumber}
                            </span>
                            <span className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                {profile.totalDeliveries || 0} deliveries
                            </span>
                        </div>
                    )}
                    <TodaySettlementCard />
                    <Button className="mt-4 w-full" onClick={() => setLocation("/billing")}>
                        <ReceiptText className="h-4 w-4 mr-2" /> Print Bill
                    </Button>
                </header>

                <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="available" disabled={!isOnline}>
                            Available ({availableOrders?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="active">
                            My Active ({activeMyOrders.length})
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="available" className="space-y-4">
                        {!isOnline ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                <Power className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">You're Offline</h3>
                                <p className="text-gray-500 mt-1">Go online to receive delivery requests</p>
                            </div>
                        ) : !availableOrders || availableOrders.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No orders available</h3>
                                <p className="text-gray-500 mt-1">Wait for new orders to appear...</p>
                            </div>
                        ) : (
                            availableOrders.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    type="available"
                                    onAccept={() => acceptOrderMutation.mutate({ orderId: order.id, orderType: order.orderType || 'restaurant' })}
                                    isProcessing={acceptOrderMutation.isPending}
                                />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="active" className="space-y-4">
                        {activeMyOrders.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500">You have no active deliveries.</p>
                            </div>
                        ) : (
                            activeMyOrders.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    type="active"
                                    onArrived={() => arrivedMutation.mutate({ orderId: order.id, orderType: order.orderType || 'restaurant' })}
                                    onPickup={() => pickupMutation.mutate({ orderId: order.id, orderType: order.orderType || 'restaurant' })}
                                    onDeliver={() => markDeliveredMutation.mutate({ orderId: order.id, orderType: order.orderType || 'restaurant' })}
                                    isProcessing={arrivedMutation.isPending || pickupMutation.isPending || markDeliveredMutation.isPending}
                                />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4">
                        {historyMyOrders.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                <p className="text-gray-500">No delivery history yet.</p>
                            </div>
                        ) : (
                            historyMyOrders.slice(0, 10).map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    type="history"
                                />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

interface OrderCardProps {
    order: any; // Restaurant, street food or grocery order, tagged with orderType
    type: 'available' | 'active' | 'history';
    onAccept?: () => void;
    onArrived?: () => void;
    onPickup?: () => void;
    onDeliver?: () => void;
    isProcessing?: boolean;
}

// Statuses before the rider has the food in hand. Once an order is assigned to a rider, all of
// these mean "go and collect it": many restaurants never tap Accept / Preparing / Ready.
const PRE_PICKUP_STATUSES = ['pending', 'paid', 'accepted', 'preparing', 'ready_for_pickup', 'assigned'];

const ORDER_TYPE_BADGE: Record<string, { label: string; className: string }> = {
    restaurant: { label: "🍽️ Restaurant", className: "bg-orange-100 text-orange-800" },
    street_food: { label: "🌮 Street Food", className: "bg-amber-100 text-amber-800" },
    grocery: { label: "🛒 Grocery", className: "bg-green-100 text-green-800" },
};

const OrderCard: React.FC<OrderCardProps> = ({
    order,
    type,
    onAccept,
    onArrived,
    onPickup,
    onDeliver,
    isProcessing,
}) => {
    const orderType: 'restaurant' | 'street_food' | 'grocery' = order.orderType || 'restaurant';
    const typeBadge = ORDER_TYPE_BADGE[orderType] || ORDER_TYPE_BADGE.restaurant;
    const provider = order.provider;
    const pickupName = provider?.businessName || (orderType === 'grocery' ? "Grocery Store" : "Restaurant");
    const pickupAddress = provider?.address || "";
    const pickupPhone: string | null = provider?.user?.phone || null;
    // A real link (not window.open): the Android app hands it to Google Maps.
    const dropMapsUrl = deliveryDirectionsUrl(order.deliveryAddress);
    const customerName: string = order.user?.username || "Customer";
    const customerPhone: string | null = order.user?.phone || null;
    const totalAmount = orderType === 'grocery' ? order.total : order.totalAmount;
    const isCod = order.paymentMethod === 'cod';
    const status: string = order.status || 'pending';
    const isPrePickup = type === 'active' && PRE_PICKUP_STATUSES.includes(status);
    // For the rider, an assigned order is ready to collect whatever the kitchen last tapped.
    const statusLabel = isPrePickup ? "READY TO PICK UP" : formatStatus(status);
    const showContacts = type === 'active';

    return (
        <Card className="shadow-md overflow-hidden">
            <div className={`h-2 w-full ${isPrePickup ? 'bg-green-500' : getStatusColor(status)}`} />
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                        <p className="text-xs text-slate-500">Order #{String(order.id).slice(0, 8)}</p>
                        <Badge variant="outline" className={`mt-1 ${typeBadge.className}`}>{typeBadge.label}</Badge>
                    </div>
                    <Badge variant="outline" className={isPrePickup ? "bg-green-50 text-green-700 border-green-300 shrink-0" : "bg-slate-50 shrink-0"}>
                        {statusLabel}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-3 space-y-3 text-sm">
                {/* Pick up from */}
                <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-1">Pick up from</p>
                    <p className="font-semibold text-base text-slate-900">{pickupName}</p>
                    {pickupAddress && (
                        <p className="text-slate-600 flex items-start gap-1 mt-0.5">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> <span className="break-words">{pickupAddress}</span>
                        </p>
                    )}
                    {/* No restaurant maps button: many restaurants have no map pin, and riders know them. */}
                    {showContacts && pickupPhone && (
                        <Button size="sm" variant="outline" className="w-full mt-2 bg-white" asChild>
                            <a href={`tel:${pickupPhone}`}>
                                <Phone className="h-4 w-4 mr-1.5" /> Call Restaurant
                            </a>
                        </Button>
                    )}
                </div>

                {/* Customer + items */}
                <div className="rounded-md bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <UserIcon className="h-3.5 w-3.5" /> {customerName}
                            </p>
                            {showContacts && customerPhone && (
                                <a href={`tel:${customerPhone}`} className="text-blue-700 font-medium">{customerPhone}</a>
                            )}
                        </div>
                        {showContacts && customerPhone && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 shrink-0" asChild>
                                <a href={`tel:${customerPhone}`}>
                                    <Phone className="h-4 w-4 mr-1.5" /> Call
                                </a>
                            </Button>
                        )}
                    </div>
                    <div className="space-y-1">
                        {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between gap-2">
                                <span>{item.quantity} x {item.name}</span>
                                <span className="text-slate-500 shrink-0">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between font-bold">
                        <span>{isCod ? "Collect Cash" : "Total (Paid Online)"}</span>
                        <span className={isCod ? "text-orange-700" : ""}>₹{totalAmount}</span>
                    </div>
                </div>

                {order.settlement && <OrderMoneyBox settlement={order.settlement} />}

                {/* Deliver to */}
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-1">Deliver to</p>
                    <p className="break-words text-slate-700">{displayDeliveryAddress(order.deliveryAddress) || "No address given - call the customer"}</p>
                    {dropMapsUrl && (
                        <Button size="sm" className="w-full mt-2 bg-blue-600 hover:bg-blue-700" asChild>
                            <a href={dropMapsUrl} target="_blank" rel="noopener noreferrer">
                                <Navigation className="h-4 w-4 mr-2" /> Customer Location in Maps
                            </a>
                        </Button>
                    )}
                </div>
            </CardContent>

            {type === 'history' && order.status === 'delivered' && (
                <CardFooter className="bg-slate-50 pt-3 pb-3 border-t">
                    <PrintOrderBillButton
                        orderType={orderType}
                        orderId={order.id}
                        className="w-full bg-slate-900 hover:bg-slate-800"
                    />
                </CardFooter>
            )}

            {type !== 'history' && (
                <CardFooter className="bg-slate-50 pt-3 pb-3 flex flex-wrap gap-2 justify-end border-t">
                    {type === 'available' && (
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={onAccept}
                            disabled={isProcessing}
                        >
                            Accept Delivery Job
                        </Button>
                    )}

                    {type === 'active' && (
                        <>
                            {isPrePickup && (
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={onArrived}
                                    disabled={isProcessing}
                                >
                                    <MapPin className="mr-2 h-4 w-4" /> Arrived at Pickup
                                </Button>
                            )}

                            {(isPrePickup || status === 'arrived_at_pickup') && (
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={onPickup}
                                    disabled={isProcessing}
                                >
                                    <Package className="mr-2 h-4 w-4" /> Picked Up
                                </Button>
                            )}

                            {status === 'out_for_delivery' && (
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={onDeliver}
                                    disabled={isProcessing}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" /> Mark Delivered
                                </Button>
                            )}

                            {status === 'out_for_delivery' && (
                                <div className="w-full">
                                    <PrintOrderBillButton
                                        orderType={orderType}
                                        orderId={order.id}
                                        disabled
                                        disabledHint="Print Bill turns on after you mark the order delivered"
                                        variant="outline"
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </CardFooter>
            )}
        </Card>
    );
};

/** What to pay at the counter, what to collect, and what the partner earns on one order. */
function OrderMoneyBox({ settlement }: { settlement: OrderSettlement }) {
    const billKnown = settlement.missingPrices === 0;
    return (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 space-y-1.5">
            <div className="flex justify-between items-baseline gap-2">
                <span className="font-semibold text-slate-900">Pay restaurant</span>
                <span className="text-lg font-bold text-emerald-800">
                    {billKnown ? rupees(settlement.restaurantBill) : settlement.restaurantBill > 0 ? `${rupees(settlement.restaurantBill)} +` : "Ask restaurant"}
                </span>
            </div>
            {!billKnown && (
                <p className="text-xs text-amber-700">
                    {settlement.missingPrices} dish{settlement.missingPrices > 1 ? "es have" : " has"} no restaurant price yet — check the bill at the counter.
                </p>
            )}
            <div className="flex justify-between gap-2 text-slate-700">
                <span>{settlement.isCod ? "Collect from customer" : "Paid online — collect"}</span>
                <span className="font-semibold">{rupees(settlement.collectFromCustomer)}</span>
            </div>
            <div className="flex justify-between gap-2 text-slate-700">
                <span>Your earning</span>
                <span className="font-semibold text-emerald-700">{rupees(settlement.partnerEarning)}</span>
            </div>
        </div>
    );
}

/** Today's earnings and the amount to settle with Shirur Express. */
function TodaySettlementCard() {
    const { data } = useQuery<{ date: string; totals: SettlementTotals }>({
        queryKey: ["riderSettlement"],
        queryFn: () => api.get("/rider/settlement").then((r) => r.data),
        refetchInterval: 30000,
        refetchOnWindowFocus: true,
    });
    const t = data?.totals;
    if (!t) return null;
    const line = settleLine(t.partnerOwes, "partner");
    return (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="flex justify-between items-baseline mb-2">
                <p className="font-semibold text-slate-900">Today</p>
                <p className="text-xs text-slate-500">{t.orders} order{t.orders === 1 ? "" : "s"} picked up</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-white p-2 border border-slate-200">
                    <p className="text-xs text-slate-500">Your earnings</p>
                    <p className="text-lg font-bold text-emerald-700">{rupees(t.partnerEarnings)}</p>
                </div>
                <div className="rounded-md bg-white p-2 border border-slate-200">
                    <p className="text-xs text-slate-500">Paid to restaurants</p>
                    <p className="text-lg font-bold text-slate-900">{rupees(t.paidToRestaurants)}</p>
                </div>
                <div className="rounded-md bg-white p-2 border border-slate-200 col-span-2 flex justify-between">
                    <span className="text-slate-600">Cash collected from customers</span>
                    <span className="font-semibold">{rupees(t.collectedFromCustomers)}</span>
                </div>
            </div>
            <div className={`mt-2 rounded-md p-2.5 text-center font-bold ${
                line.tone === "partnerPays" ? "bg-orange-100 text-orange-800" : line.tone === "shirurPays" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
            }`}>
                {line.text}
            </div>
            {t.ordersMissingPrices > 0 && (
                <p className="mt-1.5 text-xs text-amber-700">
                    {t.ordersMissingPrices} order{t.ordersMissingPrices > 1 ? "s" : ""} had dishes without a restaurant price, so this may change.
                </p>
            )}
        </div>
    );
}
