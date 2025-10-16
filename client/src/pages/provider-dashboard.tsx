import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Phone,
  MapPin,
  AlertCircle 
} from "lucide-react";

export default function ProviderDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // TODO: Get actual provider ID from authentication
  const providerId = "mock-provider-id";

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["/api/bookings/provider", providerId],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      return apiRequest(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, providerId }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/provider", providerId] });
      toast({
        title: variables.status === "accepted" ? "Booking Accepted" : "Booking Declined",
        description: variables.status === "accepted" 
          ? "Customer has been notified. You can now call them."
          : "Customer has been notified about the decline.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  const handleAccept = (bookingId: string) => {
    updateStatusMutation.mutate({ bookingId, status: "accepted" });
  };

  const handleDecline = (bookingId: string) => {
    updateStatusMutation.mutate({ bookingId, status: "declined" });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: "Pending", variant: "secondary", icon: Clock },
      accepted: { label: "Accepted", variant: "default", icon: CheckCircle },
      declined: { label: "Declined", variant: "destructive", icon: XCircle },
      completed: { label: "Completed", variant: "outline", icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  const pendingBookings = bookings?.filter((b: any) => b.status === "pending") || [];
  const otherBookings = bookings?.filter((b: any) => b.status !== "pending") || [];

  return (
    <div className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Provider Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your service bookings and requests
          </p>
        </div>

        {/* Pending Bookings */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Pending Requests ({pendingBookings.length})
          </h3>

          {pendingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingBookings.map((booking: any) => (
                <Card key={booking.id} className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {booking.problem?.name || "Service Request"}
                        </CardTitle>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {booking.scheduledAt 
                                ? format(new Date(booking.scheduledAt), "PPP 'at' p")
                                : "Not scheduled"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{booking.userPhone}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5" />
                            <span>{booking.userAddress}</span>
                          </div>
                        </div>
                        {booking.notes && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <p className="text-sm">{booking.notes}</p>
                          </div>
                        )}
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1"
                        onClick={() => handleAccept(booking.id)}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-accept-${booking.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDecline(booking.id)}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-decline-${booking.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Other Bookings */}
        {otherBookings.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">
              All Bookings ({otherBookings.length})
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {otherBookings.map((booking: any) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {booking.problem?.name || "Service Request"}
                        </CardTitle>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {booking.scheduledAt 
                                ? format(new Date(booking.scheduledAt), "PPP")
                                : "Not scheduled"}
                            </span>
                          </div>
                          {booking.status === "accepted" && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{booking.userPhone}</span>
                              <Button size="sm" variant="outline">
                                <Phone className="h-3 w-3 mr-1" />
                                Call Customer
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
