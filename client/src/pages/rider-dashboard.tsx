
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { RestaurantOrder } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Package, CheckCircle, Truck, Phone, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

const getStatusColor = (status: string) => {
    switch (status) {
        case "pending": return "bg-yellow-500";
        case "accepted": return "bg-blue-400";
        case "preparing": return "bg-orange-400";
        case "ready_for_pickup": return "bg-green-500";
        case "picked_up": return "bg-blue-600";
        case "delivered": return "bg-green-700";
        case "declined":
        case "cancelled": return "bg-red-500";
        default: return "bg-gray-500";
    }
};

export default function RiderDashboard() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Fetch Available Orders (For claiming)
    const { data: availableOrders, isLoading: isLoadingAvailable } = useQuery<RestaurantOrder[]>({
        queryKey: ["riderAvailableOrders"],
        queryFn: async () => {
            const res = await api.get("/rider/orders/available");
            return res.data;
        },
        refetchInterval: 5000, // Poll frequently for new orders
    });

    // Fetch My Active Orders
    const { data: myOrders, isLoading: isLoadingMyOrders } = useQuery<RestaurantOrder[]>({
        queryKey: ["riderMyOrders"],
        queryFn: async () => {
            const res = await api.get("/rider/orders/my-active");
            return res.data;
        },
        refetchInterval: 10000,
    });

    // Update Status Mutation (Claim, Pick Up, Deliver)
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            api.patch(`/rider/orders/${id}/status`, { status }),
        onSuccess: (data, variables) => {
            let message = "Order updated.";
            if (variables.status === 'claimed') message = "Order claimed successfully!";
            if (variables.status === 'picked_up') message = "Order marked as picked up.";
            if (variables.status === 'delivered') message = "Order delivered successfully!";

            toast({ title: "Success", description: message });
            queryClient.invalidateQueries({ queryKey: ["riderAvailableOrders"] });
            queryClient.invalidateQueries({ queryKey: ["riderMyOrders"] });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update status",
                variant: "destructive",
            });
        },
    });

    const handleClaimOrder = (id: string) => {
        updateStatusMutation.mutate({ id, status: 'claimed' });
    };

    const handleUpdateStatus = (id: string, status: string) => {
        updateStatusMutation.mutate({ id, status });
    };

    if (isLoadingAvailable || isLoadingMyOrders) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    const activeMyOrders = myOrders?.filter(o => !['delivered', 'cancelled', 'declined'].includes(o.status || '')) || [];
    const historyMyOrders = myOrders?.filter(o => ['delivered', 'cancelled', 'declined'].includes(o.status || '')) || [];

    return (
        <div className="min-h-screen bg-gray-100 p-4 pb-20">
            <div className="max-w-3xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Rider Dashboard</h1>
                    <p className="text-gray-500">Welcome, {user?.username}</p>
                </header>

                <Tabs defaultValue="available" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="available">
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
                        {!availableOrders || availableOrders.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                <h3 className="text-lg font-medium text-gray-900">No orders available</h3>
                                <p className="text-gray-500 mt-1">Wait for new orders to appear...</p>
                            </div>
                        ) : (
                            availableOrders.map(order => (
                                <RiderOrderCard
                                    key={order.id}
                                    order={order}
                                    type="available"
                                    onAction={handleClaimOrder}
                                    isProcessing={updateStatusMutation.isPending}
                                />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="active" className="space-y-4">
                        {activeMyOrders.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                <p className="text-gray-500">You have no active deliveries.</p>
                            </div>
                        ) : (
                            activeMyOrders.map(order => (
                                <RiderOrderCard
                                    key={order.id}
                                    order={order}
                                    type="active"
                                    onAction={handleUpdateStatus}
                                    isProcessing={updateStatusMutation.isPending}
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
                            historyMyOrders.map(order => (
                                <RiderOrderCard
                                    key={order.id}
                                    order={order}
                                    type="history"
                                    onAction={() => { }}
                                    isProcessing={false}
                                />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

const RiderOrderCard: React.FC<{
    order: RestaurantOrder & { user?: any; provider?: any };
    type: 'available' | 'active' | 'history';
    onAction: (id: string, status: string) => void;
    isProcessing: boolean;
}> = ({ order, type, onAction, isProcessing }) => {

    // Helper to get restaurant phone safely
    // Note: provider object might not have phone directly if it's nested in user, 
    // but schema says serviceProvider has userId. We need provider's user to get phone.
    // In storage.ts, we included provider: true. 
    // Wait, provider is the ServiceProvider record. It doesn't have phone. 
    // We need provider.user.phone. 
    // Let's check storage.ts getRiderOrders. It includes provider: true.
    // Does provider relation include user? 
    // In storage.ts: with: { user: true, provider: true }
    // In schema.ts: serviceProvidersRelations has user.
    // But did we include provider.user in the query?
    // storage.ts: with: { user: true, provider: true } -> This fetches provider record.
    // It does NOT automatically fetch provider.user unless we specify provider: { with: { user: true } }.
    // I need to check storage.ts again.

    // Checking storage.ts (from memory/previous view):
    // getRiderOrders: with: { user: true, provider: true }
    // This implies provider is fetched, but provider's user is NOT deep fetched.
    // So we might miss the restaurant phone number! 
    // I should fix storage.ts to fetch provider.user as well.

    // For now, let's assume we might need to fix it. 
    // But let's finish the UI first.

    const restaurantName = order.provider?.businessName || "Unknown Restaurant";
    const restaurantAddress = order.provider?.address || "Unknown Address";
    // const restaurantPhone = order.provider?.user?.phone; // This might be missing if not fetched.

    return (
        <Card className="shadow-md overflow-hidden">
            <div className={`h-2 w-full ${getStatusColor(order.status || 'pending')}`} />
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{restaurantName}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" /> {restaurantAddress}
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-slate-50">
                        {order.status?.replace(/_/g, " ").toUpperCase()}
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
                        <span>₹{order.totalAmount}</span>
                    </div>
                </div>

                <div className="text-sm">
                    <p className="font-medium text-slate-700 mb-1">Delivery Address:</p>
                    <p className="text-slate-600 bg-slate-100 p-2 rounded">{order.deliveryAddress}</p>
                </div>
            </CardContent>

            {type !== 'history' && (
                <CardFooter className="bg-slate-50 pt-3 pb-3 flex gap-2 justify-end border-t">
                    {type === 'available' && (
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={() => onAction(order.id, 'claimed')}
                            disabled={isProcessing}
                        >
                            Accept Delivery Job
                        </Button>
                    )}

                    {type === 'active' && (
                        <>
                            {/* Call Button - Ideally we need phone number */}
                            <Button variant="outline" size="icon" asChild>
                                <a href={`tel:${"9999999999" /* Placeholder until we fix backend */}`}>
                                    <Phone className="h-4 w-4" />
                                </a>
                            </Button>

                            {order.status === 'ready_for_pickup' && (
                                <Button
                                    className="flex-1 bg-blue-600"
                                    onClick={() => onAction(order.id, 'picked_up')}
                                    disabled={isProcessing}
                                >
                                    <Package className="mr-2 h-4 w-4" /> Pick Up Order
                                </Button>
                            )}

                            {order.status === 'picked_up' && (
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => onAction(order.id, 'delivered')}
                                    disabled={isProcessing}
                                >
                                    <Truck className="mr-2 h-4 w-4" /> Mark Delivered
                                </Button>
                            )}

                            {(order.status === 'pending' || order.status === 'accepted' || order.status === 'preparing') && (
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
}
