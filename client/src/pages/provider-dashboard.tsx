import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MenuItemForm } from "@/components/forms/MenuItemForm";
import { CheckCircle, XCircle, Clock, Phone, MapPin, AlertCircle, PlusCircle, Edit, Trash2 } from "lucide-react";

const fetchMyMenu = async (providerId: string | undefined) => {
  if (!providerId) return [];
  const res = await fetch(`/api/street-food-items?providerId=${providerId}`);
  if (!res.ok) throw new Error("Aapka menu fetch nahi ho paaya.");
  return res.json();
};

export default function ProviderDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: providerProfile } = useQuery({
    queryKey: ["/api/provider/profile"],
    enabled: !!user,
  });

  const providerId = providerProfile?.id;

  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["/api/bookings/provider", providerId],
    enabled: !!providerId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status, providerId });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/provider", providerId] });
      toast({ title: variables.status === "accepted" ? "Booking Accepted" : "Booking Declined" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update booking status", variant: "destructive" });
    },
  });

  const { data: menuItems, isLoading: isLoadingMenu } = useQuery({
    queryKey: ['myMenu', providerId],
    queryFn: () => fetchMyMenu(providerId),
    enabled: !!providerId,
  });

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
    onError: (error) => {
      toast({ title: "Error!", description: error.message, variant: "destructive" });
    },
  });

  const handleDelete = (itemId: string) => {
    deleteMutation.mutate(itemId);
  };

  if (isLoadingBookings || isLoadingMenu) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  const pendingBookings = bookings?.filter((b: any) => b.status === "pending") || [];
  const otherBookings = bookings?.filter((b: any) => b.status !== "pending") || [];

  return (
    <div className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Provider Dashboard</h2>
          <p className="text-muted-foreground">Manage your service bookings and menu</p>
        </div>

        {/* --- BOOKING MANAGEMENT UI --- */}
        {/* ... (Yahan aapka poora booking UI code aayega, maine usko chhota rakha hai) ... */}

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
                {menuItems && menuItems.length > 0 ? (
                  <div className="space-y-4">
                    {menuItems.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between border p-4 rounded-lg">
                        <div>
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">Price: ₹{item.price}</p>
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