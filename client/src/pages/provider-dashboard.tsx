import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient"; // Assuming apiRequest handles auth
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MenuItemForm } from "@/components/forms/MenuItemForm";
import { CheckCircle, XCircle, Clock, Phone, MapPin, AlertCircle, PlusCircle, Edit, Trash2 } from "lucide-react";

// API function to fetch the provider's own menu (category-aware)
const fetchMyMenu = async () => {
  // Fetch menu items based on provider's category
  const res = await fetch(`/api/provider/menu`); 
  if (!res.ok) throw new Error("Aapka menu fetch nahi ho paaya.");
  return res.json();
};

export default function ProviderDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: isLoadingAuth } = useAuth(); // Renamed isLoading to isLoadingAuth

  // Fetch provider profile
  const { data: providerProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["providerProfile", user?.id], // Use user ID in key
    queryFn: async () => {
      // Assuming GET /api/provider/profile fetches the logged-in provider's profile
      const res = await fetch('/api/provider/profile');
      if (!res.ok) {
        // If profile doesn't exist yet (e.g., new provider hasn't onboarded), handle gracefully
        if (res.status === 404) return null;
        throw new Error("Provider profile fetch nahi ho paaya.");
      }
      return res.json();
    },
    enabled: !!user && user.role === 'provider', // Only fetch if user is logged in and is a provider
  });

  const providerId = providerProfile?.id;

  // Fetch bookings for the provider
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["providerBookings", providerId], // Use providerId in key
    queryFn: async () => {
      const res = await fetch(`/api/bookings/provider/${providerId}`);
      if (!res.ok) throw new Error('Bookings fetch nahi ho paaye.');
      return res.json();
    },
    enabled: !!providerId, // Only fetch if providerId exists
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      // Use apiRequest if it handles authenticated requests, otherwise use fetch with credentials
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, providerId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Status update nahi ho paaya");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["providerBookings", providerId] });
      toast({ title: variables.status === "accepted" ? "Booking Accepted" : "Booking Declined" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update booking status", variant: "destructive" });
    },
  });

  // Fetch menu items for the provider
  const { data: menuItems, isLoading: isLoadingMenu } = useQuery({
    queryKey: ['myMenu', providerId],
    queryFn: fetchMyMenu,
    enabled: !!providerId,
  });

  // Delete menu item mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/menu-items/${itemId}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Item delete nahi ho paaya.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMenu', providerId] });
      toast({ title: "Success!", description: "Menu item delete ho gaya hai." });
    },
    onError: (error: any) => {
      toast({ title: "Error!", description: error.message, variant: "destructive" });
    },
  });

  // Handler functions for bookings
  const handleAccept = (bookingId: string) => {
    updateStatusMutation.mutate({ bookingId, status: "accepted" });
  };

  const handleDecline = (bookingId: string) => {
    updateStatusMutation.mutate({ bookingId, status: "declined" });
  };

  // Handler function for deleting menu item
  const handleDelete = (itemId: string) => {
    deleteMutation.mutate(itemId);
  };

  // Helper to get status badge
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


  // Loading state checks
  if (isLoadingAuth || isLoadingProfile) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

   // Redirect if not a provider or profile not found yet (could be onboarding phase)
   if (!user || user.role !== 'provider' || !providerProfile) {
     // You might want to redirect to onboarding if profile is null and user is provider
     // setLocation("/provider-onboarding");
     return <div className="p-8 text-center">Verifying provider status...</div>;
   }

  // Filter bookings (Ensure bookings is an array before filtering)
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const pendingBookings = safeBookings.filter((b: any) => b.status === "pending");
  const otherBookings = safeBookings.filter((b: any) => b.status !== "pending");

  return (
    <div className="py-16 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Provider Dashboard</h2>
          <p className="text-muted-foreground">Manage your service bookings and menu</p>
        </div>

        {/* --- BOOKING MANAGEMENT UI --- */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Pending Requests ({pendingBookings.length})
          </h3>
          {isLoadingBookings ? (
             <p className="text-muted-foreground">Loading bookings...</p>
          ) : pendingBookings.length === 0 ? (
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
                             {/* You might need to fetch problem details separately if needed */}
                             Service Request #{booking.id.substring(0, 6)}
                           </CardTitle>
                           <div className="space-y-2 text-sm text-muted-foreground">
                             <div className="flex items-center gap-2">
                               <Clock className="h-4 w-4" />
                               <span>
                                 {booking.scheduledAt
                                   ? format(new Date(booking.scheduledAt), "PPP 'at' p")
                                   : booking.preferredTimeSlots?.join(', ') || "ASAP"}
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
                         >
                           <CheckCircle className="h-4 w-4 mr-2" /> Accept
                         </Button>
                         <Button
                           variant="destructive"
                           className="flex-1"
                           onClick={() => handleDecline(booking.id)}
                           disabled={updateStatusMutation.isPending}
                         >
                           <XCircle className="h-4 w-4 mr-2" /> Decline
                         </Button>
                       </div>
                     </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Other Bookings Section */}
        {otherBookings.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-4">All Bookings ({otherBookings.length})</h3>
             <div className="grid grid-cols-1 gap-4">
              {otherBookings.map((booking: any) => (
                <Card key={booking.id}>
                  <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">
                            Service Request #{booking.id.substring(0, 6)}
                          </CardTitle>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {booking.scheduledAt
                                  ? format(new Date(booking.scheduledAt), "PPP")
                                  : "ASAP"}
                              </span>
                            </div>
                             {booking.status === "accepted" && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{booking.userPhone}</span>
                                {/* Add Call button functionality later */}
                                {/* <Button size="sm" variant="outline">Call</Button> */}
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

        {/* --- MENU MANAGEMENT UI --- */}
        <div className="mt-16">
          <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
            setIsModalOpen(isOpen);
            if (!isOpen) setEditingItem(null);
          }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Aapka Menu</CardTitle>
                <DialogTrigger asChild>
                  <Button><PlusCircle className="h-4 w-4 mr-2" />Add New Item</Button>
                </DialogTrigger>
              </CardHeader>
              <CardContent>
                {isLoadingMenu ? (
                  <p className="text-muted-foreground">Loading menu...</p>
                ) : menuItems && menuItems.length > 0 ? (
                  <div className="space-y-4">
                    {menuItems.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between border p-4 rounded-lg">
                        <div className="flex items-center gap-4">
                          {item.imageUrl && (
                             <img src={item.imageUrl} alt={item.name} className="h-16 w-16 object-cover rounded-md"/>
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">Price: ₹{item.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" disabled={deleteMutation.isPending}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Yeh action hamesha ke liye is item ko delete kar dega. Item: <span className="font-semibold">{item.name}</span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                  Haan, Delete Karo
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Aapne abhi tak koi menu item add nahi kiya hai.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Menu Item" : "Add a New Menu Item"}</DialogTitle>
              </DialogHeader>
              {providerId && (
                <MenuItemForm
                  providerId={providerId}
                  initialData={editingItem}
                  onSuccess={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}