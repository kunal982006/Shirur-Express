import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Phone,
  MapPin,
  AlertCircle 
} from "lucide-react";

export default function MyBookings() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["/api/bookings/user", userId],
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any; description: string }> = {
      pending: { 
        label: "Pending", 
        variant: "secondary", 
        icon: Clock,
        description: "Waiting for provider to accept" 
      },
      accepted: { 
        label: "Accepted", 
        variant: "default", 
        icon: CheckCircle,
        description: "Provider accepted your request" 
      },
      declined: { 
        label: "Declined", 
        variant: "destructive", 
        icon: XCircle,
        description: "Provider declined this request" 
      },
      completed: { 
        label: "Completed", 
        variant: "outline", 
        icon: CheckCircle,
        description: "Service completed" 
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div>
        <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-muted-foreground">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">My Bookings</h2>
          <p className="text-muted-foreground">
            Track the status of your service requests
          </p>
        </div>

        {!bookings || bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">You haven't made any bookings yet</p>
              <Button className="mt-4" onClick={() => window.location.href = '/electrician'}>
                Book a Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bookings.map((booking: any) => (
              <Card 
                key={booking.id}
                className={
                  booking.status === "accepted" ? "border-l-4 border-l-green-500" :
                  booking.status === "declined" ? "border-l-4 border-l-red-500" :
                  booking.status === "pending" ? "border-l-4 border-l-yellow-500" : ""
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {booking.problem?.name || "Service Request"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mb-3">
                        {booking.provider?.businessName || "Provider"}
                      </p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {booking.scheduledAt 
                              ? format(new Date(booking.scheduledAt), "EEEE, MMMM d, yyyy")
                              : "Not scheduled"}
                          </span>
                        </div>
                        {booking.preferredTimeSlots && booking.preferredTimeSlots.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Preferred time: {booking.preferredTimeSlots[0]}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <span>{booking.userAddress}</span>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-1">Your notes:</p>
                          <p className="text-sm">{booking.notes}</p>
                        </div>
                      )}

                      {booking.status === "accepted" && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                            ✓ Booking Confirmed
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            The provider will contact you soon on {booking.userPhone}
                          </p>
                        </div>
                      )}

                      {booking.status === "declined" && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                            ✗ Booking Declined
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            Unfortunately, the provider couldn't accept this request. 
                            Please try booking with another provider.
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-3"
                            onClick={() => window.location.href = '/electrician'}
                          >
                            Find Another Provider
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
