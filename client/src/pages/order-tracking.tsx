import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import api from "@/lib/api";
import { useLiveOrderTracking } from "@/hooks/use-live-order-tracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Phone, User, Truck, CheckCircle, Clock, Package, ChefHat, Navigation } from "lucide-react";
import { displayDeliveryAddress } from "@shared/delivery-address";

const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-5 w-5" />,
    accepted: <CheckCircle className="h-5 w-5" />,
    preparing: <ChefHat className="h-5 w-5" />,
    ready_for_pickup: <Package className="h-5 w-5" />,
    assigned: <User className="h-5 w-5" />,
    out_for_delivery: <Truck className="h-5 w-5" />,
    delivered: <CheckCircle className="h-5 w-5" />,
};

export default function OrderTracking() {
    const [, params] = useRoute("/order/:orderId/track");
    const [, setLocation] = useLocation();
    const orderId = params?.orderId;

    // Connect to SSE stream for instantaneous status changes
    useLiveOrderTracking(orderId);

    const { data: trackingInfo, isLoading, error, refetch } = useQuery({
        queryKey: ["orderTracking", orderId],
        queryFn: async () => {
            const res = await api.get(`/orders/${orderId}/track`);
            return res.data;
        },
        enabled: !!orderId,
        refetchInterval: (query) => {
            const status = query.state.data?.order?.status;
            // Stop polling once order reaches terminal status
            if (status === 'delivered' || status === 'cancelled' || status === 'declined') {
                return false;
            }
            // Rapid polling (2.5 seconds) so progress updates live without reload
            return 2500;
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-muted-foreground">Finding your order…</p>
            </div>
        );
    }

    if (error || !trackingInfo) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center space-y-4">
                        <p className="font-semibold">We couldn't load this order</p>
                        <p className="text-sm text-muted-foreground">
                            Check your connection and try again. If you're signed in to a different account, the order won't show here.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button onClick={() => refetch()}>Try again</Button>
                            <Button variant="outline" onClick={() => setLocation("/my-bookings")}>See all my orders</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { order, riderLocation, statusTimeline } = trackingInfo;
    const isOutForDelivery = order.status === 'out_for_delivery';
    const isDelivered = order.status === 'delivered';
    const isStopped = order.status === 'cancelled' || order.status === 'declined';
    const formatTime = (value: string) =>
        new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    // The step the order is on right now: the last one marked completed.
    const currentStepIndex = (statusTimeline ?? []).reduce(
        (last: number, step: any, index: number) => (step.completed ? index : last),
        -1,
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 pb-20">
            <div className="max-w-2xl mx-auto space-y-4">
                {/* Header */}
                <Card className="border-0 shadow-lg overflow-hidden">
                    <div className={`h-2 w-full ${isStopped ? 'bg-red-500' : isDelivered ? 'bg-green-500' : isOutForDelivery ? 'bg-blue-500' : 'bg-orange-400'}`} />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <CardTitle className="text-xl">Order #{order.id.slice(-6).toUpperCase()}</CardTitle>
                                <p className="text-sm text-gray-500 mt-1 truncate">
                                    {order.provider?.businessName || "Shirur Express"}
                                </p>
                            </div>
                            <Badge
                                variant={isDelivered || isStopped ? "default" : "secondary"}
                                className={`shrink-0 ${isStopped ? "bg-red-500" : isDelivered ? "bg-green-500" : ""}`}
                            >
                                {order.status?.replace(/_/g, " ").toUpperCase()}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {isStopped ? (
                    <Card className="border-0 shadow-lg bg-red-50">
                        <CardContent className="pt-6 text-center space-y-3">
                            <p className="font-semibold text-red-700">
                                {order.status === 'declined' ? "The shop couldn't accept this order" : "This order was cancelled"}
                            </p>
                            <p className="text-sm text-red-600">
                                If you already paid online, contact support and we'll help with your payment.
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                                <Button onClick={() => setLocation("/")}>Order something else</Button>
                                <Button variant="outline" onClick={() => setLocation("/help-support")}>Help & support</Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                /* Status Timeline */
                <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Order Status</CardTitle>
                        {!isDelivered && (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                Updates automatically — no need to refresh
                            </p>
                        )}
                    </CardHeader>
                    <CardContent>
                        <ol>
                            {statusTimeline?.map((step: any, index: number) => {
                                const isCurrent = index === currentStepIndex && !isDelivered;
                                const isLast = index === statusTimeline.length - 1;
                                return (
                                    <li key={step.key} className="flex gap-3" aria-current={isCurrent ? "step" : undefined}>
                                        <div className="flex flex-col items-center">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isCurrent
                                                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                                : step.completed
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                {statusIcons[step.key] || <Clock className="h-5 w-5" />}
                                            </div>
                                            {!isLast && (
                                                <div className={`w-0.5 flex-1 min-h-4 ${index < currentStepIndex ? 'bg-green-300' : 'bg-gray-200'}`} />
                                            )}
                                        </div>
                                        <div className={`flex-1 pt-2 ${isLast ? '' : 'pb-4'}`}>
                                            <p className={`font-medium ${isCurrent ? 'text-blue-700' : step.completed ? 'text-green-700' : 'text-gray-400'}`}>
                                                {step.label}
                                            </p>
                                            {step.time && step.completed && (
                                                <p className="text-xs text-gray-400 mt-0.5">{formatTime(step.time)}</p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </CardContent>
                </Card>
                )}

                {/* Delivery Partner Info (shown when assigned) */}
                {order.riderId && order.rider && (
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Your Delivery Partner
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {order.rider.username?.charAt(0).toUpperCase() || "R"}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-lg">{order.rider.username}</p>
                                    <p className="text-sm text-gray-500">Delivery Partner</p>
                                </div>
                                {order.rider.phone && (
                                    <Button variant="outline" asChild>
                                        <a href={`tel:${order.rider.phone}`} aria-label={`Call ${order.rider.username || "delivery partner"}`}>
                                            <Phone className="mr-2 h-4 w-4" />
                                            Call
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Live Location (shown when out for delivery) */}
                {isOutForDelivery && riderLocation && (
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Navigation className="h-5 w-5" />
                                Live Tracking
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-700">
                                    Your delivery partner is on the way!
                                </p>
                                <p className="text-xs text-blue-500 mt-1">
                                    Last updated: {riderLocation.lastUpdate
                                        ? formatTime(riderLocation.lastUpdate)
                                        : 'Just now'
                                    }
                                </p>
                                {/* Placeholder for map - can integrate Leaflet or Google Maps here */}
                                <div className="mt-4 h-48 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                    <div className="text-center text-blue-600">
                                        <Truck className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                                        <p className="text-sm">Rider is on the way to you</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Delivery Address */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Delivery Address
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">{displayDeliveryAddress(order.deliveryAddress)}</p>
                    </CardContent>
                </Card>

                {/* Order Items */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">Order Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {order.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                                    <span>{item.quantity} x {item.name}</span>
                                    <span className="font-medium">₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>₹{order.totalAmount}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Delivered Success Message */}
                {isDelivered && (
                    <Card className="border-0 shadow-lg bg-green-50">
                        <CardContent className="pt-6 text-center">
                            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                            <h3 className="text-xl font-bold text-green-700">Order Delivered!</h3>
                            <p className="text-green-600 mt-2">
                                Thank you for ordering with Shirur Express
                            </p>
                            {order.deliveredAt && (
                                <p className="text-sm text-green-500 mt-2">
                                    Delivered at {new Date(order.deliveredAt).toLocaleString()}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
