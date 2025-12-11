
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { StreetFoodOrder } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Package, CheckCircle, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const getStatusColor = (status: string) => {
    switch (status) {
        case "pending": return "bg-yellow-500";
        case "picked_up": return "bg-blue-500";
        case "delivered": return "bg-green-600";
        case "cancelled": return "bg-red-500";
        default: return "bg-gray-500";
    }
};

export default function RunnerDashboard() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Orders
    const { data: orders, isLoading } = useQuery<StreetFoodOrder[]>({
        queryKey: ["runnerOrders"],
        queryFn: async () => {
            const res = await api.get("/runner/orders");
            return res.data;
        },
        refetchInterval: 10000, // Auto-refresh every 10 seconds
    });

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            api.patch(`/runner/orders/${id}/status`, { status }),
        onSuccess: () => {
            toast({ title: "Status Updated", description: "Order status has been updated." });
            queryClient.invalidateQueries({ queryKey: ["runnerOrders"] });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update status",
                variant: "destructive",
            });
        },
    });

    const handleStatusUpdate = (id: string, newStatus: string) => {
        updateStatusMutation.mutate({ id, status: newStatus });
    };



    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    const activeOrders = orders?.filter(o => o.status !== 'delivered' && o.status !== 'cancelled') || [];
    const completedOrders = orders?.filter(o => o.status === 'delivered' || o.status === 'cancelled') || [];

    return (
        <div className="min-h-screen bg-gray-100 p-4 pb-20">
            <div className="max-w-3xl mx-auto">
                <header className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Runner Dashboard</h1>
                        <p className="text-gray-500">Stationed Runner: Main Market</p>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 bg-white">
                        {activeOrders.length} Active
                    </Badge>
                </header>

                <div className="space-y-6">
                    {activeOrders.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No active orders right now.
                            </CardContent>
                        </Card>
                    ) : (
                        activeOrders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onUpdateStatus={handleStatusUpdate}
                                isUpdating={updateStatusMutation.isPending}
                            />
                        ))
                    )}

                    {completedOrders.length > 0 && (
                        <>
                            <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-700">Completed History</h2>
                            <div className="space-y-4 opacity-75">
                                {completedOrders.slice(0, 5).map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onUpdateStatus={handleStatusUpdate}
                                        isUpdating={updateStatusMutation.isPending}
                                        readonly
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function OrderCard({ order, onUpdateStatus, isUpdating, readonly = false }: {
    order: StreetFoodOrder;
    onUpdateStatus: (id: string, status: string) => void;
    isUpdating: boolean;
    readonly?: boolean;
}) {
    return (
        <Card className="shadow-md border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">Order #{order.id.slice(-6)}</CardTitle>
                        <CardDescription>{new Date(order.createdAt || new Date()).toLocaleTimeString()}</CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(order.status || 'pending')} text-white`}>
                        {order.status?.replace("_", " ").toUpperCase()}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-2">
                {/* Items List */}
                <div className="bg-gray-50 p-3 rounded-md mb-3 space-y-2">
                    {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm border-b border-gray-200 last:border-0 pb-1 last:pb-0">
                            <div className="flex flex-col">
                                <span className="font-medium">{item.name} x {item.quantity}</span>
                                {/* Vendor Name (Mocked if not present, but schema has it) */}
                                <span className="text-xs text-muted-foreground">Vendor: {item.providerId ? "Stall " + item.providerId.slice(-4) : "Unknown"}</span>
                            </div>
                            <span className="font-semibold">₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-bold pt-1">
                        <span>Total</span>
                        <span>₹{order.totalAmount}</span>
                    </div>
                </div>

                {/* Customer Address */}
                <div className="flex items-start space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-gray-700">{order.deliveryAddress}</span>
                </div>
            </CardContent>

            {!readonly && (
                <CardFooter className="pt-2 flex justify-end gap-2">
                    {order.status === 'pending' && (
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={() => onUpdateStatus(order.id, 'picked_up')}
                            disabled={isUpdating}
                        >
                            <Package className="mr-2 h-4 w-4" /> Mark Picked Up
                        </Button>
                    )}
                    {order.status === 'picked_up' && (
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => onUpdateStatus(order.id, 'delivered')}
                            disabled={isUpdating}
                        >
                            <Truck className="mr-2 h-4 w-4" /> Mark Delivered
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
