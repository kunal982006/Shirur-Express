import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  AlertCircle,
  Key,
  Loader2,
  DollarSign,
  Wrench,
  ShoppingBag,
  Navigation,
  UtensilsCrossed
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import api from "@/lib/api";
import { GroceryOrder, RestaurantOrder } from "@shared/schema";

type BookingWithDetails = {
  id: string;
  status: string;
  serviceOtp?: string | null;
  scheduledAt?: string;
  userAddress: string;
  userPhone: string;
  notes?: string;
  preferredTimeSlots?: string[];
  invoice?: {
    id: string;
    totalAmount: number;
    serviceCharge: number;
    spareParts?: Array<{ part: string; cost: number }>;
  };
  paymentMethod?: string;
  problem?: {
    name: string;
  };
  serviceOffering?: {
    name?: string;
    template?: {
      name: string;
    };
  };
  provider?: {
    businessName: string;
    user?: {
      username: string;
    };
  };
};

export default function MyBookings() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Cancel booking mutation (for customer)
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}/cancel`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel booking');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/my-bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancel Failed",
        description: error.message || "Could not cancel the booking.",
        variant: "destructive",
      });
    },
  });

  const { data: bookings, isLoading: isLoadingBookings } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/customer/my-bookings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customer/my-bookings");
      return response.json();
    },
    enabled: !!user && isAuthenticated,
  });

  const { data: groceryOrders, isLoading: isLoadingOrders } = useQuery<GroceryOrder[]>({
    queryKey: ["/api/customer/grocery-orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customer/grocery-orders");
      return response.json();
    },
    enabled: !!user && isAuthenticated,
  });

  const { data: restaurantOrders, isLoading: isLoadingRestaurantOrders } = useQuery<RestaurantOrder[]>({
    queryKey: ["/api/customer/restaurant-orders"],
    queryFn: async () => {
      const response = await api.get("/customer/restaurant-orders");
      return response.data;
    },
    enabled: !!user && isAuthenticated,
  });

  const getStatusInfo = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any; description: string; color: string }> = {
      pending: {
        label: "Confirmed",
        variant: "secondary",
        icon: Clock,
        description: "Order confirmed! Provider is preparing...",
        color: "border-yellow-500"
      },
      accepted: {
        label: "Confirmed",
        variant: "default",
        icon: CheckCircle,
        description: "Provider has confirmed! Work will begin shortly.",
        color: "border-green-500"
      },
      in_progress: {
        label: "In Progress",
        variant: "default",
        icon: Wrench,
        description: "Service is currently in progress.",
        color: "border-blue-500"
      },
      awaiting_otp: {
        label: "OTP Verification",
        variant: "outline",
        icon: Key,
        description: "Share the OTP with the technician to confirm service.",
        color: "border-yellow-500"
      },
      awaiting_billing: {
        label: "Preparing Bill",
        variant: "outline",
        icon: Clock,
        description: "Provider is creating your final bill.",
        color: "border-blue-400"
      },
      pending_payment: {
        label: "Payment Due",
        variant: "destructive",
        icon: DollarSign,
        description: "Job complete! Your final bill is ready.",
        color: "border-orange-500"
      },
      completed: {
        label: "Completed",
        variant: "outline",
        icon: CheckCircle,
        description: "Service completed successfully.",
        color: "border-gray-400"
      },
      declined: {
        label: "Declined",
        variant: "destructive",
        icon: XCircle,
        description: "This request was declined.",
        color: "border-red-500"
      },
      cancelled: {
        label: "Cancelled",
        variant: "destructive",
        icon: XCircle,
        description: "This request was cancelled.",
        color: "border-red-500"
      },
      // Grocery Order Statuses
      confirmed: {
        label: "Confirmed",
        variant: "default",
        icon: CheckCircle,
        description: "Order placed successfully.",
        color: "border-green-500"
      }
    };

    return statusConfig[status] || statusConfig.pending;
  };

  if (!isAuthenticated) {
    return (
      <div className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in to view your bookings</p>
          <Button onClick={() => setLocation("/login")}>Log In</Button>
        </div>
      </div>
    );
  }

  if (isLoadingBookings || isLoadingOrders || isLoadingRestaurantOrders) {
    return (
      <div className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">My Activity</h2>
          <p className="text-muted-foreground">
            Track your service requests and orders
          </p>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[500px] mb-8">
            <TabsTrigger value="orders">Food Orders</TabsTrigger>
            <TabsTrigger value="grocery">Grocery</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            {!Array.isArray(bookings) || bookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">No service bookings yet</p>
                  <p className="text-muted-foreground mb-4">Need a professional?</p>
                  <Button onClick={() => setLocation("/electrician")}>
                    Find a Technician
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {bookings.map((booking) => {
                  const statusInfo = getStatusInfo(booking.status);
                  const Icon = statusInfo.icon;

                  return (
                    <Card
                      key={booking.id}
                      className={`border-l-4 ${statusInfo.color}`}
                      data-testid={`booking-card-${booking.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">
                              {booking.problem?.name || booking.serviceOffering?.name || booking.serviceOffering?.template?.name || "Service Request"}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mb-3">
                              Provider: {booking.provider?.businessName || "N/A"}
                            </p>

                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-start w-full pr-4 text-muted-foreground">
                                <span className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 mt-0.5" />
                                  <span>{booking.userAddress}</span>
                                </span>
                                {booking.paymentMethod && (
                                  <Badge variant="outline" className="text-xs whitespace-nowrap ml-2">
                                    {booking.paymentMethod === 'cod' ? '💵 COD' : '💳 Online'}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {booking.notes && (
                              <div className="mt-3 p-3 bg-muted rounded-md">
                                <p className="text-sm font-medium mb-1">Your notes:</p>
                                <p className="text-sm text-muted-foreground">{booking.notes}</p>
                              </div>
                            )}

                            {/* OTP Display for awaiting_otp status */}
                            {booking.status === "awaiting_otp" && booking.serviceOtp && (
                              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <Key className="h-5 w-5 text-yellow-700 dark:text-yellow-300" />
                                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                                    Share this OTP with the technician
                                  </p>
                                </div>
                                <p className="text-3xl font-bold tracking-[0.3em] text-yellow-800 dark:text-yellow-100">
                                  {booking.serviceOtp}
                                </p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                                  The technician will enter this to confirm service completion
                                </p>
                              </div>
                            )}

                            {/* Status-specific messages */}
                            {booking.status === "pending_payment" && booking.invoice && (
                              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <p className="text-sm font-bold text-orange-900 dark:text-orange-100 mb-2">
                                  💰 Job Complete! Your Final Bill is Ready
                                </p>
                                <div className="space-y-1 text-sm text-orange-700 dark:text-orange-300 mb-3">
                                  <p>Service Charge: ₹{booking.invoice.serviceCharge}</p>
                                  {booking.invoice.spareParts && booking.invoice.spareParts.length > 0 && (
                                    <div>
                                      <p className="font-medium">Spare Parts:</p>
                                      {booking.invoice.spareParts.map((part, idx) => (
                                        <p key={idx} className="ml-3">
                                          • {part.part}: ₹{part.cost}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  <p className="font-bold text-base mt-2">
                                    Total Bill: ₹{booking.invoice.totalAmount}
                                  </p>
                                </div>
                                <Button
                                  className="w-full bg-orange-600 hover:bg-orange-700"
                                  onClick={() => setLocation(`/pay/invoice/${booking.invoice!.id}`)}
                                  data-testid="button-pay-now"
                                >
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Pay Now - ₹{booking.invoice.totalAmount}
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="text-right flex-shrink-0">
                            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                              <Icon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-2 max-w-[120px]">
                              {statusInfo.description}
                            </p>
                          </div>
                        </div>

                        {/* Cancel Button - shown before job starts */}
                        {(booking.status === 'pending' || booking.status === 'accepted') && (
                          <div className="mt-4 pt-4 border-t">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full"
                              disabled={cancelBookingMutation.isPending}
                              onClick={() => {
                                if (confirm('Are you sure you want to cancel this booking?')) {
                                  cancelBookingMutation.mutate(booking.id);
                                }
                              }}
                              data-testid={`cancel-booking-${booking.id}`}
                            >
                              {cancelBookingMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                              )}
                              Cancel Booking
                            </Button>
                          </div>
                        )}
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            {!Array.isArray(restaurantOrders) || restaurantOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">No food orders yet</p>
                  <p className="text-muted-foreground mb-4">Order from your favorite restaurants!</p>
                  <Button onClick={() => setLocation("/restaurants")}>
                    Browse Restaurants
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {restaurantOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-orange-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg mb-2 flex items-center gap-2">
                            <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                            Restaurant Order
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Order #{order.id.slice(0, 8)} • {format(new Date(order.createdAt || new Date()), "PPP p")}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-orange-600">
                          {(order.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Items</h4>
                          <div className="space-y-2">
                            {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                            <span>Total</span>
                            <span>₹{order.totalAmount}</span>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{order.deliveryAddress}</span>
                          </div>
                        </div>

                        {/* Track Order Button */}
                        {!['delivered', 'cancelled', 'declined'].includes(order.status || '') && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setLocation(`/order/${order.id}/track`)}
                          >
                            <Navigation className="mr-2 h-4 w-4" />
                            Track Order
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="grocery">
            {!Array.isArray(groceryOrders) || groceryOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">No orders yet</p>
                  <p className="text-muted-foreground mb-4">Order something delicious!</p>
                  <Button onClick={() => setLocation("/cake-shop")}>
                    Visit Cake Shop
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {groceryOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status || 'pending');

                  return (
                    <Card key={order.id} className="border-l-4 border-green-500">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg mb-2">
                              Order #{order.id.slice(0, 8)}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.createdAt || new Date()), "PPP p")}
                            </p>
                          </div>
                          <Badge variant="default" className={
                            order.status === 'delivered' ? 'bg-green-600' :
                            order.status === 'out_for_delivery' ? 'bg-orange-500' :
                            order.status === 'assigned' ? 'bg-blue-500' :
                            order.status === 'ready_for_pickup' ? 'bg-purple-500' :
                            order.status === 'cancelled' ? 'bg-red-600' :
                            'bg-green-600'
                          }>
                            {(order.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Items</h4>
                            <div className="space-y-2">
                              {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{item.name} x {item.quantity}</span>
                                  <span>₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                              <span>Total</span>
                              <span>₹{order.total}</span>
                            </div>
                          </div>


                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{order.deliveryAddress}</span>
                            </div>
                            {order.paymentMethod && (
                              <Badge variant="outline" className="text-xs">
                                {order.paymentMethod === 'cod' ? '💵 COD' : '💳 Online'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
