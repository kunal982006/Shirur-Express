import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Phone, User, Truck, CheckCircle, Clock, Package, ChefHat, Navigation } from "lucide-react";

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
    const orderId = params?.orderId;

    const { data: trackingInfo, isLoading, error, refetch } = useQuery({
        queryKey: ["orderTracking", orderId],
        queryFn: async () => {
            const res = await api.get(`/orders/${orderId}/track`);
            return res.data;
        },
        enabled: !!orderId,
        refetchInterval: 10000, // Poll every 10 seconds
    });

    useEffect(() => {
        // More frequent polling when order is out for delivery
        if (trackingInfo?.order?.status === 'out_for_delivery') {
            const interval = setInterval(refetch, 5000);
            return () => clearInterval(interval);
        }
    }, [trackingInfo?.order?.status, refetch]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !trackingInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-red-500">Order not found or you don't have access to track this order.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { order, riderLocation, statusTimeline } = trackingInfo;
    const isOutForDelivery = order.status === 'out_for_delivery';
    const isDelivered = order.status === 'delivered';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 pt-20 pb-20">
            <div className="max-w-2xl mx-auto space-y-4">
                {/* Header */}
                <Card className="border-0 shadow-lg overflow-hidden">
                    <div className={`h-2 w-full ${isDelivered ? 'bg-green-500' : isOutForDelivery ? 'bg-blue-500' : 'bg-orange-400'}`} />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">Order #{order.id.slice(-6).toUpperCase()}</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">
                                    {order.provider?.businessName || "Restaurant"}
                                </p>
                            </div>
                            <Badge variant={isDelivered ? "default" : "secondary"} className={isDelivered ? "bg-green-500" : ""}>
                                {order.status?.replace(/_/g, " ").toUpperCase()}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Status Timeline */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">Order Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {statusTimeline?.map((step: any, index: number) => (
                                <div key={step.key} className="flex items-start gap-4">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${step.completed
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {statusIcons[step.key] || <Clock className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 pb-4 border-l-2 border-gray-200 -ml-5 pl-9">
                                        <p className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-500'}`}>
                                            {step.label}
                                        </p>
                                        {step.time && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(step.time).toLocaleTimeString()}
                                            </p>
                                        )}
                                    </div>
                                    {step.completed && (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

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
                                    <Button variant="outline" size="icon" asChild>
                                        <a href={`tel:${order.rider.phone}`}>
                                            <Phone className="h-5 w-5" />
                                        </a>
                                    </Button>
                                )}
                            </div>

                            {/* OTP Display when out for delivery */}
                            {isOutForDelivery && order.deliveryOtp && (
                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                                    <p className="text-sm text-yellow-700 mb-1">Share this OTP with the delivery partner</p>
                                    <p className="text-3xl font-bold tracking-widest text-yellow-800">
                                        {order.deliveryOtp}
                                    </p>
                                </div>
                            )}
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
                                        ? new Date(riderLocation.lastUpdate).toLocaleTimeString()
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
                        <p className="text-gray-700">{order.deliveryAddress}</p>
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
