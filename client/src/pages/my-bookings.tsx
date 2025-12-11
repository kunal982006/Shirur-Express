import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  AlertCircle,
  Loader2,
  DollarSign,
  Wrench,
  ShoppingBag
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { GroceryOrder } from "@shared/schema";

type BookingWithDetails = {
  id: string;
  status: string;
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
  problem?: {
    name: string;
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

  const getStatusInfo = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any; description: string; color: string }> = {
      pending: {
        label: "Pending",
        variant: "secondary",
        icon: Clock,
        description: "Waiting for provider to accept...",
        color: "border-yellow-500"
      },
      accepted: {
        label: "Accepted",
        variant: "default",
        icon: CheckCircle,
        description: "Provider has accepted! They are on their way.",
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
        label: "Awaiting OTP",
        variant: "outline",
        icon: Clock,
        description: "Provider is completing the service.",
        color: "border-blue-400"
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

  if (isLoadingBookings || isLoadingOrders) {
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

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
            <TabsTrigger value="services">Service Bookings</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
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
                              {booking.problem?.name || "Service Request"}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mb-3">
                              Provider: {booking.provider?.businessName || "N/A"}
                            </p>

                            <div className="space-y-2 text-sm">
                              {booking.scheduledAt && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {format(new Date(booking.scheduledAt), "EEEE, MMMM d, yyyy")}
                                  </span>
                                </div>
                              )}
                              {booking.preferredTimeSlots && booking.preferredTimeSlots.length > 0 && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>Time: {booking.preferredTimeSlots[0]}</span>
                                </div>
                              )}
                              <div className="flex items-start gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 mt-0.5" />
                                <span>{booking.userAddress}</span>
                              </div>
                            </div>

                            {booking.notes && (
                              <div className="mt-3 p-3 bg-muted rounded-md">
                                <p className="text-sm font-medium mb-1">Your notes:</p>
                                <p className="text-sm text-muted-foreground">{booking.notes}</p>
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
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
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
                          <Badge variant="default" className="bg-green-600">
                            {order.status?.toUpperCase() || "CONFIRMED"}
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

                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{order.deliveryAddress}</span>
                            </div>
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
