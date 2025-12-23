import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { RestaurantOrder } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, MapPin, Package, CheckCircle, Truck, Phone, User as UserIcon, Navigation, Power, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

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
    const [isOnline, setIsOnline] = useState(false);
    const [otpDialogOpen, setOtpDialogOpen] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
    const [currentOrderType, setCurrentOrderType] = useState<string>('restaurant');
    const [otp, setOtp] = useState("");

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

    // Picked Up (generates OTP)
    const pickupMutation = useMutation({
        mutationFn: ({ orderId, orderType }: { orderId: string; orderType: string }) =>
            api.post(`/rider/orders/${orderId}/picked-up`, { orderType }),
        onSuccess: (response) => {
            const deliveryOtp = response.data.deliveryOtp;
            toast({
                title: "Order Picked Up!",
                description: `Delivery OTP: ${deliveryOtp}. Customer will provide this on delivery.`,
            });
            queryClient.invalidateQueries({ queryKey: ["riderMyOrders"] });
        },
    });

    // Verify Delivery OTP
    const verifyDeliveryMutation = useMutation({
        mutationFn: ({ orderId, otp, orderType }: { orderId: string; otp: string; orderType: string }) =>
            api.post(`/rider/orders/${orderId}/verify-delivery`, { otp, orderType }),
        onSuccess: () => {
            toast({ title: "Delivery Complete!", description: "Great job! Order delivered successfully." });
            setOtpDialogOpen(false);
            setOtp("");
            setCurrentOrderId(null);
            setCurrentOrderType('restaurant');
            queryClient.invalidateQueries({ queryKey: ["riderMyOrders"] });
        },
        onError: (error: any) => {
            toast({
                title: "Invalid OTP",
                description: error.response?.data?.message || "Please check the OTP and try again",
                variant: "destructive",
            });
        },
    });

    const handleDeliverClick = (orderId: string, orderType: string = 'restaurant') => {
        setCurrentOrderId(orderId);
        setCurrentOrderType(orderType);
        setOtpDialogOpen(true);
    };

    const handleVerifyOtp = () => {
        if (currentOrderId && otp) {
            verifyDeliveryMutation.mutate({ orderId: currentOrderId, otp, orderType: currentOrderType });
        }
    };

    const openGoogleMaps = (address: string) => {
        const encoded = encodeURIComponent(address);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
    };

    const activeMyOrders = myOrders?.filter(o => !['delivered', 'cancelled', 'declined'].includes(o.status || '')) || [];
    const historyMyOrders = myOrders?.filter(o => ['delivered', 'cancelled', 'declined'].includes(o.status || '')) || [];

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
                </header>

                <Tabs defaultValue="available" className="w-full">
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
                                    openGoogleMaps={openGoogleMaps}
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
                                    onDeliver={() => handleDeliverClick(order.id, order.orderType || 'restaurant')}
                                    isProcessing={arrivedMutation.isPending || pickupMutation.isPending}
                                    openGoogleMaps={openGoogleMaps}
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
                                    openGoogleMaps={openGoogleMaps}
                                />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* OTP Verification Dialog */}
            <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Delivery</DialogTitle>
                        <DialogDescription>
                            Enter the 4-digit OTP provided by the customer to complete delivery.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={4}
                            className="text-center text-2xl tracking-widest"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOtpDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleVerifyOtp}
                            disabled={otp.length !== 4 || verifyDeliveryMutation.isPending}
                        >
                            {verifyDeliveryMutation.isPending ? "Verifying..." : "Complete Delivery"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface OrderCardProps {
    order: any; // Supports both RestaurantOrder and GroceryOrder with orderType
    type: 'available' | 'active' | 'history';
    onAccept?: () => void;
    onArrived?: () => void;
    onPickup?: () => void;
    onDeliver?: () => void;
    isProcessing?: boolean;
    openGoogleMaps: (address: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
    order,
    type,
    onAccept,
    onArrived,
    onPickup,
    onDeliver,
    isProcessing,
    openGoogleMaps
}) => {
    const orderType = order.orderType || 'restaurant';
    const isGrocery = orderType === 'grocery';
    const restaurantName = isGrocery ? "Grocery Order" : (order.provider?.businessName || "Unknown Restaurant");
    const restaurantAddress = order.provider?.address || "Unknown Address";
    const customerPhone = order.user?.phone;
    const totalAmount = isGrocery ? order.total : order.totalAmount;

    return (
        <Card className="shadow-md overflow-hidden">
            <div className={`h-2 w-full ${getStatusColor(order.status || 'pending')}`} />
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            {restaurantName}
                            <Badge variant={isGrocery ? "secondary" : "outline"} className={isGrocery ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                                {isGrocery ? "🛒 Grocery" : "🍽️ Food"}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" /> {restaurantAddress}
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-slate-50">
                        {formatStatus(order.status || 'pending')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                <div className="bg-slate-50 p-3 rounded-md mb-3 text-sm">
                    <div className="font-medium mb-2 flex items-center text-slate-700">
                        <UserIcon className="h-3 w-3 mr-2" /> Customer: {order.user?.username}
                    </div>
                    <div className="space-y-1">
                        {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                                <span>{item.quantity} x {item.name}</span>
                                <span className="text-slate-500">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between font-bold">
                        <span>Total Bill</span>
                        <span>₹{totalAmount}</span>
                    </div>
                </div>

                <div className="text-sm">
                    <p className="font-medium text-slate-700 mb-1">Delivery Address:</p>
                    <p className="text-slate-600 bg-slate-100 p-2 rounded flex items-center justify-between">
                        <span>{order.deliveryAddress}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openGoogleMaps(order.deliveryAddress)}
                        >
                            <Navigation className="h-4 w-4" />
                        </Button>
                    </p>
                </div>
            </CardContent>

            {type !== 'history' && (
                <CardFooter className="bg-slate-50 pt-3 pb-3 flex gap-2 justify-end border-t">
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
                            {customerPhone && (
                                <Button variant="outline" size="icon" asChild>
                                    <a href={`tel:${customerPhone}`}>
                                        <Phone className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}

                            {order.status === 'assigned' && (
                                <Button
                                    className="flex-1"
                                    onClick={onArrived}
                                    disabled={isProcessing}
                                >
                                    <MapPin className="mr-2 h-4 w-4" /> Arrived at Pickup
                                </Button>
                            )}

                            {order.status === 'arrived_at_pickup' && (
                                <Button
                                    className="flex-1 bg-blue-600"
                                    onClick={onPickup}
                                    disabled={isProcessing}
                                >
                                    <Package className="mr-2 h-4 w-4" /> Pick Up Order
                                </Button>
                            )}

                            {order.status === 'out_for_delivery' && (
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={onDeliver}
                                    disabled={isProcessing}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" /> Mark Delivered
                                </Button>
                            )}

                            {['pending', 'accepted', 'preparing', 'ready_for_pickup'].includes(order.status || '') && (
                                <Button variant="secondary" disabled className="flex-1">
                                    Waiting for Restaurant...
                                </Button>
                            )}
                        </>
                    )}
                </CardFooter>
            )}
        </Card>
    );
};
